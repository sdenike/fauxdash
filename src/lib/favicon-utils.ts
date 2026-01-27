import sharp from 'sharp';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { parseICO } from 'icojs';

export interface FaviconResult {
  success: boolean;
  path?: string;
  filename?: string;
  domain?: string;
  error?: string;
}

/**
 * Get the favicon directory path, creating it if it doesn't exist
 */
export function getFaviconDir(): string {
  const faviconDir = join(process.cwd(), 'public', 'favicons');
  if (!existsSync(faviconDir)) {
    mkdirSync(faviconDir, { recursive: true });
  }
  return faviconDir;
}

/**
 * Try to fetch a favicon from multiple sources and convert to PNG
 */
export async function fetchAndSaveFavicon(
  url: string,
  options?: {
    isDirectFaviconUrl?: boolean;
    timeout?: number;
  }
): Promise<FaviconResult> {
  const { isDirectFaviconUrl = false, timeout = 10000 } = options || {};

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const faviconDir = getFaviconDir();

    // Build list of URLs to try
    const faviconUrls = isDirectFaviconUrl
      ? [url]
      : [
          // 1. Google's favicon service (most reliable, always returns PNG)
          `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          // 2. Icon Horse service (good fallback, returns PNG)
          `https://icon.horse/icon/${domain}`,
          // 3. Favicon.io service
          `https://favicons.githubusercontent.com/${domain}`,
          // 4. Direct favicon.ico from the site
          `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
          // 5. DuckDuckGo's icon service
          `https://icons.duckduckgo.com/ip3/${domain}.ico`,
          // 6. Try with www if not present, or without if present
          urlObj.hostname.startsWith('www.')
            ? `${urlObj.protocol}//${urlObj.hostname.replace('www.', '')}/favicon.ico`
            : `${urlObj.protocol}//www.${urlObj.hostname}/favicon.ico`,
          // 7. Clearbit logo API (returns PNG)
          `https://logo.clearbit.com/${domain}`,
        ];

    let pngBuffer: Buffer | null = null;
    let lastError = 'No favicon found';

    for (const faviconUrl of faviconUrls) {
      try {
        console.log(`Trying favicon source: ${faviconUrl}`);

        const response = await fetch(faviconUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          console.log(`HTTP ${response.status} from ${faviconUrl}`);
          lastError = `HTTP ${response.status} from ${faviconUrl}`;
          continue;
        }

        const data = await response.arrayBuffer();
        const buffer = Buffer.from(data);
        console.log(`Fetched ${buffer.length} bytes from ${faviconUrl}`);

        // Skip empty or tiny responses (likely placeholder)
        if (buffer.length < 100) {
          console.log(`Skipping tiny response (${buffer.length} bytes)`);
          lastError = 'Response too small';
          continue;
        }

        // Try to convert to PNG using Sharp
        const result = await convertToPng(buffer, domain);
        if (result.success && result.buffer) {
          pngBuffer = result.buffer;
          console.log(`Successfully fetched from: ${faviconUrl}`);
          break;
        } else {
          lastError = result.error || 'Conversion failed';
        }
      } catch (fetchError: any) {
        console.log(`Fetch error from ${faviconUrl}: ${fetchError.message}`);
        lastError = fetchError.message || 'Fetch failed';
        continue;
      }
    }

    if (!pngBuffer) {
      return { success: false, error: lastError };
    }

    // Generate filenames and save
    const timestamp = Date.now();
    const baseFilename = `${domain.replace(/\./g, '_')}_${timestamp}`;
    const originalFilename = `${baseFilename}_original.png`;
    const activeFilename = `${baseFilename}.png`;
    const originalPath = join(faviconDir, originalFilename);
    const activePath = join(faviconDir, activeFilename);

    // Save both original and active copies
    await sharp(pngBuffer).toFile(originalPath);
    await sharp(pngBuffer).toFile(activePath);

    return {
      success: true,
      path: `/api/favicons/serve/${activeFilename}`,
      filename: `/api/favicons/serve/${activeFilename}`,
      domain,
    };
  } catch (error: any) {
    console.error('Error in fetchAndSaveFavicon:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Convert an image buffer to PNG, handling various formats
 */
export async function convertToPng(
  buffer: Buffer,
  domain?: string
): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  // Check magic bytes to detect format
  const isIco = buffer[0] === 0x00 && buffer[1] === 0x00 &&
                (buffer[2] === 0x01 || buffer[2] === 0x02) && buffer[3] === 0x00;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 &&
                buffer[2] === 0x4E && buffer[3] === 0x47;
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  const isWebp = buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45 &&
                 buffer[10] === 0x42 && buffer[11] === 0x50;
  const isBmp = buffer[0] === 0x42 && buffer[1] === 0x4D;

  // Check for SVG (text-based)
  const bufferStr = buffer.toString('utf8', 0, Math.min(buffer.length, 500));
  const isSvg = bufferStr.includes('<svg') || (bufferStr.includes('<?xml') && bufferStr.includes('svg'));

  console.log(`Format detection - ICO: ${isIco}, PNG: ${isPng}, JPEG: ${isJpeg}, GIF: ${isGif}, WebP: ${isWebp}, BMP: ${isBmp}, SVG: ${isSvg}`);

  try {
    let pngBuffer: Buffer;

    if (isSvg) {
      // SVG needs special handling - try multiple approaches
      const svgAttempts = [
        // Attempt 1: High density with resize
        async () => {
          return await sharp(buffer, { density: 300 })
            .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        },
        // Attempt 2: Lower density
        async () => {
          return await sharp(buffer, { density: 150 })
            .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        },
        // Attempt 3: Default density with flatten
        async () => {
          return await sharp(buffer)
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .resize(128, 128, { fit: 'contain' })
            .png()
            .toBuffer();
        },
      ];

      for (const attempt of svgAttempts) {
        try {
          pngBuffer = await attempt();
          if (pngBuffer && pngBuffer.length > 100) {
            console.log('SVG conversion successful');
            return { success: true, buffer: pngBuffer };
          }
        } catch (e: any) {
          console.warn('SVG attempt failed:', e.message);
          continue;
        }
      }

      return { success: false, error: 'SVG conversion failed after all attempts' };
    }

    if (isIco) {
      // ICO files need special handling - try Sharp first, then icojs fallback
      try {
        const metadata = await sharp(buffer).metadata();
        console.log('ICO metadata:', metadata);

        if (metadata.pages && metadata.pages > 1) {
          // Find the largest image in the ICO
          let bestPage = 0;
          let bestSize = 0;

          for (let page = 0; page < metadata.pages; page++) {
            try {
              const pageMetadata = await sharp(buffer, { page }).metadata();
              const size = (pageMetadata.width || 0) * (pageMetadata.height || 0);
              if (size > bestSize) {
                bestSize = size;
                bestPage = page;
              }
            } catch (e) {
              // Skip pages that can't be read
            }
          }

          console.log(`Using ICO page ${bestPage} with size ${bestSize}`);
          pngBuffer = await sharp(buffer, { page: bestPage })
            .png()
            .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
        } else {
          // Single page ICO
          pngBuffer = await sharp(buffer)
            .png()
            .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
        }
        return { success: true, buffer: pngBuffer };
      } catch (icoError: any) {
        console.warn('Sharp ICO processing failed, trying icojs fallback:', icoError.message);

        // Sharp failed - try icojs as fallback
        try {
          const images = await parseICO(buffer);
          if (images && images.length > 0) {
            // Find the largest image
            let bestImage = images[0];
            for (const img of images) {
              if (img.width > bestImage.width) {
                bestImage = img;
              }
            }

            console.log(`icojs found ${images.length} images, using ${bestImage.width}x${bestImage.height}`);

            // Convert the ArrayBuffer to Buffer and process with Sharp
            const imageBuffer = Buffer.from(bestImage.buffer);
            pngBuffer = await sharp(imageBuffer)
              .png()
              .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
              .toBuffer();

            return { success: true, buffer: pngBuffer };
          }
        } catch (icojsError: any) {
          console.warn('icojs fallback also failed:', icojsError.message);
        }

        // Third fallback: Try to find embedded PNG data in the ICO
        try {
          // Look for PNG signature within the ICO file
          const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
          let pngStart = -1;
          for (let i = 0; i < buffer.length - 4; i++) {
            if (buffer[i] === 0x89 && buffer[i+1] === 0x50 && buffer[i+2] === 0x4E && buffer[i+3] === 0x47) {
              pngStart = i;
              break;
            }
          }

          if (pngStart !== -1) {
            console.log(`Found embedded PNG at offset ${pngStart}`);
            const embeddedPng = buffer.slice(pngStart);
            pngBuffer = await sharp(embeddedPng)
              .png()
              .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
              .toBuffer();
            return { success: true, buffer: pngBuffer };
          }
        } catch (pngExtractError: any) {
          console.warn('PNG extraction from ICO failed:', pngExtractError.message);
        }

        // Fourth fallback: Try to decode as raw BMP (some ICOs have non-standard BMP headers)
        try {
          // Skip ICO header (6 bytes) and directory entry (16 bytes per image)
          // Try to find BMP data starting after the header
          if (buffer.length > 22) {
            const possibleBmpStart = 22; // Minimal ICO with one image
            const bmpHeader = buffer.slice(possibleBmpStart, possibleBmpStart + 40);

            // Check for BITMAPINFOHEADER (starts with 40 as DWORD)
            if (bmpHeader.readUInt32LE(0) === 40) {
              console.log('Found BITMAPINFOHEADER, attempting BMP decode');
              // This is likely a DIB/BMP, try processing with Sharp anyway
              const dibBuffer = buffer.slice(possibleBmpStart);
              pngBuffer = await sharp(dibBuffer)
                .png()
                .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
                .toBuffer();
              return { success: true, buffer: pngBuffer };
            }
          }
        } catch (bmpError: any) {
          console.warn('BMP extraction from ICO failed:', bmpError.message);
        }

        return { success: false, error: `ICO processing failed: ${icoError.message}` };
      }
    }

    // Standard image processing for PNG, JPEG, GIF, WebP, BMP
    try {
      let sharpInstance = sharp(buffer);

      // Get metadata to check if we can process it
      const metadata = await sharpInstance.metadata();
      console.log('Image metadata:', metadata);

      if (!metadata || !metadata.format) {
        return { success: false, error: 'Unable to read image metadata' };
      }

      // Check for supported formats
      const supportedFormats = ['png', 'jpeg', 'jpg', 'webp', 'gif', 'tiff', 'raw', 'heif', 'avif'];
      if (!supportedFormats.includes(metadata.format)) {
        return { success: false, error: `Unsupported format: ${metadata.format}` };
      }

      // If it has multiple pages/frames, use the first
      if (metadata.pages && metadata.pages > 1) {
        sharpInstance = sharp(buffer, { page: 0 });
      }

      pngBuffer = await sharpInstance
        .png()
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      return { success: true, buffer: pngBuffer };
    } catch (sharpError: any) {
      console.warn('Sharp conversion failed:', sharpError.message);
      return { success: false, error: `Image conversion failed: ${sharpError.message}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown conversion error' };
  }
}

/**
 * Validate that a file can be processed by Sharp - actually tries to process it
 */
export async function validateFaviconFile(filepath: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Don't just check metadata - actually try to process the image
    // This catches files with valid headers but corrupted data
    const buffer = await sharp(filepath)
      .png()
      .toBuffer();

    // If we got here, the file is valid
    if (buffer && buffer.length > 0) {
      return { valid: true };
    }

    return { valid: false, error: 'Empty output buffer' };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Convert a favicon to grayscale
 * Creates two versions: one for light theme (darker) and one for dark theme (lighter)
 */
export async function convertToGrayscale(
  sourcePath: string,
  outputBaseName: string,
  faviconDir: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const blackFilename = `${outputBaseName}_grayscale_black.png`;
    const whiteFilename = `${outputBaseName}_grayscale_white.png`;
    const blackFullPath = join(faviconDir, blackFilename);
    const whiteFullPath = join(faviconDir, whiteFilename);

    // Create dark version (for light theme) - proper grayscale
    await sharp(sourcePath)
      .grayscale()
      .png()
      .toFile(blackFullPath);

    // Create light version (for dark theme) - grayscale then inverted
    await sharp(sourcePath)
      .grayscale()
      .negate({ alpha: false })
      .png()
      .toFile(whiteFullPath);

    return {
      success: true,
      filename: `/api/favicons/serve/${outputBaseName}_grayscale`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
