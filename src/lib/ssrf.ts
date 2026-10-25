import { lookup } from 'dns/promises'
import { isIP } from 'net'

/**
 * SSRF helpers for server-side fetches of user-supplied URLs.
 *
 * Residual risk: fetch() re-resolves the hostname after we validate it, so a
 * DNS-rebinding attacker with a very short TTL could still flip the answer
 * between check and connect. Redirects and DNS names that resolve to internal
 * addresses (the common cases) are covered.
 */

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0
}

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

/** True if the literal IP is loopback, private, link-local, multicast or otherwise non-public. */
export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) {
    const n = ipv4ToInt(ip)
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
      return (n & mask) >>> 0 === (ipv4ToInt(base) & mask) >>> 0
    })
  }
  if (version === 6) {
    const lower = ip.toLowerCase()
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isBlockedIp(mapped[1])
    if (lower === '::' || lower === '::1') return true
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true // unique local fc00::/7
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true // link-local fe80::/10
    if (/^ff[0-9a-f]{2}:/.test(lower)) return true // multicast
    if (lower.startsWith('::ffff:')) return true // other mapped forms: refuse
    return false
  }
  return true // not an IP at all
}

/** Throws if the hostname is, or resolves to, a non-public address. */
export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, '')
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new Error(`Host not allowed: ${hostname}`)
    return
  }
  const addrs = await lookup(host, { all: true })
  if (addrs.length === 0 || addrs.some(a => isBlockedIp(a.address))) {
    throw new Error(`Host resolves to a disallowed address: ${hostname}`)
  }
}

/**
 * fetch() that validates the scheme and resolved address of the URL and of
 * every redirect hop (redirects are followed manually, max `maxRedirects`).
 */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  maxRedirects = 3
): Promise<Response> {
  let current = new URL(url)
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (current.protocol !== 'http:' && current.protocol !== 'https:') {
      throw new Error(`Scheme not allowed: ${current.protocol}`)
    }
    await assertPublicHost(current.hostname)
    const response = await fetch(current, { ...init, redirect: 'manual' })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) return response
      await response.body?.cancel()
      current = new URL(location, current)
      continue
    }
    return response
  }
  throw new Error('Too many redirects')
}
