<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Uploader from './components/Uploader.vue'
import ImageGallery from './components/ImageGallery.vue'
import ParamPanel from './components/ParamPanel.vue'
import PreviewCanvas from './components/PreviewCanvas.vue'
import ComparisonView from './components/ComparisonView.vue'
import ExportBar from './components/ExportBar.vue'
import VariantGenerator from './components/VariantGenerator.vue'
import PresetManager from './components/PresetManager.vue'
import { useGlobalParams } from './composables/useGlobalParams'
import { useImageStore } from './composables/useImageStore'
import { usePipeline } from './composables/usePipeline'
import { useDarkMode } from './composables/useDarkMode'
import { useI18n } from './composables/useI18n'
import { downloadImagesAsZip } from './utils/export'

const { t, toggleLocale, isEnglish } = useI18n()
const { params: globalParams } = useGlobalParams()
const imageStore = useImageStore()
const { selectedImage, images, addImage, updateProcessedData, updateImageParams, getProcessableImages } = imageStore
const { processImage, processing: pipelineProcessing, useWorker } = usePipeline()
const { isDarkMode, toggleDarkMode } = useDarkMode()

const processing = pipelineProcessing

const showUploader = ref(false)
const zoom = ref(1)
const batchProcessing = ref(false)
const viewMode = ref<'preview' | 'comparison'>('preview')

const canCompare = computed(() =>
  selectedImage.value?.originalData && selectedImage.value?.processedData
)

async function handleUpload(files: { name: string; data: ImageData }[]) {
  try {
    for (const file of files) {
      const id = addImage(file.name, file.data, globalParams)
      await processAndUpdate(id)
    }
    showUploader.value = false
  } catch (error) {
    console.error('Error in handleUpload:', error)
  }
}

async function processAndUpdate(id: string) {
  const image = images.find(img => img.id === id)
  if (!image) return

  const result = await processImage(image)
  if (result) {
    updateProcessedData(id, result)
  }
}

watch(globalParams, async () => {
  if (selectedImage.value) {
    updateImageParams(selectedImage.value.id, globalParams)
    await processAndUpdate(selectedImage.value.id)
  }
}, { deep: true })

function handleZoom(delta: number) {
  zoom.value = Math.max(1, Math.min(10, zoom.value + delta))
}

async function handleBatchApply() {
  batchProcessing.value = true
  try {
    for (const image of images) {
      updateImageParams(image.id, globalParams)
      await processAndUpdate(image.id)
    }
  } finally {
    batchProcessing.value = false
  }
}

async function handleBatchExport() {
  const processableImages = getProcessableImages()
  if (processableImages.length === 0) {
    alert(t.value('export.noExportableImages'))
    return
  }

  const exportData = processableImages.map(img => ({
    name: img.name,
    data: img.processedData!
  }))

  try {
    await downloadImagesAsZip(exportData)
  } catch (error) {
    console.error('Batch export failed:', error)
    alert(t.value('export.batchExportFailed'))
  }
}

function handlePresetLoad(params: Record<string, any>) {
  Object.assign(globalParams, params)
}
</script>

