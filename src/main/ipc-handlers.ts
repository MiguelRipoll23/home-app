import { ipcMain, BrowserWindow, app, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IMatterController } from './matter/controller'
import { storageService } from './matter/storage'
import { Accessory } from '../shared/types/device'

export function registerIpcHandlers(controller: IMatterController, mainWindow: BrowserWindow): void {
  controller.onUpdate((device: Accessory) => {
    mainWindow.webContents.send('device:updated', device)
  })

  ipcMain.handle('devices:list', async () => {
    return controller.getDevices()
  })

  ipcMain.handle('devices:listBridges', async () => {
    return controller.getBridges()
  })

  ipcMain.handle('bridge:remove', async (_e, bridgeId: string) => {
    return controller.removeBridge(bridgeId)
  })

  ipcMain.handle('scenes:list', async () => {
    return controller.getScenes()
  })

  ipcMain.handle('scene:activate', async (_e, sceneId: string) => {
    return controller.activateScene(sceneId)
  })

  ipcMain.handle('device:toggle', async (_e, deviceId: string) => {
    return controller.toggleDevice(deviceId)
  })

  ipcMain.handle('device:setOn', async (_e, deviceId: string, on: boolean) => {
    return controller.setDeviceOn(deviceId, on)
  })

  ipcMain.handle('device:pair', async (_e, pairingCode: string) => {
    return controller.pairDevice(pairingCode)
  })

  ipcMain.handle('devices:discoverCommissionable', async () => {
    return controller.discoverCommissionableDevices()
  })

  ipcMain.handle('device:pairDiscovered', async (_e, identifier, passcode) => {
    return controller.pairDiscoveredDevice(identifier, passcode)
  })

  ipcMain.handle('device:identify', async (_e, deviceId: string) => {
    return controller.identifyDevice(deviceId)
  })

  ipcMain.handle('device:setBrightness', async (_e, deviceId: string, level: number) => {
    return controller.setDeviceBrightness(deviceId, level)
  })

  ipcMain.handle('device:setColor', async (_e, deviceId: string, color: { hue: number; saturation: number }) => {
    return controller.setDeviceColor(deviceId, color)
  })

  ipcMain.handle('device:setName', async (_e, deviceId: string, name: string) => {
    return controller.setDeviceName(deviceId, name)
  })

  ipcMain.handle('device:setRoom', async (_e, deviceId: string, roomId: string) => {
    return controller.setDeviceRoom(deviceId, roomId)
  })

  ipcMain.handle('device:getState', async (_e, deviceId: string) => {
    return controller.getDeviceState(deviceId)
  })

  ipcMain.handle('storage:getPreferences', async () => {
    return storageService.getAllPreferences()
  })

  ipcMain.handle('storage:getRooms', async () => {
    return storageService.getRooms()
  })

  ipcMain.handle('storage:addRoom', async (_e, id: string, name: string) => {
    storageService.addRoom(id, name)
  })

  ipcMain.handle('storage:removeRoom', async (_e, id: string) => {
    storageService.removeRoom(id)
  })

  ipcMain.handle('storage:getFavorites', async () => {
    return storageService.getFavorites()
  })

  ipcMain.handle('storage:setFavorite', async (_e, accessoryId: string, favorite: boolean) => {
    storageService.setFavorite(accessoryId, favorite)
  })

  ipcMain.handle('storage:getSceneFavorites', async () => {
    return storageService.getSceneFavorites()
  })

  ipcMain.handle('storage:setSceneFavorite', async (_e, sceneId: string, favorite: boolean) => {
    storageService.setSceneFavorite(sceneId, favorite)
  })

  ipcMain.handle('storage:getRoomAssignment', async (_e, accessoryId: string) => {
    return storageService.getRoomAssignment(accessoryId)
  })

  ipcMain.handle('storage:setRoomAssignment', async (_e, accessoryId: string, roomId: string) => {
    storageService.setRoomAssignment(accessoryId, roomId)
  })

  ipcMain.handle('storage:getCustomName', async (_e, accessoryId: string) => {
    return storageService.getCustomName(accessoryId)
  })

  ipcMain.handle('storage:setCustomName', async (_e, accessoryId: string, name: string) => {
    storageService.setCustomName(accessoryId, name)
  })

  ipcMain.handle('storage:removeCustomName', async (_e, accessoryId: string) => {
    storageService.removeCustomName(accessoryId)
  })

  ipcMain.handle('storage:setCustomIcon', async (_e, accessoryId: string, iconId: string) => {
    storageService.setIcon(accessoryId, iconId)
  })

  ipcMain.handle('storage:getCustomIcon', async (_e, accessoryId: string) => {
    return storageService.getIcon(accessoryId)
  })

  ipcMain.handle('storage:getHomeAccessories', async () => {
    return storageService.getHiddenAccessories()
  })

  ipcMain.handle('storage:setHomeAccessory', async (_e, accessoryId: string, show: boolean) => {
    storageService.setHomeAccessory(accessoryId, show)
  })

  ipcMain.handle('storage:export', async () => {
    return storageService.getData()
  })

  ipcMain.handle('storage:import', async (_e, data: Record<string, unknown>) => {
    storageService.setData(data)
    app.relaunch()
    app.exit()
  })

  ipcMain.handle('app:getLocale', () => {
    return app.getLocale()
  })

  ipcMain.handle('check-for-updates', () => {
    console.log('[auto-updater] Manual check requested')
    return new Promise<{ version: string; url: string } | null>((resolve) => {
      if (!app.isPackaged) {
        console.log('[auto-updater] Skipped (dev mode)')
        return resolve(null)
      }

      autoUpdater.checkForUpdates().then((result) => {
        if (!result?.updateInfo) {
          console.log('[auto-updater] No update info returned')
          return resolve(null)
        }
        const version = result.updateInfo.version
        const url = `https://github.com/MiguelRipoll23/home-app/releases/tag/v${version}`
        console.log(`[auto-updater] checkForUpdates result: current=${app.getVersion()}, latest=${version}`)
        resolve({ version, url })
      }).catch((err) => {
        console.error('[auto-updater] checkForUpdates failed:', err)
        resolve(null)
      })
    })
  })

  ipcMain.on('restart-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('open-external', (_event, url: string) => {
    shell.openExternal(url)
  })
}
