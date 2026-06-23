/**
 * Filter registry and factory
 * Central point for registering and accessing all filters
 */

import { Filter } from '../types'
import { downsampleFilter } from './downsample'
import { quantizeFilter } from './quantize'
import { paletteFilter } from './palette'
import { paletteRandomFilter } from './paletteRandom'
import { noiseFilter } from './noise'
import { symmetryFilter } from './symmetry'
import { contrastFilter } from './contrast'
import { ditherFilter } from './dither'

export const FILTER_REGISTRY: Record<string, Filter> = {
  downsample: downsampleFilter,
  quantize: quantizeFilter,
  dither: ditherFilter,
  palette: paletteFilter,
  paletteRandom: paletteRandomFilter,
  noise: noiseFilter,
  symmetry: symmetryFilter,
  contrast: contrastFilter
}

/**
 * Get effect filters (for random variations)
 */
export function getEffectFilters(): Filter[] {
  return [
    paletteRandomFilter,
    noiseFilter,
    symmetryFilter,
    contrastFilter
  ]
}

/**
 * Get a filter by ID
 */
export function getFilter(id: string): Filter | undefined {
  return FILTER_REGISTRY[id]
}

/**
 * Get all registered filters
 */
export function getAllFilters(): Filter[] {
  return Object.values(FILTER_REGISTRY)
}

/**
 * Get default parameters for a filter
 */
export function getFilterDefaults(filterId: string): Record<string, any> {
  const filter = getFilter(filterId)
  if (!filter) return {}

  const defaults: Record<string, any> = {}
  for (const [key, param] of Object.entries(filter.params)) {
    defaults[key] = param.default
  }
  return defaults
}
