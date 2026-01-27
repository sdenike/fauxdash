import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { existsSync, statSync } from 'fs'

interface TestResult {
  provider: string
  success: boolean
  message: string
  details?: Record<string, any>
}

/**
 * Get GeoIP settings from database
 */
async function getGeoIPSettings() {
  const defaults = {
    provider: 'maxmind',
    maxmindPath: '/data/GeoLite2-City.mmdb',
    maxmindLicenseKey: '',
    maxmindAccountId: '',
    ipinfoToken: '',
    enabled: false,
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
      provider: settingsMap.get('geoipProvider') || defaults.provider,
      maxmindPath: settingsMap.get('geoipMaxmindPath') || defaults.maxmindPath,
      maxmindLicenseKey: settingsMap.get('geoipMaxmindLicenseKey') || defaults.maxmindLicenseKey,
      maxmindAccountId: settingsMap.get('geoipMaxmindAccountId') || defaults.maxmindAccountId,
      ipinfoToken: settingsMap.get('geoipIpinfoToken') || defaults.ipinfoToken,
      enabled: settingsMap.get('geoipEnabled') === 'true',
    }
  } catch {
    return defaults
  }
}

/**
 * Test MaxMind database
 */
async function testMaxMind(dbPath: string): Promise<TestResult> {
  // Normalize the path
  let normalizedPath = dbPath
  if (normalizedPath.startsWith('./')) {
    // ./data/file.mmdb -> /data/file.mmdb (just replace ./ with /)
    normalizedPath = normalizedPath.replace('./', '/')
  }
  if (!normalizedPath.startsWith('/')) {
    // Relative path without ./ prefix -> prepend /data/
    normalizedPath = `/data/${normalizedPath}`
  }

  // Check if file exists
  if (!existsSync(normalizedPath)) {
    // Try some alternate paths
    const alternatePaths = [
      dbPath,
      `/data/${dbPath.split('/').pop()}`,
      `/data/GeoLite2-City.mmdb`,
    ]

    let foundPath: string | null = null
    for (const p of alternatePaths) {
      if (existsSync(p)) {
        foundPath = p
        break
      }
    }

    if (!foundPath) {
      return {
        provider: 'maxmind',
        success: false,
        message: `Database file not found at: ${normalizedPath}`,
        details: {
          configuredPath: dbPath,
          searchedPaths: [normalizedPath, ...alternatePaths],
          hint: 'Upload a .mmdb file or download from MaxMind'
        }
      }
    }
    normalizedPath = foundPath
  }

  try {
    // Get file stats
    const stats = statSync(normalizedPath)
    const modDate = new Date(stats.mtime)
    const fileSize = (stats.size / (1024 * 1024)).toFixed(2)

    // Try to load and test the database
    const maxmind = await import('maxmind')
    const reader = await maxmind.open(normalizedPath)

    // Test lookup with a known public IP (Google DNS)
    const testResult = reader.get('8.8.8.8') as any

    if (!testResult) {
      return {
        provider: 'maxmind',
        success: false,
        message: 'Database loaded but test lookup failed',
        details: {
          path: normalizedPath,
          fileSize: `${fileSize} MB`,
          modifiedDate: modDate.toISOString().split('T')[0],
        }
      }
    }

    // Check if database is outdated (MaxMind updates weekly on Tuesdays)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysSinceTuesday = (dayOfWeek + 5) % 7 + 1
    const lastTuesday = new Date(now)
    lastTuesday.setDate(now.getDate() - daysSinceTuesday)
    const isOutdated = modDate < lastTuesday

    // Extract country and city from result (structure varies by database type)
    const countryName = testResult.country?.names?.en || testResult.registered_country?.names?.en || 'Unknown'
    const cityName = testResult.city?.names?.en || 'Unknown'

    return {
      provider: 'maxmind',
      success: true,
      message: isOutdated
        ? 'Database connected (may be outdated)'
        : 'Database connected successfully',
      details: {
        path: normalizedPath,
        fileSize: `${fileSize} MB`,
        modifiedDate: modDate.toISOString().split('T')[0],
        isOutdated,
        testLookup: {
          ip: '8.8.8.8',
          country: countryName,
          city: cityName,
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      provider: 'maxmind',
      success: false,
      message: `Failed to load database: ${message}`,
      details: {
        configuredPath: dbPath,
        normalizedPath,
      }
    }
  }
}

/**
 * Test ipinfo.io API and get usage stats
 */
async function testIpInfo(apiToken: string): Promise<TestResult> {
  if (!apiToken) {
    return {
      provider: 'ipinfo',
      success: false,
      message: 'No API token configured',
      details: {
        hint: 'Get a free token at https://ipinfo.io/signup (50,000 lookups/month)'
      }
    }
  }

  try {
    // First test with a lookup
    const lookupResponse = await fetch(`https://ipinfo.io/8.8.8.8?token=${apiToken}`, {
      headers: { 'Accept': 'application/json' },
    })

    if (lookupResponse.status === 401) {
      return {
        provider: 'ipinfo',
        success: false,
        message: 'Invalid API token',
        details: {
          status: 401,
          hint: 'Check your API token at https://ipinfo.io/account'
        }
      }
    }

    if (lookupResponse.status === 429) {
      return {
        provider: 'ipinfo',
        success: false,
        message: 'Rate limited - too many requests',
        details: {
          status: 429,
          hint: 'Monthly quota may be exceeded'
        }
      }
    }

    if (!lookupResponse.ok) {
      return {
        provider: 'ipinfo',
        success: false,
        message: `API error: HTTP ${lookupResponse.status}`,
      }
    }

    const lookupData = await lookupResponse.json()

    // Now get usage/quota info from the /me endpoint
    let usageInfo: any = null
    try {
      const meResponse = await fetch(`https://ipinfo.io/me?token=${apiToken}`, {
        headers: { 'Accept': 'application/json' },
      })
      if (meResponse.ok) {
        usageInfo = await meResponse.json()
      }
    } catch {
      // Usage info is optional, don't fail the test
    }

    // Parse usage from headers or response
    const requestsRemaining = lookupResponse.headers.get('X-RateLimit-Remaining')
    const requestsLimit = lookupResponse.headers.get('X-RateLimit-Limit')

    return {
      provider: 'ipinfo',
      success: true,
      message: 'API connection successful',
      details: {
        testLookup: {
          ip: '8.8.8.8',
          country: lookupData.country || 'Unknown',
          city: lookupData.city || 'Unknown',
          org: lookupData.org || 'Unknown',
        },
        usage: {
          remaining: requestsRemaining ? parseInt(requestsRemaining, 10) : null,
          limit: requestsLimit ? parseInt(requestsLimit, 10) : 50000,
          used: requestsRemaining && requestsLimit
            ? parseInt(requestsLimit, 10) - parseInt(requestsRemaining, 10)
            : null,
        },
        account: usageInfo ? {
          email: usageInfo.email,
          plan: usageInfo.plan || 'free',
        } : null,
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      provider: 'ipinfo',
      success: false,
      message: `Connection failed: ${message}`,
    }
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const geoSettings = await getGeoIPSettings()
    const provider = request.nextUrl.searchParams.get('provider') || geoSettings.provider

    let result: TestResult

    if (provider === 'maxmind') {
      result = await testMaxMind(geoSettings.maxmindPath)
    } else if (provider === 'ipinfo') {
      result = await testIpInfo(geoSettings.ipinfoToken)
    } else if (provider === 'chain') {
      // Test both providers
      const maxmindResult = await testMaxMind(geoSettings.maxmindPath)
      const ipinfoResult = await testIpInfo(geoSettings.ipinfoToken)

      const anySuccess = maxmindResult.success || ipinfoResult.success

      return NextResponse.json({
        provider: 'chain',
        success: anySuccess,
        message: anySuccess
          ? 'At least one provider is available'
          : 'Both providers failed',
        results: {
          maxmind: maxmindResult,
          ipinfo: ipinfoResult,
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GeoIP test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test GeoIP' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { provider, maxmindPath, ipinfoToken } = body

    let result: TestResult

    if (provider === 'maxmind') {
      result = await testMaxMind(maxmindPath || '/data/GeoLite2-City.mmdb')
    } else if (provider === 'ipinfo') {
      result = await testIpInfo(ipinfoToken || '')
    } else if (provider === 'chain') {
      // Test both providers
      const maxmindResult = await testMaxMind(maxmindPath || '/data/GeoLite2-City.mmdb')
      const ipinfoResult = await testIpInfo(ipinfoToken || '')

      const anySuccess = maxmindResult.success || ipinfoResult.success

      return NextResponse.json({
        provider: 'chain',
        success: anySuccess,
        message: anySuccess
          ? 'At least one provider is available'
          : 'Both providers failed',
        results: {
          maxmind: maxmindResult,
          ipinfo: ipinfoResult,
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('GeoIP test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test GeoIP' },
      { status: 500 }
    )
  }
}
