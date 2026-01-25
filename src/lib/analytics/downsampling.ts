/**
 * LTTB (Largest Triangle Three Buckets) Downsampling Algorithm
 * Preserves visual shape while reducing the number of data points
 *
 * Reference: https://skemman.is/handle/1946/15343
 */

interface DataPoint {
  x: number
  y: number
  [key: string]: any
}

/**
 * Downsample data using LTTB algorithm
 * @param data - Array of data points with x and y values
 * @param threshold - Target number of points to keep
 * @returns Downsampled array
 */
export function lttbDownsample<T extends DataPoint>(
  data: T[],
  threshold: number
): T[] {
  if (data.length <= threshold) return data
  if (threshold < 3) return [data[0], data[data.length - 1]] as T[]

  const sampled: T[] = [data[0]] // Always keep first point
  const bucketSize = (data.length - 2) / (threshold - 2)

  let a = 0 // Index of previously selected point

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate bucket boundaries
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1
    const bucketEndClamped = Math.min(bucketEnd, data.length - 1)

    // Calculate average point in next bucket (for triangle calculation)
    let avgX = 0
    let avgY = 0
    const avgRangeEnd = Math.min(bucketEndClamped, data.length)
    const avgRangeStart = bucketStart

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x
      avgY += data[j].y
    }

    const avgCount = avgRangeEnd - avgRangeStart
    if (avgCount > 0) {
      avgX /= avgCount
      avgY /= avgCount
    }

    // Find point in current bucket with largest triangle area
    const rangeStart = Math.floor(i * bucketSize) + 1
    const rangeEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length)

    let maxArea = -1
    let maxIndex = rangeStart

    for (let j = rangeStart; j < rangeEnd; j++) {
      // Calculate triangle area using cross product
      const area = Math.abs(
        (data[a].x - avgX) * (data[j].y - data[a].y) -
        (data[a].x - data[j].x) * (avgY - data[a].y)
      )

      if (area > maxArea) {
        maxArea = area
        maxIndex = j
      }
    }

    sampled.push(data[maxIndex])
    a = maxIndex
  }

  sampled.push(data[data.length - 1]) // Always keep last point
  return sampled
}

/**
 * Helper to convert date-based data to x/y format for LTTB
 */
export function prepareForDownsampling<T extends { date: string; count: number }>(
  data: T[]
): (T & { x: number; y: number })[] {
  return data.map((item, index) => ({
    ...item,
    x: index,
    y: item.count,
  }))
}

/**
 * Downsample date-based data
 */
export function downsampleDateData<T extends { date: string; count: number }>(
  data: T[],
  threshold: number
): T[] {
  if (data.length <= threshold) return data

  const prepared = prepareForDownsampling(data)
  const downsampled = lttbDownsample(prepared, threshold)

  // Remove the x/y properties we added
  return downsampled.map(({ x, y, ...rest }) => rest as unknown as T)
}
