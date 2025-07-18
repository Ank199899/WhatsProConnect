import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja', 'ko'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ko: '한국어'
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  hi: '🇮🇳',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
  ar: '🇸🇦',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷'
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound()

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
