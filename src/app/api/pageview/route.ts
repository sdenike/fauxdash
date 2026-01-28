import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { pageviews, geoCache } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashIP, getClientIP, isPrivateIP } from '@/lib/geoip'
import { createGeoIPProvider } from '@/lib/geoip/factory'
import type { GeoLocation } from '@/lib/geoip'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path } = body

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    const db = getDb()
    const userAgent = request.headers.get('user-agent') || ''
    const ipAddress = getClientIP(request.headers, 'unknown')
    const ipHash = hashIP(ipAddress)

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
        console.error('Failed to enrich geo data:', err)
      })
    } else {
      // Mark as enriched for private IPs (no geo data available)
      db.update(pageviews)
        .set({ geoEnriched: true })
        .where(eq(pageviews.id, inserted.id))
        .catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to track pageview:', error)
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
    const result = await provider.lookup(ipAddress)

    if (result.success) {
      geoData = result.data

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
      } catch (cacheError) {
        // Cache insert failed, but we can still update the pageview
        console.error('Failed to cache geo data:', cacheError)
      }
    }
  }

  // Update pageview with geo data
  if (geoData) {
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
  } else {
    // Mark as enriched even if no data (to skip in future)
    await db.update(pageviews)
      .set({ geoEnriched: true })
      .where(eq(pageviews.id, pageviewId))
  }
}
