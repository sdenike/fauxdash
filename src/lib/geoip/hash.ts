import { createHash } from 'crypto'

const IP_HASH_SALT = process.env.IP_HASH_SALT || 'fauxdash-default-salt-please-change'

/**
 * Hash an IP address for privacy-preserving storage
 * Uses SHA-256 with a server-side salt
 */
export function hashIP(ip: string): string {
  return createHash('sha256')
    .update(ip + IP_HASH_SALT)
    .digest('hex')
    .slice(0, 32) // Truncate to 32 chars for storage efficiency
}

/**
 * Check if an IP address is private/reserved (should not be geo-located)
 */
export function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('127.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.') ||
      ip === '0.0.0.0' ||
      ip === 'localhost') {
    return true
  }

  // IPv6 private ranges
  if (ip.startsWith('::1') ||
      ip.startsWith('fe80:') ||
      ip.startsWith('fc00:') ||
      ip.startsWith('fd00:')) {
    return true
  }

  return false
}

/**
 * Get client IP from request headers (proxy-aware)
 * Checks common proxy headers in order of precedence
 */
export function getClientIP(headers: Headers, fallbackIP?: string): string {
  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  // nginx/generic reverse proxy
  const realIP = headers.get('x-real-ip')
  if (realIP) return realIP

  // X-Forwarded-For (take first IP, which is the client)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIP = forwardedFor.split(',')[0].trim()
    if (firstIP) return firstIP
  }

  // Fallback
  return fallbackIP || '0.0.0.0'
}
