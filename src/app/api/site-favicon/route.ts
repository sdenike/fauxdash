import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { logSystem } from '@/lib/logger';
import { fetchAndSaveFavicon } from '@/lib/favicon-utils';

// Use /data for persistence in Docker, fallback to public for dev
const SITE_FAVICON_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets'
  : join(process.cwd(), 'public', 'site-assets');
const SITE_FAVICON_FILE = 'site-favicon.png';

// Ensure the site-assets directory exists
async function ensureDir() {
  if (!existsSync(SITE_FAVICON_DIR)) {
    await mkdir(SITE_FAVICON_DIR, { recursive: true });
  }
}

// GET: Serve the current site favicon
export async function GET() {
  try {
    const filepath = join(SITE_FAVICON_DIR, SITE_FAVICON_FILE);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'No custom favicon' }, { status: 404 });
    }

    const fileBuffer = readFileSync(filepath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error) {
    logSystem('error', 'Error serving site favicon', { error });
    return NextResponse.json({ error: 'Failed to serve favicon' }, { status: 500 });
  }
}

// POST: Upload or fetch a new site favicon
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDir();

    const contentType = request.headers.get('content-type') || '';

    // Handle URL-based fetch
    if (contentType.includes('application/json')) {
      const { url } = await request.json();

      if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }

      // Determine if this is a direct favicon URL or a domain
      const isDirectFavicon = /\.(ico|png|jpg|jpeg|svg|gif|webp)$/i.test(url);

      // Fetch the favicon
      const result = await fetchAndSaveFavicon(url, { isDirectFaviconUrl: isDirectFavicon });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to fetch favicon' },
          { status: 400 }
        );
      }

      // Copy the fetched favicon to site-assets
      const sourcePath = join(process.cwd(), 'public', 'favicons', result.filename || '');
      if (existsSync(sourcePath)) {
        const imageBuffer = readFileSync(sourcePath);
        // Convert to PNG and resize to standard favicon size
        const processedBuffer = await sharp(imageBuffer)
          .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        await writeFile(join(SITE_FAVICON_DIR, SITE_FAVICON_FILE), processedBuffer);
      }

      logSystem('info', 'Site favicon updated from URL', { url });

      return NextResponse.json({
        success: true,
        path: `/api/site-favicon/serve`,
        message: 'Favicon updated from URL',
      });
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, ICO, SVG, JPEG' },
        { status: 400 }
      );
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 1MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to PNG and resize to standard favicon size
    const processedBuffer = await sharp(buffer)
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Save the file
    await writeFile(join(SITE_FAVICON_DIR, SITE_FAVICON_FILE), processedBuffer);

    logSystem('info', 'Site favicon uploaded', { originalName: file.name, size: file.size });

    return NextResponse.json({
      success: true,
      path: `/api/site-favicon/serve`,
      message: 'Favicon uploaded successfully',
    });
  } catch (error: any) {
    logSystem('error', 'Error uploading site favicon', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to upload favicon' },
      { status: 500 }
    );
  }
}

// DELETE: Remove the custom site favicon
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const filepath = join(SITE_FAVICON_DIR, SITE_FAVICON_FILE);

    if (existsSync(filepath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filepath);
      logSystem('info', 'Site favicon removed');
    }

    return NextResponse.json({ success: true, message: 'Favicon removed' });
  } catch (error: any) {
    logSystem('error', 'Error removing site favicon', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to remove favicon' },
      { status: 500 }
    );
  }
}
