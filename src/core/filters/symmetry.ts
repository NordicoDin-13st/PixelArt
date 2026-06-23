/**
 * Symmetry filter for creating mirrored patterns
 */

import { Filter } from '../types'

export interface SymmetryParams {
  mode: 'horizontal' | 'vertical' | 'quad' | 'radial'
  preserveOriginal: boolean
}

export const symmetryFilter: Filter = {
  id: 'symmetry',
  name: '对称变换',
  params: {
    mode: {
      type: 'select',
      options: [
        { value: 'horizontal', label: '水平对称' },
        { value: 'vertical', label: '垂直对称' },
        { value: 'quad', label: '四向对称' },
        { value: 'radial', label: '径向对称' }
      ],
      default: 'horizontal' as const,
      label: '对称模式'
    },
    preserveOriginal: {
      type: 'boolean',
      default: false,
      label: '保留原图'
    }
  },

  apply(input: ImageData, params: SymmetryParams): ImageData {
    const { mode, preserveOriginal } = params
    const width = input.width
    const height = input.height
    const output = new ImageData(
      new Uint8ClampedArray(input.data),
      width,
      height
    )

    // Copy original if needed
    if (preserveOriginal) {
      output.data.set(input.data)
    }

    switch (mode) {
      case 'horizontal':
        applyHorizontalSymmetry(input, output, preserveOriginal)
        break
      case 'vertical':
        applyVerticalSymmetry(input, output, preserveOriginal)
        break
      case 'quad':
        applyQuadSymmetry(input, output, preserveOriginal)
        break
      case 'radial':
        applyRadialSymmetry(input, output, preserveOriginal)
        break
    }

    return output
  }
}

function applyHorizontalSymmetry(
  input: ImageData,
  output: ImageData,
  preserveOriginal: boolean
) {
  const { width, height, data } = input
  const out = output.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = preserveOriginal ? x : Math.min(x, width - 1 - x)
      const srcIdx = (y * width + srcX) * 4
      const dstIdx = (y * width + x) * 4

      out[dstIdx] = data[srcIdx]
      out[dstIdx + 1] = data[srcIdx + 1]
      out[dstIdx + 2] = data[srcIdx + 2]
      out[dstIdx + 3] = data[srcIdx + 3]
    }
  }
}

function applyVerticalSymmetry(
  input: ImageData,
  output: ImageData,
  preserveOriginal: boolean
) {
  const { width, height, data } = input
  const out = output.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcY = preserveOriginal ? y : Math.min(y, height - 1 - y)
      const srcIdx = (srcY * width + x) * 4
      const dstIdx = (y * width + x) * 4

      out[dstIdx] = data[srcIdx]
      out[dstIdx + 1] = data[srcIdx + 1]
      out[dstIdx + 2] = data[srcIdx + 2]
      out[dstIdx + 3] = data[srcIdx + 3]
    }
  }
}

function applyQuadSymmetry(
  input: ImageData,
  output: ImageData,
  preserveOriginal: boolean
) {
  const { width, height, data } = input
  const out = output.data
  const halfW = Math.ceil(width / 2)
  const halfH = Math.ceil(height / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let srcX = x < halfW ? x : width - 1 - x
      let srcY = y < halfH ? y : height - 1 - y

      if (preserveOriginal) {
        srcX = x
        srcY = y
      }

      const srcIdx = (srcY * width + srcX) * 4
      const dstIdx = (y * width + x) * 4

      out[dstIdx] = data[srcIdx]
      out[dstIdx + 1] = data[srcIdx + 1]
      out[dstIdx + 2] = data[srcIdx + 2]
      out[dstIdx + 3] = data[srcIdx + 3]
    }
  }
}

function applyRadialSymmetry(
  input: ImageData,
  output: ImageData,
  preserveOriginal: boolean
) {
  const { width, height, data } = input
  const out = output.data
  const centerX = width / 2
  const centerY = height / 2

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX
      const dy = y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)

      // Mirror angle 4 times
      const mirroredAngle = Math.abs(((angle % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2) - Math.PI / 4)

      let srcX = Math.round(centerX + Math.cos(mirroredAngle) * dist)
      let srcY = Math.round(centerY + Math.sin(mirroredAngle) * dist)

      if (preserveOriginal) {
        srcX = x
        srcY = y
      }

      srcX = Math.max(0, Math.min(width - 1, srcX))
      srcY = Math.max(0, Math.min(height - 1, srcY))

      const srcIdx = (srcY * width + srcX) * 4
      const dstIdx = (y * width + x) * 4

      out[dstIdx] = data[srcIdx]
      out[dstIdx + 1] = data[srcIdx + 1]
      out[dstIdx + 2] = data[srcIdx + 2]
      out[dstIdx + 3] = data[srcIdx + 3]
    }
  }
}
