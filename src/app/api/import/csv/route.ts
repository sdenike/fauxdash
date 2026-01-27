import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, categories, services, serviceCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cacheDel } from '@/lib/redis';

interface ParsedItem {
  section: 'bookmarks' | 'services';
  category: string;
  name: string;
  description: string | null;
  url: string;
}

function parseCSV(csvText: string): ParsedItem[] {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  const items: ParsedItem[] = [];

  // Skip header row if present
  let startIndex = 0;
  const firstLine = lines[0]?.toLowerCase();
  if (firstLine?.includes('section') || firstLine?.includes('category') || firstLine?.includes('name')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Parse CSV line, handling quoted values
    const values = parseCSVLine(line);

    if (values.length < 4) continue; // Need at least section, category, name, url

    const section = values[0]?.toLowerCase().trim();
    const category = values[1]?.trim();
    const name = values[2]?.trim();
    const description = values.length >= 5 ? values[3]?.trim() || null : null;
    const url = values.length >= 5 ? values[4]?.trim() : values[3]?.trim();

    if (!section || !category || !name || !url) continue;

    // Skip rows without a category (these are section headers)
    if (!category) continue;

    // Normalize section name
    let normalizedSection: 'bookmarks' | 'services';
    if (section.includes('bookmark')) {
      normalizedSection = 'bookmarks';
    } else if (section.includes('service') || section.includes('application')) {
      normalizedSection = 'services';
    } else {
      continue; // Skip unknown sections
    }

    items.push({
      section: normalizedSection,
      category,
      name,
      description,
      url: url.startsWith('http') ? url : `https://${url}`,
    });
  }

  return items;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const items = parseCSV(csvText);

    if (items.length === 0) {
      return NextResponse.json({ error: 'No valid items found in CSV' }, { status: 400 });
    }

    const db = getDb();
    const results = {
      bookmarksCreated: 0,
      servicesCreated: 0,
      categoriesCreated: 0,
      serviceCategoriesCreated: 0,
      errors: [] as string[],
    };

    // Cache for category lookups
    const categoryCache = new Map<string, number>();
    const serviceCategoryCache = new Map<string, number>();

    // Get existing categories
    const existingCategories = await db.select().from(categories);
    existingCategories.forEach((cat: { id: number; name: string }) => categoryCache.set(cat.name.toLowerCase(), cat.id));

    const existingServiceCategories = await db.select().from(serviceCategories);
    existingServiceCategories.forEach((cat: { id: number; name: string }) => serviceCategoryCache.set(cat.name.toLowerCase(), cat.id));

    for (const item of items) {
      try {
        if (item.section === 'bookmarks') {
          // Get or create category
          let catId = categoryCache.get(item.category.toLowerCase());
          if (catId === undefined) {
            const [newCat] = await db.insert(categories).values({
              name: item.category,
              order: categoryCache.size,
            }).returning();
            catId = newCat.id as number;
            categoryCache.set(item.category.toLowerCase(), catId);
            results.categoriesCreated++;
          }

          // Create bookmark
          await db.insert(bookmarks).values({
            categoryId: catId as number,
            name: item.name,
            url: item.url,
            description: item.description,
            order: 0,
            isVisible: true,
            requiresAuth: false,
          });
          results.bookmarksCreated++;

        } else if (item.section === 'services') {
          // Get or create service category
          let catId = serviceCategoryCache.get(item.category.toLowerCase());
          if (catId === undefined) {
            const [newCat] = await db.insert(serviceCategories).values({
              name: item.category,
              order: serviceCategoryCache.size,
            }).returning();
            catId = newCat.id as number;
            serviceCategoryCache.set(item.category.toLowerCase(), catId);
            results.serviceCategoriesCreated++;
          }

          // Create service
          await db.insert(services).values({
            categoryId: catId as number,
            name: item.name,
            url: item.url,
            description: item.description,
            order: 0,
            isVisible: true,
            requiresAuth: false,
          });
          results.servicesCreated++;
        }
      } catch (error: any) {
        results.errors.push(`Failed to import "${item.name}": ${error.message}`);
      }
    }

    // Invalidate caches
    await cacheDel('categories:public');
    await cacheDel(`categories:auth:${session.user?.email}`);
    await cacheDel('services:public');
    await cacheDel(`services:auth:${session.user?.email}`);
    await cacheDel('service-categories:public');
    await cacheDel(`service-categories:auth:${session.user?.email}`);

    return NextResponse.json({
      success: true,
      message: `Import complete`,
      results,
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import CSV' }, { status: 500 });
  }
}
