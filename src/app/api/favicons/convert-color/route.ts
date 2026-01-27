import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import sharp from 'sharp';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { fetchAndSaveFavicon, getFaviconDir, validateFaviconFile } from '@/lib/favicon-utils';
import { logFavicon } from '@/lib/logger';

// Helper to find the original file for a given favicon
async function findOriginalFile(filename: string, faviconDir: string): Promise<string | null> {
  const baseName = filename
    .replace(/_themed_[^.]+\.png$/, '')
    .replace(/_grayscale_black\.png$/, '')
    .replace(/_grayscale_white\.png$/, '')
    .replace(/_grayscale$/, '')
    .replace(/_inverted\.png$/, '')
    .replace(/\.png$/, '');

  const originalPath = join(faviconDir, `${baseName}_original.png`);
  if (existsSync(originalPath)) {
    return originalPath;
  }

  try {
    const files = readdirSync(faviconDir);
    const match = baseName.match(/^(.+?)_(\d+)/);
    if (match) {
      const [, domain, timestamp] = match;
      const originalFile = files.find(f => f.startsWith(`${domain}_${timestamp}`) && f.includes('_original.png'));
      if (originalFile) {
        return join(faviconDir, originalFile);
      }
    }
  } catch (e) {
    // Ignore errors
  }

  const basePath = join(faviconDir, `${baseName}.png`);
  if (existsSync(basePath)) {
    return basePath;
  }

  const exactPath = join(faviconDir, filename);
  if (existsSync(exactPath)) {
    return exactPath;
  }

  return null;
}

// Helper to find the URL for a favicon from the database
async function findUrlForFavicon(faviconPath: string): Promise<string | null> {
  try {
    const db = getDb();
    const allBookmarks = await db.select().from(bookmarks);
    const allServices = await db.select().from(services);

    for (const bookmark of allBookmarks) {
      if (bookmark.icon?.includes(faviconPath.replace('/app/public/favicons/', '').replace('.png', ''))) {
        return bookmark.url;
      }
    }

    for (const service of allServices) {
      if (service.icon?.includes(faviconPath.replace('/app/public/favicons/', '').replace('.png', ''))) {
        return service.url;
      }
    }
  } catch (e) {
    logFavicon('error', 'Error finding URL for favicon', { error: e });
  }
  return null;
}

