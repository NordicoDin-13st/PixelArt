<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

interface Props {
  originalData: ImageData
  processedData: ImageData
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 1
})

const containerRef = ref<HTMLDivElement | null>(null)
const originalCanvasRef = ref<HTMLCanvasElement | null>(null)
const processedCanvasRef = ref<HTMLCanvasElement | null>(null)
const sliderPosition = ref(50)
const isDragging = ref(false)
const compareMode = ref<'slider' | 'sideBySide'>('slider')
let resizeObserver: ResizeObserver | null = null

function drawCanvas(canvas: HTMLCanvasElement | null, data: ImageData) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  canvas.width = data.width
  canvas.height = data.height
  ctx.putImageData(data, 0, 0)
}

function updateLayout() {
  const container = containerRef.value
  const origCanvas = originalCanvasRef.value
  const procCanvas = processedCanvasRef.value
  if (!container || !origCanvas || !procCanvas) return

  const imgW = origCanvas.width
  const imgH = origCanvas.height
  if (imgW === 0 || imgH === 0) return

  const cW = container.clientWidth
  const cH = container.clientHeight
  if (cW === 0 || cH === 0) return

  const baseScale = Math.min(cW / imgW, cH / imgH)
  const displayScale = baseScale * props.zoom

  const displayW = Math.floor(imgW * displayScale)
  const displayH = Math.floor(imgH * displayScale)

  if (compareMode.value === 'slider') {
    origCanvas.style.width = `${displayW}px`
    origCanvas.style.height = `${displayH}px`
    origCanvas.style.imageRendering = 'pixelated'
    procCanvas.style.width = `${displayW}px`
    procCanvas.style.height = `${displayH}px`
    procCanvas.style.imageRendering = 'pixelated'
    procCanvas.style.clipPath = `inset(0 0 0 ${sliderPosition.value}%)`
  } else {
    const halfW = Math.floor(displayW / 2)
    origCanvas.style.width = `${halfW}px`
    origCanvas.style.height = `${displayH}px`
    origCanvas.style.imageRendering = 'pixelated'
    procCanvas.style.width = `${halfW}px`
    procCanvas.style.height = `${displayH}px`
    procCanvas.style.imageRendering = 'pixelated'
    procCanvas.style.clipPath = 'none'
  }
}

function handleSliderMove(clientX: number) {
  if (!isDragging.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = clientX - rect.left
  sliderPosition.value = Math.max(0, Math.min(100, (x / rect.width) * 100))
  updateLayout()
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  handleSliderMove(e.clientX)
}

function handleMouseMove(e: MouseEvent) {
  handleSliderMove(e.clientX)
}

function handleMouseUp() {
  isDragging.value = false
}

function handleTouchStart(e: TouchEvent) {
  isDragging.value = true
  handleSliderMove(e.touches[0].clientX)
}

function handleTouchMove(e: TouchEvent) {
  handleSliderMove(e.touches[0].clientX)
}

function handleTouchEnd() {
  isDragging.value = false
}

watch(() => props.originalData, async () => {
  await nextTick()
  drawCanvas(originalCanvasRef.value, props.originalData)
  updateLayout()
})

watch(() => props.processedData, async () => {
  await nextTick()
  drawCanvas(processedCanvasRef.value, props.processedData)
  updateLayout()
})

watch(() => props.zoom, () => updateLayout())
watch(compareMode, () => updateLayout())

onMounted(() => {
  drawCanvas(originalCanvasRef.value, props.originalData)
  drawCanvas(processedCanvasRef.value, props.processedData)
  updateLayout()

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => updateLayout())
    resizeObserver.observe(containerRef.value)
  }

  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('touchend', handleTouchEnd)
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('touchmove', handleTouchMove)
})
</script>

<template>
  <div class="claude-card" style="overflow: hidden;">
    <div class="flex items-center gap-2" style="padding: var(--claude-space-2) var(--claude-space-3); border-bottom: 1px solid var(--claude-border-cream);">
      <button
        @click="compareMode = 'slider'"
        :class="compareMode === 'slider' ? 'claude-button-terracotta' : 'claude-button-warm-sand'"
        class="claude-focusable"
        style="font-size: 12px; padding: 2px 8px; min-height: 24px;"
      >
        {{ t('preview.slider') }}
      </button>
      <button
        @click="compareMode = 'sideBySide'"
        :class="compareMode === 'sideBySide' ? 'claude-button-terracotta' : 'claude-button-warm-sand'"
        class="claude-focusable"
        style="font-size: 12px; padding: 2px 8px; min-height: 24px;"
      >
        {{ t('preview.sideBySide') }}
      </button>
    </div>

    <div
      ref="containerRef"
      class="flex items-center justify-center"
      style="min-height: 400px; position: relative; background-color: var(--claude-dark-surface); overflow: hidden; user-select: none;"
      @mousedown="compareMode === 'slider' && handleMouseDown($event)"
      @touchstart="compareMode === 'slider' && handleTouchStart($event)"
    >
      <template v-if="compareMode === 'slider'">
        <canvas
          ref="originalCanvasRef"
          style="image-rendering: pixelated; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"
        />
        <canvas
          ref="processedCanvasRef"
          style="image-rendering: pixelated; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"
        />
        <div
          style="position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--claude-terracotta); z-index: 10; pointer-events: none;"
          :style="{ left: sliderPosition + '%' }"
        >
          <div
            style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; border-radius: 50%; background: var(--claude-terracotta); display: flex; align-items: center; justify-content: center; cursor: ew-resize; box-shadow: 0 2px 8px rgba(0,0,0,0.3); pointer-events: auto;"
          >
            <svg style="width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>
        <div style="position: absolute; top: 8px; left: 8px; z-index: 5; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; pointer-events: none;">
          {{ t('preview.original') }}
        </div>
        <div style="position: absolute; top: 8px; right: 8px; z-index: 5; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; pointer-events: none;">
          {{ t('preview.processed') }}
        </div>
      </template>

      <template v-else>
        <div style="display: flex; gap: 2px; align-items: center; justify-content: center;">
          <div style="position: relative;">
            <canvas ref="originalCanvasRef" style="image-rendering: pixelated;" />
            <div style="position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
              {{ t('preview.original') }}
            </div>
          </div>
          <div style="position: relative;">
            <canvas ref="processedCanvasRef" style="image-rendering: pixelated;" />
            <div style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
              {{ t('preview.processed') }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
