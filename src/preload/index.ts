import { contextBridge, ipcRenderer } from 'electron'
import { HomeControllerAPI } from './types'

// Map original callbacks to their IPC wrapper so removeListener can clean up correctly.
const listenerWrappers = new Map<(...args: unknown[]) => void, (...args: unknown[]) => void>()

const api: HomeControllerAPI = {
  devices: {
    list: () => ipcRenderer.invoke('devices:list'),
    listBridges: () => ipcRenderer.invoke('devices:listBridges'),
    removeBridge: (bridgeId: string) => ipcRenderer.invoke('bridge:remove', bridgeId),
    removeAccessory: (accessoryId: string) => ipcRenderer.invoke('device:remove', accessoryId),
    discoverCommissionable: () => ipcRenderer.invoke('devices:discoverCommissionable'),
    toggle: (deviceId: string) => ipcRenderer.invoke('device:toggle', deviceId),
    setOn: (deviceId: string, on: boolean) => ipcRenderer.invoke('device:setOn', deviceId, on),
    pair: (pairingCode: string) => ipcRenderer.invoke('device:pair', pairingCode),
    pairDiscovered: (identifier: Record<string, unknown>, passcode: number) =>
      ipcRenderer.invoke('device:pairDiscovered', identifier, passcode),
    identify: (deviceId: string) => ipcRenderer.invoke('device:identify', deviceId),
    setBrightness: (deviceId: string, level: number) =>
      ipcRenderer.invoke('device:setBrightness', deviceId, level),
    setColor: (deviceId: string, color: { hue: number; saturation: number }) =>
      ipcRenderer.invoke('device:setColor', deviceId, color),
    setName: (deviceId: string, name: string) =>
      ipcRenderer.invoke('device:setName', deviceId, name),
    setRoom: (deviceId: string, roomId: string) =>
      ipcRenderer.invoke('device:setRoom', deviceId, roomId),
    getState: (deviceId: string) => ipcRenderer.invoke('device:getState', deviceId),
  },
  storage: {
    getPreferences: () => ipcRenderer.invoke('storage:getPreferences'),
    getRooms: () => ipcRenderer.invoke('storage:getRooms'),
    addRoom: (id: string, name: string) => ipcRenderer.invoke('storage:addRoom', id, name),
    removeRoom: (id: string) => ipcRenderer.invoke('storage:removeRoom', id),
    getFavorites: () => ipcRenderer.invoke('storage:getFavorites'),
    setFavorite: (accessoryId: string, favorite: boolean) => ipcRenderer.invoke('storage:setFavorite', accessoryId, favorite),
    getRoomAssignment: (accessoryId: string) => ipcRenderer.invoke('storage:getRoomAssignment', accessoryId),
    setRoomAssignment: (accessoryId: string, roomId: string) => ipcRenderer.invoke('storage:setRoomAssignment', accessoryId, roomId),
    getCustomName: (accessoryId: string) => ipcRenderer.invoke('storage:getCustomName', accessoryId),
    setCustomName: (accessoryId: string, name: string) => ipcRenderer.invoke('storage:setCustomName', accessoryId, name),
    removeCustomName: (accessoryId: string) => ipcRenderer.invoke('storage:removeCustomName', accessoryId),
    getCustomIcon: (accessoryId: string) => ipcRenderer.invoke('storage:getCustomIcon', accessoryId),
    setCustomIcon: (accessoryId: string, iconId: string) => ipcRenderer.invoke('storage:setCustomIcon', accessoryId, iconId),
    getHomeAccessories: () => ipcRenderer.invoke('storage:getHomeAccessories'),
    setHomeAccessory: (accessoryId: string, show: boolean) => ipcRenderer.invoke('storage:setHomeAccessory', accessoryId, show),
    export: () => ipcRenderer.invoke('storage:export'),
    import: (data: Record<string, unknown>) => ipcRenderer.invoke('storage:import', data),
  },
  scenes: {
    list: () => ipcRenderer.invoke('scenes:list'),
    activate: (sceneId: string) => ipcRenderer.invoke('scene:activate', sceneId),
    getFavorites: () => ipcRenderer.invoke('storage:getSceneFavorites'),
    setFavorite: (sceneId: string, favorite: boolean) => ipcRenderer.invoke('storage:setSceneFavorite', sceneId, favorite),
  },
  app: {
    getLocale: () => ipcRenderer.invoke('app:getLocale'),
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onUpdateAvailable: (callback: (version: string) => void) => {
    ipcRenderer.on('update-available', (_event, version) => callback(version))
  },
  onDownloadProgress: (callback: (info: { percent: number; transferred: number; total: number }) => void) => {
    ipcRenderer.on('update-download-progress', (_event, info) => callback(info))
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => callback())
  },
  restartAndInstall: () => {
    ipcRenderer.send('restart-and-install')
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const wrapper = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    listenerWrappers.set(callback, wrapper)
    ipcRenderer.on(channel, wrapper)
  },
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => {
    const wrapper = listenerWrappers.get(callback)
    if (wrapper) {
      ipcRenderer.removeListener(channel, wrapper)
      listenerWrappers.delete(callback)
    }
  },
}

contextBridge.exposeInMainWorld('homeController', api)
