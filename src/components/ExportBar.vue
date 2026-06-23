<script setup lang="ts">
import { ref } from 'vue'
import { downloadImage, generateFilename, downloadImagesAsGif, downloadImageAsWebP, downloadImageAsSvg } from '../utils/export'
import { useImageStore } from '../composables/useImageStore'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

interface Props {
  imageData: ImageData | null
  imageName?: string
  disabled?: boolean
  exporting?: boolean
}

interface Emits {
  (e: 'export'): void
}

const props = withDefaults(defineProps<Props>(), {
  imageName: 'image',
  disabled: false,
  exporting: false
})

const emit = defineEmits<Emits>()

const { getProcessableImages } = useImageStore()

const isExporting = ref(false)
const isExportingGif = ref(false)
const isExportingWebp = ref(false)
const isExportingSvg = ref(false)
const showHelp = ref(false)

async function handleExport() {
  if (!props.imageData || props.disabled || props.exporting) return

  isExporting.value = true
  emit('export')

  try {
    const filename = generateFilename(props.imageName)
    await downloadImage(props.imageData, filename)
  } catch (error) {
    console.error('Export failed:', error)
    alert(t.value('export.exportFailed'))
  } finally {
    isExporting.value = false
  }
}

async function handleExportGif() {
  const processableImages = getProcessableImages()
  if (processableImages.length < 2) {
    alert(t.value('export.gifMinImages'))
    return
  }

  isExportingGif.value = true
  try {
    const exportData = processableImages.map(img => ({
      name: img.name,
      data: img.processedData!
    }))
    await downloadImagesAsGif(exportData, { delay: 200, quality: 10 })
  } catch (error) {
    console.error('GIF export failed:', error)
    alert(t.value('export.gifFailed'))
  } finally {
    isExportingGif.value = false
  }
}

async function handleExportWebP() {
  if (!props.imageData || props.disabled) return

  isExportingWebp.value = true
  try {
    const filename = generateFilename(props.imageName, 'webp')
    await downloadImageAsWebP(props.imageData, filename)
  } catch (error) {
    console.error('WebP export failed:', error)
    alert(t.value('export.exportFailed'))
  } finally {
    isExportingWebp.value = false
  }
}

async function handleExportSvg() {
  if (!props.imageData || props.disabled) return

  isExportingSvg.value = true
  try {
    const filename = generateFilename(props.imageName, 'svg')
    await downloadImageAsSvg(props.imageData, filename)
  } catch (error) {
    console.error('SVG export failed:', error)
    alert(t.value('export.exportFailed'))
  } finally {
    isExportingSvg.value = false
  }
}
</script>

<template>
  <div class="claude-card" style="display: flex; align-items: center; gap: var(--claude-space-4); padding: var(--claude-space-3);">
    <div style="flex: 1;">
      <div class="flex items-center gap-2">
        <h3 class="claude-feature-title">{{ t('export.title') }}</h3>
        <button
          @click="showHelp = !showHelp"
          class="help-icon-btn claude-focusable"
          aria-label="Show export help"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <p class="claude-caption" style="color: var(--claude-stone-gray);">
        {{ t('export.subtitle') }}
      </p>
      <div v-if="showHelp" class="claude-body-small" style="margin-top: var(--claude-space-2); padding: var(--claude-space-2); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable);">
        <p style="margin-bottom: 4px; color: var(--claude-charcoal-warm);">{{ t('export.helpPng') }}</p>
        <p style="margin-bottom: 4px; color: var(--claude-charcoal-warm);">{{ t('export.helpGif') }}</p>
        <p style="margin-bottom: 4px; color: var(--claude-charcoal-warm);">{{ t('export.helpWebp') }}</p>
        <p style="color: var(--claude-charcoal-warm);">{{ t('export.helpSvg') }}</p>
      </div>
    </div>

    <div class="claude-touch-group" style="flex-direction: row; flex-wrap: wrap;">
      <button
        @click="handleExport"
        :disabled="!imageData || disabled || exporting || isExporting"
        class="claude-button-terracotta claude-focusable"
      >
        {{ isExporting ? t('export.exporting') : 'PNG' }}
      </button>
      <button
        @click="handleExportGif"
        :disabled="disabled || isExportingGif"
        class="claude-button-warm-sand claude-focusable"
      >
        {{ isExportingGif ? t('export.generating') : 'GIF' }}
      </button>
      <button
        @click="handleExportWebP"
        :disabled="!imageData || disabled || isExportingWebp"
        class="claude-button-warm-sand claude-focusable"
      >
        {{ isExportingWebp ? t('export.exporting') : 'WebP' }}
      </button>
      <button
        @click="handleExportSvg"
        :disabled="!imageData || disabled || isExportingSvg"
        class="claude-button-warm-sand claude-focusable"
      >
        {{ isExportingSvg ? t('export.exporting') : 'SVG' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.help-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--claude-stone-gray);
  transition: all 0.2s ease;
  position: relative;
}

.help-icon-btn svg {
  width: 14px;
  height: 14px;
}

.help-icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
}
</style>
