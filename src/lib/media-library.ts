import { mkdir, readdir, stat, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname, basename } from 'path'
import { logSystem } from '@/lib/logger'

const isDev = process.env.NODE_ENV !== 'production'
export const ORIGINALS_DIR = isDev
  ? join(process.cwd(), 'public', 'site-assets', 'originals')
  : '/data/site-assets/originals'

export interface MediaLibraryItem {
  filename: string
  size: number
  createdAt: string
  thumbnailUrl: string
  originalUrl: string
}

async function ensureOriginalsDir() {
  if (!existsSync(ORIGINALS_DIR)) {
    await mkdir(ORIGINALS_DIR, { recursive: true })
  }
}

function sanitizeFilename(name: string): string {
  // Remove path components and dangerous characters
  const base = basename(name)
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)
}

/**
 * Save an original image buffer to the originals directory.
 * Returns the generated filename.
 */
export async function saveOriginal(
  buffer: Buffer,
  originalFilename: string,
  _mimeType: string
): Promise<string> {
  await ensureOriginalsDir()

  const ext = extname(originalFilename).toLowerCase() || '.png'
  const sanitized = sanitizeFilename(originalFilename).replace(/\.[^.]+$/, '')
  const timestamp = Date.now()
  const filename = `${timestamp}-${sanitized}${ext}`

  const filepath = join(ORIGINALS_DIR, filename)
  const { writeFile } = await import('fs/promises')
  await writeFile(filepath, buffer)

  logSystem('info', 'Media library: saved original', { filename, size: buffer.length })
  return filename
}

/**
 * List all original images, sorted newest first.
 */
export async function listOriginals(): Promise<MediaLibraryItem[]> {
  await ensureOriginalsDir()

  const files = await readdir(ORIGINALS_DIR)
  const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico']

  const items: MediaLibraryItem[] = []
  for (const file of files) {
    const ext = extname(file).toLowerCase()
    if (!imageExts.includes(ext)) continue

    try {
      const filepath = join(ORIGINALS_DIR, file)
      const stats = await stat(filepath)
      items.push({
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        thumbnailUrl: `/api/media-library/${encodeURIComponent(file)}?thumb=1`,
        originalUrl: `/api/media-library/${encodeURIComponent(file)}`,
      })
    } catch {
      // Skip files that can't be stat'd
    }
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items
}

/**
 * Resolve a filename to its full path, with directory traversal protection.
 */
export function getOriginalPath(filename: string): string | null {
  const sanitized = basename(filename)
  if (sanitized !== filename || filename.includes('..') || filename.includes('/')) {
    return null
  }
  const filepath = join(ORIGINALS_DIR, sanitized)
  if (!existsSync(filepath)) return null
  return filepath
}

/**
 * Delete an original file.
 */
export async function deleteOriginal(filename: string): Promise<boolean> {
  const filepath = getOriginalPath(filename)
  if (!filepath) return false
  try {
    await unlink(filepath)
    logSystem('info', 'Media library: deleted original', { filename })
    return true
  } catch {
    return false
  }
}

/**
 * Check if a media library original is in use in settings.
 * Returns an array of usage labels (e.g., ["Site Favicon", "PWA App Icon"]).
 */
export function checkOriginalUsage(
  filename: string,
  settingsObj: Record<string, string>
): string[] {
  const mediaRef = `media:${filename}`
  const usages: string[] = []

  if (settingsObj.siteFavicon === mediaRef) {
    usages.push('Site Favicon')
  }
  if (settingsObj.headerLogoPath === mediaRef) {
    usages.push('Header Logo')
  }
  if (settingsObj.pwaIconPath === mediaRef) {
    usages.push('PWA App Icon')
  }

  return usages
}
