import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Use /data for persistence in Docker, fallback to public for dev
const GRAPHIC_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets'
  : join(process.cwd(), 'public', 'site-assets');
const GRAPHIC_FILE = 'homepage-graphic.webp';

export async function GET() {
  try {
    const filepath = join(GRAPHIC_DIR, GRAPHIC_FILE);

    if (!(await access(filepath).then(() => true, () => false))) {
      return NextResponse.json({ error: 'No homepage graphic' }, { status: 404 });
    }

    const fileBuffer = await readFile(filepath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving homepage graphic:', error);
    return NextResponse.json({ error: 'Failed to serve graphic' }, { status: 500 });
  }
}
