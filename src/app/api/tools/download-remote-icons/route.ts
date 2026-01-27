import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const faviconDir = join(process.cwd(), 'public', 'favicons');

    // Ensure favicon directory exists
    if (!existsSync(faviconDir)) {
      mkdirSync(faviconDir, { recursive: true });
    }

    // Get all bookmarks and services
    const allBookmarks = await db.select().from(bookmarks);
    const allServices = await db.select().from(services);

    // Find items with remote icons (selfhst: or heroicon component names)
    const remoteItems: Array<{
      id: number;
      type: 'bookmark' | 'service';
      name: string;
      icon: string;
    }> = [];

    for (const bookmark of allBookmarks) {
      if (bookmark.icon) {
        // selfhst: icons
        if (bookmark.icon.startsWith('selfhst:')) {
          remoteItems.push({ id: bookmark.id, type: 'bookmark', name: bookmark.name, icon: bookmark.icon });
        }
        // HeroIcon component names (not favicon: or selfhst:)
        else if (!bookmark.icon.startsWith('favicon:') && !bookmark.icon.includes('/') && !bookmark.icon.includes('.')) {
          remoteItems.push({ id: bookmark.id, type: 'bookmark', name: bookmark.name, icon: bookmark.icon });
        }
      }
    }

    for (const service of allServices) {
      if (service.icon) {
        // selfhst: icons
        if (service.icon.startsWith('selfhst:')) {
          remoteItems.push({ id: service.id, type: 'service', name: service.name, icon: service.icon });
        }
        // HeroIcon component names (not favicon: or selfhst:)
        else if (!service.icon.startsWith('favicon:') && !service.icon.includes('/') && !service.icon.includes('.')) {
          remoteItems.push({ id: service.id, type: 'service', name: service.name, icon: service.icon });
        }
      }
    }

    let downloaded = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];
    const timestamp = Date.now();

    for (const item of remoteItems) {
      try {
        let pngBuffer: Buffer | null = null;
        let baseFilename: string;

        if (item.icon.startsWith('selfhst:')) {
          // Download selfh.st icon from CDN
          const iconId = item.icon.replace('selfhst:', '');
          const cdnUrl = `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${iconId}.png`;

          const response = await fetch(cdnUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)' },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) {
            errors.push(`${item.name}: Failed to fetch selfh.st icon ${iconId} - ${response.statusText}`);
            failed++;
            continue;
          }

          const data = await response.arrayBuffer();
          pngBuffer = await sharp(Buffer.from(data))
            .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
            .png()
            .toBuffer();

          baseFilename = `selfhst_${iconId.replace(/[^a-zA-Z0-9-]/g, '_')}_${timestamp}`;

        } else {
          // Try to download HeroIcon from GitHub
          const svgFilename = item.icon
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '')
            .replace(/-icon$/, '');

          const rawSvgUrl = `https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/outline/${svgFilename}.svg`;

          const svgResponse = await fetch(rawSvgUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)' },
            signal: AbortSignal.timeout(10000),
          });

          if (!svgResponse.ok) {
            // HeroIcons that can't be downloaded are OK - they still render as components
            skipped++;
            continue;
          }

          let svgContent = await svgResponse.text();

          // Prepare SVG for conversion
          if (!svgContent.includes('viewBox')) {
            svgContent = svgContent.replace('<svg', '<svg viewBox="0 0 24 24"');
          }
          svgContent = svgContent
            .replace(/width="[^"]*"/, 'width="128"')
            .replace(/height="[^"]*"/, 'height="128"');
          if (!svgContent.includes('width=')) {
            svgContent = svgContent.replace('<svg', '<svg width="128" height="128"');
          }
          svgContent = svgContent.replace(/stroke="currentColor"/g, 'stroke="#000000"');

          pngBuffer = await sharp(Buffer.from(svgContent), { density: 300 })
            .resize(128, 128, { fit: 'inside', withoutEnlargement: false })
            .png()
            .toBuffer();

          baseFilename = `heroicon_${svgFilename.replace(/-/g, '_')}_${timestamp}`;
        }

        if (!pngBuffer) {
          errors.push(`${item.name}: Failed to convert icon to PNG`);
          failed++;
          continue;
        }

        // Save both original and active copies
        const originalFilename = `${baseFilename}_original.png`;
        const activeFilename = `${baseFilename}.png`;
        const originalPath = join(faviconDir, originalFilename);
        const activePath = join(faviconDir, activeFilename);

        await sharp(pngBuffer).toFile(originalPath);
        await sharp(pngBuffer).toFile(activePath);

        // Update database with new local path
        const newIconPath = `favicon:/api/favicons/serve/${activeFilename}`;

        if (item.type === 'bookmark') {
          await db.update(bookmarks)
            .set({ icon: newIconPath })
            .where(eq(bookmarks.id, item.id));
        } else {
          await db.update(services)
            .set({ icon: newIconPath })
            .where(eq(services.id, item.id));
        }

        downloaded++;

      } catch (e: any) {
        errors.push(`${item.name}: ${e.message}`);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Found ${remoteItems.length} remote icons. Downloaded ${downloaded}, skipped ${skipped}, failed ${failed}.`,
      total: remoteItems.length,
      downloaded,
      skipped,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    });

  } catch (error: any) {
    console.error('Download remote icons error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download remote icons' },
      { status: 500 }
    );
  }
}
