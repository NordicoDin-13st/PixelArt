/**
 * Image store composable
 * Manages list of images with individual parameters
 */

import { reactive, computed, ref } from 'vue'
import type { GlobalParams } from './useGlobalParams'

export interface ImageStoreItem {
  id: string
  name: string
  originalData: ImageData | null
  processedData: ImageData | null
  params: GlobalParams
  effectFilters?: Array<{ id: string; params: Record<string, any>; enabled: boolean }>
  timestamp: number
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Image store composable
 */
export function useImageStore() {
  const images = reactive<ImageStoreItem[]>([])
  const selectedId = ref<string | null>(null)
  const processing = ref(false)

  const selectedImage = computed(() => {
    return images.find(img => img.id === selectedId.value) || null
  })

  const imageCount = computed(() => images.length)

  /**
   * Add a new image to the store
   */
  function addImage(name: string, data: ImageData, defaultParams: GlobalParams): string {
    const id = generateId()
    const item: ImageStoreItem = {
      id,
      name,
      originalData: data,
      processedData: null,
      params: { ...defaultParams },
      effectFilters: [],
      timestamp: Date.now()
    }
    images.push(item)
    selectedId.value = id
    return id
  }

  /**
   * Remove an image from the store
   */
  function removeImage(id: string) {
    const index = images.findIndex(img => img.id === id)
    if (index !== -1) {
      images.splice(index, 1)
      if (selectedId.value === id) {
        selectedId.value = images.length > 0 ? images[0].id : null
      }
    }
  }

  /**
   * Update processed data for an image
   */
  function updateProcessedData(id: string, data: ImageData) {
    const image = images.find(img => img.id === id)
    if (image) {
      image.processedData = data
    }
  }

  /**
   * Update parameters for an image
   */
  function updateImageParams(id: string, params: Partial<GlobalParams>) {
    const image = images.find(img => img.id === id)
    if (image) {
      Object.assign(image.params, params)
    }
  }

  /**
   * Select an image
   */
  function selectImage(id: string) {
    if (images.find(img => img.id === id)) {
      selectedId.value = id
    }
  }

  /**
   * Clear all images
   */
  function clear() {
    images.length = 0
    selectedId.value = null
  }

  /**
   * Get all images for batch export
   */
  function getProcessableImages(): ImageStoreItem[] {
    return images.filter(img => img.processedData !== null)
  }

  return {
    images,
    selectedId,
    selectedImage,
    imageCount,
    processing,
    addImage,
    removeImage,
    updateProcessedData,
    updateImageParams,
    selectImage,
    clear,
    getProcessableImages
  }
}
