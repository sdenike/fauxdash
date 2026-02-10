import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { saveOriginal } from '@/lib/media-library'

const isDev = process.env.NODE_ENV === 'development'
const assetDir = isDev
  ? path.join(process.cwd(), 'public', 'site-assets')
  : '/data/site-assets'

// Ensure directory exists (wrapped in try-catch for build time)
try {
  if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true })
  }
} catch (error) {
  // Directory creation may fail during build - this is expected
  console.log('Could not create site-assets directory (this is normal during build)')
}

const LOGO_FILENAME = 'header-logo.webp'
const MAX_HEIGHT = 64 // Maximum logo height in pixels
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function GET() {
  const logoPath = path.join(assetDir, LOGO_FILENAME)

  if (fs.existsSync(logoPath)) {
    return NextResponse.json({
      exists: true,
      path: `/api/header-logo/serve?t=${Date.now()}`
    })
  }

  return NextResponse.json({ exists: false })
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File
    const fromMediaLibrary = formData.get('fromMediaLibrary') === '1'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      }, { status: 400 })
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save original to media library (non-fatal), skip if re-processing from media library
    if (!fromMediaLibrary) {
      try {
        await saveOriginal(buffer, file.name, file.type)
      } catch (err) {
        console.warn('Failed to save original to media library:', err)
      }
    }

    // Process with Sharp - resize if needed, convert to WebP
    const image = sharp(buffer)
    const metadata = await image.metadata()

    // Resize if height exceeds maximum, preserving aspect ratio
    let processedImage = image
    if (metadata.height && metadata.height > MAX_HEIGHT) {
      processedImage = image.resize({
        height: MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    // Convert to WebP with lossless compression (preserves transparency)
    const webpBuffer = await processedImage
      .webp({ lossless: true, quality: 100 })
      .toBuffer()

    // Save to file system
    const logoPath = path.join(assetDir, LOGO_FILENAME)
    fs.writeFileSync(logoPath, webpBuffer)

    return NextResponse.json({
      success: true,
      path: `/api/header-logo/serve?t=${Date.now()}`
    })
  } catch (error) {
    console.error('Header logo upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload logo'
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logoPath = path.join(assetDir, LOGO_FILENAME)

    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Header logo delete error:', error)
    return NextResponse.json({
      error: 'Failed to delete logo'
    }, { status: 500 })
  }
}
