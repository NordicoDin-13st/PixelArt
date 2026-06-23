/**
 * Random palette transformation filter
 * Shifts hue, saturation, and lightness randomly
 */

import { Filter } from '../types'

export interface PaletteRandomParams {
  hueShift: number
  saturationShift: number
  lightnessShift: number
  randomSeed: number
}

export const paletteRandomFilter: Filter = {
  id: 'paletteRandom',
  name: '随机调色板',
  params: {
    hueShift: {
      type: 'range',
      min: -180,
      max: 180,
      default: 0,
      label: '色相偏移'
    },
    saturationShift: {
      type: 'range',
      min: -100,
      max: 100,
      default: 0,
      label: '饱和度偏移'
    },
    lightnessShift: {
      type: 'range',
      min: -50,
      max: 50,
      default: 0,
      label: '亮度偏移'
    },
    randomSeed: {
      type: 'hidden',
      default: 0,
      label: '随机种子'
    }
  },

  apply(input: ImageData, params: PaletteRandomParams): ImageData {
    const { hueShift, saturationShift, lightnessShift } = params
    const output = new ImageData(
      new Uint8ClampedArray(input.data),
      input.width,
      input.height
    )

    for (let i = 0; i < input.data.length; i += 4) {
      const r = input.data[i]
      const g = input.data[i + 1]
      const b = input.data[i + 2]
      const a = input.data[i + 3]

      if (a === 0) {
        output.data[i + 3] = 0
        continue
      }

      // Convert RGB to HSL
      let [h, s, l] = rgbToHsl(r, g, b)

      // Apply shifts
      h = (h + hueShift + 360) % 360
      s = Math.max(0, Math.min(100, s + saturationShift))
      l = Math.max(0, Math.min(100, l + lightnessShift))

      // Convert back to RGB
      const [nr, ng, nb] = hslToRgb(h, s, l)
      output.data[i] = nr
      output.data[i + 1] = ng
      output.data[i + 2] = nb
      output.data[i + 3] = a
    }

    return output
  }
}

/**
 * RGB to HSL conversion
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [h * 360, s * 100, l * 100]
}

/**
 * HSL to RGB conversion
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}
