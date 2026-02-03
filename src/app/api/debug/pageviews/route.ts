import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { pageviews } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Get recent pageviews - wrapped in try-catch
    let recent: any[] = []
    try {
      recent = await db.select({
        id: pageviews.id,
        path: pageviews.path,
        ipAddress: pageviews.ipAddress,
        ipHash: pageviews.ipHash,
        country: pageviews.country,
        countryName: pageviews.countryName,
        city: pageviews.city,
        region: pageviews.region,
        geoEnriched: pageviews.geoEnriched,
        timestamp: pageviews.timestamp,
      })
        .from(pageviews)
        .orderBy(desc(pageviews.id))
        .limit(20)
    } catch (e) {
      console.error('Failed to fetch recent pageviews:', e)
      recent = []
    }

    // Get counts using SQL aggregation instead of filtering
    let stats = {
      total: 0,
      withIP: 0,
      withoutIP: 0,
      withGeo: 0,
      enriched: 0,
    }

    try {
      const countResult = await db.select({
        total: sql<number>`count(*)`,
        withIP: sql<number>`count(${pageviews.ipAddress})`,
        withGeo: sql<number>`count(${pageviews.country})`,
        enriched: sql<number>`sum(case when ${pageviews.geoEnriched} = 1 then 1 else 0 end)`,
      }).from(pageviews)

      if (countResult && countResult[0]) {
        stats = {
          total: countResult[0].total || 0,
          withIP: countResult[0].withIP || 0,
          withoutIP: (countResult[0].total || 0) - (countResult[0].withIP || 0),
          withGeo: countResult[0].withGeo || 0,
          enriched: countResult[0].enriched || 0,
        }
      }
    } catch (e) {
      console.error('Failed to get pageview counts:', e)
    }

    return NextResponse.json({
      recentPageviews: recent,
      stats,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('Pageviews debug error:', error)
    return NextResponse.json({
      error: 'Failed to fetch pageviews',
      message: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
