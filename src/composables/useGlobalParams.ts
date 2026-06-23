/**
 * Global parameters management
 * Stores default values that can be applied to any image
 */

import { reactive, computed } from 'vue'

export interface GlobalParams {
  mode: 'quantize' | 'palette'
  pixelSize: number
  colorCount: number
  palettePreset: string
  dither: string
}

const DEFAULT_PARAMS: GlobalParams = {
  mode: 'quantize',
  pixelSize: 8,
  colorCount: 16,
  palettePreset: 'pico8',
  dither: 'floyd-steinberg'
}

/**
 * Global parameters composable
 */
export function useGlobalParams() {
  const params = reactive<GlobalParams>({ ...DEFAULT_PARAMS })

  const isQuantizeMode = computed(() => params.mode === 'quantize')
  const isPaletteMode = computed(() => params.mode === 'palette')

  /**
   * Reset to default values
   */
  function reset() {
    Object.assign(params, DEFAULT_PARAMS)
  }

  /**
   * Update specific parameters
   */
  function update(updates: Partial<GlobalParams>) {
    Object.assign(params, updates)
  }

  /**
   * Get current params as plain object
   */
  function getParams(): GlobalParams {
    return { ...params }
  }

  return {
    params,
    isQuantizeMode,
    isPaletteMode,
    reset,
    update,
    getParams
  }
}
