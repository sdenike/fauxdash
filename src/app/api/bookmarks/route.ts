import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks } from '@/db/schema';
import { cacheDel } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();

  const newBookmark = await db.insert(bookmarks).values({
    categoryId: body.categoryId,
    name: body.name,
    url: body.url,
    description: body.description || null,
    icon: body.icon || null,
    order: body.order || 0,
    isVisible: body.isVisible ?? true,
    requiresAuth: body.requiresAuth ?? false,
  }).returning();

  // Invalidate cache
  await cacheDel('categories:public');
  await cacheDel(`categories:auth:${session.user?.email}`);

  return NextResponse.json(newBookmark[0]);
}
