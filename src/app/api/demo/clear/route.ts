import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import {
  categories,
  bookmarks,
  serviceCategories,
  services,
  pageviews,
  bookmarkClicks,
  serviceClicks,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cacheDel } from '@/lib/redis';

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  try {
    // Delete demo data in reverse dependency order
    // 1. Delete demo clicks first (they reference bookmarks/services)
    const deletedBookmarkClicks = await db
      .delete(bookmarkClicks)
      .where(eq(bookmarkClicks.isDemo, true))
      .returning();

    const deletedServiceClicks = await db
      .delete(serviceClicks)
      .where(eq(serviceClicks.isDemo, true))
      .returning();

    // 2. Delete demo pageviews
    const deletedPageviews = await db
      .delete(pageviews)
      .where(eq(pageviews.isDemo, true))
      .returning();

    // 3. Delete demo bookmarks (they reference categories)
    const deletedBookmarks = await db
      .delete(bookmarks)
      .where(eq(bookmarks.isDemo, true))
      .returning();

    // 4. Delete demo services (they reference service categories)
    const deletedServices = await db
      .delete(services)
      .where(eq(services.isDemo, true))
      .returning();

    // 5. Delete demo categories
    const deletedCategories = await db
      .delete(categories)
      .where(eq(categories.isDemo, true))
      .returning();

    // 6. Delete demo service categories
    const deletedServiceCategories = await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.isDemo, true))
      .returning();

    // Invalidate all relevant caches
    await cacheDel('categories:public');
    await cacheDel(`categories:auth:${session.user?.email}`);
    await cacheDel('service-categories:public');
    await cacheDel(`service-categories:auth:${session.user?.email}`);
    await cacheDel('services:public');
    await cacheDel(`services:auth:${session.user?.email}`);

    return NextResponse.json({
      success: true,
      message: 'Demo content cleared successfully',
      stats: {
        bookmarkCategories: deletedCategories.length,
        bookmarks: deletedBookmarks.length,
        serviceCategories: deletedServiceCategories.length,
        services: deletedServices.length,
        pageviews: deletedPageviews.length,
        bookmarkClicks: deletedBookmarkClicks.length,
        serviceClicks: deletedServiceClicks.length,
      },
    });
  } catch (error) {
    console.error('Error clearing demo content:', error);
    return NextResponse.json(
      { error: 'Failed to clear demo content' },
      { status: 500 }
    );
  }
}
