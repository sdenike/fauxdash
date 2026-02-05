import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { pageviews, geoCache } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashIP, getClientIP, isPrivateIP } from '@/lib/geoip'
import { createGeoIPProvider } from '@/lib/geoip/factory'
import type { GeoLocation } from '@/lib/geoip'
import { logGeoIP, logApi, logDb } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path } = body

    if (!path) {
      logApi('warn', 'Pageview tracking failed - missing path parameter')
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const db = getDb()
    const userAgent = request.headers.get('user-agent') || ''
    const ipAddress = getClientIP(request.headers, 'unknown')
    const ipHash = hashIP(ipAddress)

    logApi('info', 'Pageview tracked', {
      path,
      ip: ipAddress === 'unknown' ? 'unknown' : 'detected',
      userAgent: userAgent.substring(0, 50)
    })

    // Debug logging for IP detection (helps diagnose Cloudflare issues)
    if (process.env.DEBUG_IP === 'true') {
      console.log('[Pageview] IP Detection:', {
        detected: ipAddress,
        cfConnectingIp: request.headers.get('cf-connecting-ip'),
        xForwardedFor: request.headers.get('x-forwarded-for'),
        xRealIp: request.headers.get('x-real-ip'),
        cfIpCountry: request.headers.get('cf-ipcountry'),
      })
    }

    // Insert pageview immediately (non-blocking for geo enrichment)
    const [inserted] = await db.insert(pageviews).values({
      path,
      userAgent,
      ipAddress, // Keep for backwards compatibility
      ipHash,
      geoEnriched: false,
    }).returning({ id: pageviews.id })

    // Fire-and-forget geo enrichment (don't block response)
    if (!isPrivateIP(ipAddress)) {
      enrichGeoData(inserted.id, ipAddress, ipHash).catch(err => {
        logGeoIP('error', 'Geo enrichment failed', { error: err.message, ipHash })
      })
    } else {
      logGeoIP('debug', 'Private IP detected - skipping geo lookup', { ipAddress })
      // Mark as enriched for private IPs (no geo data available)
      db.update(pageviews)
        .set({ geoEnriched: true })
        .where(eq(pageviews.id, inserted.id))
        .catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logApi('error', 'Failed to track pageview', {
      error: error.message,
      stack: error.stack?.substring(0, 200)
    })
    return NextResponse.json({ error: 'Failed to track pageview' }, { status: 500 })
  }
}

/**
 * Background geo enrichment - runs after response is sent
 * Non-blocking to ensure fast pageview tracking
 */
async function enrichGeoData(pageviewId: number, ipAddress: string, ipHash: string) {
  const db = getDb()

  // Check database cache first
  const cached = await db.select()
    .from(geoCache)
    .where(eq(geoCache.ipHash, ipHash))
    .limit(1)

  let geoData: GeoLocation | null = null

  if (cached.length && cached[0].expiresAt && cached[0].expiresAt > new Date()) {
    // Use cached data
    logGeoIP('info', 'GeoIP cache hit', {
      ipHash,
      country: cached[0].country,
      city: cached[0].city
    })
    geoData = {
      country: cached[0].country || 'XX',
      countryName: cached[0].countryName || 'Unknown',
      city: cached[0].city,
      region: cached[0].region,
      latitude: cached[0].latitude,
      longitude: cached[0].longitude,
      timezone: cached[0].timezone,
    }
  } else {
    // Lookup from provider
    const provider = await createGeoIPProvider()
    logGeoIP('info', 'GeoIP lookup started', {
      provider: provider.getName(),
      ipHash
    })
    const result = await provider.lookup(ipAddress)

    if (result.success) {
      geoData = result.data
      logGeoIP('info', 'GeoIP lookup successful', {
        provider: provider.getName(),
        country: geoData.country,
        city: geoData.city
      })

      // Cache the result
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      try {
        await db.insert(geoCache)
          .values({
            ipHash,
            country: geoData.country,
            countryName: geoData.countryName,
            city: geoData.city,
            region: geoData.region,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            timezone: geoData.timezone,
            provider: provider.getName(),
            expiresAt,
          })
          .onConflictDoUpdate({
            target: geoCache.ipHash,
            set: {
              country: geoData.country,
              countryName: geoData.countryName,
              city: geoData.city,
              region: geoData.region,
              latitude: geoData.latitude,
              longitude: geoData.longitude,
              timezone: geoData.timezone,
              provider: provider.getName(),
              expiresAt,
            },
          })
      } catch (cacheError: any) {
        // Cache insert failed, but we can still update the pageview
        logGeoIP('error', 'Failed to cache geo data', {
          error: cacheError.message,
          ipHash
        })
      }
    } else {
      logGeoIP('warn', 'GeoIP lookup failed', {
        provider: provider.getName(),
        error: result.error,
        ipHash
      })
    }
  }

  // Update pageview with geo data
  if (geoData) {
    try {
      await db.update(pageviews)
        .set({
          country: geoData.country,
          countryName: geoData.countryName,
          city: geoData.city,
          region: geoData.region,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          timezone: geoData.timezone,
          geoEnriched: true,
        })
        .where(eq(pageviews.id, pageviewId))
      logGeoIP('info', 'Pageview enriched with geo data', {
        pageviewId,
        country: geoData.country,
        city: geoData.city
      })
    } catch (error: any) {
      logDb('error', 'Failed to update pageview with geo data', {
        pageviewId,
        error: error.message
      })
    }
  } else {
    // Mark as enriched even if no data (to skip in future)
    await db.update(pageviews)
      .set({ geoEnriched: true })
      .where(eq(pageviews.id, pageviewId))
    logGeoIP('info', 'Pageview marked as enriched (no geo data)', { pageviewId })
  }
}
