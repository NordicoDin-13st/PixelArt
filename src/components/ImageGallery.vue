<script setup lang="ts">
import { ref } from 'vue'
import { useImageStore } from '../composables/useImageStore'
import { imageDataToDataURL } from '../utils/canvas'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
const { images, selectedId, selectImage, removeImage, imageCount } = useImageStore()
const showHelp = ref(false)

const emit = defineEmits<{
  'batch-apply': [params: any]
  'batch-export': []
  'add-image': []
}>()

function handleSelectImage(id: string) {
  selectImage(id)
}

function handleRemoveImage(id: string, event: Event) {
  event.stopPropagation()
  if (confirm(t.value('gallery.confirmDelete'))) {
    removeImage(id)
  }
}

function handleBatchApply() {
  emit('batch-apply', {})
}

function handleBatchExport() {
  emit('batch-export')
}
</script>

<template>
  <div class="claude-card" role="region" aria-label="Image Gallery">
    <div class="flex items-center justify-between flex-wrap gap-2" style="padding: var(--claude-space-2) var(--claude-space-3); border-bottom: 1px solid var(--claude-border-cream);">
      <div class="flex items-center gap-2">
        <h2 class="claude-heading-small">{{ t('gallery.title') }} ({{ imageCount }})</h2>
        <button
          @click="showHelp = !showHelp"
          class="help-icon-btn claude-focusable"
          aria-label="Show gallery help"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showHelp" class="claude-body-small" style="padding: var(--claude-space-2) var(--claude-space-3); background-color: var(--claude-ivory); border-bottom: 1px solid var(--claude-border-cream);">
      <p style="margin-bottom: var(--claude-space-1); color: var(--claude-charcoal-warm);">
        {{ t('gallery.helpList') }}
      </p>
      <p style="margin-bottom: var(--claude-space-1); color: var(--claude-charcoal-warm);">
        {{ t('gallery.helpBatchApply') }}
      </p>
      <p style="color: var(--claude-charcoal-warm);">
        {{ t('gallery.helpBatchExport') }}
      </p>
    </div>

    <div style="padding: var(--claude-space-3);">
      <div class="claude-touch-group">
        <button
          @click="emit('add-image')"
          class="claude-button-warm-sand claude-focusable"
          :aria-label="t('gallery.addImage')"
        >
          <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ t('gallery.addImage') }}
        </button>

        <template v-if="imageCount > 1">
          <button
            @click="handleBatchApply"
            class="claude-button-warm-sand claude-focusable"
            :aria-label="t('gallery.batchApply')"
          >
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ t('gallery.batchApply') }}
          </button>
          <button
            @click="handleBatchExport"
            class="claude-button-warm-sand claude-focusable"
            :aria-label="t('gallery.batchExport')"
          >
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ t('gallery.batchExport') }}
          </button>
        </template>
      </div>
    </div>

    <div v-if="imageCount > 0" class="claude-grid" style="padding: var(--claude-space-3); max-height: 600px; overflow-y: auto;" role="listbox" :aria-label="`${t('gallery.title')}: ${imageCount}`">
      <button
        v-for="image in images"
        :key="image.id"
        @click="handleSelectImage(image.id)"
        :aria-label="`${t('gallery.selectImage')}: ${image.name}`"
        :aria-selected="selectedId === image.id"
        :class="[
          'relative group cursor-pointer claude-card-interactive claude-focusable',
          selectedId === image.id ? 'claude-card-featured' : ''
        ]"
        :style="selectedId === image.id ? 'border-color: var(--claude-terracotta); box-shadow: var(--claude-shadow-ring-deep);' : ''"
        role="option"
      >
        <div class="aspect-square overflow-hidden" style="background-color: var(--claude-warm-sand); border-radius: var(--claude-radius-comfortable);">
          <img
            v-if="image.processedData"
            :src="imageDataToDataURL(image.processedData)"
            :alt="`${image.name} preview`"
            style="max-width: 100%; height: auto; display: block;"
            loading="lazy"
          />
          <div v-else class="w-full h-full flex items-center justify-center" style="color: var(--claude-stone-gray);">
            <svg style="width: 48px; height: 48px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0 p-2" style="background: linear-gradient(to top, rgba(201, 100, 66, 0.9), transparent);">
          <p class="claude-label" style="font-size: 12px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ image.name }}</p>
          <p v-if="image.processedData" class="claude-caption" style="font-size: 11px; color: rgba(255,255,255,0.9);">
            {{ image.processedData.width }}×{{ image.processedData.height }}
          </p>
        </div>

        <button
          @click="handleRemoveImage(image.id, $event)"
          class="claude-button-warm-sand claude-focusable absolute top-2 right-2 delete-btn"
          :aria-label="`${t('common.delete')}: ${image.name}`"
          style="min-height: 36px; min-width: 36px; padding: var(--claude-space-1); opacity: 0; transition: opacity var(--claude-transition-fast) ease;"
        >
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="claude-sr-only">{{ t('common.delete') }}</span>
        </button>
      </button>
    </div>

    <div v-else class="claude-body" style="padding: var(--claude-space-6); text-align: center; color: var(--claude-stone-gray);" role="status" aria-live="polite">
      <svg style="width: 64px; height: 64px; margin: 0 auto var(--claude-space-4); color: var(--claude-terracotta);" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="claude-feature-title" style="margin: 0;">{{ t('gallery.noImages') }}</p>
    </div>
  </div>
</template>

<style scoped>
.group:hover .delete-btn {
  opacity: 1 !important;
}

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
