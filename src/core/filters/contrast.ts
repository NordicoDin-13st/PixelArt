/**
 * Contrast and brightness adjustment filter
 */

import { Filter } from '../types'

export interface ContrastParams {
  contrast: number
  brightness: number
}

export const contrastFilter: Filter = {
  id: 'contrast',
  name: '对比度&亮度',
  params: {
    contrast: {
      type: 'range',
      min: -100,
      max: 100,
      default: 0,
      label: '对比度'
    },
    brightness: {
      type: 'range',
      min: -100,
      max: 100,
      default: 0,
      label: '亮度'
    }
  },

  apply(input: ImageData, params: ContrastParams): ImageData {
    const { contrast, brightness } = params
    const output = new ImageData(
      new Uint8ClampedArray(input.data),
      input.width,
      input.height
    )

    // Pre-calculate contrast factor
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

    for (let i = 0; i < input.data.length; i += 4) {
      const r = input.data[i]
      const g = input.data[i + 1]
      const b = input.data[i + 2]
      const a = input.data[i + 3]

      if (a === 0) {
        output.data[i + 3] = 0
        continue
      }

      // Apply contrast
      let nr = factor * (r - 128) + 128
      let ng = factor * (g - 128) + 128
      let nb = factor * (b - 128) + 128

      // Apply brightness
      nr += brightness
      ng += brightness
      nb += brightness

      // Clamp to valid range
      output.data[i] = Math.max(0, Math.min(255, nr))
      output.data[i + 1] = Math.max(0, Math.min(255, ng))
      output.data[i + 2] = Math.max(0, Math.min(255, nb))
      output.data[i + 3] = a
    }

    return output
  }
}
