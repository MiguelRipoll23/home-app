import { create } from 'zustand'

export type ViewType = 'home' | 'favorites' | 'room' | 'scenes' | 'settings' | 'category'
export type ThemeType = 'light' | 'dark' | 'system'
export type ModalType = 'pair' | 'edit-accessory' | 'detail-accessory' | 'edit-scene' | null

export function applyTheme(theme: ThemeType) {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark')
  if (theme === 'dark') {
    root.classList.add('theme-dark')
  } else if (theme === 'light') {
    root.classList.add('theme-light')
  }
}

interface UiState {
  currentView: ViewType
  selectedRoomId: string | null
  selectedCategoryId: string | null
  sidebarOpen: boolean
  editMode: boolean
  editModeType: 'sections' | 'accessories' | null
  activeModal: ModalType
  activeAccessoryId: string | null
  activeSceneId: string | null
  setView: (view: ViewType) => void
  selectRoom: (roomId: string) => void
  selectCategory: (categoryId: string) => void
  toggleSidebar: () => void
  setEditMode: (mode: boolean, type?: 'sections' | 'accessories' | null) => void
  toggleEditMode: () => void
  openModal: (modal: Exclude<ModalType, null>, id?: string | null) => void
  closeModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  currentView: 'home',
  selectedRoomId: null,
  selectedCategoryId: null,
  sidebarOpen: true,
  editMode: false,
  editModeType: null,
  activeModal: null,
  activeAccessoryId: null,
  activeSceneId: null,

  setView: (view) => set({ currentView: view, selectedRoomId: null, selectedCategoryId: null }),
  selectRoom: (roomId) => set({ currentView: 'room', selectedRoomId: roomId, selectedCategoryId: null }),
  selectCategory: (categoryId) => set({ currentView: 'category', selectedCategoryId: categoryId, selectedRoomId: null }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setEditMode: (mode, type = null) => set({ editMode: mode, editModeType: type }),
  toggleEditMode: () => set(state => ({ editMode: !state.editMode, editModeType: state.editMode ? null : state.editModeType })),
  openModal: (modal, id = null) => {
    if (modal === 'edit-accessory' || modal === 'detail-accessory') {
      set({ activeModal: modal, activeAccessoryId: id, activeSceneId: null })
    } else if (modal === 'edit-scene') {
      set({ activeModal: modal, activeSceneId: id, activeAccessoryId: null })
    } else {
      set({ activeModal: modal, activeAccessoryId: null, activeSceneId: null })
    }
  },
  closeModal: () => set({ activeModal: null, activeAccessoryId: null, activeSceneId: null }),
}))
