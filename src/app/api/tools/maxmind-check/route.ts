import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get the configured MaxMind path from settings
 */
async function getConfiguredPath(): Promise<string | null> {
  try {
    const db = getDb();
    const rows = await db.select()
      .from(settings)
      .where(eq(settings.userId, null as any));

    const settingsMap = new Map<string, string | null>(
      rows.map((r: { key: string; value: string | null }) => [r.key, r.value] as [string, string | null])
    );

    return settingsMap.get('geoipMaxmindPath') || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user-configured path first
    const configuredPath = await getConfiguredPath();

    // Normalize configured path (handle ./ prefix)
    let normalizedConfigPath: string | null = null;
    if (configuredPath) {
      normalizedConfigPath = configuredPath;
      if (normalizedConfigPath.startsWith('./')) {
        // ./data/file.mmdb -> /data/file.mmdb (just replace ./ with /)
        normalizedConfigPath = normalizedConfigPath.replace('./', '/');
      }
      if (!normalizedConfigPath.startsWith('/')) {
        // Relative path without ./ prefix -> prepend /data/
        normalizedConfigPath = `/data/${normalizedConfigPath}`;
      }
    }

    // Common paths for MaxMind GeoLite2 database (configured path takes priority)
    const possiblePaths = [
      normalizedConfigPath,
      configuredPath,
      process.env.MAXMIND_DB_PATH,
      '/data/GeoLite2-City.mmdb',
      '/app/data/GeoLite2-City.mmdb',
      join(process.cwd(), 'data', 'GeoLite2-City.mmdb'),
      '/usr/share/GeoIP/GeoLite2-City.mmdb',
      '/var/lib/GeoIP/GeoLite2-City.mmdb',
    ].filter(Boolean) as string[];

    let foundPath: string | null = null;
    let fileStats: any = null;

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        foundPath = path;
        try {
          fileStats = statSync(path);
        } catch (e) {
          // Ignore
        }
        break;
      }
    }

    if (!foundPath) {
      return NextResponse.json({
        success: false,
        installed: false,
        message: 'MaxMind GeoLite2-City database not found',
        searchedPaths: possiblePaths,
        updateCommand: 'Download from https://dev.maxmind.com/geoip/geolite2-free-geolocation-data and place in /data/GeoLite2-City.mmdb',
      });
    }

    // Get file modification date as "version"
    const modDate = fileStats ? new Date(fileStats.mtime).toISOString().split('T')[0] : 'Unknown';
    const fileSize = fileStats ? `${(fileStats.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown';

    // MaxMind updates GeoLite2 databases weekly on Tuesdays
    const now = new Date();
    const lastTuesday = new Date(now);
    const dayOfWeek = now.getDay();
    const daysSinceTuesday = (dayOfWeek + 5) % 7 + 1; // Days since last Tuesday
    lastTuesday.setDate(now.getDate() - daysSinceTuesday);

    const dbDate = fileStats ? new Date(fileStats.mtime) : new Date(0);
    const isOutdated = dbDate < lastTuesday;

    return NextResponse.json({
      success: true,
      installed: true,
      message: isOutdated
        ? 'MaxMind database may be outdated (updated weekly on Tuesdays)'
        : 'MaxMind database is installed and recent',
      path: foundPath,
      installedDate: modDate,
      fileSize,
      isOutdated,
      updateCommand: isOutdated
        ? 'Download latest from https://dev.maxmind.com/geoip/geolite2-free-geolocation-data or use geoipupdate tool'
        : undefined,
    });
  } catch (error: any) {
    console.error('MaxMind check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check MaxMind status' },
      { status: 500 }
    );
  }
}
