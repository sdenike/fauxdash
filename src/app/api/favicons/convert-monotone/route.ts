import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { favicon } = await request.json();

  if (!favicon || !favicon.startsWith('favicon:')) {
    return NextResponse.json({ error: 'Invalid favicon path' }, { status: 400 });
  }

  try {
    // Extract just the filename
    let filename = favicon.replace('favicon:', '');
    // Strip the /api/favicons/serve/ prefix if present
    if (filename.startsWith('/api/favicons/serve/')) {
      filename = filename.replace('/api/favicons/serve/', '');
    }

    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const fullPath = join(process.cwd(), 'public', 'favicons', filename);

    // Check if source file exists
    if (!existsSync(fullPath)) {
      console.error(`Favicon file not found: ${fullPath}`);
      return NextResponse.json(
        { error: `Favicon file not found: ${filename}` },
        { status: 404 }
      );
    }

    // Check if file is SVG (not supported by Sharp for conversion)
    if (filename.toLowerCase().endsWith('.svg')) {
      console.error(`SVG files cannot be converted to monotone: ${filename}`);
      return NextResponse.json(
        { error: 'SVG files are not supported for monotone conversion. Please use PNG or JPG favicons.' },
        { status: 400 }
      );
    }

    // Generate new filenames with _monotone_black and _monotone_white suffixes
    const nameParts = filename.split('.');
    const ext = nameParts.pop();
    const baseName = nameParts.join('.');

    const blackFilename = `${baseName}_monotone_black.png`;
    const whiteFilename = `${baseName}_monotone_white.png`;

    const blackFullPath = join(process.cwd(), 'public', 'favicons', blackFilename);
    const whiteFullPath = join(process.cwd(), 'public', 'favicons', whiteFilename);

    // Check if converted files already exist - if so, return them without regenerating
    if (existsSync(blackFullPath) && existsSync(whiteFullPath)) {
      return NextResponse.json({
        success: true,
        filename: `/api/favicons/serve/${baseName}_monotone`,
        message: 'Using cached monotone versions',
      });
    }

    console.log(`Converting favicon to monotone: ${filename} -> ${fullPath}`);

    // Check if file is .ico and needs special handling
    const isIco = fullPath.endsWith('.ico');

    if (isIco) {
      // For .ico files, extract as PNG first
      const tempPngPath = fullPath.replace('.ico', '_temp.png');
      try {
        await sharp(fullPath)
          .png()
          .toFile(tempPngPath);

        // Create black version
        await sharp(tempPngPath)
          .greyscale()
          .tint({ r: 0, g: 0, b: 0 })
          .toFile(blackFullPath);

        // Create white version
        await sharp(tempPngPath)
          .greyscale()
          .negate()
          .toFile(whiteFullPath);

        // Clean up temp file
        await writeFile(tempPngPath, Buffer.from([])).catch(() => {});
      } catch (icoError) {
        return NextResponse.json(
          { error: 'Unable to process .ico file. Please fetch the favicon again.' },
          { status: 400 }
        );
      }
    } else {
      // For other formats, convert directly
      await sharp(fullPath)
        .png()
        .greyscale()
        .tint({ r: 0, g: 0, b: 0 })
        .toFile(blackFullPath);

      await sharp(fullPath)
        .png()
        .greyscale()
        .negate()
        .toFile(whiteFullPath);
    }

    // Return the base filename (without the _black or _white suffix)
    // Frontend will determine which to use based on theme
    return NextResponse.json({
      success: true,
      filename: `/api/favicons/serve/${baseName}_monotone`,
      message: 'Successfully created monotone black and white versions',
    });
  } catch (error: any) {
    console.error('Error converting to monotone:', error);

    // Provide more specific error messages
    let errorMessage = error.message || 'Failed to convert to monotone';
    if (error.message?.includes('unsupported')) {
      errorMessage = 'This favicon format is not supported for monotone conversion. Try fetching the favicon again to get a compatible format.';
    } else if (error.message?.includes('Input file')) {
      errorMessage = `Unable to read favicon file. ${error.message}`;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
