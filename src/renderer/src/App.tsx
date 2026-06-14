import React, { useEffect } from 'react'
import { BackgroundLayer } from './ui/components/BackgroundLayer'
import { Sidebar } from './ui/components/Sidebar'
import { PairModal } from './ui/components/PairModal'
import { AccessoryEditView } from './ui/components/AccessoryEditView'
import { AccessoryControlView } from './ui/components/AccessoryControlView'
import { SceneEditView } from './ui/components/SceneEditView'
import { HomeView } from './ui/views/HomeView'
import { FavoritesView } from './ui/views/FavoritesView'
import { RoomView } from './ui/views/RoomView'
import { ScenesView } from './ui/views/ScenesView'
import { SettingsView } from './ui/views/SettingsView'
import { CategoryView } from './ui/views/CategoryView'
import { useUiStore, applyTheme } from './state/ui-store'
import { usePreferencesStore } from './state/preferences-store'
import { useRoomStore } from './state/room-store'
import { useDeviceStore } from './state/device-store'
import { useSceneStore } from './state/scene-store'
import { api } from './services/ipc'
import { Accessory } from './types/device'

const App: React.FC = () => {
  const { currentView, activeModal, activeAccessoryId, activeSceneId, openModal, closeModal } = useUiStore()
  const { theme } = usePreferencesStore()
  const { fetchRooms } = useRoomStore()
  const { updateDevice, fetchDevices } = useDeviceStore()
  const { fetchScenes } = useSceneStore()

  const editScene = useSceneStore(s =>
    activeSceneId ? s.scenes.find(sc => sc.id === activeSceneId) ?? null : null
  )
  const activeAccessory = useDeviceStore(s =>
    activeAccessoryId ? s.devices.find(d => d.id === activeAccessoryId) ?? null : null
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    fetchRooms()
    fetchDevices()
    fetchScenes()
  }, [fetchRooms, fetchDevices, fetchScenes])

  useEffect(() => {
    if (!api()) return
    
    const handleDeviceUpdate = (device: Accessory) => updateDevice(device)
    api().on('device:updated', handleDeviceUpdate)
    return () => api().removeListener('device:updated', handleDeviceUpdate)
  }, [updateDevice])

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView />
      case 'favorites': return <FavoritesView />
      case 'room': return <RoomView />
      case 'category': return <CategoryView />
      case 'scenes': return <ScenesView />
      case 'settings': return <SettingsView />
      default: return <HomeView />
    }
  }

  return (
    <div className="app-layout">
      <BackgroundLayer />
      <Sidebar />
      <main className="main-content">
        <div className="view-container">{renderView()}</div>
      </main>
      
      <PairModal isOpen={activeModal === 'pair'} onClose={closeModal} />
  
      {activeModal === 'edit-scene' && editScene && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <SceneEditView
              scene={editScene}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {activeModal === 'edit-accessory' && activeAccessory && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <AccessoryEditView
              accessory={activeAccessory}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {activeModal === 'detail-accessory' && activeAccessory && (
        <AccessoryControlView
          accessory={activeAccessory}
          onClose={closeModal}
          onGearClick={() => {
            openModal('edit-accessory', activeAccessoryId)
          }}
        />
      )}
    </div>
  )
}

export default App
