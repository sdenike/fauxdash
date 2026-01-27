import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { categories, bookmarks, serviceCategories, services, settings, pageviews, bookmarkClicks, serviceClicks, analyticsDaily } from '@/db/schema';
import { asc, isNull, eq } from 'drizzle-orm';
import JSZip from 'jszip';
import {
  generateBookmarksCSV,
  generateServicesCSV,
  generateCategoriesCSV,
  BookmarkData,
  ServiceData,
  CategoryData,
} from '@/lib/backup-utils';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();

    // Fetch all data
    const allCategories = await db.select().from(categories).orderBy(asc(categories.order));
    const allBookmarks = await db.select().from(bookmarks).orderBy(asc(bookmarks.order));
    const allServiceCategories = await db.select().from(serviceCategories).orderBy(asc(serviceCategories.order));
    const allServices = await db.select().from(services).orderBy(asc(services.order));
    const allSettings = await db.select().from(settings).where(isNull(settings.userId));

    // Fetch analytics data
    const allPageviews = await db.select().from(pageviews);
    const allBookmarkClicks = await db.select().from(bookmarkClicks);
    const allServiceClicks = await db.select().from(serviceClicks);
    const allAnalyticsDaily = await db.select().from(analyticsDaily);

    // Create category lookup maps
    const categoryMap = new Map(allCategories.map((c: any) => [c.id, c.name]));
    const serviceCategoryMap = new Map(allServiceCategories.map((c: any) => [c.id, c.name]));

    // Transform bookmarks for CSV
    const bookmarkData: BookmarkData[] = allBookmarks.map((b: any) => ({
      name: b.name,
      description: b.description,
      url: b.url,
      icon: b.icon,
      categoryName: categoryMap.get(b.categoryId) || 'Uncategorized',
      order: b.order,
      isVisible: b.isVisible,
      requiresAuth: b.requiresAuth,
    }));

    // Transform services for CSV
    const serviceData: ServiceData[] = allServices.map((s: any) => ({
      name: s.name,
      description: s.description,
      url: s.url,
      icon: s.icon,
      categoryName: serviceCategoryMap.get(s.categoryId) || 'Uncategorized',
      order: s.order,
      isVisible: s.isVisible,
      requiresAuth: s.requiresAuth,
    }));

    // Transform bookmark categories for CSV
    const bookmarkCategoryData: CategoryData[] = allCategories.map((c: any) => ({
      name: c.name,
      icon: c.icon,
      color: c.color,
      order: c.order,
      isCollapsed: c.isCollapsed,
      showOpenAll: c.showOpenAll,
    }));

    // Transform service categories for CSV
    const serviceCategoryData: CategoryData[] = allServiceCategories.map((c: any) => ({
      name: c.name,
      icon: c.icon,
      color: c.color,
      order: c.order,
      isCollapsed: c.isCollapsed,
      showOpenAll: c.showOpenAll,
    }));

    // Transform settings to JSON (excluding sensitive data from export)
    const settingsData: Record<string, string | null> = {};
    const sensitiveKeys = ['geoipMaxmindLicenseKey', 'geoipIpinfoToken', 'smtpPassword'];
    for (const setting of allSettings as any[]) {
      if (!sensitiveKeys.includes(setting.key)) {
        settingsData[setting.key] = setting.value;
      }
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add CSV files
    zip.file('bookmarks.csv', generateBookmarksCSV(bookmarkData));
    zip.file('services.csv', generateServicesCSV(serviceData));
    zip.file('bookmark-categories.csv', generateCategoriesCSV(bookmarkCategoryData));
    zip.file('service-categories.csv', generateCategoriesCSV(serviceCategoryData));

    // Add settings JSON
    zip.file('settings.json', JSON.stringify(settingsData, null, 2));

    // Add analytics JSON
    const analyticsData = {
      pageviews: allPageviews,
      bookmarkClicks: allBookmarkClicks,
      serviceClicks: allServiceClicks,
      analyticsDaily: allAnalyticsDaily,
    };
    zip.file('analytics.json', JSON.stringify(analyticsData, null, 2));

    // Add metadata
    const exportDate = new Date().toISOString();
    const metadata = {
      version: '1.1',
      exportDate,
      counts: {
        bookmarks: bookmarkData.length,
        services: serviceData.length,
        bookmarkCategories: bookmarkCategoryData.length,
        serviceCategories: serviceCategoryData.length,
        settings: Object.keys(settingsData).length,
        pageviews: allPageviews.length,
        bookmarkClicks: allBookmarkClicks.length,
        serviceClicks: allServiceClicks.length,
        analyticsDaily: allAnalyticsDaily.length,
      },
    };
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));

    // Save last backup date to settings
    const existingBackupSetting = await db.select().from(settings)
      .where(eq(settings.key, 'lastBackupDate'));

    if (existingBackupSetting.length > 0) {
      await db.update(settings)
        .set({ value: exportDate })
        .where(eq(settings.key, 'lastBackupDate'));
    } else {
      await db.insert(settings).values({
        key: 'lastBackupDate',
        value: exportDate,
        userId: null,
      });
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

    const date = new Date().toISOString().split('T')[0];
    const filename = `fauxdash-backup-${date}.zip`;

    return new Response(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create backup' },
      { status: 500 }
    );
  }
}
