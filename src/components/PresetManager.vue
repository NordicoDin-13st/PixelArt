<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import type { GlobalParams } from '../composables/useGlobalParams'

const { t } = useI18n()

interface Props {
  currentParams: GlobalParams
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'load-preset': [params: Record<string, any>]
}>()

const STORAGE_KEY = 'pixel-art-presets'
const showSaveDialog = ref(false)
const presetName = ref('')
const showHelp = ref(false)

interface Preset {
  name: string
  params: Record<string, any>
  timestamp: number
}

function loadPresets(): Preset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function savePresets(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

const presets = ref<Preset[]>(loadPresets())

function handleSave() {
  const name = presetName.value.trim()
  if (!name) return

  if (presets.value.some(p => p.name === name)) {
    alert(t.value('presetManager.nameExists'))
    return
  }

  presets.value.push({
    name,
    params: { ...props.currentParams },
    timestamp: Date.now()
  })
  savePresets(presets.value)
  presetName.value = ''
  showSaveDialog.value = false
}

function handleLoad(preset: Preset) {
  emit('load-preset', preset.params)
}

function handleDelete(index: number) {
  const name = presets.value[index].name
  if (confirm(t.value('presetManager.confirmDelete', { name }))) {
    presets.value.splice(index, 1)
    savePresets(presets.value)
  }
}
</script>

<template>
  <div class="claude-card" role="region" aria-label="Preset Manager">
    <div class="flex items-center gap-2" style="margin-bottom: var(--claude-space-3);">
      <h3 class="claude-heading-small">{{ t('presetManager.title') }}</h3>
      <button
        @click="showHelp = !showHelp"
        class="help-icon-btn claude-focusable"
        aria-label="Show preset help"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>

    <div v-if="showHelp" class="claude-body-small" style="padding: var(--claude-space-2); margin-bottom: var(--claude-space-3); background-color: var(--claude-ivory); border-radius: var(--claude-radius-comfortable); border: 1px solid var(--claude-border-cream);">
      <p style="color: var(--claude-charcoal-warm);">
        {{ t('presetManager.title') }}: {{ t('presetManager.helpDesc') }}
      </p>
    </div>

    <div v-if="!showSaveDialog" style="margin-bottom: var(--claude-space-3);">
      <button
        @click="showSaveDialog = true"
        class="claude-button-terracotta claude-focusable"
        style="width: 100%; min-height: var(--claude-touch-comfortable); font-size: 13px;"
      >
        <svg style="width: 16px; height: 16px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ t('presetManager.savePreset') }}
      </button>
    </div>

    <div v-else style="margin-bottom: var(--claude-space-3); display: flex; gap: var(--claude-space-2);">
      <input
        v-model="presetName"
        type="text"
        :placeholder="t('presetManager.enterName')"
        class="claude-input claude-focusable"
        style="flex: 1; min-height: var(--claude-touch-comfortable); font-size: 13px;"
        @keydown.enter="handleSave"
        @keydown.esc="showSaveDialog = false"
      />
      <button
        @click="handleSave"
        :disabled="!presetName.trim()"
        class="claude-button-terracotta claude-focusable"
        style="min-height: var(--claude-touch-comfortable); font-size: 13px; padding: 0 12px;"
      >
        {{ t('common.save') }}
      </button>
      <button
        @click="showSaveDialog = false; presetName = ''"
        class="claude-button-warm-sand claude-focusable"
        style="min-height: var(--claude-touch-comfortable); font-size: 13px; padding: 0 12px;"
      >
        {{ t('common.cancel') }}
      </button>
    </div>

    <div v-if="presets.length > 0" style="display: flex; flex-direction: column; gap: var(--claude-space-2);">
      <div
        v-for="(preset, index) in presets"
        :key="preset.name"
        class="flex items-center justify-between claude-card-interactive"
        style="padding: var(--claude-space-2) var(--claude-space-3); border: 1px solid var(--claude-border-cream); border-radius: var(--claude-radius-comfortable);"
      >
        <button
          @click="handleLoad(preset)"
          class="claude-focusable"
          style="flex: 1; text-align: left; background: none; border: none; cursor: pointer; color: var(--claude-near-black); font-size: 13px;"
          :aria-label="t('presetManager.loadPreset') + ': ' + preset.name"
        >
          <span style="font-weight: 500;">{{ preset.name }}</span>
          <span class="claude-caption" style="margin-left: 8px; color: var(--claude-stone-gray);">
            {{ preset.params.mode === 'quantize' ? t('params.autoQuantize') : t('params.fixedPreset') }}
            · {{ preset.params.pixelSize }}px
          </span>
        </button>
        <button
          @click="handleDelete(index)"
          class="claude-button-warm-sand claude-focusable"
          :aria-label="t('presetManager.deletePreset') + ': ' + preset.name"
          style="min-height: 28px; min-width: 28px; padding: 2px; margin-left: var(--claude-space-2);"
        >
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <div v-else class="claude-body-small" style="text-align: center; color: var(--claude-stone-gray); padding: var(--claude-space-3);">
      {{ t('presetManager.noPresets') }}
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
