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
import { logFavicon } from '@/lib/logger';
import { convertToPng } from '@/lib/favicon-utils';

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

  logFavicon('info', `Starting batch favicon fetch for ${ids.length} ${type}s`, { ids });

  // Create favicons directory if it doesn't exist
  const publicDir = join(process.cwd(), 'public', 'favicons');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
    logFavicon('info', 'Created favicons directory');
  }

  try {
    // Fetch items from database
    const table = type === 'bookmark' ? bookmarks : services;
    const items = await db
      .select()
      .from(table)
      .where(inArray(table.id, ids));

    logFavicon('info', `Found ${items.length} items to process`);

    // Process each item
    let processedCount = 0;
    for (const item of items) {
      processedCount++;
      logFavicon('info', `Processing ${processedCount}/${items.length}: ${item.name} (${item.url})`);

      try {
        const faviconResult = await fetchFavicon(item.url);

        if (!faviconResult) {
          logFavicon('warn', `Failed to fetch favicon for: ${item.name}`, { url: item.url });
          results.push({ id: item.id, success: false, error: 'Failed to fetch' });
          continue;
        }

        const urlObj = new URL(item.url);
        const domain = urlObj.hostname.replace('www.', '');

        // Generate filenames - both original (immutable) and active copy
        const timestamp = Date.now();
        const baseFilename = `${domain.replace(/\./g, '_')}_${timestamp}`;
        const originalFilename = `${baseFilename}_original.png`;
        const activeFilename = `${baseFilename}.png`;
        const originalPath = join(publicDir, originalFilename);
        const activePath = join(publicDir, activeFilename);

        // Try to convert to PNG using shared utility and save both original and active copies
        let finalFilename = activeFilename;
        const conversionResult = await convertToPng(Buffer.from(faviconResult.data), domain);

        if (conversionResult.success && conversionResult.buffer) {
          // Save immutable original copy
          await sharp(conversionResult.buffer).toFile(originalPath);

          // Save active copy (can be overwritten by transformations)
          await sharp(conversionResult.buffer).toFile(activePath);
          logFavicon('info', `Saved favicon for: ${item.name}`, { filename: activeFilename });
        } else {
          // If conversion fails, try Google's favicon service as fallback
          logFavicon('warn', `PNG conversion failed for ${item.name}, trying Google fallback`, { error: conversionResult.error });

          try {
            const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            const googleResponse = await fetch(googleUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)' },
              signal: AbortSignal.timeout(5000),
            });

            if (googleResponse.ok) {
              const googleData = await googleResponse.arrayBuffer();
              const googleBuffer = Buffer.from(googleData);

              // Google returns PNG, save it
              await sharp(googleBuffer).toFile(originalPath);
              await sharp(googleBuffer).toFile(activePath);
              logFavicon('info', `Saved favicon from Google for: ${item.name}`, { filename: activeFilename });
            } else {
              throw new Error('Google fallback failed');
            }
          } catch (fallbackError: any) {
            // Last resort: save raw file without original copy
            logFavicon('warn', `All conversion attempts failed for ${item.name}, saving raw file`, { error: fallbackError.message });
            await writeFile(activePath, Buffer.from(faviconResult.data));
          }
        }

        // Update database with favicon path (using API route)
        const apiPath = `favicon:/api/favicons/serve/${finalFilename}`;
        await db
          .update(table)
          .set({ icon: apiPath })
          .where(eq(table.id, item.id));

        logFavicon('info', `Updated database for: ${item.name}`);
        results.push({ id: item.id, success: true, path: apiPath });
      } catch (error: any) {
        logFavicon('error', `Error processing ${item.name}`, { error: error.message });
        results.push({ id: item.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logFavicon('info', `Batch favicon fetch complete: ${successCount}/${ids.length} successful`);

    return NextResponse.json({
      success: true,
      results,
      total: ids.length,
      successful: successCount,
    });
  } catch (error: any) {
    logFavicon('error', 'Batch favicon fetch error', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch favicons' },
      { status: 500 }
    );
  }
}
