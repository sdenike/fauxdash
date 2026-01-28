import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { categories, bookmarks } from '@/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
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

  // Fetch all bookmarks in a single query (fixes N+1 problem)
  const categoryIds = categoriesData.map((cat: any) => cat.id);
  let allBookmarks = categoryIds.length > 0
    ? await db.select().from(bookmarks).where(
        categoryIds.length === 1
          ? eq(bookmarks.categoryId, categoryIds[0])
          : inArray(bookmarks.categoryId, categoryIds)
      )
    : [];

  // Filter bookmarks based on auth
  if (!session) {
    allBookmarks = allBookmarks.filter((bm: any) => !bm.requiresAuth && bm.isVisible);
  } else {
    allBookmarks = allBookmarks.filter((bm: any) => bm.isVisible);
  }

  // Group bookmarks by categoryId
  const bookmarksByCategory = new Map<number, any[]>();
  allBookmarks.forEach((bm: any) => {
    const catId = bm.categoryId;
    if (!bookmarksByCategory.has(catId)) {
      bookmarksByCategory.set(catId, []);
    }
    bookmarksByCategory.get(catId)!.push(bm);
  });

  // Sort bookmarks per category based on category.sortBy setting
  const sortBookmarks = (items: any[], sortBy: string) => {
    const sorted = [...items];
    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name_desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'clicks_asc':
        return sorted.sort((a, b) => (a.clickCount || 0) - (b.clickCount || 0));
      case 'clicks_desc':
        return sorted.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      case 'order':
      default:
        return sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  };

  // Build final result with sorted bookmarks
  const categoriesWithBookmarks = categoriesData.map((category: any) => {
    const catBookmarks = bookmarksByCategory.get(category.id) || [];
    return {
      ...category,
      bookmarks: sortBookmarks(catBookmarks, category.sortBy),
    };
  });

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
