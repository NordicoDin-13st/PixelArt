import { Filter } from '../types'

/**
 * Color structure for palette quantization
 */
interface Color {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Color bucket for median cut algorithm
 */
interface ColorBucket {
  colors: Color[]
  minR: number
  maxR: number
  minG: number
  maxG: number
  minB: number
  maxB: number
  minA: number
  maxA: number
}

/**
 * Median cut palette quantization filter
 * Reduces color count using the median cut algorithm
 */
export const quantizeFilter: Filter = {
  id: 'quantize',
  name: '调色板量化',
  description: '使用中位切分算法减少颜色数量',
  params: {
    colorCount: {
      type: 'number',
      default: 16,
      min: 2,
      max: 256,
      step: 1,
      label: '颜色数量',
      description: '目标调色板颜色数量'
    },
    dither: {
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: '无抖动' },
        { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
        { value: 'atkinson', label: 'Atkinson' },
        { value: 'bayer', label: 'Bayer矩阵' }
      ],
      label: '抖动算法',
      description: '减少颜色渐变带来的色带'
    }
  },
  apply(input: ImageData, params: Record<string, any>): ImageData {
    const { colorCount, dither } = params
    const data = new Uint8ClampedArray(input.data)

    // Extract all colors
    const colors: Color[] = []
    for (let i = 0; i < data.length; i += 4) {
      colors.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] })
    }

    // Generate palette using median cut
    const palette = medianCut(colors, colorCount)

    // Apply quantization (with or without dithering)
    if (dither === 'floyd-steinberg') {
      return floydSteinbergDither(input, palette)
    } else if (dither === 'atkinson') {
      return atkinsonDither(input, palette)
    } else if (dither === 'bayer') {
      return bayerDither(input, palette)
    } else {
      return applyPalette(input, palette)
    }
  }
}

/**
 * Median cut algorithm implementation
 */
function medianCut(colors: Color[], maxColors: number): Color[] {
  if (colors.length === 0 || maxColors <= 0) return []

  let buckets: ColorBucket[] = [{
    colors,
    minR: 0, maxR: 255,
    minG: 0, maxG: 255,
    minB: 0, maxB: 255,
    minA: 0, maxA: 255
  }]

  while (buckets.length < maxColors) {
    // Find bucket with largest range
    let maxRange = 0
    let bucketToSplit = -1
    let channelToSplit = ''

    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i]
      const rangeR = bucket.maxR - bucket.minR
      const rangeG = bucket.maxG - bucket.minG
      const rangeB = bucket.maxB - bucket.minB
      const rangeA = bucket.maxA - bucket.minA

      if (rangeR > maxRange) { maxRange = rangeR; bucketToSplit = i; channelToSplit = 'r' }
      if (rangeG > maxRange) { maxRange = rangeG; bucketToSplit = i; channelToSplit = 'g' }
      if (rangeB > maxRange) { maxRange = rangeB; bucketToSplit = i; channelToSplit = 'b' }
      if (rangeA > maxRange) { maxRange = rangeA; bucketToSplit = i; channelToSplit = 'a' }
    }

    if (bucketToSplit === -1) break

    // Split the bucket
    const bucket = buckets[bucketToSplit]
    const sortedColors = [...bucket.colors].sort((a, b) => {
      return (a as any)[channelToSplit] - (b as any)[channelToSplit]
    })

    const median = Math.floor(sortedColors.length / 2)
    const colors1 = sortedColors.slice(0, median)
    const colors2 = sortedColors.slice(median)

    if (colors1.length === 0 || colors2.length === 0) break

    // Create new buckets
    const bucket1 = createBucket(colors1)
    const bucket2 = createBucket(colors2)

    buckets = buckets.filter((_, i) => i !== bucketToSplit)
    buckets.push(bucket1, bucket2)
  }

  // Return average color of each bucket
  return buckets.map(bucket => {
    const sum = bucket.colors.reduce((acc, c) => ({
      r: acc.r + c.r,
      g: acc.g + c.g,
      b: acc.b + c.b,
      a: acc.a + c.a
    }), { r: 0, g: 0, b: 0, a: 0 })

    const count = bucket.colors.length
    return {
      r: Math.round(sum.r / count),
      g: Math.round(sum.g / count),
      b: Math.round(sum.b / count),
      a: Math.round(sum.a / count)
    }
  })
}

function createBucket(colors: Color[]): ColorBucket {
  if (colors.length === 0) {
    return {
      colors: [],
      minR: 0, maxR: 255,
      minG: 0, maxG: 255,
      minB: 0, maxB: 255,
      minA: 0, maxA: 255
    }
  }

  return {
    colors,
    minR: Math.min(...colors.map(c => c.r)),
    maxR: Math.max(...colors.map(c => c.r)),
    minG: Math.min(...colors.map(c => c.g)),
    maxG: Math.max(...colors.map(c => c.g)),
    minB: Math.min(...colors.map(c => c.b)),
    maxB: Math.max(...colors.map(c => c.b)),
    minA: Math.min(...colors.map(c => c.a)),
    maxA: Math.max(...colors.map(c => c.a))
  }
}

