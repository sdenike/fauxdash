import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

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

  const { favicon, color } = await request.json();

  if (!favicon || !favicon.startsWith('favicon:')) {
    return NextResponse.json({ error: 'Invalid favicon path' }, { status: 400 });
  }

  if (!color) {
    return NextResponse.json({ error: 'Color is required' }, { status: 400 });
  }

  try {
    // Extract just the filename
    let filename = favicon.replace('favicon:', '');
    // Strip the /api/favicons/serve/ prefix if present
    if (filename.startsWith('/api/favicons/serve/')) {
      filename = filename.replace('/api/favicons/serve/', '');
    }
    const fullPath = join(process.cwd(), 'public', 'favicons', filename);

    // Get target color (use hex directly if provided, otherwise look up theme color name)
    const rgb = hexToRgb(color);

    if (!rgb) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    }

    // Generate new filename with _themed suffix
    const nameParts = filename.split('.');
    const ext = nameParts.pop();
    const baseName = nameParts.join('.');
    const colorHash = color.replace('#', '');
    const newFilename = `${baseName}_themed_${colorHash}.png`;
    const newFullPath = join(process.cwd(), 'public', 'favicons', newFilename);

    // Check if converted file already exists - if so, return it without regenerating
    if (existsSync(newFullPath)) {
      return NextResponse.json({
        success: true,
        filename: `/api/favicons/serve/${newFilename}`,
        message: 'Using cached themed favicon',
      });
    }

    // Use Sharp to convert the image
    // Check if file is .ico and needs special handling
    const isIco = fullPath.endsWith('.ico');

    if (isIco) {
      // For .ico files, try to extract as PNG first then apply transformations
      const tempPngPath = fullPath.replace('.ico', '_temp.png');
      try {
        // First try to extract the largest icon from .ico
        await sharp(fullPath)
          .png()
          .toFile(tempPngPath);

        // Then apply color transformation
        await sharp(tempPngPath)
          .greyscale()
          .tint({ r: rgb.r, g: rgb.g, b: rgb.b })
          .toFile(newFullPath);

        // Clean up temp file
        await writeFile(tempPngPath, Buffer.from([])).catch(() => {});
      } catch (icoError) {
        // If .ico handling fails, return error
        return NextResponse.json(
          { error: 'Unable to process .ico file. Please fetch the favicon again.' },
          { status: 400 }
        );
      }
    } else {
      // For other formats, convert directly
      await sharp(fullPath)
        .png() // Ensure PNG output
        .greyscale()
        .tint({ r: rgb.r, g: rgb.g, b: rgb.b })
        .toFile(newFullPath);
    }

    return NextResponse.json({
      success: true,
      filename: `/api/favicons/serve/${newFilename}`,
      message: 'Successfully converted favicon to theme color',
    });
  } catch (error: any) {
    console.error('Error converting favicon color:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert color' },
      { status: 500 }
    );
  }
}
