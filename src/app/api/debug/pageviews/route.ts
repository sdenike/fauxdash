import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { pageviews } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Get recent pageviews
    const recent = await db.select({
      id: pageviews.id,
      path: pageviews.path,
      ipAddress: pageviews.ipAddress,
      ipHash: pageviews.ipHash,
      country: pageviews.country,
      countryName: pageviews.countryName,
      city: pageviews.city,
      region: pageviews.region,
      geoEnriched: pageviews.geoEnriched,
      createdAt: pageviews.createdAt,
    })
      .from(pageviews)
      .orderBy(desc(pageviews.id))
      .limit(20)

    // Get counts
    const allPageviews = await db.select().from(pageviews)
    const total = allPageviews.length
    const withIP = allPageviews.filter((pv: any) => pv.ipAddress).length
    const withGeo = allPageviews.filter((pv: any) => pv.country).length
    const enriched = allPageviews.filter((pv: any) => pv.geoEnriched).length

    return NextResponse.json({
      recentPageviews: recent,
      stats: {
        total,
        withIP,
        withoutIP: total - withIP,
        withGeo,
        enriched,
      },
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
