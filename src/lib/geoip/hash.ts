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
 *
 * Header priority:
 * 1. CF-Connecting-IP (Cloudflare - most reliable)
 * 2. True-Client-IP (Cloudflare Enterprise / some configs)
 * 3. X-Real-IP (nginx/generic proxy)
 * 4. X-Forwarded-For (standard proxy header - first IP)
 */
export function getClientIP(headers: Headers, fallbackIP?: string): string {
  // Cloudflare standard header (set by Cloudflare edge)
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP && !isPrivateIP(cfIP)) return cfIP

  // Cloudflare Enterprise / True-Client-IP header
  const trueClientIP = headers.get('true-client-ip')
  if (trueClientIP && !isPrivateIP(trueClientIP)) return trueClientIP

  // nginx/generic reverse proxy
  const realIP = headers.get('x-real-ip')
  if (realIP && !isPrivateIP(realIP)) return realIP

  // X-Forwarded-For (take first non-private IP, which should be the client)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // May contain multiple IPs: "client, proxy1, proxy2"
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    for (const ip of ips) {
      if (ip && !isPrivateIP(ip)) return ip
    }
    // If all are private, return the first one anyway
    if (ips[0]) return ips[0]
  }

  // Fallback
  return fallbackIP || '0.0.0.0'
}
