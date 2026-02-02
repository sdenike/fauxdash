import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { bookmarks, bookmarkClicks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const bookmarkId = parseInt(id);

  // Calculate time-based analytics
  const now = new Date();
  const hourOfDay = now.getHours(); // 0-23
  const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
  const dayOfMonth = now.getDate(); // 1-31

  // Insert analytics data
  await db.insert(bookmarkClicks).values({
    bookmarkId,
    clickedAt: now,
    hourOfDay,
    dayOfWeek,
    dayOfMonth,
  });

  // Increment click count
  await db
    .update(bookmarks)
    .set({
      clickCount: sql`${bookmarks.clickCount} + 1`,
    })
    .where(eq(bookmarks.id, bookmarkId));

  return NextResponse.json({ success: true });
}
