import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { categories, bookmarks, serviceCategories, services, settings, pageviews, bookmarkClicks, serviceClicks, analyticsDaily } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cacheDel } from '@/lib/redis';
import JSZip from 'jszip';
import {
  parseBookmarksCSV,
  parseServicesCSV,
  parseCategoriesCSV,
  BookmarkData,
  ServiceData,
  CategoryData,
} from '@/lib/backup-utils';

interface RestoreResult {
  bookmarksCreated: number;
  servicesCreated: number;
  bookmarkCategoriesCreated: number;
  serviceCategoriesCreated: number;
  settingsRestored: number;
  analyticsRestored: number;
  errors: string[];
}

// Import bookmark categories
async function importBookmarkCategories(
  db: ReturnType<typeof getDb>,
  categoryData: CategoryData[],
  result: RestoreResult,
  clearExisting: boolean
): Promise<Map<string, number>> {
  const categoryMap = new Map<string, number>();

  if (clearExisting) {
    // Delete all existing categories (cascades to bookmarks)
    await db.delete(categories);
  }

  // Get existing categories
  const existing = await db.select().from(categories);
  existing.forEach((cat: any) => categoryMap.set(cat.name.toLowerCase(), cat.id));

  for (const cat of categoryData) {
    try {
      const existingId = categoryMap.get(cat.name.toLowerCase());
      if (existingId && !clearExisting) {
        // Update existing
        await db.update(categories)
          .set({
            icon: cat.icon,
            order: cat.order,
            showOpenAll: cat.showOpenAll,
          })
          .where(eq(categories.id, existingId));
      } else {
        // Create new
        const [newCat] = await db.insert(categories).values({
          name: cat.name,
          icon: cat.icon,
          order: cat.order,
          showOpenAll: cat.showOpenAll,
        }).returning();
        categoryMap.set(cat.name.toLowerCase(), newCat.id);
        result.bookmarkCategoriesCreated++;
      }
    } catch (error: any) {
      result.errors.push(`Failed to import category "${cat.name}": ${error.message}`);
    }
  }

  return categoryMap;
}

// Import service categories
async function importServiceCategories(
  db: ReturnType<typeof getDb>,
  categoryData: CategoryData[],
  result: RestoreResult,
  clearExisting: boolean
): Promise<Map<string, number>> {
  const categoryMap = new Map<string, number>();

  if (clearExisting) {
    await db.delete(serviceCategories);
  }

  const existing = await db.select().from(serviceCategories);
  existing.forEach((cat: any) => categoryMap.set(cat.name.toLowerCase(), cat.id));

  for (const cat of categoryData) {
    try {
      const existingId = categoryMap.get(cat.name.toLowerCase());
      if (existingId && !clearExisting) {
        await db.update(serviceCategories)
          .set({
            icon: cat.icon,
            order: cat.order,
            showOpenAll: cat.showOpenAll,
          })
          .where(eq(serviceCategories.id, existingId));
      } else {
        const [newCat] = await db.insert(serviceCategories).values({
          name: cat.name,
          icon: cat.icon,
          order: cat.order,
          showOpenAll: cat.showOpenAll,
        }).returning();
        categoryMap.set(cat.name.toLowerCase(), newCat.id);
        result.serviceCategoriesCreated++;
      }
    } catch (error: any) {
      result.errors.push(`Failed to import service category "${cat.name}": ${error.message}`);
    }
  }

  return categoryMap;
}

// Import bookmarks
async function importBookmarks(
  db: ReturnType<typeof getDb>,
  bookmarkData: BookmarkData[],
  categoryMap: Map<string, number>,
  result: RestoreResult,
  clearExisting: boolean
): Promise<void> {
  if (clearExisting) {
    await db.delete(bookmarks);
  }

  for (const bookmark of bookmarkData) {
    try {
      // Get or create category
      let catId = categoryMap.get(bookmark.categoryName.toLowerCase());
      if (!catId) {
        const [newCat] = await db.insert(categories).values({
          name: bookmark.categoryName,
          order: categoryMap.size,
        }).returning();
        catId = newCat.id as number;
        categoryMap.set(bookmark.categoryName.toLowerCase(), catId);
        result.bookmarkCategoriesCreated++;
      }

      // Create bookmark
      await db.insert(bookmarks).values({
        categoryId: catId,
        name: bookmark.name,
        url: bookmark.url,
        description: bookmark.description,
        icon: bookmark.icon,
        order: bookmark.order,
        isVisible: bookmark.isVisible,
        requiresAuth: bookmark.requiresAuth,
      });
      result.bookmarksCreated++;
    } catch (error: any) {
      result.errors.push(`Failed to import bookmark "${bookmark.name}": ${error.message}`);
    }
  }
}

