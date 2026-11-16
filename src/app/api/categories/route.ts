import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { categories, bookmarks } from '@/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { cacheDel } from '@/lib/redis';
import { loadBookmarkCategories } from '@/lib/server/start-page';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  return NextResponse.json(await loadBookmarkCategories(session));
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
