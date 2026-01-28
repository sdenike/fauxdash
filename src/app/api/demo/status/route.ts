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
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  try {
    // Count demo items in each table
    const [demoCategories] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.isDemo, true));

    const [demoBookmarks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.isDemo, true));

    const [demoServiceCategories] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceCategories)
      .where(eq(serviceCategories.isDemo, true));

    const [demoServices] = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(eq(services.isDemo, true));

    const [demoPageviews] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageviews)
      .where(eq(pageviews.isDemo, true));

    const hasDemo =
      demoCategories.count > 0 ||
      demoBookmarks.count > 0 ||
      demoServiceCategories.count > 0 ||
      demoServices.count > 0;

    return NextResponse.json({
      hasDemo,
      stats: {
        bookmarkCategories: Number(demoCategories.count),
        bookmarks: Number(demoBookmarks.count),
        serviceCategories: Number(demoServiceCategories.count),
        services: Number(demoServices.count),
        pageviews: Number(demoPageviews.count),
      },
    });
  } catch (error) {
    console.error('Error checking demo status:', error);
    return NextResponse.json(
      { error: 'Failed to check demo status' },
      { status: 500 }
    );
  }
}
