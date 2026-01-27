import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { pageviews, bookmarkClicks, serviceClicks } from '@/db/schema'
import { sql, and, isNotNull } from 'drizzle-orm'
import { StatsQuerySchema } from '@/lib/validation/analytics'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse and validate query parameters
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = StatsQuerySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { period } = parsed.data
    const db = getDb()

    // Calculate date ranges for current and previous periods
    const now = new Date()
    let periodMs: number

    switch (period) {
      case 'day':
        periodMs = 24 * 60 * 60 * 1000
        break
      case 'week':
        periodMs = 7 * 24 * 60 * 60 * 1000
        break
      case 'month':
        periodMs = 30 * 24 * 60 * 60 * 1000
        break
      case 'year':
        periodMs = 365 * 24 * 60 * 60 * 1000
        break
      default:
        periodMs = 7 * 24 * 60 * 60 * 1000
    }

    // Convert to epoch seconds for SQLite comparison (timestamps stored as integers)
    const currentStartEpoch = Math.floor((now.getTime() - periodMs) / 1000)
    const previousStartEpoch = Math.floor((now.getTime() - periodMs * 2) / 1000)
    const previousEndEpoch = currentStartEpoch

    // Get current period pageviews
    const [currentPageviews] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageviews)
      .where(sql`${pageviews.timestamp} >= ${currentStartEpoch}`)

    // Get previous period pageviews
    const [previousPageviews] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageviews)
      .where(
        sql`${pageviews.timestamp} >= ${previousStartEpoch} AND ${pageviews.timestamp} < ${previousEndEpoch}`
      )

    // Get unique visitors (by IP hash) for current period
    const [currentUniqueVisitors] = await db
      .select({ count: sql<number>`count(DISTINCT ${pageviews.ipHash})` })
      .from(pageviews)
      .where(
        sql`${pageviews.timestamp} >= ${currentStartEpoch} AND ${pageviews.ipHash} IS NOT NULL`
      )

    // Get unique visitors for previous period
    const [previousUniqueVisitors] = await db
      .select({ count: sql<number>`count(DISTINCT ${pageviews.ipHash})` })
      .from(pageviews)
      .where(
        sql`${pageviews.timestamp} >= ${previousStartEpoch} AND ${pageviews.timestamp} < ${previousEndEpoch} AND ${pageviews.ipHash} IS NOT NULL`
      )

    // Get current period clicks (bookmarks + services)
    const [currentBookmarkClicks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarkClicks)
      .where(sql`${bookmarkClicks.clickedAt} >= ${currentStartEpoch}`)

    const [currentServiceClicks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceClicks)
      .where(sql`${serviceClicks.clickedAt} >= ${currentStartEpoch}`)

    // Get previous period clicks
    const [previousBookmarkClicks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarkClicks)
      .where(
        sql`${bookmarkClicks.clickedAt} >= ${previousStartEpoch} AND ${bookmarkClicks.clickedAt} < ${previousEndEpoch}`
      )

    const [previousServiceClicks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceClicks)
      .where(
        sql`${serviceClicks.clickedAt} >= ${previousStartEpoch} AND ${serviceClicks.clickedAt} < ${previousEndEpoch}`
      )

    // Get top country
    const topCountryResult = await db
      .select({
        country: pageviews.countryName,
        count: sql<number>`count(*)`,
      })
      .from(pageviews)
      .where(
        sql`${pageviews.timestamp} >= ${currentStartEpoch} AND ${pageviews.countryName} IS NOT NULL`
      )
      .groupBy(pageviews.countryName)
      .orderBy(sql`count(*) DESC`)
      .limit(1)

    // Calculate values and trends
    const pageviewsCount = Number(currentPageviews?.count || 0)
    const previousPageviewsCount = Number(previousPageviews?.count || 0)
    const pageviewsTrend = previousPageviewsCount > 0
      ? Math.round(((pageviewsCount - previousPageviewsCount) / previousPageviewsCount) * 100)
      : pageviewsCount > 0 ? 100 : 0

    const uniqueVisitorsCount = Number(currentUniqueVisitors?.count || 0)
    const previousUniqueVisitorsCount = Number(previousUniqueVisitors?.count || 0)
    const uniqueVisitorsTrend = previousUniqueVisitorsCount > 0
      ? Math.round(((uniqueVisitorsCount - previousUniqueVisitorsCount) / previousUniqueVisitorsCount) * 100)
      : uniqueVisitorsCount > 0 ? 100 : 0

    const totalClicks = Number(currentBookmarkClicks?.count || 0) + Number(currentServiceClicks?.count || 0)
    const previousTotalClicks = Number(previousBookmarkClicks?.count || 0) + Number(previousServiceClicks?.count || 0)
    const clicksTrend = previousTotalClicks > 0
      ? Math.round(((totalClicks - previousTotalClicks) / previousTotalClicks) * 100)
      : totalClicks > 0 ? 100 : 0

    const topCountry = topCountryResult[0]?.country || 'Unknown'
    const topCountryCount = Number(topCountryResult[0]?.count || 0)

    return NextResponse.json({
      pageviews: {
        value: pageviewsCount,
        trend: pageviewsTrend,
      },
      uniqueVisitors: {
        value: uniqueVisitorsCount,
        trend: uniqueVisitorsTrend,
      },
      totalClicks: {
        value: totalClicks,
        trend: clicksTrend,
      },
      topCountry: {
        name: topCountry,
        count: topCountryCount,
      },
      period,
    })
  } catch (error) {
    console.error('Failed to get stats:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