// Import services
async function importServices(
  db: ReturnType<typeof getDb>,
  serviceData: ServiceData[],
  categoryMap: Map<string, number>,
  result: RestoreResult,
  clearExisting: boolean
): Promise<void> {
  if (clearExisting) {
    await db.delete(services);
  }

  for (const service of serviceData) {
    try {
      let catId = categoryMap.get(service.categoryName.toLowerCase());
      if (!catId) {
        const [newCat] = await db.insert(serviceCategories).values({
          name: service.categoryName,
          order: categoryMap.size,
        }).returning();
        catId = newCat.id as number;
        categoryMap.set(service.categoryName.toLowerCase(), catId);
        result.serviceCategoriesCreated++;
      }

      await db.insert(services).values({
        categoryId: catId,
        name: service.name,
        url: service.url,
        description: service.description,
        icon: service.icon,
        order: service.order,
        isVisible: service.isVisible,
        requiresAuth: service.requiresAuth,
      });
      result.servicesCreated++;
    } catch (error: any) {
      result.errors.push(`Failed to import service "${service.name}": ${error.message}`);
    }
  }
}

// Import settings
async function importSettings(
  db: ReturnType<typeof getDb>,
  settingsData: Record<string, string | null>,
  result: RestoreResult
): Promise<void> {
  for (const [key, value] of Object.entries(settingsData)) {
    try {
      // Check if setting exists
      const existing = await db.select().from(settings)
        .where(eq(settings.key, key));

      if (existing.length > 0) {
        await db.update(settings)
          .set({ value })
          .where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({
          key,
          value,
          userId: null,
        });
      }
      result.settingsRestored++;
    } catch (error: any) {
      result.errors.push(`Failed to import setting "${key}": ${error.message}`);
    }
  }
}

