import { Accessory, BridgeInfo, DiscoveredDevice } from '../shared/types/device'
import { Scene } from '../shared/types/scene'

export interface UpdateInfo {
  version: string
  url: string
}

export interface DownloadProgress {
  percent: number
  transferred: number
  total: number
}

export interface HomeControllerAPI {
  devices: {
    list: () => Promise<Accessory[]>
    listBridges: () => Promise<BridgeInfo[]>
    removeBridge: (bridgeId: string) => Promise<void>
    removeAccessory: (accessoryId: string) => Promise<void>
    discoverCommissionable: () => Promise<DiscoveredDevice[]>
    toggle: (deviceId: string) => Promise<boolean>
    setOn: (deviceId: string, on: boolean) => Promise<boolean>
    pair: (pairingCode: string) => Promise<Accessory>
    pairDiscovered: (identifier: Record<string, unknown>, passcode: number) => Promise<Accessory>
    identify: (deviceId: string) => Promise<void>
    setBrightness: (deviceId: string, level: number) => Promise<void>
    setColor: (deviceId: string, color: { hue: number; saturation: number }) => Promise<void>
    setName: (deviceId: string, name: string) => Promise<void>
    setRoom: (deviceId: string, roomId: string) => Promise<void>
    getState: (deviceId: string) => Promise<Accessory | null>
  }
  storage: {
    getPreferences: () => Promise<{
      favoriteIds: string[]
      hiddenIds: string[]
      rooms: { id: string; name: string; order: number }[]
      roomAssignments: Record<string, string>
      customIcons: Record<string, string>
      customNames: Record<string, string>
    }>
    getRooms: () => Promise<{ id: string; name: string; order: number }[]>
    addRoom: (id: string, name: string) => Promise<void>
    removeRoom: (id: string) => Promise<void>
    getFavorites: () => Promise<string[]>
    setFavorite: (accessoryId: string, favorite: boolean) => Promise<void>
    getRoomAssignment: (accessoryId: string) => Promise<string | undefined>
    setRoomAssignment: (accessoryId: string, roomId: string) => Promise<void>
    getCustomName: (accessoryId: string) => Promise<string | undefined>
    setCustomName: (accessoryId: string, name: string) => Promise<void>
    removeCustomName: (accessoryId: string) => Promise<void>
    getCustomIcon: (accessoryId: string) => Promise<string | undefined>
    setCustomIcon: (accessoryId: string, iconId: string) => Promise<void>
    getHomeAccessories: () => Promise<string[]>
    setHomeAccessory: (accessoryId: string, show: boolean) => Promise<void>
    export: () => Promise<Record<string, unknown>>
    import: (data: Record<string, unknown>) => Promise<void>
  }
  scenes: {
    list: () => Promise<Scene[]>
    activate: (sceneId: string) => Promise<void>
    getFavorites: () => Promise<string[]>
    setFavorite: (sceneId: string, favorite: boolean) => Promise<void>
  }
  app: {
    getLocale: () => Promise<string>
  }
  checkForUpdates: () => Promise<UpdateInfo | null>
  openExternal: (url: string) => Promise<void>
  onUpdateAvailable: (callback: (version: string) => void) => void
  onDownloadProgress: (callback: (info: DownloadProgress) => void) => void
  onUpdateDownloaded: (callback: () => void) => void
  restartAndInstall: () => void
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => void
}
