import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from '../locales/en.json'
import esTranslations from '../locales/es.json'
import { getEffectiveLanguage, type SupportedLanguage } from '../utils/language-detector'

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
}

/**
 * Initialize i18next with configuration.
 * Should be called before rendering the app.
 */
export async function initializeI18n(preferredLanguage: 'en' | 'es' | 'system' = 'system'): Promise<void> {
  const effectiveLanguage = await getEffectiveLanguage(preferredLanguage)

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: effectiveLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false, // Disable Suspense to avoid blocking renders
      },
    })
}

/**
 * Change the current language and re-render all components.
 * Should be called when user changes language preference.
 */
export async function changeLanguage(language: 'en' | 'es' | 'system'): Promise<void> {
  const effectiveLanguage = await getEffectiveLanguage(language)
  await i18n.changeLanguage(effectiveLanguage)
}

/**
 * Get the current language (resolved, not 'system').
 */
export function getCurrentLanguage(): SupportedLanguage {
  return i18n.language as SupportedLanguage
}

export default i18n
