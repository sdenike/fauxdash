import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { iconType, iconId, iconName } = await request.json();

  if (!iconType || !iconId) {
    return NextResponse.json({ error: 'Icon type and ID are required' }, { status: 400 });
  }

  try {
    // Create favicons directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public', 'favicons');
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    const timestamp = Date.now();
    let pngBuffer: Buffer;
    let baseFilename: string;

    if (iconType === 'selfhst') {
      // Download selfh.st icon from CDN
      const cdnUrl = `https://cdn.jsdelivr.net/gh/selfhst/icons@latest/png/${iconId}.png`;

      const response = await fetch(cdnUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return NextResponse.json({
          error: `Failed to fetch selfh.st icon: ${response.statusText}`
        }, { status: 500 });
      }

      const data = await response.arrayBuffer();
      const buffer = Buffer.from(data);

      // Convert/resize to PNG
      pngBuffer = await sharp(buffer)
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();

      baseFilename = `selfhst_${iconId.replace(/[^a-zA-Z0-9-]/g, '_')}_${timestamp}`;

    } else if (iconType === 'heroicon') {
      // Fetch HeroIcon SVG from unpkg.com
      // Convert icon name to filename format (e.g., "Home" -> "home", "ArrowUp" -> "arrow-up")
      const svgFilename = iconName
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/-icon$/, '');

      const svgUrl = `https://unpkg.com/@heroicons/react@2.1.1/24/outline/esm/${svgFilename}.js`;

      // Try fetching the ESM module to extract SVG path
      let svgContent: string | null = null;

      // Alternative: fetch raw SVG from heroicons.com
      const rawSvgUrl = `https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/outline/${svgFilename}.svg`;

      const svgResponse = await fetch(rawSvgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!svgResponse.ok) {
        return NextResponse.json({
          error: `Failed to fetch HeroIcon SVG: ${svgResponse.statusText}. Icon name: ${svgFilename}`
        }, { status: 500 });
      }

      svgContent = await svgResponse.text();

      // Convert SVG to PNG using sharp
      // Add a viewBox if not present and ensure proper sizing
      if (!svgContent.includes('viewBox')) {
        svgContent = svgContent.replace('<svg', '<svg viewBox="0 0 24 24"');
      }

      // Ensure width and height are set for sharp
      svgContent = svgContent
        .replace(/width="[^"]*"/, 'width="128"')
        .replace(/height="[^"]*"/, 'height="128"');

      if (!svgContent.includes('width=')) {
        svgContent = svgContent.replace('<svg', '<svg width="128" height="128"');
      }

      // Set stroke color to black for better conversion
      svgContent = svgContent.replace(/stroke="currentColor"/g, 'stroke="#000000"');

      const svgBuffer = Buffer.from(svgContent);

      pngBuffer = await sharp(svgBuffer, { density: 300 })
        .resize(128, 128, { fit: 'inside', withoutEnlargement: false })
        .png()
        .toBuffer();

      baseFilename = `heroicon_${svgFilename.replace(/-/g, '_')}_${timestamp}`;

    } else {
      return NextResponse.json({ error: 'Invalid icon type' }, { status: 400 });
    }

    // Save both original and active copies
    const originalFilename = `${baseFilename}_original.png`;
    const activeFilename = `${baseFilename}.png`;
    const originalPath = join(publicDir, originalFilename);
    const activePath = join(publicDir, activeFilename);

    await sharp(pngBuffer).toFile(originalPath);
    await sharp(pngBuffer).toFile(activePath);

    return NextResponse.json({
      success: true,
      path: `/api/favicons/serve/${activeFilename}`,
      filename: activeFilename,
      iconType,
      iconId,
    });

  } catch (error: any) {
    console.error('Error saving icon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save icon' },
      { status: 500 }
    );
  }
}