// Import analytics
async function importAnalytics(
  db: ReturnType<typeof getDb>,
  analyticsData: any,
  result: RestoreResult,
  clearExisting: boolean
): Promise<void> {
  try {
    // Clear existing analytics if requested
    if (clearExisting) {
      await db.delete(pageviews);
      await db.delete(bookmarkClicks);
      await db.delete(serviceClicks);
      await db.delete(analyticsDaily);
    }

    // Import pageviews
    if (analyticsData.pageviews && Array.isArray(analyticsData.pageviews)) {
      for (const pv of analyticsData.pageviews) {
        try {
          await db.insert(pageviews).values({
            path: pv.path,
            userAgent: pv.userAgent,
            ipAddress: pv.ipAddress,
            ipHash: pv.ipHash,
            country: pv.country,
            countryName: pv.countryName,
            city: pv.city,
            region: pv.region,
            latitude: pv.latitude,
            longitude: pv.longitude,
            timezone: pv.timezone,
            geoEnriched: pv.geoEnriched,
            timestamp: pv.timestamp,
          });
          result.analyticsRestored++;
        } catch (e: any) {
          // Ignore duplicates
        }
      }
    }

    // Import bookmark clicks
    if (analyticsData.bookmarkClicks && Array.isArray(analyticsData.bookmarkClicks)) {
      for (const click of analyticsData.bookmarkClicks) {
        try {
          await db.insert(bookmarkClicks).values({
            bookmarkId: click.bookmarkId,
            clickedAt: click.clickedAt,
            hourOfDay: click.hourOfDay,
            dayOfWeek: click.dayOfWeek,
            dayOfMonth: click.dayOfMonth,
          });
          result.analyticsRestored++;
        } catch (e: any) {
          // Ignore duplicates
        }
      }
    }

    // Import service clicks
    if (analyticsData.serviceClicks && Array.isArray(analyticsData.serviceClicks)) {
      for (const click of analyticsData.serviceClicks) {
        try {
          await db.insert(serviceClicks).values({
            serviceId: click.serviceId,
            clickedAt: click.clickedAt,
            hourOfDay: click.hourOfDay,
            dayOfWeek: click.dayOfWeek,
            dayOfMonth: click.dayOfMonth,
          });
          result.analyticsRestored++;
        } catch (e: any) {
          // Ignore duplicates
        }
      }
    }

    // Import analytics daily
    if (analyticsData.analyticsDaily && Array.isArray(analyticsData.analyticsDaily)) {
      for (const daily of analyticsData.analyticsDaily) {
        try {
          await db.insert(analyticsDaily).values({
            date: daily.date,
            type: daily.type,
            itemId: daily.itemId,
            country: daily.country,
            count: daily.count,
            uniqueVisitors: daily.uniqueVisitors,
          });
          result.analyticsRestored++;
        } catch (e: any) {
          // Ignore duplicates
        }
      }
    }
  } catch (error: any) {
    result.errors.push(`Failed to import analytics: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string || 'full';
    const clearExisting = formData.get('clearExisting') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const db = getDb();
    const result: RestoreResult = {
      bookmarksCreated: 0,
      servicesCreated: 0,
      bookmarkCategoriesCreated: 0,
      serviceCategoriesCreated: 0,
      settingsRestored: 0,
      analyticsRestored: 0,
      errors: [],
    };

    const fileName = file.name.toLowerCase();

    // Handle ZIP backup file
    if (fileName.endsWith('.zip')) {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Import in order: categories first, then items, then settings
      const bookmarkCategoriesFile = zip.file('bookmark-categories.csv');
      const serviceCategoriesFile = zip.file('service-categories.csv');
      const bookmarksFile = zip.file('bookmarks.csv');
      const servicesFile = zip.file('services.csv');
      const settingsFile = zip.file('settings.json');

      // Import bookmark categories
      let bookmarkCategoryMap = new Map<string, number>();
      if (bookmarkCategoriesFile && (importType === 'full' || importType === 'bookmark-categories')) {
        const content = await bookmarkCategoriesFile.async('string');
        const categoryData = parseCategoriesCSV(content);
        bookmarkCategoryMap = await importBookmarkCategories(db, categoryData, result, clearExisting);
      } else {
        // Load existing categories
        const existing = await db.select().from(categories);
        existing.forEach((cat: any) => bookmarkCategoryMap.set(cat.name.toLowerCase(), cat.id));
      }

      // Import service categories
      let serviceCategoryMap = new Map<string, number>();
      if (serviceCategoriesFile && (importType === 'full' || importType === 'service-categories')) {
        const content = await serviceCategoriesFile.async('string');
        const categoryData = parseCategoriesCSV(content);
        serviceCategoryMap = await importServiceCategories(db, categoryData, result, clearExisting);
      } else {
        const existing = await db.select().from(serviceCategories);
        existing.forEach((cat: any) => serviceCategoryMap.set(cat.name.toLowerCase(), cat.id));
      }

      // Import bookmarks
      if (bookmarksFile && (importType === 'full' || importType === 'bookmarks')) {
        const content = await bookmarksFile.async('string');
        const bookmarkData = parseBookmarksCSV(content);
        await importBookmarks(db, bookmarkData, bookmarkCategoryMap, result, clearExisting);
      }

      // Import services
      if (servicesFile && (importType === 'full' || importType === 'services')) {
        const content = await servicesFile.async('string');
        const serviceData = parseServicesCSV(content);
        await importServices(db, serviceData, serviceCategoryMap, result, clearExisting);
      }

      // Import settings
      if (settingsFile && (importType === 'full' || importType === 'settings')) {
        const content = await settingsFile.async('string');
        const settingsData = JSON.parse(content);
        await importSettings(db, settingsData, result);
      }

      // Import analytics
      const analyticsFile = zip.file('analytics.json');
      if (analyticsFile && (importType === 'full' || importType === 'analytics')) {
        const content = await analyticsFile.async('string');
        const analyticsData = JSON.parse(content);
        await importAnalytics(db, analyticsData, result, clearExisting);
      }
    }
    // Handle individual CSV file
    else if (fileName.endsWith('.csv')) {
      const content = await file.text();

      if (importType === 'bookmarks' || fileName.includes('bookmark') && !fileName.includes('categor')) {
        const existing = await db.select().from(categories);
        const categoryMap = new Map<string, number>();
        existing.forEach((cat: any) => categoryMap.set(cat.name.toLowerCase(), cat.id));

        const bookmarkData = parseBookmarksCSV(content);
        await importBookmarks(db, bookmarkData, categoryMap, result, clearExisting);
      }
      else if (importType === 'services' || fileName.includes('service') && !fileName.includes('categor')) {
        const existing = await db.select().from(serviceCategories);
        const categoryMap = new Map<string, number>();
        existing.forEach((cat: any) => categoryMap.set(cat.name.toLowerCase(), cat.id));

        const serviceData = parseServicesCSV(content);
        await importServices(db, serviceData, categoryMap, result, clearExisting);
      }
      else if (importType === 'bookmark-categories' || (fileName.includes('bookmark') && fileName.includes('categor'))) {
        const categoryData = parseCategoriesCSV(content);
        await importBookmarkCategories(db, categoryData, result, clearExisting);
      }
      else if (importType === 'service-categories' || (fileName.includes('service') && fileName.includes('categor'))) {
        const categoryData = parseCategoriesCSV(content);
        await importServiceCategories(db, categoryData, result, clearExisting);
      }
      else {
        return NextResponse.json({ error: 'Unable to determine CSV type. Please specify import type.' }, { status: 400 });
      }
    }
    // Handle settings JSON
    else if (fileName.endsWith('.json')) {
      const content = await file.text();
      const settingsData = JSON.parse(content);
      await importSettings(db, settingsData, result);
    }
    else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a .zip, .csv, or .json file.' }, { status: 400 });
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
      message: 'Import complete',
      results: result,
    });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore backup' },
      { status: 500 }
    );
  }
}
