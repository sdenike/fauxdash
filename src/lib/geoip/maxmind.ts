import type { GeoIPProvider, GeoIPResult } from './index'
import { isPrivateIP } from './hash'

interface MaxMindConfig {
  databasePath?: string
  licenseKey?: string
  accountId?: string
}

/**
 * MaxMind GeoLite2/GeoIP2 Provider
 * Uses the maxmind npm package with local database file
 * Supports both free GeoLite2 and paid GeoIP2 databases
 */
export class MaxMindProvider implements GeoIPProvider {
  private reader: any = null
  private initPromise: Promise<void> | null = null
  private initError: Error | null = null

  constructor(private config: MaxMindConfig = {}) {}

  getName(): string {
    return 'maxmind'
  }

  /**
   * Lazy initialization - don't load DB until first lookup
   * This reduces cold start time for serverless environments
   */
  private async ensureInitialized(): Promise<void> {
    if (this.reader) return
    if (this.initError) throw this.initError
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        // Dynamic import to avoid loading maxmind if not needed
        const maxmind = await import('maxmind')
        const dbPath = this.config.databasePath || process.env.MAXMIND_DB_PATH || '/data/GeoLite2-City.mmdb'
        this.reader = await maxmind.open(dbPath)
      } catch (error) {
        this.initError = error as Error
        throw error
      }
    })()

    return this.initPromise
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ensureInitialized()
      return true
    } catch {
      return false
    }
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
      await this.ensureInitialized()

      if (!this.reader) {
        return {
          success: false,
          error: {
            code: 'DATABASE_NOT_FOUND',
            path: this.config.databasePath || '/data/GeoLite2-City.mmdb'
          }
        }
      }

      const result = this.reader.get(ip)

      if (!result) {
        return {
          success: false,
          error: { code: 'LOOKUP_FAILED', message: 'No data found for IP' }
        }
      }

      return {
        success: true,
        data: {
          country: result.country?.iso_code || 'XX',
          countryName: result.country?.names?.en || 'Unknown',
          city: result.city?.names?.en || null,
          region: result.subdivisions?.[0]?.names?.en || null,
          latitude: result.location?.latitude || null,
          longitude: result.location?.longitude || null,
          timezone: result.location?.time_zone || null,
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      // Check if it's a database not found error
      if (message.includes('ENOENT') || message.includes('no such file')) {
        return {
          success: false,
          error: {
            code: 'DATABASE_NOT_FOUND',
            path: this.config.databasePath || '/data/GeoLite2-City.mmdb'
          }
        }
      }

      return {
        success: false,
        error: { code: 'LOOKUP_FAILED', message }
      }
    }
  }
}
