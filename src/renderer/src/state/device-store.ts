import { create } from 'zustand'
import { Accessory, DiscoveredDevice } from '../types/device'
import { api } from '../services/ipc'
import { useRoomStore } from './room-store'

interface DeviceState {
  devices: Accessory[]
  loading: boolean
  initialLoad: boolean
  error: string | null
  failedCommandIds: Record<string, boolean>
  pairing: boolean
  discoveredDevices: DiscoveredDevice[]
  scanning: boolean
  fetchDevices: () => Promise<void>
  toggleDevice: (id: string) => Promise<void>
  setDeviceOn: (id: string, on: boolean) => Promise<void>
  pairDevice: (pairingCode: string) => Promise<Accessory | null>
  pairDiscovered: (identifier: Record<string, unknown>, passcode: number) => Promise<Accessory | null>
  scanForDevices: () => Promise<void>
  setBrightness: (id: string, level: number) => Promise<void>
  setColor: (id: string, color: { hue: number; saturation: number }) => Promise<void>
  setDeviceName: (id: string, name: string) => Promise<void>
  setDeviceRoom: (id: string, roomId: string) => Promise<void>
  updateDevice: (device: Accessory) => void
  toggleFavorite: (id: string, favorite: boolean) => Promise<void>
  setShowOnHome: (id: string, show: boolean) => Promise<void>
  removeDevice: (id: string) => Promise<void>
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: JSON.parse(localStorage.getItem('devices') || '[]'),
  loading: true,
  initialLoad: true,
  error: null,
  failedCommandIds: {},
  pairing: false,
  discoveredDevices: [],
  scanning: false,

  fetchDevices: async () => {
    set({ loading: true, error: null })
    try {
      const [devices, prefs] = await Promise.all([
        api().devices.list(),
        api().storage.getPreferences(),
      ])
      const merged = devices.map(d => ({
        ...d,
        isFavorite: prefs.favoriteIds.includes(d.id),
        icon: prefs.customIcons[d.id] ?? d.icon,
        showOnHome: !prefs.hiddenIds.includes(d.id),
      }))
      localStorage.setItem('devices', JSON.stringify(merged))
      set({ devices: merged, loading: false, initialLoad: false })
    } catch {
      set({ error: 'Could not load accessories', loading: false, initialLoad: false })
    }
  },

  toggleDevice: async (id: string) => {
    const previousDevices = get().devices
    const device = get().devices.find(d => d.id === id)
    if (!device) return

    // Optimistic update — clear any prior failure
    set(state => ({
      failedCommandIds: { ...state.failedCommandIds, [id]: false },
      devices: state.devices.map(d => d.id === id ? { ...d, isOn: !d.isOn } : d)
    }))

    try {
      const isOn = await api().devices.toggle(id)
      set(state => ({
        devices: state.devices.map(d => d.id === id ? { ...d, isOn } : d)
      }))
    } catch {
      set(state => ({ failedCommandIds: { ...state.failedCommandIds, [id]: true }, devices: previousDevices }))
    }
  },

  setDeviceOn: async (id: string, on: boolean) => {
    const previousDevices = get().devices

    // Optimistic update — clear any prior failure
    set(state => ({
      failedCommandIds: { ...state.failedCommandIds, [id]: false },
      devices: state.devices.map(d => d.id === id ? { ...d, isOn: on } : d)
    }))

    try {
      const isOn = await api().devices.setOn(id, on)
      set(state => ({
        devices: state.devices.map(d => d.id === id ? { ...d, isOn } : d)
      }))
    } catch {
      set(state => ({ failedCommandIds: { ...state.failedCommandIds, [id]: true }, devices: previousDevices }))
    }
  },

  pairDevice: async (pairingCode: string) => {
    set({ pairing: true, error: null })
    try {
      const accessory = await api().devices.pair(pairingCode)
      await Promise.all([get().fetchDevices(), useRoomStore.getState().fetchRooms()])
      return accessory
    } catch {
      set({ error: 'Failed to pair accessory' })
      return null
    } finally {
      set({ pairing: false })
    }
  },

  pairDiscovered: async (identifier, passcode) => {
    set({ pairing: true, error: null })
    try {
      const accessory = await api().devices.pairDiscovered(identifier, passcode)
      await Promise.all([get().fetchDevices(), useRoomStore.getState().fetchRooms()])
      return accessory
    } catch {
      set({ error: 'Failed to pair accessory' })
      return null
    } finally {
      set({ pairing: false })
    }
  },

  scanForDevices: async () => {
    set({ scanning: true, error: null })
    try {
      const devices = await api().devices.discoverCommissionable()
      set({ discoveredDevices: devices, scanning: false })
    } catch {
      set({ error: 'Failed to discover devices', scanning: false })
    }
  },

  setBrightness: async (id: string, level: number) => {
    const previousDevices = get().devices

    // Optimistic update — clear any prior failure
    set(state => ({
      failedCommandIds: { ...state.failedCommandIds, [id]: false },
      devices: state.devices.map(d => d.id === id ? { ...d, brightness: level, isOn: level > 0 } : d)
    }))

    try {
      await api().devices.setBrightness(id, level)
    } catch {
      set(state => ({ failedCommandIds: { ...state.failedCommandIds, [id]: true }, devices: previousDevices }))
    }
  },

  setColor: async (id: string, color: { hue: number; saturation: number }) => {
    set(state => ({ failedCommandIds: { ...state.failedCommandIds, [id]: false } }))
    try {
      await api().devices.setColor(id, color)
      set(state => ({
        devices: state.devices.map(d => d.id === id ? { ...d, color } : d)
      }))
    } catch {
      set(state => ({ failedCommandIds: { ...state.failedCommandIds, [id]: true } }))
    }
  },

  setDeviceName: async (id: string, name: string) => {
    try {
      await api().devices.setName(id, name)
      set(state => ({
        devices: state.devices.map(d => d.id === id ? { ...d, friendlyName: name } : d)
      }))
    } catch {
      set({ error: 'Failed to rename accessory' })
    }
  },

  setDeviceRoom: async (id: string, roomId: string) => {
    try {
      await api().devices.setRoom(id, roomId)
      set(state => ({
        devices: state.devices.map(d => d.id === id ? { ...d, roomId } : d)
      }))
    } catch {
      set({ error: 'Failed to change room' })
    }
  },

  updateDevice: (device: Accessory) => {
    set(state => ({
      failedCommandIds: { ...state.failedCommandIds, [device.id]: false },
      devices: state.devices.map(d =>
        d.id === device.id
          ? { ...d, isOn: device.brightness === 0 ? false : device.isOn, isReachable: device.isReachable, brightness: device.brightness, color: device.color, powerConsumption: device.powerConsumption, cumulativeEnergyConsumed: device.cumulativeEnergyConsumed }
          : d
      )
    }))
  },
  toggleFavorite: async (id: string, favorite: boolean) => {
    try {
      await api().storage.setFavorite(id, favorite)
      set(state => ({
        devices: state.devices.map(d => d.id === id ? { ...d, isFavorite: favorite } : d),
      }))
    } catch {
      set({ error: 'Failed to update favorite' })
    }
  },

  setShowOnHome: async (id: string, show: boolean) => {
    try {
      await api().storage.setHomeAccessory(id, show)
      set(state => ({
        devices: state.devices.map(d => d.id === id ? { ...d, showOnHome: show } : d),
      }))
    } catch {
      set({ error: 'Failed to update home visibility' })
    }
  },

  removeDevice: async (id: string) => {
    await api().devices.removeAccessory(id)
    set(state => ({
      devices: state.devices.filter(d => d.id !== id),
    }))
  },
}))
