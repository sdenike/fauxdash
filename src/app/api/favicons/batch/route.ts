import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';

async function fetchFavicon(url: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');

    const faviconUrls = [
      `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];

    for (const faviconUrl of faviconUrls) {
      try {
        const response = await fetch(faviconUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          return {
            data: await response.arrayBuffer(),
            contentType: response.headers.get('content-type') || 'image/x-icon',
          };
        }
      } catch (err) {
        continue;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ids, type } = await request.json();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
  }

  if (!type || !['bookmark', 'service'].includes(type)) {
    return NextResponse.json({ error: 'Type must be bookmark or service' }, { status: 400 });
  }

  const db = getDb();
  const results = [];

  // Create favicons directory if it doesn't exist
  const publicDir = join(process.cwd(), 'public', 'favicons');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  try {
    // Fetch items from database
    const table = type === 'bookmark' ? bookmarks : services;
    const items = await db
      .select()
      .from(table)
      .where(inArray(table.id, ids));

    // Process each item
    for (const item of items) {
      try {
        const faviconResult = await fetchFavicon(item.url);

        if (!faviconResult) {
          results.push({ id: item.id, success: false, error: 'Failed to fetch' });
          continue;
        }

        const urlObj = new URL(item.url);
        const domain = urlObj.hostname.replace('www.', '');

        // Determine file extension
        let ext = 'png';
        if (faviconResult.contentType.includes('x-icon')) ext = 'ico';
        else if (faviconResult.contentType.includes('png')) ext = 'png';
        else if (faviconResult.contentType.includes('jpg') || faviconResult.contentType.includes('jpeg')) ext = 'jpg';
        else if (faviconResult.contentType.includes('svg')) ext = 'svg';

        const filename = `${domain.replace(/\./g, '_')}_${Date.now()}.${ext}`;
        const filepath = join(publicDir, filename);

        // Try to convert to PNG, fallback to raw if it fails
        let finalFilename = filename;
        try {
          await sharp(Buffer.from(faviconResult.data))
            .png()
            .toFile(filepath.replace(`.${ext}`, '.png'));
          finalFilename = filename.replace(`.${ext}`, '.png');
        } catch (convertError) {
          // If conversion fails, save raw file
          await writeFile(filepath, Buffer.from(faviconResult.data));
        }

        // Update database with favicon path (using API route)
        const apiPath = `favicon:/api/favicons/serve/${finalFilename}`;
        await db
          .update(table)
          .set({ icon: apiPath })
          .where(eq(table.id, item.id));

        results.push({ id: item.id, success: true, path: apiPath });
      } catch (error: any) {
        results.push({ id: item.id, success: false, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: ids.length,
      successful: results.filter((r) => r.success).length,
    });
  } catch (error: any) {
    console.error('Batch favicon fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch favicons' },
      { status: 500 }
    );
  }
}
