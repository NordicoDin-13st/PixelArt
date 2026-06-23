import en from './en'
import zhCN from './zh-CN'

export type Locale = 'en' | 'zh-CN'

export type Messages = typeof en

export const locales: Record<Locale, Messages> = {
  en,
  'zh-CN': zhCN
}

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '中文'
}
