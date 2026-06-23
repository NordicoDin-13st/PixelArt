<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImageStore } from '../composables/useImageStore'
import { usePipeline } from '../composables/usePipeline'
import { getEffectFilters } from '../core/filters'
import { useI18n } from '../composables/useI18n'
import type { Filter } from '../core/types'

const { t } = useI18n()
const { selectedImage, addImage, updateProcessedData, images } = useImageStore()
const { processImage } = usePipeline()

const variantCount = ref(4)
const selectedFilters = ref<Set<string>>(new Set(['paletteRandom', 'noise']))
const isGenerating = ref(false)
const showHelp = ref(false)

const availableFilters = computed(() => getEffectFilters())
const hasSelectedImage = computed(() => selectedImage.value !== null)

function toggleFilter(filterId: string) {
  const newSet = new Set(selectedFilters.value)
  if (newSet.has(filterId)) {
    newSet.delete(filterId)
  } else {
    newSet.add(filterId)
  }
  selectedFilters.value = newSet
}

function getFilterName(filter: Filter): string {
  const key = `filters.${filter.id}`
  const translated = t.value(key)
  return translated !== key ? translated : filter.name
}

async function generateVariants() {
  if (!selectedImage.value || !selectedImage.value.originalData || selectedFilters.value.size === 0) {
    alert(t.value('variants.selectAtLeastOne'))
    return
  }

  isGenerating.value = true

  try {
    const baseImage = selectedImage.value
    const sourceData = baseImage.originalData
    if (!sourceData) return

    const filters = availableFilters.value.filter(f =>
      selectedFilters.value.has(f.id)
    )

    for (let i = 0; i < variantCount.value; i++) {
      const variantName = `${baseImage.name}_variant_${i + 1}`
      const variantData = sourceData

      const id = addImage(variantName, variantData, baseImage.params)

      const imageItem = images.find(img => img.id === id)
      if (imageItem) {
        const numFilters = Math.floor(Math.random() * 3) + 1
        const shuffled = [...filters].sort(() => Math.random() - 0.5)
        const selectedForVariant = shuffled.slice(0, numFilters)

        imageItem.effectFilters = selectedForVariant.map(filter => ({
          id: filter.id,
          params: generateRandomParams(filter),
          enabled: true
        }))

        const result = await processImage(imageItem)
        if (result) {
          updateProcessedData(id, result)
        }
      }
    }
  } catch (error) {
    console.error('Failed to generate variants:', error)
    alert(t.value('variants.generateFailed'))
  } finally {
    isGenerating.value = false
  }
}

function generateRandomParams(filter: Filter): Record<string, any> {
  const params: Record<string, any> = {}

  for (const [key, param] of Object.entries(filter.params)) {
    if (key === 'seed' || key === 'randomSeed') {
      params[key] = Math.random() * 1000000
      continue
    }

    switch (param.type) {
      case 'range':
        const range = param as { min: number; max: number }
        params[key] = Math.random() * (range.max - range.min) + range.min
        break
      case 'boolean':
        params[key] = Math.random() > 0.5
        break
      case 'select':
        const select = param as { options: { value: any }[] }
        params[key] = select.options[Math.floor(Math.random() * select.options.length)].value
        break
      default:
        params[key] = param.default
    }
  }

  return params
}
</script>

<template>
  <div class="claude-card" role="region" aria-label="Random Variant Generator">
    <div class="flex items-center gap-2" style="margin-bottom: var(--claude-space-3);">
      <h3 class="claude-heading-small">{{ t('variants.title') }}</h3>
      <button
        @click="showHelp = !showHelp"
        class="help-icon-btn claude-focusable"
        aria-label="Show variant help"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>

    <div v-if="showHelp" class="claude-body-small" style="padding: var(--claude-space-2); margin-bottom: var(--claude-space-3); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable); border: 1px solid var(--claude-border-cream);">
      <p style="margin-bottom: var(--claude-space-2); color: var(--claude-charcoal-warm);">
        <strong>{{ t('variants.helpTitle') }}:</strong> {{ t('variants.helpDesc') }}
      </p>
      <p style="margin-bottom: var(--claude-space-2); color: var(--claude-charcoal-warm);">
        <strong>{{ t('variants.selectFilters') }}:</strong> {{ t('variants.helpFilters') }}
      </p>
      <p style="color: var(--claude-charcoal-warm);">
        <strong>{{ t('variants.count') }}:</strong> {{ t('variants.helpCount') }}
      </p>
    </div>

    <div style="margin-bottom: var(--claude-space-4);">
      <label for="variant-count" class="claude-label" style="display: block; margin-bottom: var(--claude-space-2); color: var(--claude-olive-gray);">
        {{ t('variants.count') }}: {{ variantCount }}
      </label>
      <input
        id="variant-count"
        v-model.number="variantCount"
        type="range"
        min="1"
        max="10"
        class="claude-input claude-focusable"
        style="width: calc(100% - 48px); margin: 0 24px; accent-color: var(--claude-terracotta);"
        aria-valuemin="1"
        aria-valuemax="10"
        :aria-valuenow="variantCount"
      />
    </div>

    <div style="margin-bottom: var(--claude-space-4);">
      <fieldset style="border: none; padding: 0; margin: 0;">
        <legend class="claude-label" style="margin-bottom: var(--claude-space-2); color: var(--claude-olive-gray);">
          {{ t('variants.selectFilters') }}
        </legend>
        <div class="claude-grid" style="grid-template-columns: repeat(2, 1fr); gap: var(--claude-space-2);">
          <label
            v-for="filter in availableFilters"
            :key="filter.id"
            class="claude-card flex items-center gap-2 cursor-pointer transition-all claude-focusable"
            style="padding: var(--claude-space-2); border-color: var(--claude-terracotta); background-color: var(--claude-ivory);"
            :class="{ 'opacity-80': selectedFilters.has(filter.id) }"
          >
            <input
              type="checkbox"
              :checked="selectedFilters.has(filter.id)"
              @change="toggleFilter(filter.id)"
              :id="`filter-${filter.id}`"
              :aria-label="`${t('variants.selectFilters')}: ${getFilterName(filter)}`"
              style="accent-color: var(--claude-terracotta); width: 18px; height: 18px; min-height: 18px;"
            />
            <span class="claude-body-small" style="color: var(--claude-near-black);">{{ getFilterName(filter) }}</span>
          </label>
        </div>
      </fieldset>
    </div>

    <button
      @click="generateVariants"
      :disabled="!hasSelectedImage || selectedFilters.size === 0 || isGenerating"
      class="claude-button-terracotta claude-focusable"
      :class="{ 'loading': isGenerating }"
      style="width: 100%; min-height: var(--claude-touch-comfortable);"
      :aria-label="isGenerating ? t('variants.generating') : t('variants.generate', { count: variantCount })"
      :aria-live="isGenerating ? 'polite' : 'off'"
    >
      <span v-if="!isGenerating">{{ t('variants.generate', { count: variantCount }) }}</span>
      <span v-else>{{ t('variants.generating') }}</span>
      <svg v-if="!isGenerating" style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </button>

    <div v-if="!hasSelectedImage" role="status" aria-live="polite" style="margin-top: var(--claude-space-2); text-align: center;">
      <p class="claude-caption" style="color: var(--claude-stone-gray);">
        {{ t('preview.uploadToStart') }}
      </p>
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
