<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { GlobalParams } from '../composables/useGlobalParams'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

interface Props {
  modelValue: GlobalParams
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: GlobalParams): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showHelp = ref(false)
const paletteModeHelp = ref(false)
const pixelSizeHelp = ref(false)
const colorCountHelp = ref(false)
const ditherHelp = ref(false)

const localPixelSize = ref(0)
const localColorCount = ref(0)
const pendingChanges = ref(false)

function updateLocalPixelSize(value: number) {
  localPixelSize.value = value
  pendingChanges.value = true
}

function updateLocalColorCount(value: number) {
  localColorCount.value = value
  pendingChanges.value = true
}

function applyChanges() {
  if (pendingChanges.value) {
    if (localPixelSize.value > 0) {
      emit('update:modelValue', { ...props.modelValue, pixelSize: localPixelSize.value })
    }
    if (localColorCount.value > 0) {
      emit('update:modelValue', { ...props.modelValue, colorCount: localColorCount.value })
    }
    pendingChanges.value = false
  }
}

onMounted(() => {
  localPixelSize.value = props.modelValue.pixelSize
  localColorCount.value = props.modelValue.colorCount
})

watch(() => props.modelValue.pixelSize, (val) => {
  if (!pendingChanges.value) {
    localPixelSize.value = val
  }
})

watch(() => props.modelValue.colorCount, (val) => {
  if (!pendingChanges.value) {
    localColorCount.value = val
  }
})

