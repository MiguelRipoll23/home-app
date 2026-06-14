import { create } from 'zustand'
import { Scene, SceneAccessoryState } from '../types/scene'
import { api } from '../services/ipc'
import { useDeviceStore } from './device-store'

interface SceneState {
  scenes: Scene[]
  loading: boolean
  fetchScenes: () => Promise<void>
  addScene: (name: string) => void
  deleteScene: (sceneId: string) => void
  updateSceneAccessories: (sceneId: string, accessories: SceneAccessoryState[]) => void
  renameScene: (sceneId: string, name: string) => void
  setSceneIcon: (sceneId: string, icon: string) => void
  setSceneColor: (sceneId: string, color: string) => void
  setSceneRoom: (sceneId: string, roomId: string) => void
  setSceneShowOnHome: (sceneId: string, showOnHome: boolean) => void
  setSceneFavorite: (sceneId: string, favorite: boolean) => Promise<void>
  activateScene: (sceneId: string) => Promise<void>
}

interface StoredCustomScene {
  id: string
  name: string
  icon?: string
  color?: string
  accessories?: SceneAccessoryState[]
  roomId?: string
  showOnHome?: boolean
}

function readCustomScenes(): StoredCustomScene[] {
  try {
    return JSON.parse(localStorage.getItem('customScenes') || '[]')
  } catch {
    return []
  }
}

function writeCustomScenes(scenes: StoredCustomScene[]): void {
  localStorage.setItem('customScenes', JSON.stringify(scenes))
}

function patchCustomScene<K extends keyof StoredCustomScene>(
  sceneId: string,
  field: K,
  value: StoredCustomScene[K],
  set: (fn: (state: SceneState) => Partial<SceneState>) => void
) {
  const stored = readCustomScenes()
  const idx = stored.findIndex(s => s.id === sceneId)
  if (idx !== -1) {
    stored[idx] = { ...stored[idx], [field]: value }
    writeCustomScenes(stored)
  }
  set(state => ({
    scenes: state.scenes.map(s => s.id === sceneId ? { ...s, [field]: value } : s),
  }))
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  loading: false,

  fetchScenes: async () => {
    set({ loading: true })
    try {
      const [sceneList, favIds] = await Promise.all([
        api().scenes.list(),
        api().scenes.getFavorites(),
      ])
      const matterScenes = sceneList.map(s => ({ ...s, isFavorite: favIds.includes(s.id) }))
      const customScenes: Scene[] = readCustomScenes().map(s => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        color: s.color,
        isAvailable: true,
        isFavorite: favIds.includes(s.id),
        accessories: s.accessories ?? [],
        roomId: s.roomId,
        showOnHome: s.showOnHome ?? true,
      }))
      set({ scenes: [...matterScenes, ...customScenes] })
    } catch {
      void 0
    } finally {
      set({ loading: false })
    }
  },

  addScene: (name: string) => {
    const id = crypto.randomUUID()
    const stored = readCustomScenes()
    stored.push({ id, name, accessories: [], showOnHome: true })
    writeCustomScenes(stored)
    const newScene: Scene = { id, name, isAvailable: true, isFavorite: false, accessories: [], showOnHome: true }
    set(state => ({ scenes: [...state.scenes, newScene] }))
  },

  deleteScene: (sceneId: string) => {
    const stored = readCustomScenes()
    const filtered = stored.filter(s => s.id !== sceneId)
    writeCustomScenes(filtered)
    set(state => ({
      scenes: state.scenes.filter(s => s.id !== sceneId),
    }))
  },

  updateSceneAccessories: (sceneId, accessories) => patchCustomScene(sceneId, 'accessories', accessories, set),
  renameScene: (sceneId, name) => patchCustomScene(sceneId, 'name', name, set),
  setSceneIcon: (sceneId, icon) => patchCustomScene(sceneId, 'icon', icon, set),
  setSceneColor: (sceneId, color) => patchCustomScene(sceneId, 'color', color, set),
  setSceneRoom: (sceneId, roomId) => patchCustomScene(sceneId, 'roomId', roomId, set),
  setSceneShowOnHome: (sceneId, showOnHome) => patchCustomScene(sceneId, 'showOnHome', showOnHome, set),

  setSceneFavorite: async (sceneId, favorite) => {
    await api().scenes.setFavorite(sceneId, favorite)
    set(state => ({
      scenes: state.scenes.map(s => s.id === sceneId ? { ...s, isFavorite: favorite } : s),
    }))
  },

  activateScene: async (sceneId: string) => {
    const scene = get().scenes.find(s => s.id === sceneId)
    if (!scene) return

    // Custom scenes (accessories array is defined) never use IPC activate
    if (scene.accessories !== undefined) {
      const { devices, setDeviceOn, setBrightness, setColor } = useDeviceStore.getState()

      // Check if all accessories are already in their desired state
      const allMatch = scene.accessories.every(entry => {
        const device = devices.find(d => d.id === entry.accessoryId)
        if (!device) return false
        if ('isOn' in entry) {
          if (device.isOn !== entry.isOn) return false
          if (entry.deviceType === 'light') {
            if (entry.brightness !== undefined && device.brightness !== entry.brightness) return false
            if (entry.color !== undefined) {
              if (!device.color || device.color.hue !== entry.color.hue || device.color.saturation !== entry.color.saturation) return false
            }
          }
        }
        return true
      })

      // If all match, turn off all accessories; otherwise apply the scene
      const targetState = !allMatch

      for (const entry of scene.accessories) {
        if ('isOn' in entry) {
          await setDeviceOn(entry.accessoryId, targetState ? entry.isOn : false)
        }
        if (targetState && entry.deviceType === 'light') {
          if (entry.brightness !== undefined) {
            await setBrightness(entry.accessoryId, entry.brightness)
          }
          if (entry.color !== undefined) {
            await setColor(entry.accessoryId, entry.color)
          }
        }
      }
      return
    }

    await api().scenes.activate(sceneId)
  },
}))
