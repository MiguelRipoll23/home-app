import { app, BrowserWindow } from 'electron'
import { Environment, Crypto, Entropy } from '@matter/main'
import { StandardCrypto } from '@matter/general'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './window'
import { createController } from './matter/controller'
import { initializeDeviceHandlers } from './matter/device-handler-init'
import { registerIpcHandlers } from './ipc-handlers'

let mainWindow: BrowserWindow | null = null

const standardCrypto = new StandardCrypto()
Environment.default.set(Crypto, standardCrypto)
Environment.default.set(Entropy, standardCrypto)

if (app.isPackaged) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    console.log('[auto-updater] Update available:', info.version)
    mainWindow?.webContents.send('update-available', info.version)
  })

  autoUpdater.on('download-progress', (info) => {
    console.log(`[auto-updater] Download progress: ${info.percent.toFixed(1)}% (${info.transferred}/${info.total} bytes)`)
    mainWindow?.webContents.send('update-download-progress', {
      percent: info.percent,
      transferred: info.transferred,
      total: info.total
    })
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('[auto-updater] Update downloaded and ready to install')
    mainWindow?.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('[auto-updater] Error:', err)
  })
} else {
  console.log('[auto-updater] Skipped (dev mode)')
}

app.whenReady().then(async () => {
  initializeDeviceHandlers()
  const controller = createController()
  await controller.start()

  mainWindow = createWindow()
  registerIpcHandlers(controller, mainWindow)

  if (app.isPackaged) {
    console.log('[auto-updater] Background check on startup')
    autoUpdater.checkForUpdates()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
