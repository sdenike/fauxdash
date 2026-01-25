import type { GeoIPProvider, GeoIPResult } from './index'
import { isPrivateIP } from './hash'

// Country code to name mapping for common countries
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  RU: 'Russia',
  KR: 'South Korea',
  SG: 'Singapore',
  HK: 'Hong Kong',
  NZ: 'New Zealand',
  IE: 'Ireland',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PT: 'Portugal',
  ZA: 'South Africa',
}

interface IpInfoConfig {
  apiKey?: string
}

/**
 * ipinfo.io API Provider
 * Uses REST API with optional API key
 * Free tier: 50k requests/month
 */
export class IpInfoProvider implements GeoIPProvider {
  constructor(private config: IpInfoConfig = {}) {}

  getName(): string {
    return 'ipinfo'
  }

  async isAvailable(): Promise<boolean> {
    // API is always "available", may be rate limited
    return true
  }

  async lookup(ip: string): Promise<GeoIPResult> {
    // Skip private IPs
    if (isPrivateIP(ip)) {
      return {
        success: false,
        error: { code: 'PRIVATE_IP', message: 'Cannot geolocate private IP addresses' }
      }
    }

    try {
      const apiKey = this.config.apiKey || process.env.IPINFO_API_KEY
      const url = apiKey
        ? `https://ipinfo.io/${ip}?token=${apiKey}`
        : `https://ipinfo.io/${ip}/json`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
        return {
          success: false,
          error: { code: 'RATE_LIMITED', retryAfter }
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: { code: 'LOOKUP_FAILED', message: `HTTP ${response.status}` }
        }
      }

      const data = await response.json()

      // Parse location coordinates (format: "lat,lng")
      let latitude: number | null = null
      let longitude: number | null = null

      if (data.loc) {
        const [lat, lng] = data.loc.split(',').map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          latitude = lat
          longitude = lng
        }
      }

      const countryCode = data.country || 'XX'

      return {
        success: true,
        data: {
          country: countryCode,
          countryName: COUNTRY_NAMES[countryCode] || countryCode,
          city: data.city || null,
          region: data.region || null,
          latitude,
          longitude,
          timezone: data.timezone || null,
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: { code: 'LOOKUP_FAILED', message }
      }
    }
  }
}
