import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { pageviews, geoCache, settings } from '@/db/schema'
import { eq, desc, isNotNull } from 'drizzle-orm'
import { getClientIP } from '@/lib/geoip'
import { createGeoIPProvider } from '@/lib/geoip/factory'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const db = getDb()

  // Get current IP detection
  const currentIP = getClientIP(request.headers, 'unknown')

  // Get GeoIP settings
  const settingsRows = await db.select()
    .from(settings)
    .where(eq(settings.userId, null as any))

  const settingsMap = new Map<string, string | null>(
    settingsRows.map((r: { key: string; value: string | null }) => [r.key, r.value])
  )

  const geoipEnabled = settingsMap.get('geoipEnabled') !== 'false'
  const geoipProvider = settingsMap.get('geoipProvider') || 'maxmind'
  const maxmindPath = settingsMap.get('geoipMaxmindPath') || '/data/GeoLite2-City.mmdb'
  const ipinfoToken = settingsMap.get('geoipIpinfoToken') || ''

  // Check if MaxMind database exists
  const maxmindExists = existsSync(maxmindPath)

  // Get recent pageviews with unique IPs
  const recentPageviews = await db.select({
    id: pageviews.id,
    ipAddress: pageviews.ipAddress,
    country: pageviews.country,
    countryName: pageviews.countryName,
    city: pageviews.city,
    region: pageviews.region,
    createdAt: pageviews.createdAt,
  })
    .from(pageviews)
    .where(isNotNull(pageviews.ipAddress))
    .orderBy(desc(pageviews.createdAt))
    .limit(20)

  // Get unique IPs from recent pageviews
  const uniqueIPs = new Map<string, typeof recentPageviews[0]>()
  for (const pv of recentPageviews) {
    if (pv.ipAddress && !uniqueIPs.has(pv.ipAddress)) {
      uniqueIPs.set(pv.ipAddress, pv)
    }
  }

  // Get cache statistics
  const cacheCount = await db.select()
    .from(geoCache)
    .then((rows: any[]) => rows.length)

  // Test current IP lookup
  let testLookup = null
  try {
    const provider = await createGeoIPProvider()
    const result = await provider.lookup(currentIP)
    testLookup = {
      ip: currentIP,
      result: result.success ? result.data : result.error,
      success: result.success,
    }
  } catch (error: any) {
    testLookup = {
      ip: currentIP,
      error: error.message,
      success: false,
    }
  }

  const responseData = {
    headers: {
      'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'cf-ipcountry': request.headers.get('cf-ipcountry'),
    },
    currentIP,
    geoipConfig: {
      enabled: geoipEnabled,
      provider: geoipProvider,
      maxmindPath,
      maxmindExists,
      hasIpinfoToken: ipinfoToken.length > 0,
    },
    testLookup,
    recentUniqueIPs: Array.from(uniqueIPs.entries()).map(([ip, data]) => ({
      ip,
      country: data.country,
      countryName: data.countryName,
      city: data.city,
      region: data.region,
      lastSeen: data.createdAt,
    })),
    cacheSize: cacheCount,
  }

  return NextResponse.json(responseData, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  } catch (error: any) {
    console.error('GeoIP debug error:', error)
    return NextResponse.json({
      error: 'Failed to generate debug info',
      message: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
