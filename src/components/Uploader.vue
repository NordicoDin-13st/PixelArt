<script setup lang="ts">
import { ref } from 'vue'
import type { GlobalParams } from '../composables/useGlobalParams'
import { loadImageFromFile } from '../utils/canvas'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

interface Props {
  modelValue?: boolean
  globalParams: GlobalParams
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'upload', files: { name: string; data: ImageData }[]): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isProcessing = ref(false)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files) {
    await processFiles(files)
  }
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files) {
    await processFiles(files)
  }
  target.value = ''
}

async function processFiles(files: FileList) {
  isProcessing.value = true
  const results: { name: string; data: ImageData }[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    if (!file.type.match(/image\/(png|jpeg|webp)/)) {
      console.warn(`Skipping ${file.name}: unsupported file type`)
      continue
    }

    try {
      const imageData = await loadImageFromFile(file)
      results.push({ name: file.name, data: imageData })
    } catch (error) {
      console.error(`Error loading ${file.name}:`, error)
    }
  }

  isProcessing.value = false

  if (results.length > 0) {
    emit('upload', results)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer claude-card-interactive"
    :class="[
      isDragging ? 'border-terracotta' : 'border-warm hover:border-charcoal-warm',
      isProcessing ? 'opacity-50 pointer-events-none' : ''
    ]"
    style="border-color: var(--claude-border-warm);"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="image/png,image/jpeg,image/webp"
      multiple
      @change="handleFileSelect"
    />

    <div style="display: flex; flex-direction: column; gap: var(--claude-space-4);">
      <div class="text-6xl">🎨</div>

      <div>
        <h3 class="claude-heading" style="font-size: var(--claude-size-feature-title); color: var(--claude-near-black);">
          {{ isProcessing ? t('uploader.processing') : t('uploader.dragHere') }}
        </h3>
        <p class="claude-body-small" style="color: var(--claude-stone-gray); margin-top: var(--claude-space-1);">
          {{ t('uploader.supportedFormats') }}
        </p>
      </div>

      <div class="claude-caption" style="color: var(--claude-stone-gray);">
        {{ t('uploader.clickToSelect') }}
      </div>
    </div>
  </div>
</template>
