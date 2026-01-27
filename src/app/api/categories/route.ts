import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { categories, bookmarks } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const db = getDb();

  // Check cache first
  const cacheKey = session ? `categories:auth:${session.user?.email}` : 'categories:public';
  const cached = await cacheGet(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  let query = db
    .select()
    .from(categories)
    .orderBy(asc(categories.order));

  let categoriesData = await query;

  // Filter out categories that require auth if user is not logged in
  if (!session) {
    categoriesData = categoriesData.filter((cat: any) => !cat.requiresAuth && cat.isVisible);
  } else {
    categoriesData = categoriesData.filter((cat: any) => cat.isVisible);
  }

  // Get bookmarks for each category
  const categoriesWithBookmarks = await Promise.all(
    categoriesData.map(async (category: any) => {
      // Determine sorting based on category.sortBy
      let orderByClause;
      switch (category.sortBy) {
        case 'name_asc':
          orderByClause = asc(bookmarks.name);
          break;
        case 'name_desc':
          orderByClause = desc(bookmarks.name);
          break;
        case 'clicks_asc':
          orderByClause = asc(bookmarks.clickCount);
          break;
        case 'clicks_desc':
          orderByClause = desc(bookmarks.clickCount);
          break;
        case 'order':
        default:
          orderByClause = asc(bookmarks.order);
          break;
      }

      let bookmarksQuery = db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.categoryId, category.id))
        .orderBy(orderByClause);

      let bookmarksData = await bookmarksQuery;

      // Filter bookmarks based on auth
      if (!session) {
        bookmarksData = bookmarksData.filter((bm: any) => !bm.requiresAuth && bm.isVisible);
      } else {
        bookmarksData = bookmarksData.filter((bm: any) => bm.isVisible);
      }

      return {
        ...category,
        bookmarks: bookmarksData,
      };
    })
  );

  // Cache for 5 minutes
  await cacheSet(cacheKey, categoriesWithBookmarks, 300);

  return NextResponse.json(categoriesWithBookmarks);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();

  const newCategory = await db.insert(categories).values({
    name: body.name,
    icon: body.icon || null,
    order: body.order || 0,
    columns: body.columns || 1,
    isVisible: body.isVisible ?? true,
    requiresAuth: body.requiresAuth ?? false,
    itemsToShow: body.itemsToShow ?? 5,
    showItemCount: body.showItemCount ?? true,
    autoExpanded: body.autoExpanded ?? false,
    showOpenAll: body.showOpenAll ?? false,
  }).returning();

  // Invalidate cache
  await cacheDel('categories:public');
  await cacheDel(`categories:auth:${session.user?.email}`);

  return NextResponse.json(newCategory[0]);
}
