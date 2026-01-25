import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { bookmarks, services, bookmarkClicks, serviceClicks } from '@/db/schema'
import { sql, gte, eq, desc } from 'drizzle-orm'
import { TopItemsQuerySchema } from '@/lib/validation/analytics'
import { subDays, subWeeks, subMonths, subYears } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse and validate query parameters
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = TopItemsQuerySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { type, period, limit } = parsed.data
    const db = getDb()

    // Calculate date range for current and previous periods
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

    const currentStart = new Date(now.getTime() - periodMs)
    const previousStart = new Date(now.getTime() - periodMs * 2)
    const previousEnd = currentStart

    let items: { id: number; name: string; clicks: number; trend: number }[]

    if (type === 'bookmarks') {
      // Get current period clicks
      const currentClicks = await db
        .select({
          id: bookmarks.id,
          name: bookmarks.name,
          clicks: sql<number>`count(${bookmarkClicks.id})`,
        })
        .from(bookmarks)
        .leftJoin(
          bookmarkClicks,
          sql`${bookmarkClicks.bookmarkId} = ${bookmarks.id} AND ${bookmarkClicks.clickedAt} >= ${currentStart}`
        )
        .groupBy(bookmarks.id, bookmarks.name)
        .orderBy(desc(sql`count(${bookmarkClicks.id})`))
        .limit(limit)

      // Get previous period clicks for trend calculation
      const previousClicks = await db
        .select({
          id: bookmarks.id,
          clicks: sql<number>`count(${bookmarkClicks.id})`,
        })
        .from(bookmarks)
        .leftJoin(
          bookmarkClicks,
          sql`${bookmarkClicks.bookmarkId} = ${bookmarks.id}
              AND ${bookmarkClicks.clickedAt} >= ${previousStart}
              AND ${bookmarkClicks.clickedAt} < ${previousEnd}`
        )
        .where(
          sql`${bookmarks.id} IN (${currentClicks.map((c: { id: number }) => c.id).join(',') || '0'})`
        )
        .groupBy(bookmarks.id)

      const previousClicksMap = new Map<number, number>(
        previousClicks.map((c: { id: number; clicks: number }) => [c.id, Number(c.clicks)] as [number, number])
      )

      items = currentClicks.map((item: { id: number; name: string; clicks: number }) => {
        const currentCount = Number(item.clicks)
        const previousCount = previousClicksMap.get(item.id) || 0
        const trend = previousCount > 0
          ? Math.round(((currentCount - previousCount) / previousCount) * 100)
          : currentCount > 0 ? 100 : 0

        return {
          id: item.id,
          name: item.name,
          clicks: currentCount,
          trend,
        }
      })
    } else {
      // Get current period clicks for services
      const currentClicks = await db
        .select({
          id: services.id,
          name: services.name,
          clicks: sql<number>`count(${serviceClicks.id})`,
        })
        .from(services)
        .leftJoin(
          serviceClicks,
          sql`${serviceClicks.serviceId} = ${services.id} AND ${serviceClicks.clickedAt} >= ${currentStart}`
        )
        .groupBy(services.id, services.name)
        .orderBy(desc(sql`count(${serviceClicks.id})`))
        .limit(limit)

      // Get previous period clicks for trend calculation
      const previousClicks = await db
        .select({
          id: services.id,
          clicks: sql<number>`count(${serviceClicks.id})`,
        })
        .from(services)
        .leftJoin(
          serviceClicks,
          sql`${serviceClicks.serviceId} = ${services.id}
              AND ${serviceClicks.clickedAt} >= ${previousStart}
              AND ${serviceClicks.clickedAt} < ${previousEnd}`
        )
        .where(
          sql`${services.id} IN (${currentClicks.map((c: { id: number }) => c.id).join(',') || '0'})`
        )
        .groupBy(services.id)

      const previousClicksMap = new Map<number, number>(
        previousClicks.map((c: { id: number; clicks: number }) => [c.id, Number(c.clicks)] as [number, number])
      )

      items = currentClicks.map((item: { id: number; name: string; clicks: number }) => {
        const currentCount = Number(item.clicks)
        const previousCount = previousClicksMap.get(item.id) || 0
        const trend = previousCount > 0
          ? Math.round(((currentCount - previousCount) / previousCount) * 100)
          : currentCount > 0 ? 100 : 0

        return {
          id: item.id,
          name: item.name,
          clicks: currentCount,
          trend,
        }
      })
    }

    return NextResponse.json({
      items,
      type,
      period,
    })
  } catch (error) {
    console.error('Failed to get top items:', error)
    return NextResponse.json({ error: 'Failed to get top items' }, { status: 500 })
  }
}
