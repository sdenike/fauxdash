import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { createGunzip } from 'zlib'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import * as tar from 'tar'
import { join } from 'path'

/**
 * Get MaxMind credentials from settings
 */
async function getMaxMindCredentials() {
  try {
    const db = getDb()
    const rows = await db.select()
      .from(settings)
      .where(eq(settings.userId, null as any))

    const settingsMap = new Map<string, string | null>(
      rows.map((r: { key: string; value: string | null }) => [r.key, r.value] as [string, string | null])
    )

    return {
      accountId: settingsMap.get('geoipMaxmindAccountId') || '',
      licenseKey: settingsMap.get('geoipMaxmindLicenseKey') || '',
    }
  } catch {
    return { accountId: '', licenseKey: '' }
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const edition = body.edition || 'GeoLite2-City'

    // Get credentials from settings or request body
    let { accountId, licenseKey } = await getMaxMindCredentials()

    // Allow override from request body (for testing with unsaved credentials)
    if (body.accountId) accountId = body.accountId
    if (body.licenseKey) licenseKey = body.licenseKey

    if (!accountId || !licenseKey) {
      return NextResponse.json({
        success: false,
        error: 'MaxMind credentials not configured',
        message: 'Please enter your MaxMind Account ID and License Key in the settings above, then try again.',
      }, { status: 400 })
    }

    // Ensure data directory exists
    const dataDir = '/data'
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    // Download URL with Basic Auth
    const downloadUrl = `https://download.maxmind.com/geoip/databases/${edition}/download?suffix=tar.gz`

    console.log(`Downloading MaxMind ${edition} database...`)

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountId}:${licenseKey}`).toString('base64')}`,
      },
    })

    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: 'Invalid MaxMind credentials',
        message: 'The Account ID or License Key is incorrect. Please check your credentials at maxmind.com/en/account',
      }, { status: 401 })
    }

    if (response.status === 404) {
      return NextResponse.json({
        success: false,
        error: 'Database not found',
        message: `The ${edition} database was not found. Make sure your account has access to this database.`,
      }, { status: 404 })
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Download failed: HTTP ${response.status}`,
        message: await response.text(),
      }, { status: response.status })
    }

    // Get the response as a buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB, extracting...`)

    // Create a temporary file for the tar.gz
    const tempTarPath = join(dataDir, `${edition}.tar.gz`)
    await writeFile(tempTarPath, buffer)

    // Extract the .mmdb file from the tar.gz
    let mmdbPath: string | null = null

    await tar.x({
      file: tempTarPath,
      cwd: dataDir,
      filter: (path) => path.endsWith('.mmdb'),
      onentry: (entry) => {
        // The mmdb file is inside a directory like GeoLite2-City_20240123/
        const filename = entry.path.split('/').pop()
        if (filename?.endsWith('.mmdb')) {
          mmdbPath = join(dataDir, filename)
          // Rename to standard name
          entry.path = filename
        }
      },
    })

    // Clean up temp file
    const { unlink } = await import('fs/promises')
    await unlink(tempTarPath).catch(() => {})

    // Rename to standard filename
    const finalPath = join(dataDir, `${edition}.mmdb`)
    if (mmdbPath && mmdbPath !== finalPath) {
      const { rename } = await import('fs/promises')
      await rename(mmdbPath, finalPath).catch(() => {})
    }

    // Verify the file exists
    if (!existsSync(finalPath)) {
      return NextResponse.json({
        success: false,
        error: 'Extraction failed',
        message: 'The database was downloaded but could not be extracted properly.',
      }, { status: 500 })
    }

    const { statSync } = await import('fs')
    const stats = statSync(finalPath)

    console.log(`MaxMind ${edition} database installed at ${finalPath}`)

    return NextResponse.json({
      success: true,
      message: `${edition} database downloaded successfully`,
      path: finalPath,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      date: new Date(stats.mtime).toISOString().split('T')[0],
    })

  } catch (error: any) {
    console.error('MaxMind download error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Download failed',
      message: 'An error occurred while downloading the database. Please try again.',
    }, { status: 500 })
  }
}
