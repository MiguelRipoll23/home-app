import { api } from '../services/ipc'

export type SupportedLanguage = 'en' | 'es'

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'es']

/**
 * Extract language code from locale string.
 * Converts 'es-MX', 'es-ES' to 'es', 'en-US' to 'en', etc.
 */
function extractLanguageCode(locale: string): string {
  return locale.split('-')[0].toLowerCase()
}

/**
 * Check if a language code is supported.
 */
function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)
}

/**
 * Detect system language with fallback chain:
 * 1. Try to get OS language via Electron IPC
 * 2. Fall back to browser navigator.language
 * 3. Default to 'en' if neither is supported
 */
export async function detectSystemLanguage(): Promise<SupportedLanguage> {
  try {
    // Try Electron first
    const locale = await api().app.getLocale?.()
    if (locale) {
      const langCode = extractLanguageCode(locale)
      if (isLanguageSupported(langCode)) {
        return langCode as SupportedLanguage
      }
    }
  } catch {
    // Electron API not available, fall back to browser
  }

  // Fall back to browser navigator
  const navLang = extractLanguageCode(navigator.language)
  if (isLanguageSupported(navLang)) {
    return navLang as SupportedLanguage
  }

  // Default to English
  return 'en'
}

/**
 * Get the effective language to use.
 * If preferred language is 'system', detect and return system language.
 * Otherwise return the preferred language.
 */
export async function getEffectiveLanguage(
  preferredLanguage: 'en' | 'es' | 'system'
): Promise<SupportedLanguage> {
  if (preferredLanguage === 'system') {
    return detectSystemLanguage()
  }
  return preferredLanguage
}
