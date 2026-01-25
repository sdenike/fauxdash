/**
 * GeoIP Provider Types and Interfaces
 */

export interface GeoLocation {
  country: string       // ISO 2-letter code (US, GB, etc.)
  countryName: string   // Full country name
  city: string | null
  region: string | null // State/Province
  latitude: number | null
  longitude: number | null
  timezone: string | null
}

/**
 * Result type for explicit error handling
 * Discriminated union pattern for type-safe error handling
 */
export type GeoIPResult =
  | { success: true; data: GeoLocation }
  | { success: false; error: GeoIPError }

export type GeoIPError =
  | { code: 'PROVIDER_UNAVAILABLE'; message: string }
  | { code: 'INVALID_IP'; message: string }
  | { code: 'RATE_LIMITED'; retryAfter?: number }
  | { code: 'DATABASE_NOT_FOUND'; path: string }
  | { code: 'LOOKUP_FAILED'; message: string }
  | { code: 'PRIVATE_IP'; message: string }

/**
 * GeoIP Provider Interface
 * All providers must implement this interface
 */
export interface GeoIPProvider {
  lookup(ip: string): Promise<GeoIPResult>
  getName(): string
  isAvailable(): Promise<boolean>
}

// Re-export utilities
export { hashIP, isPrivateIP, getClientIP } from './hash'
