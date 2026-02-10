import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOriginalPath, deleteOriginal, checkOriginalUsage } from '@/lib/media-library'
import { readFileSync, existsSync, unlinkSync } from 'fs'
import { extname, join } from 'path'
import sharp from 'sharp'
import { logSystem } from '@/lib/logger'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { isNull, and, inArray } from 'drizzle-orm'
import { invalidateGlobalSettingsCache } from '@/lib/settings-cache'

export const dynamic = 'force-dynamic'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

// GET: Serve an original file, or a thumbnail with ?thumb=1
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { filename } = await params
  const filepath = getOriginalPath(decodeURIComponent(filename))
  if (!filepath) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const buffer = readFileSync(filepath)
    const ext = extname(filepath).toLowerCase()
    const isThumb = request.nextUrl.searchParams.get('thumb') === '1'

    if (isThumb) {
      // Generate 128x128 thumbnail on the fly
      const thumbnail = await sharp(buffer)
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

      return new NextResponse(new Uint8Array(thumbnail), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    logSystem('error', 'Error serving media library file', { filename, error: error.message })
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}

// DELETE: Delete an original, with usage check
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { filename } = await params
  const decodedFilename = decodeURIComponent(filename)
  const force = request.nextUrl.searchParams.get('force') === '1'

  // Check usage in settings
  const db = getDb()
  const globalSettings = await db
    .select()
    .from(settings)
    .where(isNull(settings.userId))

  const settingsObj: Record<string, string> = {}
  globalSettings.forEach((s: any) => {
    settingsObj[s.key] = s.value || ''
  })

  const usages = checkOriginalUsage(decodedFilename, settingsObj)

  if (usages.length > 0 && !force) {
    return NextResponse.json(
      { inUse: true, usages },
      { status: 409 }
    )
  }

  // If force delete and in use, clear the relevant settings and processed files
  if (usages.length > 0 && force) {
    const mediaRef = `media:${decodedFilename}`
    const keysToReset: { key: string; value: string }[] = []

    const isDev = process.env.NODE_ENV !== 'production'
    const assetDir = isDev
      ? join(process.cwd(), 'public', 'site-assets')
      : '/data/site-assets'

    if (settingsObj.siteFavicon === mediaRef) {
      keysToReset.push({ key: 'siteFavicon', value: '' })
      keysToReset.push({ key: 'siteFaviconType', value: 'default' })
      // Remove processed favicon file so serve endpoint falls back to default
      const faviconFile = join(assetDir, 'site-favicon.png')
      if (existsSync(faviconFile)) {
        try { unlinkSync(faviconFile) } catch { /* ignore */ }
      }
    }
    if (settingsObj.headerLogoPath === mediaRef) {
      keysToReset.push({ key: 'headerLogoPath', value: '' })
      keysToReset.push({ key: 'headerLogoType', value: 'none' })
      keysToReset.push({ key: 'headerLogoEnabled', value: 'false' })
      // Remove processed logo file
      const logoFile = join(assetDir, 'header-logo.webp')
      if (existsSync(logoFile)) {
        try { unlinkSync(logoFile) } catch { /* ignore */ }
      }
    }
    if (settingsObj.pwaIconPath === mediaRef) {
      keysToReset.push({ key: 'pwaIconPath', value: '' })
      keysToReset.push({ key: 'pwaIconType', value: 'none' })
      // Remove all generated PWA icon sizes so serve falls back to defaults
      const pwaDir = join(assetDir, 'pwa-icons')
      const pwaIconSizes = [72, 96, 128, 144, 152, 192, 384, 512]
      for (const size of pwaIconSizes) {
        const iconFile = join(pwaDir, `icon-${size}x${size}.png`)
        if (existsSync(iconFile)) {
          try { unlinkSync(iconFile) } catch { /* ignore */ }
        }
      }
    }

    if (keysToReset.length > 0) {
      await db.transaction(async (tx: any) => {
        const keys = keysToReset.map(k => k.key)
        await tx
          .delete(settings)
          .where(and(inArray(settings.key, keys), isNull(settings.userId)))
        await tx
          .insert(settings)
          .values(keysToReset.map(k => ({ userId: null, key: k.key, value: k.value })))
      })
      invalidateGlobalSettingsCache()
    }
  }

  const deleted = await deleteOriginal(decodedFilename)
  if (!deleted) {
    return NextResponse.json({ error: 'File not found or could not be deleted' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
