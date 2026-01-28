import { NextResponse } from 'next/server'
import { VERSION } from '@/lib/version'

// Cache the result for 1 hour to avoid rate limiting
let cachedResult: {
  data: any
  timestamp: number
} | null = null

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour
const GITHUB_REPO = 'sdenike/fauxdash'

/**
 * Compare semantic versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/^v/, '').split('.').map(Number)
  const partsB = b.replace(/^v/, '').split('.').map(Number)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0
    const numB = partsB[i] || 0
    if (numA > numB) return 1
    if (numA < numB) return -1
  }
  return 0
}

export async function GET() {
  try {
    const now = Date.now()

    // Return cached result if still valid
    if (cachedResult && (now - cachedResult.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedResult.data)
    }

    // Fetch latest release from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'FauxDash-UpdateChecker',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      // No releases found or rate limited
      if (response.status === 404) {
        const result = {
          currentVersion: VERSION,
          latestVersion: VERSION,
          updateAvailable: false,
          message: 'No releases found',
        }
        cachedResult = { data: result, timestamp: now }
        return NextResponse.json(result)
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const release = await response.json()
    const latestVersion = release.tag_name?.replace(/^v/, '') || VERSION
    const updateAvailable = compareVersions(latestVersion, VERSION) > 0

    const result = {
      currentVersion: VERSION,
      latestVersion,
      updateAvailable,
      releaseUrl: release.html_url,
      releaseName: release.name,
      releaseBody: release.body,
      publishedAt: release.published_at,
    }

    // Cache the result
    cachedResult = { data: result, timestamp: now }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to check for updates:', error)
    return NextResponse.json({
      currentVersion: VERSION,
      latestVersion: VERSION,
      updateAvailable: false,
      error: 'Failed to check for updates',
    })
  }
}
