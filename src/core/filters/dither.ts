import { Filter } from '../types'

export const ditherFilter: Filter = {
  id: 'dither',
  name: '抖动',
  description: '对已量化的图像应用抖动算法，减少色带',
  params: {
    algorithm: {
      type: 'select',
      default: 'floyd-steinberg',
      options: [
        { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
        { value: 'bayer', label: 'Bayer矩阵' },
        { value: 'atkinson', label: 'Atkinson' },
        { value: 'none', label: '无抖动' }
      ],
      label: '抖动算法',
      description: '减少颜色渐变带来的色带'
    },
    strength: {
      type: 'range',
      min: 0,
      max: 100,
      default: 100,
      label: '强度'
    },
    bayerSize: {
      type: 'select',
      default: '4x4',
      options: [
        { value: '2x2', label: '2×2' },
        { value: '4x4', label: '4×4' },
        { value: '8x8', label: '8×8' }
      ],
      label: 'Bayer矩阵大小'
    }
  },

  apply(input: ImageData, params: Record<string, any>): ImageData {
    const { algorithm, strength, bayerSize } = params
    const factor = strength / 100

    if (algorithm === 'none' || factor === 0) {
      return new ImageData(new Uint8ClampedArray(input.data), input.width, input.height)
    }

    if (algorithm === 'floyd-steinberg') {
      return floydSteinbergDither(input, factor)
    } else if (algorithm === 'bayer') {
      return bayerDither(input, factor, bayerSize)
    } else if (algorithm === 'atkinson') {
      return atkinsonDither(input, factor)
    }

    return new ImageData(new Uint8ClampedArray(input.data), input.width, input.height)
  }
}

function floydSteinbergDither(imageData: ImageData, strength: number): ImageData {
  const width = imageData.width
  const height = imageData.height
  const output = new ImageData(width, height)
  const pixels = new Float32Array(imageData.data.length)
  for (let i = 0; i < imageData.data.length; i++) {
    pixels[i] = imageData.data[i]
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      const oldR = pixels[idx]
      const oldG = pixels[idx + 1]
      const oldB = pixels[idx + 2]
      const oldA = pixels[idx + 3]

      const newR = oldR > 127 ? 255 : 0
      const newG = oldG > 127 ? 255 : 0
      const newB = oldB > 127 ? 255 : 0

      output.data[idx] = newR
      output.data[idx + 1] = newG
      output.data[idx + 2] = newB
      output.data[idx + 3] = Math.round(oldA)

      const errR = (oldR - newR) * strength
      const errG = (oldG - newG) * strength
      const errB = (oldB - newB) * strength

      distributeError(pixels, width, height, x, y, errR, errG, errB, 1, 0, 7 / 16)
      distributeError(pixels, width, height, x, y, errR, errG, errB, -1, 1, 3 / 16)
      distributeError(pixels, width, height, x, y, errR, errG, errB, 0, 1, 5 / 16)
      distributeError(pixels, width, height, x, y, errR, errG, errB, 1, 1, 1 / 16)
    }
  }

  return output
}

function atkinsonDither(imageData: ImageData, strength: number): ImageData {
  const width = imageData.width
  const height = imageData.height
  const output = new ImageData(width, height)
  const pixels = new Float32Array(imageData.data.length)
  for (let i = 0; i < imageData.data.length; i++) {
    pixels[i] = imageData.data[i]
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      const oldR = pixels[idx]
      const oldG = pixels[idx + 1]
      const oldB = pixels[idx + 2]
      const oldA = pixels[idx + 3]

      const newR = oldR > 127 ? 255 : 0
      const newG = oldG > 127 ? 255 : 0
      const newB = oldB > 127 ? 255 : 0

      output.data[idx] = newR
      output.data[idx + 1] = newG
      output.data[idx + 2] = newB
      output.data[idx + 3] = Math.round(oldA)

      const errR = (oldR - newR) * strength / 8
      const errG = (oldG - newG) * strength / 8
      const errB = (oldB - newB) * strength / 8

      distributeError(pixels, width, height, x, y, errR, errG, errB, 1, 0, 1)
      distributeError(pixels, width, height, x, y, errR, errG, errB, 2, 0, 1)
      distributeError(pixels, width, height, x, y, errR, errG, errB, -1, 1, 1)
      distributeError(pixels, width, height, x, y, errR, errG, errB, 0, 1, 1)
      distributeError(pixels, width, height, x, y, errR, errG, errB, 1, 1, 1)
      distributeError(pixels, width, height, x, y, errR, errG, errB, 0, 2, 1)
    }
  }

  return output
}

function bayerDither(imageData: ImageData, strength: number, bayerSize: string): ImageData {
  const width = imageData.width
  const height = imageData.height
  const output = new ImageData(width, height)
  const data = imageData.data

  const bayer2x2 = [
    [0, 2],
    [3, 1]
  ]

  const bayer4x4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ]

  const bayer8x8 = [
    [0, 48, 12, 60, 3, 51, 15, 63],
    [32, 16, 44, 28, 35, 19, 47, 31],
    [8, 56, 4, 52, 11, 59, 7, 55],
    [40, 24, 36, 20, 43, 27, 39, 23],
    [2, 50, 14, 62, 1, 49, 13, 61],
    [34, 18, 46, 30, 33, 17, 45, 29],
    [10, 58, 6, 54, 9, 57, 5, 53],
    [42, 26, 38, 22, 41, 25, 37, 21]
  ]

  let matrix: number[][]
  let divisor: number

  switch (bayerSize) {
    case '2x2':
      matrix = bayer2x2
      divisor = 4
      break
    case '8x8':
      matrix = bayer8x8
      divisor = 64
      break
    default:
      matrix = bayer4x4
      divisor = 16
  }

  const matrixSize = matrix.length

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const bayerValue = (matrix[y % matrixSize][x % matrixSize] / divisor - 0.5) * strength

      const r = data[idx] + bayerValue * 255
      const g = data[idx + 1] + bayerValue * 255
      const b = data[idx + 2] + bayerValue * 255

      output.data[idx] = r > 127 ? 255 : 0
      output.data[idx + 1] = g > 127 ? 255 : 0
      output.data[idx + 2] = b > 127 ? 255 : 0
      output.data[idx + 3] = data[idx + 3]
    }
  }

  return output
}

function distributeError(
  pixels: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  errR: number,
  errG: number,
  errB: number,
  dx: number,
  dy: number,
  factor: number
) {
  const nx = x + dx
  const ny = y + dy
  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
    const nidx = (ny * width + nx) * 4
    pixels[nidx] += errR * factor
    pixels[nidx + 1] += errG * factor
    pixels[nidx + 2] += errB * factor
  }
}
