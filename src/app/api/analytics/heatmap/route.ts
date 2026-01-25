import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { bookmarkClicks, serviceClicks, pageviews } from '@/db/schema'
import { sql, gte, and } from 'drizzle-orm'
import { HeatmapQuerySchema } from '@/lib/validation/analytics'
import { subWeeks, subMonths, subYears } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse and validate query parameters
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = HeatmapQuerySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { period, type } = parsed.data
    const db = getDb()

    // Calculate date range
    const now = new Date()
    let rangeStart: Date

    switch (period) {
      case 'week':
        rangeStart = subWeeks(now, 1)
        break
      case 'month':
        rangeStart = subMonths(now, 1)
        break
      case 'year':
        rangeStart = subYears(now, 1)
        break
      default:
        rangeStart = subMonths(now, 1)
    }

    // Initialize heatmap grid (7 days x 24 hours)
    const heatmapGrid: Map<string, number> = new Map()
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapGrid.set(`${day}-${hour}`, 0)
      }
    }

    // Query bookmark clicks
    if (type === 'bookmarks' || type === 'all') {
      const bookmarkData = await db
        .select({
          hourOfDay: bookmarkClicks.hourOfDay,
          dayOfWeek: bookmarkClicks.dayOfWeek,
          count: sql<number>`count(*)`,
        })
        .from(bookmarkClicks)
        .where(gte(bookmarkClicks.clickedAt, rangeStart))
        .groupBy(bookmarkClicks.hourOfDay, bookmarkClicks.dayOfWeek)

      bookmarkData.forEach((row: { hourOfDay: number | null; dayOfWeek: number | null; count: number }) => {
        const key = `${row.dayOfWeek}-${row.hourOfDay}`
        const current = heatmapGrid.get(key) || 0
        heatmapGrid.set(key, current + Number(row.count))
      })
    }

    // Query service clicks
    if (type === 'services' || type === 'all') {
      const serviceData = await db
        .select({
          hourOfDay: serviceClicks.hourOfDay,
          dayOfWeek: serviceClicks.dayOfWeek,
          count: sql<number>`count(*)`,
        })
        .from(serviceClicks)
        .where(gte(serviceClicks.clickedAt, rangeStart))
        .groupBy(serviceClicks.hourOfDay, serviceClicks.dayOfWeek)

      serviceData.forEach((row: { hourOfDay: number | null; dayOfWeek: number | null; count: number }) => {
        const key = `${row.dayOfWeek}-${row.hourOfDay}`
        const current = heatmapGrid.get(key) || 0
        heatmapGrid.set(key, current + Number(row.count))
      })
    }

    // Query pageviews (extract hour and day from timestamp)
    if (type === 'pageviews' || type === 'all') {
      const pageviewData = await db
        .select({
          hourOfDay: sql<number>`strftime('%H', datetime(${pageviews.timestamp}, 'unixepoch'))`,
          dayOfWeek: sql<number>`strftime('%w', datetime(${pageviews.timestamp}, 'unixepoch'))`,
          count: sql<number>`count(*)`,
        })
        .from(pageviews)
        .where(gte(pageviews.timestamp, rangeStart))
        .groupBy(
          sql`strftime('%H', datetime(${pageviews.timestamp}, 'unixepoch'))`,
          sql`strftime('%w', datetime(${pageviews.timestamp}, 'unixepoch'))`
        )

      pageviewData.forEach((row: { hourOfDay: number; dayOfWeek: number; count: number }) => {
        const hour = Number(row.hourOfDay)
        const day = Number(row.dayOfWeek)
        const key = `${day}-${hour}`
        const current = heatmapGrid.get(key) || 0
        heatmapGrid.set(key, current + Number(row.count))
      })
    }

    // Convert to array format for frontend
    const data: { hour: number; dayOfWeek: number; value: number }[] = []
    heatmapGrid.forEach((value, key) => {
      const [day, hour] = key.split('-').map(Number)
      data.push({
        dayOfWeek: day,
        hour,
        value,
      })
    })

    // Sort by day then hour
    data.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
      return a.hour - b.hour
    })

    // Calculate max value for color scaling
    const maxValue = Math.max(...data.map(d => d.value), 1)

    return NextResponse.json({
      data,
      maxValue,
      period,
      type,
    })
  } catch (error) {
    console.error('Failed to get heatmap data:', error)
    return NextResponse.json({ error: 'Failed to get heatmap data' }, { status: 500 })
  }
}
