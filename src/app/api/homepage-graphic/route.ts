import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { logSystem } from '@/lib/logger';

// Use /data for persistence in Docker, fallback to public for dev
const GRAPHIC_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets'
  : join(process.cwd(), 'public', 'site-assets');
const GRAPHIC_FILE = 'homepage-graphic.webp';

// Ensure the site-assets directory exists
async function ensureDir() {
  if (!existsSync(GRAPHIC_DIR)) {
    await mkdir(GRAPHIC_DIR, { recursive: true });
  }
}

// GET: Serve the current homepage graphic
export async function GET() {
  try {
    const filepath = join(GRAPHIC_DIR, GRAPHIC_FILE);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'No homepage graphic' }, { status: 404 });
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
    logSystem('error', 'Error serving homepage graphic', { error });
    return NextResponse.json({ error: 'Failed to serve graphic' }, { status: 500 });
  }
}

// POST: Upload a new homepage graphic
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

    // Validate that the buffer contains valid image data
    // Check for common image format signatures (magic bytes)
    const isValidImage =
      (buffer[0] === 0xFF && buffer[1] === 0xD8) || // JPEG
      (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) || // PNG
      (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) || // GIF
      (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46); // WebP/RIFF

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Invalid image file. The file does not contain valid image data.' },
        { status: 400 }
      );
    }

    // Convert to WebP with lossless compression for logos/graphics
    // Resize to max 1024px on longest side to keep file sizes reasonable
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(buffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ lossless: true })
        .toBuffer();
    } catch (sharpError: any) {
      logSystem('error', 'Sharp processing failed', { error: sharpError.message });
      return NextResponse.json(
        { error: 'Image conversion failed. The file may be corrupted or in an unsupported format.' },
        { status: 400 }
      );
    }

    // Save the file
    await writeFile(join(GRAPHIC_DIR, GRAPHIC_FILE), processedBuffer);

    logSystem('info', 'Homepage graphic uploaded', {
      originalName: file.name,
      originalSize: file.size,
      processedSize: processedBuffer.length,
    });

    return NextResponse.json({
      success: true,
      path: `/api/homepage-graphic/serve`,
      message: 'Homepage graphic uploaded successfully',
    });
  } catch (error: any) {
    logSystem('error', 'Error uploading homepage graphic', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to upload graphic' },
      { status: 500 }
    );
  }
}

// DELETE: Remove the homepage graphic
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const filepath = join(GRAPHIC_DIR, GRAPHIC_FILE);

    if (existsSync(filepath)) {
      await unlink(filepath);
      logSystem('info', 'Homepage graphic removed');
    }

    return NextResponse.json({ success: true, message: 'Graphic removed' });
  } catch (error: any) {
    logSystem('error', 'Error removing homepage graphic', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to remove graphic' },
      { status: 500 }
    );
  }
}
