import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

interface FileStats {
  name: string
  size: number
  modified: Date
}

interface FaviconStats {
  totalFiles: number
  totalSize: number
  totalSizeFormatted: string
  originalCount: number
  originalSize: number
  modifiedCount: number
  modifiedSize: number
  breakdown: {
    type: string
    count: number
    size: number
    sizeFormatted: string
  }[]
  recentFiles: FileStats[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const faviconDir = join(process.cwd(), 'public', 'favicons')

    let files: FileStats[] = []

    try {
      const fileNames = readdirSync(faviconDir)
      files = fileNames
        .filter(name => !name.startsWith('.')) // Exclude hidden files
        .map(name => {
          const filePath = join(faviconDir, name)
          const stat = statSync(filePath)
          return {
            name,
            size: stat.size,
            modified: stat.mtime
          }
        })
    } catch (err) {
      // Directory doesn't exist or is empty
      files = []
    }

    // Calculate totals
    const totalFiles = files.length
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    // Categorize files
    // Modified files have patterns like: _themed, _monotone, _inverted, _black, _white
    const modifiedPatterns = ['_themed', '_monotone', '_inverted', '_black', '_white']

    const originalFiles = files.filter(f =>
      !modifiedPatterns.some(pattern => f.name.includes(pattern))
    )
    const modifiedFiles = files.filter(f =>
      modifiedPatterns.some(pattern => f.name.includes(pattern))
    )

    // Breakdown by file type/modification
    const breakdown: { type: string; count: number; size: number; sizeFormatted: string }[] = []

    // Original favicons (downloaded)
    if (originalFiles.length > 0) {
      const size = originalFiles.reduce((sum, f) => sum + f.size, 0)
      breakdown.push({
        type: 'Original (Downloaded)',
        count: originalFiles.length,
        size,
        sizeFormatted: formatBytes(size)
      })
    }

    // Theme colored
    const themedFiles = files.filter(f => f.name.includes('_themed'))
    if (themedFiles.length > 0) {
      const size = themedFiles.reduce((sum, f) => sum + f.size, 0)
      breakdown.push({
        type: 'Theme Colored',
        count: themedFiles.length,
        size,
        sizeFormatted: formatBytes(size)
      })
    }

    // Monotone (black/white pairs)
    const monotoneFiles = files.filter(f =>
      f.name.includes('_monotone') || f.name.includes('_black') || f.name.includes('_white')
    )
    if (monotoneFiles.length > 0) {
      const size = monotoneFiles.reduce((sum, f) => sum + f.size, 0)
      breakdown.push({
        type: 'Monotone',
        count: monotoneFiles.length,
        size,
        sizeFormatted: formatBytes(size)
      })
    }

    // Inverted
    const invertedFiles = files.filter(f => f.name.includes('_inverted'))
    if (invertedFiles.length > 0) {
      const size = invertedFiles.reduce((sum, f) => sum + f.size, 0)
      breakdown.push({
        type: 'Inverted',
        count: invertedFiles.length,
        size,
        sizeFormatted: formatBytes(size)
      })
    }

    // Get 5 most recent files
    const recentFiles = [...files]
      .sort((a, b) => b.modified.getTime() - a.modified.getTime())
      .slice(0, 5)

    const stats: FaviconStats = {
      totalFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      originalCount: originalFiles.length,
      originalSize: originalFiles.reduce((sum, f) => sum + f.size, 0),
      modifiedCount: modifiedFiles.length,
      modifiedSize: modifiedFiles.reduce((sum, f) => sum + f.size, 0),
      breakdown,
      recentFiles
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to get favicon stats:', error)
    return NextResponse.json({ error: 'Failed to get favicon stats' }, { status: 500 })
  }
}
