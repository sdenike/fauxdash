import sharp from 'sharp';
import { join, resolve, sep } from 'path';
import { mkdirSync } from 'fs';
import { parseICO } from 'icojs';

// ── Security constants ─────────────────────────────────────────────────────

/** Maximum response body size accepted when fetching a favicon (2 MB). */
const MAX_FAVICON_BYTES = 2 * 1024 * 1024;

/** SVG patterns that indicate unsafe content (scripts, external entities, remote fetches). */
const DANGEROUS_SVG_PATTERNS = ['<script', '<!entity', '<foreignobject', 'xlink:href=', 'javascript:'];

/** Hostnames / prefixes that must never be fetched (SSRF protection). */
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,                              // loopback
  /^10\./,                               // RFC-1918
  /^172\.(1[6-9]|2[0-9]|3[01])\./,      // RFC-1918
  /^192\.168\./,                         // RFC-1918
  /^169\.254\./,                         // link-local
  /^::1$/,                               // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,                   // IPv6 unique-local
  /^fe80:/i,                             // IPv6 link-local
  /^\[/,                                 // any bracketed IPv6 literal
  /^0\./,                                // 0.x.x.x
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // 100.64/10 carrier-grade NAT
  /^224\./,                              // multicast
  /^240\./,                              // reserved
];

/** Returns true if the hostname resolves to a blocked (internal) address. */
function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some(p => p.test(hostname));
}

/**
 * Validates a pre-parsed URL is safe to fetch (no SSRF risk).
 * Returns an error string if blocked, undefined if safe.
 */
function validateFetchUrl(urlObj: URL): string | undefined {
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return `Scheme not allowed: ${urlObj.protocol}`;
  }
  if (isBlockedHostname(urlObj.hostname)) {
    return `Host not allowed: ${urlObj.hostname}`;
  }
  return undefined;
}

/**
 * Streams a fetch response body with a hard size cap.
 * Returns null if the body is missing, too large, or the Content-Length
 * header already indicates it would exceed maxBytes.
 */
async function fetchWithSizeLimit(response: Response, maxBytes: number): Promise<Buffer | null> {
  const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
  if (contentLength > maxBytes) return null;
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  // Uint8Array chunks are passed directly — no intermediate Buffer.from() copy needed
  return Buffer.concat(chunks);
}

// ──────────────────────────────────────────────────────────────────────────

export interface FaviconResult {
  success: boolean;
  path?: string;
  filename?: string;
  domain?: string;
  error?: string;
}

let _faviconDir: string | null = null;

/**
 * Returns the favicon directory path, creating it on first call.
 * Memoized — the existsSync check is skipped after the first call.
 */
export function getFaviconDir(): string {
  if (!_faviconDir) {
    _faviconDir = join(process.cwd(), 'public', 'favicons');
    mkdirSync(_faviconDir, { recursive: true });
  }
  return _faviconDir;
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
    const domain = urlObj.hostname.replace(/^www\./, '');  // anchored: only strip leading www.
    const faviconDir = getFaviconDir();

    // SSRF protection — validate using the already-parsed urlObj (no redundant re-parse)
    const ssrfError = validateFetchUrl(urlObj);
    if (ssrfError) return { success: false, error: ssrfError };

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
        const safeLogUrl = faviconUrl.replace(/[\r\n]/g, ' ');
        console.log(`Trying favicon source: ${safeLogUrl}`);

        const response = await fetch(faviconUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          console.log(`HTTP ${response.status} from ${safeLogUrl}`);
          lastError = `HTTP ${response.status}`;
          continue;
        }

        // Stream body with a 2 MB cap — no full buffer in memory before check
        const buffer = await fetchWithSizeLimit(response, MAX_FAVICON_BYTES);
        if (!buffer) {
          console.log(`Response too large or empty from ${safeLogUrl}`);
          lastError = 'Response too large or empty';
          continue;
        }
        console.log(`Fetched ${buffer.length} bytes from ${safeLogUrl}`);

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
          console.log(`Successfully fetched from: ${safeLogUrl}`);
          break;
        } else {
          lastError = result.error || 'Conversion failed';
        }
      } catch (fetchError: any) {
        console.log(`Fetch error from ${safeLogUrl}: ${fetchError.message}`);
        lastError = fetchError.message || 'Fetch failed';
        continue;
      }
    }

    if (!pngBuffer) {
      return { success: false, error: lastError };
    }

    // Generate filenames and save
    const timestamp = Date.now();
    // Strict allowlist: only alphanum/hyphen in filename; capped at 64 chars
    const safeDomain = domain.replace(/[^a-zA-Z0-9\-]/g, '_').slice(0, 64);
    const baseFilename = `${safeDomain}_${timestamp}`;
    const originalFilename = `${baseFilename}_original.png`;
    const activeFilename = `${baseFilename}.png`;
    const originalPath = join(faviconDir, originalFilename);
    const activePath = join(faviconDir, activeFilename);

    // Path boundary assertion — ensure constructed paths stay inside faviconDir
    const boundary = faviconDir + sep;
    if (!resolve(originalPath).startsWith(boundary) || !resolve(activePath).startsWith(boundary)) {
      return { success: false, error: 'Invalid file path' };
    }

    // Write both copies in parallel
    await Promise.all([
      sharp(pngBuffer).toFile(originalPath),
      sharp(pngBuffer).toFile(activePath),
    ]);

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
 * Convert an ICO buffer to PNG using a multi-method fallback chain:
 * 1. Sharp native (best-page selection for multi-image ICOs)
 * 2. icojs parser
 * 3. Embedded PNG scan (some ICOs embed a raw PNG frame)
 */