<template>
  <div class="min-h-screen claude-body" style="background-color: var(--claude-parchment);">
    <a href="#main-content" class="claude-skip-link claude-focusable">
      {{ t('common.skipToContent') }}
    </a>

    <!-- Header -->
    <header class="claude-bg-white shadow-sm transition-colors" role="banner" style="border-bottom: 1px solid var(--claude-border-cream);">
      <div class="claude-container">
        <div class="flex items-center justify-between" style="padding: var(--claude-space-1) var(--claude-space-2);">
          <div>
            <h1 class="claude-heading" style="font-size: var(--claude-size-subheading); color: var(--claude-near-black);">{{ t('app.title') }}</h1>
            <p class="claude-body-small" style="color: var(--claude-stone-gray); margin-top: 1px;">{{ t('app.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="toggleLocale"
              class="claude-button-warm-sand claude-focusable"
              :aria-label="isEnglish ? 'Switch to Chinese' : '切换到英文'"
              :title="isEnglish ? 'Switch to Chinese' : '切换到英文'"
              style="padding: 4px 8px; min-height: 28px; min-width: 28px; font-size: 13px; font-weight: 500;"
            >
              {{ isEnglish ? '中' : 'EN' }}
            </button>
            <button
              @click="toggleDarkMode"
              class="claude-button-warm-sand claude-focusable"
              :aria-label="isDarkMode ? t('darkMode.switchToLight') : t('darkMode.switchToDark')"
              :title="isDarkMode ? t('darkMode.switchToLight') : t('darkMode.switchToDark')"
              style="padding: 4px 8px; min-height: 28px; min-width: 28px;"
            >
              <svg v-if="!isDarkMode" class="w-6 h-6" style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="w-6 h-6" style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span class="claude-sr-only">{{ isDarkMode ? t('darkMode.switchToLight') : t('darkMode.switchToDark') }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main id="main-content" class="claude-container" style="padding-top: var(--claude-space-6); padding-bottom: var(--claude-space-6);" role="main">
      <!-- Empty State -->
      <div v-if="images.length === 0" style="display: flex; flex-direction: column; gap: var(--claude-space-4);">
        <Uploader
          :global-params="globalParams"
          @upload="handleUpload"
        />
      </div>

      <!-- Editor -->
      <div v-else class="claude-grid editor-container" style="grid-template-columns: 1fr; gap: var(--claude-space-4);">
        <!-- Left: Gallery -->
        <div class="editor-grid" style="grid-column: span 1;">
          <ImageGallery
            @batch-apply="handleBatchApply"
            @batch-export="handleBatchExport"
            @add-image="showUploader = true"
          />
        </div>

        <!-- Middle: Preview -->
        <div class="editor-grid" style="grid-column: span 2;">
          <!-- Zoom & View Controls -->
          <div class="claude-card" style="padding: var(--claude-space-3);">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h2 class="claude-heading" style="font-size: var(--claude-size-subheading-small);">{{ t('preview.title') }}</h2>
              <div class="flex items-center gap-2">
                <div v-if="canCompare" class="claude-touch-group">
                  <button
                    @click="viewMode = 'preview'"
                    :class="viewMode === 'preview' ? 'claude-button-terracotta' : 'claude-button-warm-sand'"
                    class="claude-focusable"
                    style="font-size: 12px; padding: 2px 8px; min-height: 24px;"
                  >
                    {{ t('preview.processed') }}
                  </button>
                  <button
                    @click="viewMode = 'comparison'"
                    :class="viewMode === 'comparison' ? 'claude-button-terracotta' : 'claude-button-warm-sand'"
                    class="claude-focusable"
                    style="font-size: 12px; padding: 2px 8px; min-height: 24px;"
                  >
                    {{ t('preview.comparison') }}
                  </button>
                </div>
                <div class="claude-touch-group">
                  <button
                    @click="handleZoom(-1)"
                    :disabled="zoom <= 1"
                    class="claude-button-warm-sand claude-focusable"
                    :aria-label="t('preview.zoomOut')"
                    aria-live="polite"
                  >
                    <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                    <span class="claude-sr-only">{{ t('preview.zoomOut') }}</span>
                  </button>
                  <span class="claude-body" style="min-width: 60px; text-align: center; font-size: var(--claude-size-subheading); min-height: var(--claude-touch-min); display: flex; align-items: center; justify-content: center;" aria-live="polite" :aria-label="t('preview.currentZoom', { zoom })">
                    {{ zoom }}×
                  </span>
                  <button
                    @click="handleZoom(1)"
                    :disabled="zoom >= 10"
                    class="claude-button-warm-sand claude-focusable"
                    :aria-label="t('preview.zoomIn')"
                    aria-live="polite"
                  >
                    <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="claude-sr-only">{{ t('preview.zoomIn') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Comparison View -->
          <ComparisonView
            v-if="viewMode === 'comparison' && canCompare && selectedImage"
            :original-data="selectedImage.originalData!"
            :processed-data="selectedImage.processedData!"
            :zoom="zoom"
          />

          <!-- Canvas Preview -->
          <PreviewCanvas
            v-else-if="selectedImage"
            :image-data="selectedImage.processedData"
            :processing="processing"
            :zoom="zoom"
          />

          <!-- Export Bar -->
          <ExportBar
            v-if="selectedImage"
            :image-data="selectedImage.processedData"
            :image-name="selectedImage.name"
            :disabled="processing"
          />
        </div>

        <!-- Right: Parameters -->
        <div style="display: flex; flex-direction: column; gap: var(--claude-space-4);">
          <ParamPanel
            :model-value="globalParams"
            @update:model-value="(val) => Object.assign(globalParams, val)"
            :disabled="processing"
          />

          <PresetManager
            :current-params="globalParams"
            @load-preset="handlePresetLoad"
          />

          <VariantGenerator />

          <div v-if="selectedImage && selectedImage.effectFilters && selectedImage.effectFilters.length > 0" class="claude-card" style="background-color: rgba(201, 100, 66, 0.1); border-color: var(--claude-terracotta);">
            <p class="claude-body-small" style="color: var(--claude-terracotta);">
              {{ t('variants.appliedFilters', { count: selectedImage.effectFilters.length }) }}
            </p>
          </div>

          <!-- File Info -->
          <div v-if="selectedImage" class="claude-card">
            <h3 class="claude-heading-small" style="margin-bottom: var(--claude-space-2);">{{ t('fileInfo.title') }}</h3>
            <div style="display: flex; flex-direction: column; gap: var(--claude-space-2);">
              <div class="flex justify-between claude-body">
                <span style="color: var(--claude-stone-gray);">{{ t('fileInfo.fileName') }}:</span>
                <span style="color: var(--claude-near-black); font-weight: 400;">{{ selectedImage.name }}</span>
              </div>
              <div v-if="selectedImage.originalData" class="flex justify-between claude-body">
                <span style="color: var(--claude-stone-gray);">{{ t('fileInfo.originalSize') }}:</span>
                <span style="color: var(--claude-near-black); font-weight: 400;">
                  {{ selectedImage.originalData.width }} × {{ selectedImage.originalData.height }}
                </span>
              </div>
              <div v-if="selectedImage.processedData" class="flex justify-between claude-body">
                <span style="color: var(--claude-stone-gray);">{{ t('fileInfo.pixelSize') }}:</span>
                <span style="color: var(--claude-near-black); font-weight: 400;">
                  {{ selectedImage.processedData.width }} × {{ selectedImage.processedData.height }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer style="background-color: var(--claude-warm-sand); border-top: 1px solid var(--claude-border-cream); margin-top: auto;" role="contentinfo">
      <div class="claude-container" style="padding-top: var(--claude-space-6); padding-bottom: var(--claude-space-6); text-align: center;">
        <p class="claude-caption" style="color: var(--claude-stone-gray);">
          {{ t('app.footer') }}
        </p>
        <p class="claude-caption" style="color: var(--claude-stone-gray); margin-top: var(--claude-space-2);">
          {{ t('app.footerSub') }}
        </p>
        <p class="claude-caption" style="color: var(--claude-stone-gray); margin-top: var(--claude-space-2);">
          ⚡ {{ useWorker ? 'Web Worker' : 'Main Thread' }} Processing
        </p>
      </div>
    </footer>

    <!-- Uploader Modal -->
    <div
      v-if="showUploader"
      class="fixed inset-0 flex items-center justify-center p-4 claude-focusable"
      style="z-index: var(--claude-z-modal-backdrop); background-color: rgba(20, 20, 19, 0.75);"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      @click.self="showUploader = false"
      @keydown.esc="showUploader = false"
    >
      <div
        class="claude-card-hero max-w-2xl w-full"
        style="z-index: var(--claude-z-modal); max-height: 90vh; overflow-y: auto; border-color: var(--claude-terracotta);"
        role="document"
      >
        <div class="flex items-center justify-between" style="padding: var(--claude-space-4); border-bottom: 1px solid var(--claude-border-cream);">
          <h3 id="modal-title" class="claude-heading-small">{{ t('uploader.modalTitle') }}</h3>
          <button
            @click="showUploader = false"
            class="claude-button-warm-sand claude-focusable"
            :aria-label="t('common.close')"
            style="min-height: 36px; min-width: 36px; padding: var(--claude-space-1);"
          >
            <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span class="claude-sr-only">{{ t('common.close') }}</span>
          </button>
        </div>
        <div style="padding: var(--claude-space-6);">
          <Uploader
            v-model="showUploader"
            :global-params="globalParams"
            @upload="handleUpload"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: grid;
}

@media (min-width: 1024px) {
  .editor-container {
    grid-template-columns: repeat(4, 1fr) !important;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .editor-container {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 767px) {
  .editor-grid {
    grid-column: span 1 !important;
  }
}
</style>
