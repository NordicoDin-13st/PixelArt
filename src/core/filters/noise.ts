/**
 * Noise filter for adding grain and texture
 */

import { Filter } from '../types'

export interface NoiseParams {
  amount: number
  monochromatic: boolean
  seed: number
}

export const noiseFilter: Filter = {
  id: 'noise',
  name: '噪点',
  params: {
    amount: {
      type: 'range',
      min: 0,
      max: 100,
      default: 20,
      label: '噪点强度'
    },
    monochromatic: {
      type: 'boolean',
      default: true,
      label: '单色噪点'
    },
    seed: {
      type: 'hidden',
      default: 0,
      label: '随机种子'
    }
  },

  apply(input: ImageData, params: NoiseParams): ImageData {
    const { amount, monochromatic, seed } = params
    const output = new ImageData(
      new Uint8ClampedArray(input.data),
      input.width,
      input.height
    )

    // Simple seeded random
    let randomState = seed
    const random = () => {
      randomState = (randomState * 9301 + 49297) % 233280
      return randomState / 233280
    }

    for (let i = 0; i < input.data.length; i += 4) {
      const r = input.data[i]
      const g = input.data[i + 1]
      const b = input.data[i + 2]
      const a = input.data[i + 3]

      if (a === 0) {
        output.data[i + 3] = 0
        continue
      }

      if (monochromatic) {
        const noise = (random() - 0.5) * 2 * amount
        output.data[i] = Math.max(0, Math.min(255, r + noise))
        output.data[i + 1] = Math.max(0, Math.min(255, g + noise))
        output.data[i + 2] = Math.max(0, Math.min(255, b + noise))
      } else {
        output.data[i] = Math.max(0, Math.min(255, r + (random() - 0.5) * 2 * amount))
        output.data[i + 1] = Math.max(0, Math.min(255, g + (random() - 0.5) * 2 * amount))
        output.data[i + 2] = Math.max(0, Math.min(255, b + (random() - 0.5) * 2 * amount))
      }
      output.data[i + 3] = a
    }

    return output
  }
}
