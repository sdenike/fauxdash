import sharpLib from 'sharp'

/**
 * sharp with a tighter decode ceiling than its 268 MP default, so a hostile
 * upload or remote favicon cannot force a ~1 GB pixel buffer. 40 MP covers
 * ~7000x5700, far beyond any icon, logo or background we accept.
 */
export const MAX_INPUT_PIXELS = 40_000_000

sharpLib.concurrency(2)

export default function sharp(
  input?: Parameters<typeof sharpLib>[0],
  options?: Parameters<typeof sharpLib>[1]
) {
  // Stream form: sharp(options)
  if (input === undefined) {
    return sharpLib({ limitInputPixels: MAX_INPUT_PIXELS, ...options })
  }
  // Object inputs ({ create }, { text }, raw descriptors) don't decode a file, and sharp
  // rejects a second options argument for them, so pass them through untouched.
  const isDecodable =
    typeof input === 'string' || Buffer.isBuffer(input) || ArrayBuffer.isView(input) || input instanceof ArrayBuffer
  if (!isDecodable) return options ? sharpLib(input, options) : sharpLib(input)
  return sharpLib(input, { limitInputPixels: MAX_INPUT_PIXELS, ...options })
}
