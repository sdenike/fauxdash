import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

export const dynamic = 'force-dynamic';

const VALID_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

const PWA_ICONS_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets/pwa-icons'
  : join(process.cwd(), 'public', 'site-assets', 'pwa-icons');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  try {
    const { size: sizeStr } = await params;
    const size = parseInt(sizeStr, 10);

    if (!VALID_SIZES.includes(size)) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
    }

    // Check settings for PWA icon configuration
    const dbPath = process.env.DATABASE_PATH || process.env.SQLITE_FILE ||
      (process.env.NODE_ENV === 'production' ? '/data/fauxdash.db' : join(process.cwd(), 'data', 'fauxdash.db'));

    let pwaIconType = 'none';

    if (existsSync(dbPath)) {
      const db = new Database(dbPath, { readonly: true });
      const typeSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('pwaIconType') as { value: string } | undefined;
      pwaIconType = typeSetting?.value || 'none';
      db.close();
    }

    // Try serving custom icon
    if (pwaIconType !== 'none') {
      const customPath = join(PWA_ICONS_DIR, `icon-${size}x${size}.png`);
      if (existsSync(customPath)) {
        const fileBuffer = readFileSync(customPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // Fallback to default icons in public/icons/
    const defaultPath = join(process.cwd(), 'public', 'icons', `icon-${size}x${size}.png`);
    if (existsSync(defaultPath)) {
      const fileBuffer = readFileSync(defaultPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    return NextResponse.json({ error: 'Icon not found' }, { status: 404 });
  } catch (error) {
    console.error('Error serving PWA icon:', error);
    return NextResponse.json({ error: 'Failed to serve icon' }, { status: 500 });
  }
}
