import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, itemId, isDirectFaviconUrl } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Extract domain from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');

    // If this is a direct favicon URL, use it directly
    const faviconUrls = isDirectFaviconUrl ? [url] : [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, // Google returns PNG
      `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ];

    let faviconData: ArrayBuffer | null = null;
    let contentType = 'image/x-icon';

    // Try each URL until one works
    for (const faviconUrl of faviconUrls) {
      try {
        const response = await fetch(faviconUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FauxDash/1.0)',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          faviconData = await response.arrayBuffer();
          contentType = response.headers.get('content-type') || 'image/x-icon';
          break;
        }
      } catch (err) {
        // Try next URL
        continue;
      }
    }

    if (!faviconData) {
      return NextResponse.json({
        error: 'No favicon found for this site. Please use the icon selector to choose an icon manually.',
        noFavicon: true
      }, { status: 404 });
    }

    // Create favicons directory if it doesn't exist
    const publicDir = join(process.cwd(), 'public', 'favicons');
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    // Determine file extension from content type
    let ext = 'png'; // Default to png
    if (contentType.includes('x-icon')) ext = 'ico';
    else if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('jpg') || contentType.includes('jpeg')) ext = 'jpg';
    else if (contentType.includes('svg')) ext = 'svg';
    else if (contentType.includes('gif')) ext = 'gif';
    else if (contentType.includes('webp')) ext = 'webp';

    // Generate filename
    const filename = `${domain.replace(/\./g, '_')}_${Date.now()}.${ext}`;
    const filepath = join(publicDir, filename);

    // Generate filename
    const pngFilename = filename.replace(`.${ext}`, '.png');
    const pngPath = join(publicDir, pngFilename);

    // Always convert to PNG for better compatibility
    try {
      const buffer = Buffer.from(faviconData);

      // For ICO files, extract the largest image or try to convert directly
      let sharpInstance = sharp(buffer);

      // Get metadata to check if we can process it
      try {
        const metadata = await sharpInstance.metadata();

        // If it's an ICO file with pages, extract the first/largest page
        if (metadata.pages && metadata.pages > 1) {
          // For multi-page ICO files, sharp will use the first page by default
          sharpInstance = sharp(buffer, { page: 0 });
        }
      } catch (metadataError) {
        console.warn('Could not read metadata, proceeding with conversion:', metadataError);
      }

      // Convert to PNG
      await sharpInstance
        .png()
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .toFile(pngPath);

      return NextResponse.json({
        success: true,
        path: `/api/favicons/serve/${pngFilename}`,
        filename: `/api/favicons/serve/${pngFilename}`,
        domain,
      });
    } catch (convertError: any) {
      console.error('PNG conversion failed:', convertError);
      console.error('Error details:', convertError.message);

      // Return a more helpful error with the actual error message
      return NextResponse.json({
        error: `Unable to process the favicon image: ${convertError.message}. Please try a different image format (PNG, JPG) or use the icon selector.`,
        conversionFailed: true,
        details: convertError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error fetching favicon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch favicon' },
      { status: 500 }
    );
  }
}
