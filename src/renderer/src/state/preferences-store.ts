import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyTheme, ThemeType } from './ui-store'

const DEFAULT_BG = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80'

interface PreferencesState {
  cardSizes: Record<string, 'small' | 'large'>
  cardOrder: string[]
  sectionOrder: string[]
  theme: ThemeType
  bgImage: string | null
  bgColor: string | null
  language: 'en' | 'es' | 'system'
  setCardSize: (deviceId: string, size: 'small' | 'large') => void
  getCardSize: (deviceId: string) => 'small' | 'large'
  setCardOrder: (order: string[]) => void
  setSectionOrder: (order: string[]) => void
  moveCard: (activeId: string, overId: string) => void
  setTheme: (theme: ThemeType) => void
  setBgImage: (image: string | null) => void
  setBgColor: (color: string | null) => void
  setLanguage: (language: 'en' | 'es' | 'system') => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      // Seed from old localStorage keys on first run (before persist rehydrates)
      cardSizes: JSON.parse(localStorage.getItem('cardSizes') || '{}'),
      cardOrder: JSON.parse(localStorage.getItem('cardOrder') || '[]'),
      sectionOrder: JSON.parse(localStorage.getItem('sectionOrder') || '[]'),
      theme: (localStorage.getItem('theme') as ThemeType) || 'system',
      bgImage:
        localStorage.getItem('bgImage') ||
        (localStorage.getItem('bgColor') ? null : DEFAULT_BG),
      bgColor: localStorage.getItem('bgColor'),
      language: (localStorage.getItem('language') as 'en' | 'es' | 'system') || 'system',

      setCardSize: (deviceId, size) =>
        set(state => ({ cardSizes: { ...state.cardSizes, [deviceId]: size } })),

      getCardSize: (deviceId) => get().cardSizes[deviceId] || 'large',

      setCardOrder: (order) => set({ cardOrder: order }),

      setSectionOrder: (order) => set({ sectionOrder: order }),

      moveCard: (activeId, overId) => {
        const { cardOrder } = get()
        const oldIndex = cardOrder.indexOf(activeId)
        const newIndex = cardOrder.indexOf(overId)
        if (oldIndex === -1 || newIndex === -1) return
        const newOrder = [...cardOrder]
        newOrder.splice(oldIndex, 1)
        newOrder.splice(newIndex, 0, activeId)
        set({ cardOrder: newOrder })
      },

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      setBgImage: (image) => {
        if (image) {
          set({ bgImage: image, bgColor: null })
        } else {
          set({ bgImage: null })
        }
      },

      setBgColor: (color) => {
        if (color) {
          set({ bgColor: color, bgImage: null })
        } else {
          set({ bgColor: null, bgImage: DEFAULT_BG })
        }
      },

      setLanguage: (language) => set({ language }),
    }),
    { name: 'home-app-preferences' }
  )
)
