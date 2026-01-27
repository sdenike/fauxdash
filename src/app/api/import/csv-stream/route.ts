import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, categories, services, serviceCategories } from '@/db/schema';
import { cacheDel } from '@/lib/redis';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';

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

  let startIndex = 0;
  const firstLine = lines[0]?.toLowerCase();
  if (firstLine?.includes('section') || firstLine?.includes('category') || firstLine?.includes('name')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);

    if (values.length < 4) continue;

    const section = values[0]?.toLowerCase().trim();
    const category = values[1]?.trim();
    const name = values[2]?.trim();
    const description = values.length >= 5 ? values[3]?.trim() || null : null;
    const url = values.length >= 5 ? values[4]?.trim() : values[3]?.trim();

    if (!section || !category || !name || !url) continue;

    let normalizedSection: 'bookmarks' | 'services';
    if (section.includes('bookmark')) {
      normalizedSection = 'bookmarks';
    } else if (section.includes('service') || section.includes('application')) {
      normalizedSection = 'services';
    } else {
      continue;
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

async function fetchFavicon(url: string): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');

    const faviconUrls = [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];

    let faviconData: ArrayBuffer | null = null;
    let contentType = 'image/x-icon';

    for (const faviconUrl of faviconUrls) {
      try {
        const response = await fetch(faviconUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)' },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          faviconData = await response.arrayBuffer();
          contentType = response.headers.get('content-type') || 'image/x-icon';
          break;
        }
      } catch {
        continue;
      }
    }

    if (!faviconData) {
      return { success: false, error: 'No favicon found' };
    }

    const publicDir = join(process.cwd(), 'public', 'favicons');
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    let ext = 'png';
    if (contentType.includes('x-icon')) ext = 'ico';
    else if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('jpg') || contentType.includes('jpeg')) ext = 'jpg';

    const filename = `${domain.replace(/\./g, '_')}_${Date.now()}.png`;
    const pngPath = join(publicDir, filename);

    try {
      const buffer = Buffer.from(faviconData);
      let sharpInstance = sharp(buffer);

      try {
        const metadata = await sharpInstance.metadata();
        if (metadata.pages && metadata.pages > 1) {
          sharpInstance = sharp(buffer, { page: 0 });
        }
      } catch {
        // Proceed with conversion
      }

      await sharpInstance
        .png()
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .toFile(pngPath);

      return { success: true, path: `/api/favicons/serve/${filename}` };
    } catch (convertError: any) {
      return { success: false, error: `Conversion failed: ${convertError.message}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fetchFavicons = formData.get('fetchFavicons') === 'true';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const csvText = await file.text();
    const items = parseCSV(csvText);

    if (items.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid items found in CSV' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const db = getDb();
        const results = {
          bookmarksCreated: 0,
          servicesCreated: 0,
          categoriesCreated: 0,
          serviceCategoriesCreated: 0,
          errors: [] as string[],
        };
        const failedFavicons: Array<{
          name: string;
          url: string;
          section: string;
          itemId: number;
        }> = [];

        const categoryCache = new Map<string, number>();
        const serviceCategoryCache = new Map<string, number>();

        const existingCategories = await db.select().from(categories);
        existingCategories.forEach((cat: { id: number; name: string }) =>
          categoryCache.set(cat.name.toLowerCase(), cat.id)
        );

        const existingServiceCategories = await db.select().from(serviceCategories);
        existingServiceCategories.forEach((cat: { id: number; name: string }) =>
          serviceCategoryCache.set(cat.name.toLowerCase(), cat.id)
        );

        const total = items.length;

        // Send initial progress
        controller.enqueue(encoder.encode(
          JSON.stringify({ type: 'start', total }) + '\n'
        ));

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          let itemId: number | null = null;
          let faviconPath: string | null = null;

          try {
            // Fetch favicon if enabled
            if (fetchFavicons) {
              controller.enqueue(encoder.encode(
                JSON.stringify({
                  type: 'progress',
                  current: i + 1,
                  total,
                  phase: 'favicon',
                  item: { name: item.name, url: item.url }
                }) + '\n'
              ));

              const faviconResult = await fetchFavicon(item.url);
              if (faviconResult.success && faviconResult.path) {
                faviconPath = `favicon:${faviconResult.path}`;
              }
            }

            // Create the item
            controller.enqueue(encoder.encode(
              JSON.stringify({
                type: 'progress',
                current: i + 1,
                total,
                phase: 'saving',
                item: { name: item.name, url: item.url }
              }) + '\n'
            ));

            if (item.section === 'bookmarks') {
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

              const [newBookmark] = await db.insert(bookmarks).values({
                categoryId: catId as number,
                name: item.name,
                url: item.url,
                description: item.description,
                icon: faviconPath,
                order: 0,
                isVisible: true,
                requiresAuth: false,
              }).returning();
              itemId = newBookmark.id;
              results.bookmarksCreated++;

            } else if (item.section === 'services') {
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

              const [newService] = await db.insert(services).values({
                categoryId: catId as number,
                name: item.name,
                url: item.url,
                description: item.description,
                icon: faviconPath,
                order: 0,
                isVisible: true,
                requiresAuth: false,
              }).returning();
              itemId = newService.id;
              results.servicesCreated++;
            }

            // Track failed favicons
            if (fetchFavicons && !faviconPath && itemId) {
              failedFavicons.push({
                name: item.name,
                url: item.url,
                section: item.section,
                itemId,
              });
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

        // Send final results
        controller.enqueue(encoder.encode(
          JSON.stringify({
            type: 'complete',
            results,
            failedFavicons,
          }) + '\n'
        ));

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to import CSV' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
