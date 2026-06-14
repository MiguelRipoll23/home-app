import React, { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { Accessory } from '../../types/device'
import { useDeviceStore } from '../../state/device-store'
import { useRoomStore } from '../../state/room-store'
import { api } from '../../services/ipc'
import { AVAILABLE_ICONS } from '../types/icons'
import './PostPairingModal.css'

interface PostPairingModalProps {
  accessory: Accessory
  onClose: () => void
}

export const PostPairingModal: React.FC<PostPairingModalProps> = ({ accessory, onClose }) => {
  const { setDeviceName, setDeviceRoom, fetchDevices } = useDeviceStore()
  const { rooms } = useRoomStore()
  const defaultRoomId = rooms.length > 0 ? rooms[0].id : ''
  const [name, setName] = useState(accessory.friendlyName)
  const [roomId, setRoomId] = useState(accessory.roomId || defaultRoomId)
  const [identifying, setIdentifying] = useState(false)
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

    if (changed) {
      await fetchDevices()
    }
    onClose()
  }, [name, roomId, accessory, setDeviceName, setDeviceRoom, fetchDevices, onClose])

  const handleIdentify = useCallback(async () => {
    setIdentifying(true)
    try {
      await api().devices.identify(accessory.id)
    } finally {
      setTimeout(() => setIdentifying(false), 2000)
    }
  }, [accessory.id])

  const handleRoomSelect = useCallback((id: string) => {
    setRoomId(id)
    setShowRoomPicker(false)
  }, [])

  const currentRoom = rooms.find(r => r.id === roomId)
  const typeIcons = AVAILABLE_ICONS[accessory.deviceType] || AVAILABLE_ICONS.light
  const DefaultIcon = typeIcons[0].Icon

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="post-pairing-modal" onClick={e => e.stopPropagation()}>
        <div className="post-pairing-header">
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="post-pairing-body">
          <div className="post-pairing-icon">
            <DefaultIcon size={40} />
          </div>

          <h2 className="post-pairing-title">
            {accessory.deviceType.charAt(0).toUpperCase() + accessory.deviceType.slice(1)}
          </h2>

          <div className="edit-identity-group" style={{ width: '100%' }}>
            <input
              type="text"
              className="edit-identity-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Living Room Light"
              autoFocus
            />
          </div>

          <div className="edit-toggle-list" style={{ width: '100%' }}>
            <button className="edit-toggle-row" onClick={() => setShowRoomPicker(!showRoomPicker)}>
              <span className="edit-toggle-label">Room</span>
              <span className="edit-toggle-value">{currentRoom?.name ?? ''}</span>
            </button>
            {showRoomPicker && (
              <div className="edit-room-picker">
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
          </div>

          <div className="post-pairing-actions">
            <button className="modal-btn-amber wide" onClick={handleDone}>
              Continue
            </button>
            <button
              className={`modal-btn-amber wide secondary ${identifying ? 'is-identifying' : ''}`}
              onClick={handleIdentify}
              disabled={identifying}
            >
              {identifying ? 'Identifying...' : 'Identify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
