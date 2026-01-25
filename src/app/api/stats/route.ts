import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { pageviews, bookmarkClicks, serviceClicks } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    // Calculate timestamps for different periods
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(todayStart.getTime() / 1000);

    const last24hTimestamp = now - (24 * 60 * 60);
    const lastWeekTimestamp = now - (7 * 24 * 60 * 60);
    const lastMonthTimestamp = now - (30 * 24 * 60 * 60);

    // Get counts for each period
    const [todayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageviews)
      .where(gte(pageviews.timestamp, new Date(todayTimestamp * 1000)));

    const [last24hResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageviews)
      .where(gte(pageviews.timestamp, new Date(last24hTimestamp * 1000)));

    const [lastWeekResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageviews)
      .where(gte(pageviews.timestamp, new Date(lastWeekTimestamp * 1000)));

    const [lastMonthResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageviews)
      .where(gte(pageviews.timestamp, new Date(lastMonthTimestamp * 1000)));

    // Get bookmark click counts
    const [bookmarkTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarkClicks)
      .where(gte(bookmarkClicks.clickedAt, new Date(todayTimestamp * 1000)));

    const [bookmarkLast24hResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarkClicks)
      .where(gte(bookmarkClicks.clickedAt, new Date(last24hTimestamp * 1000)));

    const [bookmarkLastWeekResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarkClicks)
      .where(gte(bookmarkClicks.clickedAt, new Date(lastWeekTimestamp * 1000)));

    const [bookmarkLastMonthResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarkClicks)
      .where(gte(bookmarkClicks.clickedAt, new Date(lastMonthTimestamp * 1000)));

    // Get service click counts
    const [serviceTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceClicks)
      .where(gte(serviceClicks.clickedAt, new Date(todayTimestamp * 1000)));

    const [serviceLast24hResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceClicks)
      .where(gte(serviceClicks.clickedAt, new Date(last24hTimestamp * 1000)));

    const [serviceLastWeekResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceClicks)
      .where(gte(serviceClicks.clickedAt, new Date(lastWeekTimestamp * 1000)));

    const [serviceLastMonthResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceClicks)
      .where(gte(serviceClicks.clickedAt, new Date(lastMonthTimestamp * 1000)));

    return NextResponse.json({
      pageviews: {
        today: todayResult?.count || 0,
        last24h: last24hResult?.count || 0,
        lastWeek: lastWeekResult?.count || 0,
        lastMonth: lastMonthResult?.count || 0,
      },
      bookmarkClicks: {
        today: bookmarkTodayResult?.count || 0,
        last24h: bookmarkLast24hResult?.count || 0,
        lastWeek: bookmarkLastWeekResult?.count || 0,
        lastMonth: bookmarkLastMonthResult?.count || 0,
      },
      serviceClicks: {
        today: serviceTodayResult?.count || 0,
        last24h: serviceLast24hResult?.count || 0,
        lastWeek: serviceLastWeekResult?.count || 0,
        lastMonth: serviceLastMonthResult?.count || 0,
      },
    });
  } catch (error) {
    console.error('Failed to get pageview stats:', error);
    return NextResponse.json({ error: 'Failed to get statistics' }, { status: 500 });
  }
}
