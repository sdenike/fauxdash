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
import {
  demoBookmarkCategories,
  demoBookmarks,
  demoServiceCategories,
  demoServices,
  generateDemoPageviews,
  generateDemoClicks,
} from '@/lib/demo-data';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  try {
    // Check if demo content already exists
    const existingDemo = await db
      .select()
      .from(categories)
      .where(eq(categories.isDemo, true))
      .limit(1);

    if (existingDemo.length > 0) {
      return NextResponse.json(
        { error: 'Demo content already loaded. Clear it first to reload.' },
        { status: 400 }
      );
    }

    // Track created IDs for click generation
    const createdBookmarkIds: number[] = [];
    const createdServiceIds: number[] = [];

    // Create bookmark categories and their bookmarks
    for (const catData of demoBookmarkCategories) {
      const [newCategory] = await db.insert(categories).values(catData).returning();
      const categoryId = newCategory.id;

      // Get bookmarks for this category
      const categoryBookmarks = demoBookmarks[catData.name] || [];
      for (const bmData of categoryBookmarks) {
        const [newBookmark] = await db
          .insert(bookmarks)
          .values({
            ...bmData,
            categoryId,
            isVisible: true,
            requiresAuth: false,
            clickCount: Math.floor(Math.random() * 50) + 5, // Random initial clicks
            isDemo: true,
          })
          .returning();
        createdBookmarkIds.push(newBookmark.id);
      }
    }

    // Create service categories and their services
    for (const catData of demoServiceCategories) {
      const [newCategory] = await db.insert(serviceCategories).values(catData).returning();
      const categoryId = newCategory.id;

      // Get services for this category
      const categoryServices = demoServices[catData.name] || [];
      for (const svcData of categoryServices) {
        const [newService] = await db
          .insert(services)
          .values({
            ...svcData,
            categoryId,
            isVisible: true,
            requiresAuth: false,
            clickCount: Math.floor(Math.random() * 30) + 3, // Random initial clicks
            isDemo: true,
          })
          .returning();
        createdServiceIds.push(newService.id);
      }
    }

    // Generate and insert demo pageviews (batched)
    const demoPageviewsData = generateDemoPageviews(30);
    const pageviewBatchSize = 100;
    for (let i = 0; i < demoPageviewsData.length; i += pageviewBatchSize) {
      const batch = demoPageviewsData.slice(i, i + pageviewBatchSize);
      await db.insert(pageviews).values(batch);
    }

    // Generate and insert demo bookmark clicks
    if (createdBookmarkIds.length > 0) {
      const demoBookmarkClicks = generateDemoClicks(createdBookmarkIds, 'bookmark', 30);
      const clickBatchSize = 100;
      for (let i = 0; i < demoBookmarkClicks.length; i += clickBatchSize) {
        const batch = demoBookmarkClicks.slice(i, i + clickBatchSize).map((click) => ({
          bookmarkId: click.itemId,
          clickedAt: click.clickedAt,
          hourOfDay: click.hourOfDay,
          dayOfWeek: click.dayOfWeek,
          dayOfMonth: click.dayOfMonth,
          isDemo: true,
        }));
        await db.insert(bookmarkClicks).values(batch);
      }
    }

    // Generate and insert demo service clicks
    if (createdServiceIds.length > 0) {
      const demoServiceClicks = generateDemoClicks(createdServiceIds, 'service', 30);
      const clickBatchSize = 100;
      for (let i = 0; i < demoServiceClicks.length; i += clickBatchSize) {
        const batch = demoServiceClicks.slice(i, i + clickBatchSize).map((click) => ({
          serviceId: click.itemId,
          clickedAt: click.clickedAt,
          hourOfDay: click.hourOfDay,
          dayOfWeek: click.dayOfWeek,
          dayOfMonth: click.dayOfMonth,
          isDemo: true,
        }));
        await db.insert(serviceClicks).values(batch);
      }
    }

    // Invalidate all relevant caches
    await cacheDel('categories:public');
    await cacheDel(`categories:auth:${session.user?.email}`);
    await cacheDel('service-categories:public');
    await cacheDel(`service-categories:auth:${session.user?.email}`);
    await cacheDel('services:public');
    await cacheDel(`services:auth:${session.user?.email}`);

    return NextResponse.json({
      success: true,
      message: 'Demo content loaded successfully',
      stats: {
        bookmarkCategories: demoBookmarkCategories.length,
        bookmarks: createdBookmarkIds.length,
        serviceCategories: demoServiceCategories.length,
        services: createdServiceIds.length,
        pageviews: demoPageviewsData.length,
      },
    });
  } catch (error) {
    console.error('Error loading demo content:', error);
    return NextResponse.json(
      { error: 'Failed to load demo content' },
      { status: 500 }
    );
  }
}
