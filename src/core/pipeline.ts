/**
 * Pipeline orchestration system
 * Executes filters in sequence to transform ImageData
 */

import type { Pipeline, PipelineConfig } from './types'
import { getFilter } from './filters'

/**
 * Create a pipeline from configuration
 */
export function createPipeline(configs: PipelineConfig[]): Pipeline {
  return {
    filters: configs,
    run(source: ImageData): ImageData {
      let current = source

      for (const config of this.filters) {
        if (!config.enabled) continue

        const filter = getFilter(config.filter.id)
        if (!filter) {
          console.warn(`Filter ${config.filter.id} not found, skipping`)
          continue
        }

        try {
          current = filter.apply(current, config.params)
        } catch (error) {
          console.error(`Error applying filter ${filter.id}:`, error)
          throw error
        }
      }

      return current
    }
  }
}

/**
 * Create a default pixel art pipeline (Phase 1)
 * Downsample → Quantize/Palette → Effect Filters
 */
export function createDefaultPipeline(params: {
  mode: 'quantize' | 'palette'
  pixelSize: number
  colorCount?: number
  palettePreset?: string
  dither?: string
  effectFilters?: Array<{ id: string; params: Record<string, any>; enabled: boolean }>
}): Pipeline {
  const { mode, pixelSize, colorCount, palettePreset, dither, effectFilters = [] } = params

  const downsampleFilter = getFilter('downsample')
  if (!downsampleFilter) {
    throw new Error('Downsample filter not found in registry')
  }

  const configs: PipelineConfig[] = [
    {
      filter: downsampleFilter,
      params: { pixelSize },
      enabled: true
    }
  ]

  if (mode === 'quantize') {
    const quantizeFilter = getFilter('quantize')
    if (quantizeFilter) {
      configs.push({
        filter: quantizeFilter,
        params: {
          colorCount: colorCount || 16,
          dither: dither || 'none'
        },
        enabled: true
      })
    }
  } else {
    const paletteFilter = getFilter('palette')
    if (paletteFilter) {
      configs.push({
        filter: paletteFilter,
        params: {
          preset: palettePreset || 'pico8',
          dither: dither || 'floyd-steinberg'
        },
        enabled: true
      })
    }
  }

  // Add effect filters
  for (const effect of effectFilters) {
    const filter = getFilter(effect.id)
    if (filter) {
      configs.push({
        filter,
        params: effect.params,
        enabled: effect.enabled
      })
    }
  }

  return createPipeline(configs)
}

/**
 * Clone ImageData
 */
export function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  )
}
