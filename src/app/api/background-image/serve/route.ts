import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Use /data for persistence in Docker, fallback to public for dev
const BACKGROUND_DIR = process.env.NODE_ENV === 'production'
  ? '/data/site-assets'
  : join(process.cwd(), 'public', 'site-assets');
const BACKGROUND_FILE = 'background-image.webp';

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
    console.error('Error serving background image:', error);
    return NextResponse.json({ error: 'Failed to serve background' }, { status: 500 });
  }
}
