import { ref, watch } from 'vue'

const isDarkMode = ref(false)
let initialized = false

function initialize() {
  if (initialized) return
  initialized = true

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      isDarkMode.value = stored === 'true'
    } else {
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  const applyDarkMode = (dark: boolean) => {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  watch(isDarkMode, (newValue) => {
    applyDarkMode(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(newValue))
    }
  }, { immediate: true })
}

export function useDarkMode() {
  initialize()

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  return {
    isDarkMode,
    toggleDarkMode
  }
}