async function icoToPng(buffer: Buffer): Promise<Buffer | null> {
  // Method 1: Sharp native ICO support
  try {
    const metadata = await sharp(buffer).metadata();
    let pngBuffer: Buffer;

    if (metadata.pages && metadata.pages > 1) {
      // Cap page count to prevent DoS on malformed ICOs advertising many pages
      const pageCount = Math.min(metadata.pages, 16);
      // Fetch all page metadata in parallel for speed
      const pageSizes = await Promise.all(
        Array.from({ length: pageCount }, (_, page) =>
          sharp(buffer, { page }).metadata().catch(() => null)
        )
      );
      let bestPage = 0;
      let bestSize = 0;
      for (let page = 0; page < pageSizes.length; page++) {
        const meta = pageSizes[page];
        const size = meta ? (meta.width || 0) * (meta.height || 0) : 0;
        if (size > bestSize) { bestSize = size; bestPage = page; }
      }
      console.log(`Using ICO page ${bestPage} with size ${bestSize}`);
      pngBuffer = await sharp(buffer, { page: bestPage })
        .png()
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } else {
      pngBuffer = await sharp(buffer)
        .png()
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
    return pngBuffer;
  } catch (e: any) {
    console.warn('Sharp ICO processing failed, trying icojs:', e.message);
  }

  // Method 2: icojs fallback
  try {
    const images = await parseICO(buffer);
    if (images && images.length > 0) {
      let bestImage = images[0];
      for (const img of images) {
        if (img.width > bestImage.width) bestImage = img;
      }
      console.log(`icojs found ${images.length} images, using ${bestImage.width}x${bestImage.height}`);
      return await sharp(Buffer.from(bestImage.buffer))
        .png()
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
  } catch (e: any) {
    console.warn('icojs fallback failed:', e.message);
  }

  // Method 3: Scan for an embedded PNG frame within the ICO
  try {
    const pngOffset = buffer.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (pngOffset !== -1) {
      console.log(`Found embedded PNG at offset ${pngOffset}`);
      return await sharp(buffer.subarray(pngOffset))
        .png()
        .resize(128, 128, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
  } catch (e: any) {
    console.warn('Embedded PNG extraction failed:', e.message);
  }

  return null;
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
      // Reject SVGs with script, external entities, or remote-fetch vectors.
      // Scan up to 32 KB — the 500-byte preview is too short for these patterns.
      const svgContent = buffer.toString('utf8', 0, Math.min(buffer.length, 32768)).toLowerCase();
      if (DANGEROUS_SVG_PATTERNS.some(p => svgContent.includes(p))) {
        return { success: false, error: 'SVG contains unsafe content' };
      }

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
      const result = await icoToPng(buffer);
      if (result) return { success: true, buffer: result };
      return { success: false, error: 'ICO processing failed after all methods' };
    }

    // Standard image processing for PNG, JPEG, GIF, WebP, BMP
    try {
      // Reuse the bufferStr slice already computed above for SVG detection
      if (bufferStr.includes('<!DOCTYPE') ||
          bufferStr.includes('<html') ||
          (bufferStr.includes('<?xml') && !bufferStr.includes('svg'))) {
        console.log('Buffer contains HTML/XML, not a valid image');
        return { success: false, error: 'Response is HTML/XML, not an image' };
      }

      let sharpInstance = sharp(buffer);

      // Get metadata to check if we can process it
      const metadata = await sharpInstance.metadata();
      console.log('Image metadata:', metadata);

      if (!metadata || !metadata.format) {
        return { success: false, error: 'Unable to read image metadata' };
      }

      // Check for supported formats
      const supportedFormats = ['png', 'jpeg', 'jpg', 'webp', 'gif', 'tiff', 'raw', 'heif', 'avif'];
      if (metadata.format === 'ico') {
        // ICO not caught by magic bytes — delegate to the full fallback chain
        const result = await icoToPng(buffer);
        if (result) return { success: true, buffer: result };
        return { success: false, error: 'ICO processing failed after all methods' };
      }
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
