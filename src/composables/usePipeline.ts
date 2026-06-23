import { ref } from 'vue'
import { createDefaultPipeline } from '../core/pipeline'
import type { ImageStoreItem } from './useImageStore'

interface WorkerResponse {
  id: string
  data: Uint8ClampedArray
  width: number
  height: number
  error?: string
}

let workerInstance: Worker | null = null
let requestId = 0
const pendingRequests = new Map<string, {
  resolve: (data: ImageData) => void
  reject: (error: Error) => void
}>()

function getWorker(): Worker | null {
  if (workerInstance) return workerInstance

  try {
    workerInstance = new Worker(
      new URL('../workers/pipeline.worker.ts', import.meta.url),
      { type: 'module' }
    )

    workerInstance.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, data, width, height, error } = e.data
      const pending = pendingRequests.get(id)
      if (!pending) return

      pendingRequests.delete(id)

      if (error) {
        pending.reject(new Error(error))
      } else {
        const imageData = new ImageData(new Uint8ClampedArray(data), width, height)
        pending.resolve(imageData)
      }
    }

    workerInstance.onerror = (e) => {
      console.error('Pipeline worker error:', e)
      for (const [id, pending] of pendingRequests) {
        pending.reject(new Error('Worker error'))
        pendingRequests.delete(id)
      }
    }

    return workerInstance
  } catch (err) {
    console.warn('Web Worker not available, falling back to main thread:', err)
    return null
  }
}

function processInWorker(
  imageData: ImageData,
  params: {
    mode: 'quantize' | 'palette'
    pixelSize: number
    colorCount?: number
    palettePreset?: string
    dither?: string
    effectFilters?: Array<{ id: string; params: Record<string, any>; enabled: boolean }>
  }
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    if (!worker) {
      reject(new Error('Worker not available'))
      return
    }

    const id = `${++requestId}`
    pendingRequests.set(id, { resolve, reject })

    const dataCopy = new Uint8ClampedArray(imageData.data)

    worker.postMessage(
      {
        id,
        data: dataCopy,
        width: imageData.width,
        height: imageData.height,
        params
      },
      [dataCopy.buffer]
    )
  })
}

function processInMainThread(
  imageData: ImageData,
  params: {
    mode: 'quantize' | 'palette'
    pixelSize: number
    colorCount?: number
    palettePreset?: string
    dither?: string
    effectFilters?: Array<{ id: string; params: Record<string, any>; enabled: boolean }>
  }
): ImageData {
  const pipeline = createDefaultPipeline(params)
  return pipeline.run(imageData)
}

export function usePipeline() {
  const processing = ref(false)
  const error = ref<string | null>(null)
  const useWorker = ref(true)

  async function processImage(item: ImageStoreItem): Promise<ImageData | null> {
    if (!item.originalData) return null

    processing.value = true
    error.value = null

    const params = {
      mode: item.params.mode,
      pixelSize: item.params.pixelSize,
      colorCount: item.params.colorCount,
      palettePreset: item.params.palettePreset,
      dither: item.params.dither,
      effectFilters: item.effectFilters
    }

    try {
      let result: ImageData

      if (useWorker.value) {
        try {
          result = await processInWorker(item.originalData, params)
        } catch (workerErr) {
          console.warn('Worker processing failed, falling back to main thread:', workerErr)
          useWorker.value = false
          await new Promise(resolve => setTimeout(resolve, 0))
          result = processInMainThread(item.originalData, params)
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 0))
        result = processInMainThread(item.originalData, params)
      }

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Processing failed'
      console.error('Pipeline processing error:', err)
      return null
    } finally {
      processing.value = false
    }
  }

  async function processBatch(items: ImageStoreItem[]): Promise<Map<string, ImageData>> {
    const results = new Map<string, ImageData>()

    for (const item of items) {
      if (!item.originalData) continue

      const result = await processImage(item)
      if (result) {
        results.set(item.id, result)
      }
    }

    return results
  }

  return {
    processing,
    error,
    useWorker,
    processImage,
    processBatch
  }
}
