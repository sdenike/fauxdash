import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { logSystem } from '@/lib/logger';
import { fetchAndSaveFavicon } from '@/lib/favicon-utils';
import { saveOriginal } from '@/lib/media-library';

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const PWA_ICONS_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets/pwa-icons'
  : join(process.cwd(), 'public', 'site-assets', 'pwa-icons');

async function ensureDir() {
  if (!existsSync(PWA_ICONS_DIR)) {
    await mkdir(PWA_ICONS_DIR, { recursive: true });
  }
}

async function generateAllSizes(buffer: Buffer) {
  await ensureDir();
  for (const size of ICON_SIZES) {
    const resized = await sharp(buffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await writeFile(join(PWA_ICONS_DIR, `icon-${size}x${size}.png`), resized);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();

      // Handle library icon
      if (body.libraryIcon) {
        let iconName = body.libraryIcon;
        if (iconName.startsWith('favicon:')) {
          iconName = iconName.replace('favicon:', '');
        }
        const faviconPath = join(process.cwd(), 'public', 'favicons', iconName);
        if (!existsSync(faviconPath)) {
          return NextResponse.json({ error: 'Library icon not found' }, { status: 404 });
        }
        const imageBuffer = readFileSync(faviconPath);
        await generateAllSizes(imageBuffer);
        logSystem('info', 'PWA icons generated from library icon', { icon: iconName });
        return NextResponse.json({
          success: true,
          path: '/api/pwa-icons/serve/192',
        });
      }

      // Handle URL fetch
      if (body.url) {
        const isDirectImage = /\.(ico|png|jpg|jpeg|svg|gif|webp)$/i.test(body.url);
        const result = await fetchAndSaveFavicon(body.url, { isDirectFaviconUrl: isDirectImage });
        if (!result.success) {
          return NextResponse.json({ error: result.error || 'Failed to fetch image' }, { status: 400 });
        }
        const sourcePath = join(process.cwd(), 'public', 'favicons', result.filename || '');
        if (!existsSync(sourcePath)) {
          return NextResponse.json({ error: 'Fetched image not found' }, { status: 500 });
        }
        const imageBuffer = readFileSync(sourcePath);

        // Save original to media library (non-fatal)
        try {
          await saveOriginal(imageBuffer, result.filename || 'pwa-icon.png', 'image/png');
        } catch (err) {
          logSystem('warn', 'Failed to save original to media library', { error: err });
        }

        await generateAllSizes(imageBuffer);
        logSystem('info', 'PWA icons generated from URL', { url: body.url });
        return NextResponse.json({
          success: true,
          path: '/api/pwa-icons/serve/192',
        });
      }

      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fromMediaLibrary = formData.get('fromMediaLibrary') === '1';
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Must be an image.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save original to media library (non-fatal), skip if re-processing from media library
    if (!fromMediaLibrary) {
      try {
        await saveOriginal(buffer, file.name, file.type);
      } catch (err) {
        logSystem('warn', 'Failed to save original to media library', { error: err });
      }
    }

    await generateAllSizes(buffer);

    logSystem('info', 'PWA icons uploaded and generated', { originalName: file.name, size: file.size });

    return NextResponse.json({
      success: true,
      path: '/api/pwa-icons/serve/192',
    });
  } catch (error: any) {
    logSystem('error', 'Error processing PWA icon', { error: error.message });
    return NextResponse.json({ error: error.message || 'Failed to process icon' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    for (const size of ICON_SIZES) {
      const filepath = join(PWA_ICONS_DIR, `icon-${size}x${size}.png`);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }
    logSystem('info', 'PWA icons removed');
    return NextResponse.json({ success: true, message: 'PWA icons removed' });
  } catch (error: any) {
    logSystem('error', 'Error removing PWA icons', { error: error.message });
    return NextResponse.json({ error: error.message || 'Failed to remove icons' }, { status: 500 });
  }
}
