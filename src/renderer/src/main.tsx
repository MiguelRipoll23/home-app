import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './ui/styles/global.css'
import './ui/styles/animations.css'
import { applyTheme, ThemeType } from './state/ui-store'
import { initializeI18n } from './services/i18n'
import { usePreferencesStore } from './state/preferences-store'
import { initializeAccessoryRegistry } from './registry-init'

// Apply active theme immediately on boot, before React mounts
const savedPrefs = JSON.parse(localStorage.getItem('home-app-preferences') || '{}')
const savedTheme = ((savedPrefs?.state?.theme as ThemeType) || (localStorage.getItem('theme') as ThemeType) || 'system')
applyTheme(savedTheme)

// Initialize i18n before rendering React
const preferredLanguage = usePreferencesStore.getState().language
await initializeI18n(preferredLanguage)

// Initialize the Accessory Registry
initializeAccessoryRegistry()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
