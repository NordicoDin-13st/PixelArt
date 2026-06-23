import { Filter } from '../types'

/**
 * Classic palette presets for pixel art
 */
export const PALETTE_PRESETS = {
  gameboy: {
    name: 'GameBoy',
    colors: [
      { r: 15, g: 56, b: 15 },
      { r: 48, g: 98, b: 48 },
      { r: 139, g: 172, b: 15 },
      { r: 155, g: 188, b: 15 }
    ]
  },
  nes: {
    name: 'NES',
    colors: [
      { r: 124, g: 124, b: 124 },
      { r: 0, g: 0, b: 0 },
      { r: 252, g: 252, b: 252 },
      { r: 188, g: 188, b: 188 },
      { r: 0, g: 0, b: 252 },
      { r: 0, g: 0, b: 188 },
      { r: 136, g: 0, b: 252 },
      { r: 252, g: 0, b: 252 },
      { r: 252, g: 0, b: 0 },
      { r: 252, g: 100, b: 0 },
      { r: 252, g: 252, b: 0 },
      { r: 0, g: 252, b: 0 },
      { r: 0, g: 252, b: 252 },
      { r: 0, g: 124, b: 124 },
      { r: 252, g: 124, b: 124 },
      { r: 124, g: 124, b: 124 }
    ]
  },
  pico8: {
    name: 'PICO-8',
    colors: [
      { r: 0, g: 0, b: 0 },
      { r: 29, g: 43, b: 83 },
      { r: 126, g: 37, b: 83 },
      { r: 0, g: 135, b: 81 },
      { r: 171, g: 82, b: 54 },
      { r: 95, g: 87, b: 79 },
      { r: 194, g: 195, b: 199 },
      { r: 255, g: 241, b: 232 },
      { r: 255, g: 0, b: 77 },
      { r: 255, g: 163, b: 0 },
      { r: 255, g: 236, b: 39 },
      { r: 0, g: 228, b: 54 },
      { r: 41, g: 173, b: 255 },
      { r: 131, g: 118, b: 156 },
      { r: 255, g: 119, b: 168 },
      { r: 255, g: 204, b: 170 }
    ]
  },
  cga: {
    name: 'CGA',
    colors: [
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 170 },
      { r: 170, g: 0, b: 0 },
      { r: 170, g: 0, b: 170 },
      { r: 0, g: 170, b: 0 },
      { r: 0, g: 170, b: 170 },
      { r: 170, g: 85, b: 0 },
      { r: 170, g: 170, b: 170 },
      { r: 85, g: 85, b: 85 },
      { r: 85, g: 85, b: 255 },
      { r: 255, g: 85, b: 85 },
      { r: 255, g: 85, b: 255 },
      { r: 85, g: 255, b: 85 },
      { r: 85, g: 255, b: 255 },
      { r: 255, g: 255, b: 85 },
      { r: 255, g: 255, b: 255 }
    ]
  },
  grayscale: {
    name: '灰度',
    colors: Array.from({ length: 16 }, (_, i) => {
      const v = Math.round((i / 15) * 255)
      return { r: v, g: v, b: v }
    })
  },
  amber: {
    name: '琥珀色',
    colors: Array.from({ length: 16 }, (_, i) => {
      const v = Math.round((i / 15) * 255)
      return { r: v, g: Math.round(v * 0.75), b: 0 }
    })
  },
  green: {
    name: '绿色荧光',
    colors: Array.from({ length: 16 }, (_, i) => {
      const v = Math.round((i / 15) * 255)
      return { r: 0, g: v, b: 0 }
    })
  }
}

/**
 * Fixed palette quantization filter
 * Maps image colors to a predefined palette
 */
export const paletteFilter: Filter = {
  id: 'palette',
  name: '固定调色板',
  description: '使用预设调色板映射颜色',
  params: {
    preset: {
      type: 'select',
      default: 'pico8',
      options: Object.entries(PALETTE_PRESETS).map(([key, val]) => ({
        value: key,
        label: val.name
      })),
      label: '调色板预设',
      description: '选择要使用的经典调色板'
    },
    dither: {
      type: 'select',
      default: 'floyd-steinberg',
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
    const { preset, dither } = params
    const palette = PALETTE_PRESETS[preset as keyof typeof PALETTE_PRESETS]?.colors || PALETTE_PRESETS.pico8.colors

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

interface Color {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Find nearest color in palette
 */
function findNearestColor(color: Color, palette: typeof PALETTE_PRESETS.pico8.colors): Color {
  let minDist = Infinity
  let nearest = palette[0]

  for (const p of palette) {
    const dist = Math.pow(color.r - p.r, 2) +
                 Math.pow(color.g - p.g, 2) +
                 Math.pow(color.b - p.b, 2)

    if (dist < minDist) {
      minDist = dist
      nearest = p
    }
  }

  return { ...nearest, a: color.a }
}

/**
 * Apply palette without dithering
 */
function applyPalette(imageData: ImageData, palette: typeof PALETTE_PRESETS.pico8.colors): ImageData {
  const data = imageData.data
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

function atkinsonDither(imageData: ImageData, palette: typeof PALETTE_PRESETS.pico8.colors): ImageData {
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

      const distribute = (dx: number, dy: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = (ny * width + nx) * 4
          pixels[nidx] += errR
          pixels[nidx + 1] += errG
          pixels[nidx + 2] += errB
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
 * Floyd-Steinberg dithering with fixed palette
 */
function floydSteinbergDither(imageData: ImageData, palette: typeof PALETTE_PRESETS.pico8.colors): ImageData {
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

      const errR = oldPixel.r - newPixel.r
      const errG = oldPixel.g - newPixel.g
      const errB = oldPixel.b - newPixel.b

      const distribute = (dx: number, dy: number, factor: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = (ny * width + nx) * 4
          pixels[nidx] += errR * factor
          pixels[nidx + 1] += errG * factor
          pixels[nidx + 2] += errB * factor
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
 * Bayer ordered dithering with fixed palette
 */
function bayerDither(imageData: ImageData, palette: typeof PALETTE_PRESETS.pico8.colors): ImageData {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const output = new ImageData(width, height)

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
