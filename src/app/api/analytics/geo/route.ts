import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { pageviews } from '@/db/schema'
import { sql, gte, and, isNotNull } from 'drizzle-orm'
import { GeoQuerySchema } from '@/lib/validation/analytics'
import { subDays, subWeeks, subMonths, subYears } from 'date-fns'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse and validate query parameters
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = GeoQuerySchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { period, level, limit, startDate, endDate } = parsed.data
    const db = getDb()

    // Calculate date range
    const now = new Date()
    let rangeStart: Date | null = null
    const rangeEnd: Date = endDate ? new Date(endDate) : now

    if (startDate) {
      rangeStart = new Date(startDate)
    } else if (period !== 'all') {
      switch (period) {
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
      }
    }

    // Build where conditions
    const conditions = [isNotNull(pageviews.country)]
    if (rangeStart) {
      conditions.push(gte(pageviews.timestamp, rangeStart))
    }

    let locations: any[]
    let total = 0

    if (level === 'country') {
      // Aggregate by country
      const countryData = await db
        .select({
          code: pageviews.country,
          name: pageviews.countryName,
          count: sql<number>`count(*)`,
          lat: sql<number>`avg(${pageviews.latitude})`,
          lng: sql<number>`avg(${pageviews.longitude})`,
        })
        .from(pageviews)
        .where(and(...conditions))
        .groupBy(pageviews.country, pageviews.countryName)
        .orderBy(sql`count(*) DESC`)
        .limit(limit)

      locations = countryData.map((row: { code: string | null; name: string | null; count: number; lat: number; lng: number }) => ({
        code: row.code || 'XX',
        name: row.name || 'Unknown',
        count: Number(row.count),
        lat: row.lat || 0,
        lng: row.lng || 0,
      }))

      // Get total for all countries
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pageviews)
        .where(and(...conditions))

      total = Number(totalResult?.count || 0)
    } else {
      // Aggregate by city
      const cityConditions = [...conditions, isNotNull(pageviews.city)]

      const cityData = await db
        .select({
          name: pageviews.city,
          country: pageviews.country,
          countryName: pageviews.countryName,
          count: sql<number>`count(*)`,
          lat: sql<number>`avg(${pageviews.latitude})`,
          lng: sql<number>`avg(${pageviews.longitude})`,
        })
        .from(pageviews)
        .where(and(...cityConditions))
        .groupBy(pageviews.city, pageviews.country, pageviews.countryName)
        .orderBy(sql`count(*) DESC`)
        .limit(limit)

      locations = cityData.map((row: { name: string | null; country: string | null; countryName: string | null; count: number; lat: number; lng: number }) => ({
        name: row.name || 'Unknown',
        country: row.country || 'XX',
        countryName: row.countryName || 'Unknown',
        count: Number(row.count),
        lat: row.lat || 0,
        lng: row.lng || 0,
      }))

      // Get total for all cities
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pageviews)
        .where(and(...cityConditions))

      total = Number(totalResult?.count || 0)
    }

    return NextResponse.json({
      locations,
      total,
      level,
      period,
    })
  } catch (error) {
    console.error('Failed to get geo analytics:', error)
    return NextResponse.json({ error: 'Failed to get geo analytics' }, { status: 500 })
  }
}
