import { LRUCache } from 'lru-cache'
import type { GeoIPProvider, GeoIPResult, GeoLocation } from './index'
import { MaxMindProvider } from './maxmind'
import { IpInfoProvider } from './ipinfo'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Tiered caching: LRU memory cache + database cache
 * Memory cache for hot IPs, database for persistence
 */
const memoryCache = new LRUCache<string, GeoLocation>({
  max: 10000,               // Max 10k entries in memory
  ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
})

/**
 * Get GeoIP settings from database
 */
async function getGeoIPSettings(): Promise<{
  provider: 'maxmind' | 'ipinfo'
  maxmindDbPath: string
  maxmindLicenseKey: string
  maxmindAccountId: string
  ipinfoApiKey: string
  enabled: boolean
  cacheDays: number
}> {
  const defaults = {
    provider: 'maxmind' as const,
    maxmindDbPath: '/data/GeoLite2-City.mmdb',
    maxmindLicenseKey: '',
    maxmindAccountId: '',
    ipinfoApiKey: '',
    enabled: true,
    cacheDays: 30,
  }

  try {
    const db = getDb()
    const rows = await db.select()
      .from(settings)
      .where(eq(settings.userId, null as any))

    const settingsMap = new Map<string, string | null>(
      rows.map((r: { key: string; value: string | null }) => [r.key, r.value] as [string, string | null])
    )

    return {
      provider: (settingsMap.get('geoipProvider') as 'maxmind' | 'ipinfo') || defaults.provider,
      maxmindDbPath: settingsMap.get('geoipMaxmindPath') || defaults.maxmindDbPath,
      maxmindLicenseKey: settingsMap.get('geoipMaxmindLicenseKey') || defaults.maxmindLicenseKey,
      maxmindAccountId: settingsMap.get('geoipMaxmindAccountId') || defaults.maxmindAccountId,
      ipinfoApiKey: settingsMap.get('geoipIpinfoToken') || defaults.ipinfoApiKey,
      enabled: settingsMap.get('geoipEnabled') !== 'false',
      cacheDays: parseInt(settingsMap.get('geoipCacheDuration') || '30', 10) / 86400, // Convert seconds to days
    }
  } catch {
    // Return defaults if settings table doesn't exist or query fails
    return defaults
  }
}

/**
 * Chain provider - tries each provider in order until one succeeds
 */
class ChainProvider implements GeoIPProvider {
  constructor(private providers: GeoIPProvider[]) {}

  getName(): string {
    return 'chain'
  }

  async isAvailable(): Promise<boolean> {
    for (const p of this.providers) {
      if (await p.isAvailable()) return true
    }
    return false
  }

  async lookup(ip: string): Promise<GeoIPResult> {
    // Check memory cache first
    const cached = memoryCache.get(ip)
    if (cached) {
      return { success: true, data: cached }
    }

    // Try each provider in order
    for (const provider of this.providers) {
      const result = await provider.lookup(ip)
      if (result.success) {
        // Cache successful result
        memoryCache.set(ip, result.data)
        return result
      }
      // If provider returned PRIVATE_IP, don't try others
      if (!result.success && result.error.code === 'PRIVATE_IP') {
        return result
      }
    }

    return {
      success: false,
      error: { code: 'PROVIDER_UNAVAILABLE', message: 'All providers failed' }
    }
  }
}

/**
 * Create GeoIP provider based on settings
 * Uses chain pattern - tries primary provider, falls back to secondary
 */
export async function createGeoIPProvider(): Promise<GeoIPProvider> {
  const geoSettings = await getGeoIPSettings()

  if (!geoSettings.enabled) {
    // Return a no-op provider if GeoIP is disabled
    return {
      getName: () => 'disabled',
      isAvailable: async () => false,
      lookup: async () => ({
        success: false,
        error: { code: 'PROVIDER_UNAVAILABLE', message: 'GeoIP is disabled' }
      } as GeoIPResult)
    }
  }

  const maxmind = new MaxMindProvider({
    databasePath: geoSettings.maxmindDbPath,
    licenseKey: geoSettings.maxmindLicenseKey,
    accountId: geoSettings.maxmindAccountId,
  })

  const ipinfo = new IpInfoProvider({
    apiKey: geoSettings.ipinfoApiKey,
  })

  // Return chain provider based on preference
  if (geoSettings.provider === 'ipinfo') {
    return new ChainProvider([ipinfo, maxmind])
  }

  return new ChainProvider([maxmind, ipinfo])
}

/**
 * Get cached geo data from memory
 */
export function getCachedGeoData(ip: string): GeoLocation | undefined {
  return memoryCache.get(ip)
}

/**
 * Cache geo data in memory
 */
export function cacheGeoData(ip: string, data: GeoLocation): void {
  memoryCache.set(ip, data)
}

/**
 * Clear the memory cache
 */
export function clearGeoCache(): void {
  memoryCache.clear()
}
