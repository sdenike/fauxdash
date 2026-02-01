import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { logSystem } from '@/lib/logger';

// Use /data for persistence in Docker, fallback to public for dev
const BACKGROUND_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets'
  : join(process.cwd(), 'public', 'site-assets');
const BACKGROUND_FILE = 'background-image.webp';

// Ensure the site-assets directory exists
async function ensureDir() {
  if (!existsSync(BACKGROUND_DIR)) {
    await mkdir(BACKGROUND_DIR, { recursive: true });
  }
}

// GET: Serve the current background image
export async function GET() {
  try {
    const filepath = join(BACKGROUND_DIR, BACKGROUND_FILE);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'No background image' }, { status: 404 });
    }

    const fileBuffer = readFileSync(filepath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error) {
    logSystem('error', 'Error serving background image', { error });
    return NextResponse.json({ error: 'Failed to serve background' }, { status: 500 });
  }
}

// POST: Upload a new background image
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to WebP for optimal performance, preserve aspect ratio
    // Resize to max 2560px on longest side to balance quality and file size
    const processedBuffer = await sharp(buffer)
      .resize(2560, 2560, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Save the file
    await writeFile(join(BACKGROUND_DIR, BACKGROUND_FILE), processedBuffer);

    logSystem('info', 'Background image uploaded', {
      originalName: file.name,
      originalSize: file.size,
      processedSize: processedBuffer.length,
    });

    return NextResponse.json({
      success: true,
      path: `/api/background-image/serve`,
      message: 'Background image uploaded successfully',
    });
  } catch (error: any) {
    logSystem('error', 'Error uploading background image', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to upload background' },
      { status: 500 }
    );
  }
}

// DELETE: Remove the background image
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const filepath = join(BACKGROUND_DIR, BACKGROUND_FILE);

    if (existsSync(filepath)) {
      await unlink(filepath);
      logSystem('info', 'Background image removed');
    }

    return NextResponse.json({ success: true, message: 'Background removed' });
  } catch (error: any) {
    logSystem('error', 'Error removing background image', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to remove background' },
      { status: 500 }
    );
  }
}
