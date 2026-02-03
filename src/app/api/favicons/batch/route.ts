import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logFavicon } from '@/lib/logger';
import { fetchAndSaveFavicon } from '@/lib/favicon-utils';

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
        // Use centralized favicon fetching function
        const faviconResult = await fetchAndSaveFavicon(item.url);

        if (!faviconResult.success) {
          logFavicon('warn', `Failed to fetch favicon for: ${item.name}`, { url: item.url, error: faviconResult.error });
          results.push({ id: item.id, success: false, error: faviconResult.error || 'Failed to fetch' });
          continue;
        }

        // Update database with favicon path
        const apiPath = `favicon:${faviconResult.path}`;
        await db
          .update(table)
          .set({ icon: apiPath })
          .where(eq(table.id, item.id));

        logFavicon('info', `Updated database for: ${item.name}`, { path: faviconResult.path });
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