function updateParams<K extends keyof GlobalParams>(key: K, value: GlobalParams[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="claude-card" role="region" aria-label="Parameters">
    <div class="flex items-center gap-2" style="margin-bottom: var(--claude-space-3);">
      <h3 class="claude-heading-small">{{ t('params.title') }}</h3>
      <button
        @click="showHelp = !showHelp"
        class="help-icon-btn claude-focusable"
        aria-label="Show parameter help"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>

    <div v-if="showHelp" class="claude-body-small" style="padding: var(--claude-space-2); margin-bottom: var(--claude-space-3); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable); border: 1px solid var(--claude-border-cream);">
      <p style="margin-bottom: var(--claude-space-2); color: var(--claude-charcoal-warm);">
        <strong>{{ t('params.paletteMode') }}:</strong> {{ t('params.helpPaletteMode') }}
      </p>
      <p style="margin-bottom: var(--claude-space-2); color: var(--claude-charcoal-warm);">
        <strong>{{ t('params.pixelSize') }}:</strong> {{ t('params.helpPixelSize') }}
      </p>
      <p style="margin-bottom: var(--claude-space-2); color: var(--claude-charcoal-warm);">
        <strong>{{ t('params.colorCount') }}:</strong> {{ t('params.helpColorCount') }}
      </p>
      <p style="color: var(--claude-charcoal-warm);">
        <strong>{{ t('params.dither') }}:</strong> {{ t('params.helpDither') }}
      </p>
    </div>

    <!-- Palette Mode -->
    <div style="margin-bottom: var(--claude-space-4); position: relative;">
      <div class="flex items-center gap-2">
        <fieldset style="border: none; padding: 0; margin: 0;">
          <legend class="claude-label" style="margin-bottom: var(--claude-space-2); color: var(--claude-olive-gray); text-transform: uppercase; letter-spacing: 0.5px;">
            {{ t('params.paletteMode') }}
          </legend>
        </fieldset>
        <button
          @click="paletteModeHelp = !paletteModeHelp"
          class="help-icon-btn claude-focusable"
          :aria-label="t('params.paletteMode') + ' help'"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <div v-if="paletteModeHelp" class="claude-body-small" style="padding: var(--claude-space-2); margin-top: var(--claude-space-2); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable);">
        {{ t('params.helpPaletteMode') }}
      </div>
      <div class="claude-touch-group">
        <label class="flex items-center claude-focusable" style="cursor: pointer; min-height: var(--claude-touch-min);">
          <input
            type="radio"
            value="quantize"
            :checked="modelValue.mode === 'quantize'"
            @change="updateParams('mode', 'quantize')"
            :disabled="disabled"
            :aria-disabled="disabled"
            style="accent-color: var(--claude-terracotta); width: 18px; height: 18px; margin-right: var(--claude-space-2);"
          />
          <span class="claude-body" style="color: var(--claude-near-black);">{{ t('params.autoQuantize') }}</span>
        </label>
        <label class="flex items-center claude-focusable" style="cursor: pointer; min-height: var(--claude-touch-min);">
          <input
            type="radio"
            value="palette"
            :checked="modelValue.mode === 'palette'"
            @change="updateParams('mode', 'palette')"
            :disabled="disabled"
            :aria-disabled="disabled"
            style="accent-color: var(--claude-terracotta); width: 18px; height: 18px; margin-right: var(--claude-space-2);"
          />
          <span class="claude-body" style="color: var(--claude-near-black);">{{ t('params.fixedPreset') }}</span>
        </label>
      </div>
    </div>

    <!-- Pixel Size -->
    <div style="margin-bottom: var(--claude-space-3); position: relative;">
      <div class="flex items-center gap-2">
        <label for="pixel-size" class="claude-label" style="display: block; margin-bottom: var(--claude-space-2); color: var(--claude-olive-gray);">
          {{ t('params.pixelSize') }}: {{ localPixelSize || modelValue.pixelSize }}px
        </label>
        <button
          @click="pixelSizeHelp = !pixelSizeHelp"
          class="help-icon-btn claude-focusable"
          :aria-label="t('params.pixelSize') + ' help'"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <div v-if="pixelSizeHelp" class="claude-body-small" style="padding: var(--claude-space-2); margin-bottom: var(--claude-space-2); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable);">
        {{ t('params.helpPixelSize') }}
      </div>
      <input
        id="pixel-size"
        type="range"
        :value="localPixelSize || modelValue.pixelSize"
        @input="(e) => updateLocalPixelSize(Number((e.target as HTMLInputElement).value))"
        :disabled="disabled"
        :aria-disabled="disabled"
        min="1"
        max="64"
        step="1"
        class="claude-input claude-focusable"
        style="width: calc(100% - 48px); margin: 0 24px; accent-color: var(--claude-terracotta);"
        aria-valuemin="1"
        aria-valuemax="64"
        :aria-valuenow="localPixelSize || modelValue.pixelSize"
      />
      <div class="flex justify-between claude-caption" style="color: var(--claude-stone-gray); margin-top: var(--claude-space-1);">
        <span>1px</span>
        <span>64px</span>
      </div>
    </div>

    <!-- Color Count -->
    <div v-if="modelValue.mode === 'quantize'" style="margin-bottom: var(--claude-space-6); position: relative;">
      <div class="flex items-center gap-2">
        <label for="color-count" class="claude-label" style="display: block; margin-bottom: var(--claude-space-2); color: var(--claude-olive-gray);">
          {{ t('params.colorCount') }}: {{ localColorCount || modelValue.colorCount }}
        </label>
        <button
          @click="colorCountHelp = !colorCountHelp"
          class="help-icon-btn claude-focusable"
          :aria-label="t('params.colorCount') + ' help'"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <div v-if="colorCountHelp" class="claude-body-small" style="padding: var(--claude-space-2); margin-bottom: var(--claude-space-2); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable);">
        {{ t('params.helpColorCount') }}
      </div>
      <input
        id="color-count"
        type="range"
        :value="localColorCount || modelValue.colorCount"
        @input="(e) => updateLocalColorCount(Number((e.target as HTMLInputElement).value))"
        :disabled="disabled"
        :aria-disabled="disabled"
        min="2"
        max="256"
        step="2"
        class="claude-input claude-focusable"
        style="width: calc(100% - 48px); margin: 0 24px; accent-color: var(--claude-terracotta);"
        aria-valuemin="2"
        aria-valuemax="256"
        :aria-valuenow="localColorCount || modelValue.colorCount"
      />
      <div class="flex justify-between claude-caption" style="color: var(--claude-stone-gray); margin-top: var(--claude-space-1);">
        <span>2</span>
        <span>256</span>
      </div>
    </div>

    <!-- Palette Preset -->
    <div v-if="modelValue.mode === 'palette'" style="margin-bottom: var(--claude-space-6); position: relative;">
      <label for="palette-preset" class="claude-label" style="display: block; margin-bottom: var(--claude-space-2); color: var(--claude-olive-gray);">
        {{ t('params.palettePreset') }}
      </label>
      <select
        id="palette-preset"
        :value="modelValue.palettePreset"
        @change="updateParams('palettePreset', ($event.target as HTMLSelectElement).value)"
        :disabled="disabled"
        :aria-disabled="disabled"
        class="claude-select claude-focusable"
        style="width: 100%; min-height: var(--claude-touch-min);"
      >
        <option value="gameboy">{{ t('presets.gameboy') }}</option>
        <option value="nes">{{ t('presets.nes') }}</option>
        <option value="pico8">{{ t('presets.pico8') }}</option>
        <option value="cga">{{ t('presets.cga') }}</option>
        <option value="grayscale">{{ t('presets.grayscale') }}</option>
        <option value="amber">{{ t('presets.amber') }}</option>
        <option value="green">{{ t('presets.green') }}</option>
      </select>
    </div>

    <!-- Dither Algorithm -->
    <div style="margin-bottom: var(--claude-space-6); position: relative;">
      <div class="flex items-center gap-2">
        <label for="dither-algorithm" class="claude-label" style="display: block; margin-bottom: var(--claude-space-2); color: var(--claude-olive-gray);">
          {{ t('params.dither') }}
        </label>
        <button
          @click="ditherHelp = !ditherHelp"
          class="help-icon-btn claude-focusable"
          :aria-label="t('params.dither') + ' help'"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <div v-if="ditherHelp" class="claude-body-small" style="padding: var(--claude-space-2); margin-bottom: var(--claude-space-2); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable);">
        {{ t('params.helpDither') }}
      </div>
      <select
        id="dither-algorithm"
        :value="modelValue.dither"
        @change="updateParams('dither', ($event.target as HTMLSelectElement).value)"
        :disabled="disabled"
        :aria-disabled="disabled"
        class="claude-select claude-focusable"
        style="width: 100%; min-height: var(--claude-touch-min);"
      >
        <option value="none">{{ t('ditherOptions.none') }}</option>
        <option value="floyd-steinberg">{{ t('ditherOptions.floydSteinberg') }}</option>
        <option value="atkinson">{{ t('ditherOptions.atkinson') }}</option>
        <option value="bayer">{{ t('ditherOptions.bayer') }}</option>
      </select>
    </div>

    <!-- Generate Button -->
    <button
      @click="applyChanges"
      :disabled="disabled || !pendingChanges"
      class="claude-button-terracotta claude-focusable"
      style="width: 100%; min-height: var(--claude-touch-comfortable);"
      :aria-label="t('common.apply')"
    >
      {{ t('common.apply') }}
    </button>
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