/**
 * Find nearest color in palette
 */
function findNearestColor(color: Color, palette: Color[]): Color {
  let minDist = Infinity
  let nearest = palette[0]

  for (const p of palette) {
    const dist = Math.pow(color.r - p.r, 2) +
                 Math.pow(color.g - p.g, 2) +
                 Math.pow(color.b - p.b, 2) +
                 Math.pow(color.a - p.a, 2)

    if (dist < minDist) {
      minDist = dist
      nearest = p
    }
  }

  return nearest
}

/**
 * Apply palette without dithering
 */
function applyPalette(imageData: ImageData, palette: Color[]): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const output = new ImageData(imageData.width, imageData.height)

  for (let i = 0; i < data.length; i += 4) {
    const color: Color = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3]
    }

    const nearest = findNearestColor(color, palette)
    output.data[i] = nearest.r
    output.data[i + 1] = nearest.g
    output.data[i + 2] = nearest.b
    output.data[i + 3] = nearest.a
  }

  return output
}

function atkinsonDither(imageData: ImageData, palette: Color[]): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height
  const output = new ImageData(width, height)

  const pixels = data.map(v => v)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const oldPixel: Color = {
        r: pixels[idx],
        g: pixels[idx + 1],
        b: pixels[idx + 2],
        a: pixels[idx + 3]
      }

      const newPixel = findNearestColor(oldPixel, palette)

      output.data[idx] = newPixel.r
      output.data[idx + 1] = newPixel.g
      output.data[idx + 2] = newPixel.b
      output.data[idx + 3] = newPixel.a

      const errR = (oldPixel.r - newPixel.r) / 8
      const errG = (oldPixel.g - newPixel.g) / 8
      const errB = (oldPixel.b - newPixel.b) / 8
      const errA = (oldPixel.a - newPixel.a) / 8

      const distribute = (dx: number, dy: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = (ny * width + nx) * 4
          pixels[nidx] += errR
          pixels[nidx + 1] += errG
          pixels[nidx + 2] += errB
          pixels[nidx + 3] += errA
        }
      }

      distribute(1, 0)
      distribute(2, 0)
      distribute(-1, 1)
      distribute(0, 1)
      distribute(1, 1)
      distribute(0, 2)
    }
  }

  return output
}

/**
 * Floyd-Steinberg dithering
 */
function floydSteinbergDither(imageData: ImageData, palette: Color[]): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height
  const output = new ImageData(width, height)

  // Work with floating point for error distribution
  const pixels = data.map(v => v)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const oldPixel: Color = {
        r: pixels[idx],
        g: pixels[idx + 1],
        b: pixels[idx + 2],
        a: pixels[idx + 3]
      }

      const newPixel = findNearestColor(oldPixel, palette)

      output.data[idx] = newPixel.r
      output.data[idx + 1] = newPixel.g
      output.data[idx + 2] = newPixel.b
      output.data[idx + 3] = newPixel.a

      // Calculate quantization error
      const errR = oldPixel.r - newPixel.r
      const errG = oldPixel.g - newPixel.g
      const errB = oldPixel.b - newPixel.b
      const errA = oldPixel.a - newPixel.a

      // Distribute error to neighboring pixels
      const distribute = (dx: number, dy: number, factor: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = (ny * width + nx) * 4
          pixels[nidx] += errR * factor
          pixels[nidx + 1] += errG * factor
          pixels[nidx + 2] += errB * factor
          pixels[nidx + 3] += errA * factor
        }
      }

      distribute(1, 0, 7 / 16)
      distribute(-1, 1, 3 / 16)
      distribute(0, 1, 5 / 16)
      distribute(1, 1, 1 / 16)
    }
  }

  return output
}

/**
 * Bayer ordered dithering
 */
function bayerDither(imageData: ImageData, palette: Color[]): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height
  const output = new ImageData(width, height)

  // 4x4 Bayer matrix
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ]

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const bayerValue = (bayerMatrix[y % 4][x % 4] - 8) / 16

      const oldPixel: Color = {
        r: Math.max(0, Math.min(255, data[idx] + bayerValue * 255)),
        g: Math.max(0, Math.min(255, data[idx + 1] + bayerValue * 255)),
        b: Math.max(0, Math.min(255, data[idx + 2] + bayerValue * 255)),
        a: data[idx + 3]
      }

      const newPixel = findNearestColor(oldPixel, palette)
      output.data[idx] = newPixel.r
      output.data[idx + 1] = newPixel.g
      output.data[idx + 2] = newPixel.b
      output.data[idx + 3] = newPixel.a
    }
  }

  return output
}
