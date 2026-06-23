/**
 * Parameter definition for filter configuration UI
 */
export interface ParamDef {
  type: 'number' | 'boolean' | 'select' | 'color' | 'range' | 'hidden'
  default: any
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: any; label: string }>
  label: string
  description?: string
}

/**
 * Filter interface for image processing pipeline
 * All filters must implement this interface to work with the pipeline system
 */
export interface Filter {
  id: string
  name: string
  description?: string
  params: Record<string, ParamDef>
  apply(input: ImageData, params: Record<string, any>): ImageData
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  filter: Filter
  params: Record<string, any>
  enabled: boolean
}

/**
 * Pipeline for orchestrating multiple filters
 */
export interface Pipeline {
  filters: PipelineConfig[]
  run(source: ImageData): ImageData
}

/**
 * Image metadata with associated parameters
 */
export interface ImageMeta {
  id: string
  name: string
  originalData: ImageData
  processedData: ImageData | null
  params: Record<string, any>
  timestamp: number
}
