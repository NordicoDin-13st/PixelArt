import { ref, computed, watch } from 'vue'
import { locales, type Locale, type Messages } from '../i18n'

const STORAGE_KEY = 'pixel-art-locale'

const currentLocale = ref<Locale>(
  (localStorage.getItem(STORAGE_KEY) as Locale) || 'en'
)

function getMessages(): Messages {
  return locales[currentLocale.value]
}

const messages = ref<Messages>(getMessages())

watch(currentLocale, (val) => {
  messages.value = locales[val]
  localStorage.setItem(STORAGE_KEY, val)
  document.documentElement.setAttribute('lang', val === 'zh-CN' ? 'zh-CN' : 'en')
}, { immediate: true })

function getByPath(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path
}

export function useI18n() {
  const t = computed(() => {
    return (key: string, params?: Record<string, any>): string => {
      let text = getByPath(messages.value, key)
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    }
  })

  function setLocale(locale: Locale) {
    currentLocale.value = locale
  }

  function toggleLocale() {
    currentLocale.value = currentLocale.value === 'en' ? 'zh-CN' : 'en'
  }

  const locale = computed(() => currentLocale.value)

  const isEnglish = computed(() => currentLocale.value === 'en')
  const isChinese = computed(() => currentLocale.value === 'zh-CN')

  return {
    t,
    locale,
    setLocale,
    toggleLocale,
    isEnglish,
    isChinese,
    currentLocale
  }
}
