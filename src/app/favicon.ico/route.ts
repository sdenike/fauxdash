import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Use /data for persistence in Docker, fallback to public for dev
const SITE_FAVICON_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets'
  : join(process.cwd(), 'public', 'site-assets');
const SITE_FAVICON_FILE = 'site-favicon.png';

export async function GET() {
  try {
    // Check settings for favicon configuration
    const dbPath = process.env.DATABASE_PATH || process.env.SQLITE_FILE ||
      (process.env.NODE_ENV === 'production' ? '/data/fauxdash.db' : join(process.cwd(), 'data', 'fauxdash.db'));

    let favicon = '';
    let faviconType = 'default';

    if (existsSync(dbPath)) {
      const db = new Database(dbPath, { readonly: true });
      const faviconSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('siteFavicon') as { value: string } | undefined;
      const faviconTypeSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('siteFaviconType') as { value: string } | undefined;
      favicon = faviconSetting?.value || '';
      faviconType = faviconTypeSetting?.value || 'default';
      db.close();
    }

    // If using uploaded favicon, serve from site-assets
    if (faviconType === 'upload') {
      const customPath = join(SITE_FAVICON_DIR, SITE_FAVICON_FILE);
      if (existsSync(customPath)) {
        const fileBuffer = readFileSync(customPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
    }

    // If using library icon, fetch from favicons serve endpoint
    if (faviconType === 'library' && favicon) {
      // Extract the path from favicon: prefix
      let iconPath = favicon;
      if (favicon.startsWith('favicon:')) {
        iconPath = favicon.replace('favicon:', '');
      }
      // Normalize the path
      if (!iconPath.startsWith('/api/favicons/serve/')) {
        iconPath = `/api/favicons/serve/${iconPath}`;
      }

      // Read directly from the favicons directory
      const filename = iconPath.replace('/api/favicons/serve/', '');
      const faviconPath = join(process.cwd(), 'public', 'favicons', filename);

      if (existsSync(faviconPath)) {
        const fileBuffer = readFileSync(faviconPath);
        const ext = filename.split('.').pop()?.toLowerCase();
        const contentType = ext === 'svg' ? 'image/svg+xml' : ext === 'ico' ? 'image/x-icon' : 'image/png';

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
    }

    // If using URL-fetched favicon, serve from site-assets
    if (faviconType === 'url') {
      const customPath = join(SITE_FAVICON_DIR, SITE_FAVICON_FILE);
      if (existsSync(customPath)) {
        const fileBuffer = readFileSync(customPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      }
    }

    // Fall back to default favicon in public folder
    const defaultIcoPath = join(process.cwd(), 'public', 'default-favicon.ico');
    if (existsSync(defaultIcoPath)) {
      const fileBuffer = readFileSync(defaultIcoPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Return a simple SVG favicon as final fallback
    const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#3b82f6"/>
      <text x="50" y="70" font-family="Arial" font-size="50" fill="white" text-anchor="middle" font-weight="bold">F</text>
    </svg>`;

    return new NextResponse(svgFavicon, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error serving favicon.ico:', error);
    return NextResponse.json({ error: 'Failed to serve favicon' }, { status: 500 });
  }
}
