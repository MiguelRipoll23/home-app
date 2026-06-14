import React, { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Accessory } from '../../types/device'
import { useDeviceStore } from '../../state/device-store'
import { useRoomStore } from '../../state/room-store'
import { api } from '../../services/ipc'
import './AccessoryEditView.css'

interface BaseAccessoryEditViewProps {
  accessory: Accessory
  onClose: () => void
  customIcon?: React.ReactNode
  customIconPicker?: React.ReactNode
  customFields?: React.ReactNode
  onSave?: (name: string, roomId: string) => Promise<boolean>
}

export const BaseAccessoryEditView: React.FC<BaseAccessoryEditViewProps> = ({
  accessory,
  onClose,
  customIcon,
  customIconPicker,
  customFields,
  onSave,
}) => {
  const { t } = useTranslation()
  const { setDeviceName, setDeviceRoom, setShowOnHome, removeDevice } = useDeviceStore()
  const { rooms } = useRoomStore()
  const [name, setName] = useState(accessory.friendlyName)
  const [roomId, setRoomId] = useState(accessory.roomId)
  const [isFavorite, setIsFavorite] = useState(accessory.isFavorite)
  const [showOnHome, setShowOnHomeState] = useState(accessory.showOnHome ?? true)
  const [showRoomPicker, setShowRoomPicker] = useState(false)

  const handleDone = useCallback(async () => {
    let changed = false
    const trimmed = name.trim()
    if (trimmed && trimmed !== accessory.friendlyName) {
      await setDeviceName(accessory.id, trimmed)
      changed = true
    }
    if (roomId !== accessory.roomId) {
      await setDeviceRoom(accessory.id, roomId)
      changed = true
    }
    if (showOnHome !== accessory.showOnHome) {
      await setShowOnHome(accessory.id, showOnHome)
      changed = true
    }
    if (isFavorite !== accessory.isFavorite) {
      await api().storage.setFavorite(accessory.id, isFavorite)
      changed = true
    }

    if (onSave) {
      const subclassChanged = await onSave(name, roomId)
      if (subclassChanged) changed = true
    }

    if (changed) {
      await fetchDevices()
    }
    onClose()
  }, [name, roomId, showOnHome, isFavorite, accessory, setDeviceName, setDeviceRoom, setShowOnHome, fetchDevices, onSave, onClose])

  const handleRoomSelect = useCallback((id: string) => {
    setRoomId(id)
    setShowRoomPicker(false)
  }, [])

  const currentRoom = rooms.find(r => r.id === roomId)

  return (
    <>
      <div className="edit-view">
        <div className="edit-view-header">
          <button className="edit-view-close" onClick={onClose}>
            <X size={20} />
          </button>
          <h2 className="edit-view-title">{accessory.friendlyName}</h2>
          <button className="edit-view-done" onClick={handleDone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
        </div>

        <div className="edit-view-body">
          <div className="edit-identity-group">
            {customIcon}
            <input
              type="text"
              className="edit-identity-name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="edit-toggle-list">
            {customFields}
            
            <button className="edit-toggle-row with-divider" onClick={() => setShowRoomPicker(!showRoomPicker)}>
              <span className="edit-toggle-label">Room</span>
              <span className="edit-toggle-value">{currentRoom?.name ?? 'None'}</span>
            </button>
            {showRoomPicker && (
              <div className="edit-room-picker">
                <button
                  className={`edit-room-option ${roomId === '' ? 'is-selected' : ''}`}
                  onClick={() => handleRoomSelect('')}
                >
                  None
                </button>
                {rooms.map(r => (
                  <button
                    key={r.id}
                    className={`edit-room-option ${roomId === r.id ? 'is-selected' : ''}`}
                    onClick={() => handleRoomSelect(r.id)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
            <button className="edit-toggle-row with-divider" onClick={() => setIsFavorite(!isFavorite)}>
              <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
            </button>

            <button
              className={`edit-toggle-row${!accessory.bridgeId ? ' with-divider' : ''}`}
              onClick={() => setShowOnHomeState(!showOnHome)}
            >
              <span>{showOnHome ? 'Remove from Home View' : 'Add to Home View'}</span>
            </button>
            
            {!accessory.bridgeId && (
              <button className="edit-toggle-row" style={{ color: 'var(--red)' }} onClick={async () => {
                if (!confirm(t('common.removeAccessoryConfirm'))) return
                try {
                  await removeDevice(accessory.id)
                  onClose()
                } catch (err) {
                  alert(t('common.removeAccessoryError') + ' ' + (err as Error).message)
                }
              }}>
                <span>{t('common.removeAccessory')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {customIconPicker}
    </>
  )
}