// Helper to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper to get theme color hex
function getThemeColorHex(themeColor: string): string {
  const themeColors: Record<string, string> = {
    'Slate': '#64748b',
    'Gray': '#6b7280',
    'Zinc': '#71717a',
    'Neutral': '#737373',
    'Stone': '#78716c',
    'Red': '#ef4444',
    'Orange': '#f97316',
    'Amber': '#f59e0b',
    'Yellow': '#eab308',
    'Lime': '#84cc16',
    'Green': '#22c55e',
    'Emerald': '#10b981',
    'Teal': '#14b8a6',
    'Cyan': '#06b6d4',
    'Sky': '#0ea5e9',
    'Blue': '#3b82f6',
    'Indigo': '#6366f1',
    'Violet': '#8b5cf6',
    'Purple': '#a855f7',
    'Fuchsia': '#d946ef',
    'Pink': '#ec4899',
    'Rose': '#f43f5e',
  };

  return themeColors[themeColor] || '#64748b';
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { favicon, color, itemUrl } = await request.json();

  if (!favicon || !favicon.startsWith('favicon:')) {
    return NextResponse.json({ error: 'Invalid favicon path' }, { status: 400 });
  }

  if (!color) {
    return NextResponse.json({ error: 'Color is required' }, { status: 400 });
  }

  try {
    let filename = favicon.replace('favicon:', '');
    if (filename.startsWith('/api/favicons/serve/')) {
      filename = filename.replace('/api/favicons/serve/', '');
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const faviconDir = getFaviconDir();

    // Find the source file
    let sourcePath = await findOriginalFile(filename, faviconDir);

    if (!sourcePath) {
      logFavicon('warn', `Favicon file not found: ${filename}`);
      return NextResponse.json({ error: 'Favicon file not found' }, { status: 404 });
    }

    // Validate the source file - if invalid, try to re-fetch
    const validation = await validateFaviconFile(sourcePath);
    if (!validation.valid) {
      logFavicon('warn', `Invalid favicon file: ${sourcePath}`, { error: validation.error });

      const url = itemUrl || await findUrlForFavicon(sourcePath);
      if (url) {
        logFavicon('info', `Re-fetching favicon from: ${url}`);
        const result = await fetchAndSaveFavicon(url);

        if (result.success && result.path) {
          const newFilename = result.path.replace('/api/favicons/serve/', '');
          sourcePath = join(faviconDir, newFilename.replace('.png', '_original.png'));

          if (!existsSync(sourcePath)) {
            sourcePath = join(faviconDir, newFilename);
          }

          const newValidation = await validateFaviconFile(sourcePath);
          if (!newValidation.valid) {
            return NextResponse.json(
              { error: `Re-fetched favicon is still invalid: ${newValidation.error}` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: `Could not re-fetch favicon: ${result.error}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Invalid image format and no URL available to re-fetch` },
          { status: 400 }
        );
      }
    }

    // Get the base name for output files
    const baseName = filename
      .replace(/_themed_[^.]+\.png$/, '')
      .replace(/_monotone_black\.png$/, '')
      .replace(/_monotone_white\.png$/, '')
      .replace(/_monotone$/, '')
      .replace(/_inverted\.png$/, '')
      .replace(/\.png$/, '');

    // Get target color - try hex first, then look up theme color name
    let rgb = hexToRgb(color);

    if (!rgb) {
      const hexColor = getThemeColorHex(color);
      rgb = hexToRgb(hexColor);
    }

    if (!rgb) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    }

    const colorHash = color.replace('#', '');
    const newFilename = `${baseName}_themed_${colorHash}.png`;
    const newFullPath = join(faviconDir, newFilename);

    // Check if converted file already exists and is valid
    if (existsSync(newFullPath)) {
      const existingValid = await validateFaviconFile(newFullPath);
      if (existingValid.valid) {
        logFavicon('debug', `Using cached themed favicon: ${newFilename}`);
        return NextResponse.json({
          success: true,
          filename: `/api/favicons/serve/${newFilename}`,
          message: 'Using cached themed favicon',
        });
      }
    }

    logFavicon('info', `Converting favicon to theme color: ${filename}`, { color });

    // Convert the image to theme color
    try {
      await sharp(sourcePath)
        .png()
        .greyscale()
        .tint({ r: rgb.r, g: rgb.g, b: rgb.b })
        .toFile(newFullPath);

      logFavicon('info', `Successfully converted to theme color: ${baseName}`, { color });
      return NextResponse.json({
        success: true,
        filename: `/api/favicons/serve/${newFilename}`,
        message: 'Successfully converted favicon to theme color',
      });
    } catch (conversionError: any) {
      logFavicon('error', 'Favicon color conversion error', { error: conversionError.message });

      // Try to re-fetch and retry
      const url = itemUrl || await findUrlForFavicon(sourcePath);
      if (url) {
        logFavicon('info', `Conversion failed, re-fetching favicon from: ${url}`);
        const result = await fetchAndSaveFavicon(url);

        if (result.success && result.path) {
          const newSourceFilename = result.path.replace('/api/favicons/serve/', '');
          const newSourcePath = join(faviconDir, newSourceFilename.replace('.png', '_original.png'));
          const actualSourcePath = existsSync(newSourcePath) ? newSourcePath : join(faviconDir, newSourceFilename);

          try {
            await sharp(actualSourcePath)
              .png()
              .greyscale()
              .tint({ r: rgb.r, g: rgb.g, b: rgb.b })
              .toFile(newFullPath);

            logFavicon('info', `Re-fetched and converted to theme color: ${baseName}`, { color });
            return NextResponse.json({
              success: true,
              filename: `/api/favicons/serve/${newFilename}`,
              message: 'Re-fetched and converted favicon to theme color',
            });
          } catch (retryError: any) {
            logFavicon('error', 'Retry conversion also failed', { error: retryError.message });
          }
        }
      }

      logFavicon('error', `Unable to convert favicon: ${conversionError.message}`);
      return NextResponse.json(
        { error: `Unable to convert favicon: ${conversionError.message}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logFavicon('error', 'Error converting favicon color', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to convert color' },
      { status: 500 }
    );
  }
}
