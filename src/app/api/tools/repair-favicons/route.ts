import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { join } from 'path';
import { existsSync, unlinkSync, readdirSync } from 'fs';
import { fetchAndSaveFavicon, validateFaviconFile, getFaviconDir } from '@/lib/favicon-utils';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const faviconDir = getFaviconDir();

    // Get all bookmarks and services with favicon: icons
    const allBookmarks = await db.select().from(bookmarks);
    const allServices = await db.select().from(services);

    const items: Array<{
      id: number;
      type: 'bookmark' | 'service';
      name: string;
      url: string;
      icon: string;
    }> = [];

    for (const bookmark of allBookmarks) {
      if (bookmark.icon?.startsWith('favicon:')) {
        items.push({
          id: bookmark.id,
          type: 'bookmark',
          name: bookmark.name,
          url: bookmark.url,
          icon: bookmark.icon,
        });
      }
    }

    for (const service of allServices) {
      if (service.icon?.startsWith('favicon:')) {
        items.push({
          id: service.id,
          type: 'service',
          name: service.name,
          url: service.url,
          icon: service.icon,
        });
      }
    }

    let repaired = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        // Extract filename from icon path
        let filename = item.icon.replace('favicon:', '');
        if (filename.startsWith('/api/favicons/serve/')) {
          filename = filename.replace('/api/favicons/serve/', '');
        }

        // Skip monotone variants - they need to be regenerated from the original
        if (filename.includes('_monotone')) {
          skipped++;
          continue;
        }

        const filepath = join(faviconDir, filename);

        // Check if file exists and is valid
        if (existsSync(filepath)) {
          const validation = await validateFaviconFile(filepath);
          if (validation.valid) {
            skipped++;
            continue;
          }
          console.log(`Invalid favicon for ${item.name}: ${validation.error}`);
        } else {
          console.log(`Missing favicon for ${item.name}: ${filepath}`);
        }

        // File is missing or invalid - re-fetch
        console.log(`Repairing favicon for ${item.name} from ${item.url}`);

        const result = await fetchAndSaveFavicon(item.url);

        if (result.success && result.path) {
          // Delete old file and its variants
          try {
            const baseName = filename.replace(/\.png$/, '').replace(/_original$/, '');
            const filesToDelete = readdirSync(faviconDir).filter(f => f.startsWith(baseName));
            for (const f of filesToDelete) {
              const fullPath = join(faviconDir, f);
              if (existsSync(fullPath)) {
                unlinkSync(fullPath);
              }
            }
          } catch (e) {
            // Ignore cleanup errors
          }

          // Update database with new path
          if (item.type === 'bookmark') {
            await db.update(bookmarks)
              .set({ icon: `favicon:${result.path}` })
              .where(eq(bookmarks.id, item.id));
          } else {
            await db.update(services)
              .set({ icon: `favicon:${result.path}` })
              .where(eq(services.id, item.id));
          }
          repaired++;
        } else {
          errors.push(`${item.name}: ${result.error || 'Unknown error'}`);
          failed++;
        }
      } catch (e: any) {
        errors.push(`${item.name}: ${e.message}`);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scanned ${items.length} favicons. Repaired ${repaired}, skipped ${skipped} (valid), failed ${failed}.`,
      total: items.length,
      repaired,
      skipped,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    });

  } catch (error: any) {
    console.error('Repair favicons error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to repair favicons' },
      { status: 500 }
    );
  }
}
