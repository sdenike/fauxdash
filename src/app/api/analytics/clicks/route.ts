import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { bookmarkClicks, serviceClicks } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { ClicksQuerySchema } from '@/lib/validation/analytics'
import { downsampleDateData } from '@/lib/analytics/downsampling'
import { subDays, subWeeks, subMonths, subYears, subHours, format, startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse and validate query parameters
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = ClicksQuerySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { period, type, groupBy, downsample, startDate, endDate } = parsed.data
    const db = getDb()

    // Calculate date range
    const now = new Date()
    let rangeStart: Date
    let rangeEnd: Date = endDate ? new Date(endDate) : now

    if (startDate) {
      rangeStart = new Date(startDate)
    } else {
      switch (period) {
        case 'hour':
          rangeStart = subHours(now, 1)
          break
        case 'day':
          rangeStart = subDays(now, 1)
          break
        case 'week':
          rangeStart = subWeeks(now, 1)
          break
        case 'month':
          rangeStart = subMonths(now, 1)
          break
        case 'year':
          rangeStart = subYears(now, 1)
          break
        case 'custom':
          // For custom, require startDate
          rangeStart = subWeeks(now, 1)
          break
        default:
          rangeStart = subWeeks(now, 1)
      }
    }

    // Get date format based on groupBy
    let dateFormat: string
    switch (groupBy) {
      case 'hour':
        dateFormat = 'yyyy-MM-dd HH:00'
        break
      case 'day':
        dateFormat = 'yyyy-MM-dd'
        break
      case 'week':
        dateFormat = 'yyyy-\'W\'ww'
        break
      case 'month':
        dateFormat = 'yyyy-MM'
        break
      default:
        dateFormat = 'yyyy-MM-dd'
    }

    const datasets: { label: string; data: { date: string; count: number }[] }[] = []

    // Convert range to epoch seconds for SQLite comparison
    const rangeStartEpoch = Math.floor(rangeStart.getTime() / 1000)

    // Query bookmark clicks if needed
    if (type === 'bookmarks' || type === 'all') {
      const bookmarkData = await db
        .select({
          date: sql<string>`date(${bookmarkClicks.clickedAt}, 'unixepoch')`,
          count: sql<number>`count(*)`,
        })
        .from(bookmarkClicks)
        .where(
          sql`${bookmarkClicks.clickedAt} >= ${rangeStartEpoch}`
        )
        .groupBy(sql`date(${bookmarkClicks.clickedAt}, 'unixepoch')`)
        .orderBy(sql`date(${bookmarkClicks.clickedAt}, 'unixepoch')`)

      datasets.push({
        label: 'Bookmark Clicks',
        data: bookmarkData.map((row: { date: string; count: number }) => ({
          date: row.date,
          count: Number(row.count),
        })),
      })
    }

    // Query service clicks if needed
    if (type === 'services' || type === 'all') {
      const serviceData = await db
        .select({
          date: sql<string>`date(${serviceClicks.clickedAt}, 'unixepoch')`,
          count: sql<number>`count(*)`,
        })
        .from(serviceClicks)
        .where(
          sql`${serviceClicks.clickedAt} >= ${rangeStartEpoch}`
        )
        .groupBy(sql`date(${serviceClicks.clickedAt}, 'unixepoch')`)
        .orderBy(sql`date(${serviceClicks.clickedAt}, 'unixepoch')`)

      datasets.push({
        label: 'Service Clicks',
        data: serviceData.map((row: { date: string; count: number }) => ({
          date: row.date,
          count: Number(row.count),
        })),
      })
    }

    // Apply downsampling if needed
    const downsampledDatasets = datasets.map(dataset => ({
      ...dataset,
      data: downsampleDateData(dataset.data, downsample),
    }))

    // Generate labels (unique dates across all datasets)
    const allDates = new Set<string>()
    downsampledDatasets.forEach(ds => ds.data.forEach(d => allDates.add(d.date)))
    const labels = Array.from(allDates).sort()

    // Format for chart consumption
    const formattedDatasets = downsampledDatasets.map(ds => {
      const dataMap = new Map(ds.data.map(d => [d.date, d.count]))
      return {
        label: ds.label,
        data: labels.map(label => dataMap.get(label) || 0),
      }
    })

    return NextResponse.json({
      labels,
      datasets: formattedDatasets,
      period,
      groupBy,
    })
  } catch (error) {
    console.error('Failed to get click analytics:', error)
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 })
  }
}
