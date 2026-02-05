import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
const assetDir = isDev
  ? path.join(process.cwd(), 'public', 'site-assets')
  : '/data/site-assets'

const LOGO_FILENAME = 'header-logo.webp'

export async function GET() {
  try {
    const logoPath = path.join(assetDir, LOGO_FILENAME)

    if (!fs.existsSync(logoPath)) {
      return new NextResponse('Logo not found', { status: 404 })
    }

    const logoBuffer = fs.readFileSync(logoPath)

    return new NextResponse(logoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving header logo:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
