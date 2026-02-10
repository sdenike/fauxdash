import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listOriginals, saveOriginal } from '@/lib/media-library'
import { logSystem } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET: List all originals in the media library
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await listOriginals()
    return NextResponse.json({ items })
  } catch (error: any) {
    logSystem('error', 'Error listing media library', { error: error.message })
    return NextResponse.json({ error: 'Failed to list media library' }, { status: 500 })
  }
}

// POST: Upload a file directly to the media library
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Must be an image.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = await saveOriginal(buffer, file.name, file.type)

    return NextResponse.json({
      success: true,
      filename,
      thumbnailUrl: `/api/media-library/${encodeURIComponent(filename)}?thumb=1`,
      originalUrl: `/api/media-library/${encodeURIComponent(filename)}`,
    })
  } catch (error: any) {
    logSystem('error', 'Error uploading to media library', { error: error.message })
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
