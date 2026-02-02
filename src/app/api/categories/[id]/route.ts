import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { categories, bookmarks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cacheDel } from '@/lib/redis';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();

  const updated = await db
    .update(categories)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, parseInt(params.id)))
    .returning();

  // Invalidate cache
  await cacheDel('categories:public');
  await cacheDel(`categories:auth:${session.user?.email}`);

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const categoryId = parseInt(params.id);

  // Check if there are bookmarks in this category
  const bookmarksInCategory = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarks)
    .where(eq(bookmarks.categoryId, categoryId));

  const bookmarkCount = bookmarksInCategory[0]?.count || 0;

  if (bookmarkCount > 0) {
    // Get or create Uncategorized category
    let uncategorized = await db
      .select()
      .from(categories)
      .where(eq(categories.name, 'Uncategorized'));

    let uncategorizedId: number;

    if (uncategorized.length === 0) {
      // Create Uncategorized category
      const maxOrder = await db
        .select({ max: sql<number>`COALESCE(MAX("order"), 0)` })
        .from(categories);

      const [newCategory] = await db.insert(categories).values({
        name: 'Uncategorized',
        icon: 'mdi:folder-alert',
        order: (maxOrder[0]?.max || 0) + 1,
        isVisible: true,
        autoExpanded: true,
      }).returning();

      uncategorizedId = newCategory.id;
    } else {
      uncategorizedId = uncategorized[0].id;
    }

    // Move bookmarks to Uncategorized
    await db
      .update(bookmarks)
      .set({ categoryId: uncategorizedId })
      .where(eq(bookmarks.categoryId, categoryId));
  }

  // Now delete the category
  await db
    .delete(categories)
    .where(eq(categories.id, categoryId));

  // Invalidate cache
  await cacheDel('categories:public');
  await cacheDel(`categories:auth:${session.user?.email}`);

  return NextResponse.json({ success: true, movedBookmarks: bookmarkCount });
}
