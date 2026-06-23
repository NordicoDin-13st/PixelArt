<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

interface Props {
  imageData: ImageData | null
  processing?: boolean
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  processing: false,
  zoom: 1
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function drawCanvas(data: ImageData) {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = data.width
  canvas.height = data.height
  ctx.putImageData(data, 0, 0)
  updateCanvasStyle()
}

watch(() => props.imageData, async (newData) => {
  if (newData) {
    await nextTick()
    drawCanvas(newData)
  }
})

watch(() => props.zoom, () => {
  updateCanvasStyle()
})

function updateCanvasStyle() {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const imgW = canvas.width
  const imgH = canvas.height
  if (imgW === 0 || imgH === 0) return

  const cW = container.clientWidth
  const cH = container.clientHeight
  if (cW === 0 || cH === 0) return

  const baseScale = Math.min(cW / imgW, cH / imgH)
  const displayScale = baseScale * props.zoom

  canvas.style.width = `${Math.floor(imgW * displayScale)}px`
  canvas.style.height = `${Math.floor(imgH * displayScale)}px`
  canvas.style.imageRendering = 'pixelated'
}

onMounted(() => {
  if (props.imageData) {
    drawCanvas(props.imageData)
  }
  updateCanvasStyle()

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => updateCanvasStyle())
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div ref="containerRef" class="flex items-center justify-center claude-card" style="min-height: 400px; overflow: hidden; background-color: var(--claude-dark-surface);">
    <div v-if="processing" style="text-align: center; color: var(--claude-warm-silver);">
      <div style="width: 48px; height: 48px; margin: 0 auto var(--claude-space-4); border: 3px solid var(--claude-warm-sand); border-top-color: var(--claude-terracotta); border-radius: 50%; animation: claude-spin 0.6s linear infinite;"></div>
      <p class="claude-body">{{ t('common.processing') }}</p>
    </div>

    <div v-else-if="!imageData" style="text-align: center; color: var(--claude-stone-gray);">
      <div class="text-6xl mb-4">🖼️</div>
      <p class="claude-body">{{ t('preview.uploadToStart') }}</p>
    </div>

    <canvas
      v-else
      ref="canvasRef"
      style="image-rendering: pixelated; border-radius: var(--claude-radius-comfortable);"
    />
  </div>

  <div v-if="imageData" class="claude-caption" style="margin-top: var(--claude-space-3); display: flex; align-items: center; justify-content: center; gap: var(--claude-space-4); color: var(--claude-stone-gray);">
    <div>
      <span style="font-weight: 500; color: var(--claude-charcoal-warm);">{{ t('preview.size') }}:</span> {{ imageData.width }} × {{ imageData.height }} {{ t('preview.pixels') }}
    </div>
    <div>
      <span style="font-weight: 500; color: var(--claude-charcoal-warm);">{{ t('preview.totalPixels') }}:</span> {{ imageData.width * imageData.height }}
    </div>
  </div>
</template>

<style scoped>
@keyframes claude-spin {
  to { transform: rotate(360deg); }
}
</style>
