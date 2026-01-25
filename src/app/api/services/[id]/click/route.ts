import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { services, serviceClicks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const serviceId = parseInt(params.id);

  // Calculate time-based analytics
  const now = new Date();
  const hourOfDay = now.getHours(); // 0-23
  const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)
  const dayOfMonth = now.getDate(); // 1-31

  // Insert analytics data
  await db.insert(serviceClicks).values({
    serviceId,
    clickedAt: now,
    hourOfDay,
    dayOfWeek,
    dayOfMonth,
  });

  // Increment click count
  await db
    .update(services)
    .set({
      clickCount: sql`${services.clickCount} + 1`,
    })
    .where(eq(services.id, serviceId));

  return NextResponse.json({ success: true });
}
