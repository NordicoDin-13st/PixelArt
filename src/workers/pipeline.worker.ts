import { createDefaultPipeline } from '../core/pipeline'

interface WorkerMessage {
  id: string
  data: Uint8ClampedArray
  width: number
  height: number
  params: {
    mode: 'quantize' | 'palette'
    pixelSize: number
    colorCount?: number
    palettePreset?: string
    dither?: string
    effectFilters?: Array<{ id: string; params: Record<string, any>; enabled: boolean }>
  }
}

interface WorkerResponse {
  id: string
  data: Uint8ClampedArray
  width: number
  height: number
  error?: string
}

type WorkerScope = {
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void
}

const workerScope = self as unknown as WorkerScope

workerScope.onmessage = function (e: MessageEvent<WorkerMessage>) {
  const { id, data, width, height, params } = e.data

  try {
    const imageData = new ImageData(new Uint8ClampedArray(data), width, height)

    const pipeline = createDefaultPipeline(params)
    const result = pipeline.run(imageData)

    const response: WorkerResponse = {
      id,
      data: result.data,
      width: result.width,
      height: result.height
    }

    workerScope.postMessage(response, [response.data.buffer as ArrayBuffer])
  } catch (err) {
    const response: WorkerResponse = {
      id,
      data: new Uint8ClampedArray(0),
      width: 0,
      height: 0,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
    workerScope.postMessage(response)
  }
}
