import React, { useState, useCallback, useMemo } from 'react'
import { useSceneStore } from '../../state/scene-store'
import { useDeviceStore } from '../../state/device-store'
import { useRoomStore } from '../../state/room-store'
import { AVAILABLE_ICONS, DeviceIcon } from '../types/icons'
import { SceneIconPicker } from './SceneIconPicker'
import { AccessoryControlView } from './AccessoryControlView'
import { groupItemsByRoom } from '../../utils/category-utils'
import { SceneAccessoryState, Scene } from '../../types/scene'
import './AccessoryEditView.css'
import './SceneEditView.css'

interface SceneEditViewProps {
  scene: Scene
  onClose: () => void
}

const SCENE_ICONS = AVAILABLE_ICONS.scene

export const SceneEditView: React.FC<SceneEditViewProps> = ({ scene, onClose }) => {
  const { updateSceneAccessories, renameScene, setSceneIcon, setSceneColor, setSceneShowOnHome, setSceneFavorite, activateScene, deleteScene } = useSceneStore()
  const accessories = useDeviceStore(s => s.devices)
  const { rooms } = useRoomStore()

  const [name, setName] = useState(scene.name)
  const [iconId, setIconId] = useState(scene.icon || SCENE_ICONS[0].id)
  const [color, setColor] = useState(scene.color || '#ffcc00')
  const [showOnHome, setShowOnHomeState] = useState(scene.showOnHome ?? true)
  const [sceneAccessories, setSceneAccessories] = useState<SceneAccessoryState[]>(scene.accessories ?? [])
  const [editingAccessoryId, setEditingAccessoryId] = useState<string | null>(null)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [showStylePicker, setShowStylePicker] = useState(false)

  const handleDone = useCallback(() => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== scene.name) {
      renameScene(scene.id, trimmed)
    }
    if (iconId !== scene.icon) {
      setSceneIcon(scene.id, iconId)
    }
    if (color !== scene.color) {
      setSceneColor(scene.id, color)
    }
    if (showOnHome !== scene.showOnHome) {
      setSceneShowOnHome(scene.id, showOnHome)
    }
    if (JSON.stringify(sceneAccessories) !== JSON.stringify(scene.accessories ?? [])) {
      updateSceneAccessories(scene.id, sceneAccessories)
    }
    onClose()
  }, [name, iconId, color, showOnHome, sceneAccessories, scene, renameScene, setSceneIcon, setSceneColor, setSceneShowOnHome, updateSceneAccessories, onClose])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleShowOnHomeToggle = useCallback(() => {
    setShowOnHomeState(prev => !prev)
  }, [])

  const handleFavoriteToggle = useCallback(async () => {
    await setSceneFavorite(scene.id, !scene.isFavorite)
  }, [scene.id, scene.isFavorite, setSceneFavorite])

  const handleDelete = useCallback(() => {
    if (confirm('Remove this scene from your home?')) {
      deleteScene(scene.id)
      onClose()
    }
  }, [scene.id, deleteScene, onClose])

  const handleToggleAccessory = useCallback((accessoryId: string) => {
    setSceneAccessories(prev => {
      const isInScene = prev.some(a => a.accessoryId === accessoryId)
      if (isInScene) {
        return prev.filter(a => a.accessoryId !== accessoryId)
      }
      const accessory = accessories.find(a => a.id === accessoryId)
      if (!accessory) return prev
      const newEntry: SceneAccessoryState = accessory.deviceType === 'light'
        ? { accessoryId: accessory.id, deviceType: 'light', isOn: accessory.isOn, brightness: accessory.brightness, color: accessory.color }
        : { accessoryId: accessory.id, deviceType: 'plug', isOn: accessory.isOn }
      return [...prev, newEntry]
    })
  }, [accessories])

  const handleToggle = useCallback((accessoryId: string, isOn: boolean) => {
    setSceneAccessories(prev =>
      prev.map(a => a.accessoryId === accessoryId ? { ...a, isOn } : a)
    )
  }, [])

  const handleBrightnessChange = useCallback((accessoryId: string, brightness: number) => {
    setSceneAccessories(prev =>
      prev.map(a => a.accessoryId === accessoryId && a.deviceType === 'light' ? { ...a, brightness } : a)
    )
  }, [])

  const handleColorChange = useCallback((accessoryId: string, color: { hue: number; saturation: number }) => {
    setSceneAccessories(prev =>
      prev.map(a => a.accessoryId === accessoryId && a.deviceType === 'light' ? { ...a, color } : a)
    )
  }, [])

  const groupedAccessories = useMemo(
    () => groupItemsByRoom(sceneAccessories, rooms, entry => accessories.find(a => a.id === entry.accessoryId)?.roomId, 'No Room'),
    [sceneAccessories, accessories, rooms]
  )

  const groupedAddableAccessories = useMemo(() => {
    const compatibleAccessories = accessories.filter(a =>
      a.deviceType === 'light' || a.deviceType === 'plug'
    )
    return groupItemsByRoom(compatibleAccessories, rooms, a => a.roomId, 'No Room')
  }, [accessories, rooms])

  const editingEntry = editingAccessoryId
    ? sceneAccessories.find(a => a.accessoryId === editingAccessoryId)
    : null

  const editingDevice = editingEntry
    ? accessories.find(a => a.id === editingEntry.accessoryId)
    : null

  const syntheticAccessory = editingDevice && editingEntry
    ? {
        ...editingDevice,
        isOn: 'isOn' in editingEntry ? editingEntry.isOn : editingDevice.isOn,
        brightness: editingEntry.deviceType === 'light' && editingEntry.brightness !== undefined
          ? editingEntry.brightness
          : editingDevice.brightness,
        color: editingEntry.deviceType === 'light' && editingEntry.color !== undefined
          ? editingEntry.color
          : editingDevice.color,
      }
    : null

  if (editingAccessoryId && syntheticAccessory) {
    return (
      <AccessoryControlView
        accessory={syntheticAccessory}
        onClose={() => setEditingAccessoryId(null)}
        onToggle={(isOn) => handleToggle(editingAccessoryId, isOn)}
        onBrightnessChange={(b) => handleBrightnessChange(editingAccessoryId, b)}
        onColorChange={(c) => handleColorChange(editingAccessoryId, c)}
      />
    )
  }

  return (
    <>
      <div className="edit-view">
        <div className="edit-view-header">
          <button className="edit-view-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <h2 className="edit-view-title">{scene.name}</h2>
          <button className="edit-view-done" onClick={handleDone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
        </div>

        <div className="edit-view-body">
          <div className="edit-identity-group">
            <button className="edit-identity-icon" onClick={() => setShowStylePicker(true)}>
              <DeviceIcon type="scene" iconId={iconId} size={24} color={color} />
            </button>
            <input
              className="edit-identity-name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          {sceneAccessories.length === 0 && (
            <p className="scene-edit-empty-msg">No accessories added yet.</p>
          )}

          {groupedAccessories.map(group => (
            <div key={group.roomId} className="scene-edit-room-group">
              <div className="scene-edit-room-label">{group.roomName}</div>
              <div className="card-grid">
                {group.items.map(entry => {
                  const device = accessories.find(a => a.id === entry.accessoryId)
                  const isOn = 'isOn' in entry ? entry.isOn : false
                  const stateLabel = 'isOn' in entry
                    ? (entry.isOn ? (entry.deviceType === 'light' && entry.brightness !== undefined ? `${entry.brightness}%` : 'Turn On') : 'Turn Off')
                    : ''

                  return (
                    <div
                      key={entry.accessoryId}
                      className={`accessory-card size-small ${isOn ? 'is-on' : ''}`}
                      onClick={() => setEditingAccessoryId(entry.accessoryId)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="accessory-card-content">
                        <div
                          className="accessory-card-icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggle(entry.accessoryId, !isOn)
                          }}
                        >
                          <DeviceIcon type={entry.deviceType} iconId={device?.icon} size={20} />
                        </div>
                        <div className="accessory-card-info">
                          <span className="accessory-card-name">{device?.friendlyName ?? entry.accessoryId}</span>
                          <span className="accessory-card-state">{stateLabel}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {showAddPicker && (
            <div className="scene-edit-add-picker">
              <div className="scene-edit-section-label">Add or Remove Accessories</div>
              {groupedAddableAccessories.map(group => (
                <div key={group.roomId} className="scene-edit-picker-room">
                  <div className="scene-edit-picker-room-label">{group.roomName}</div>
                  {group.items.map(accessory => {
                    const isInScene = sceneAccessories.some(a => a.accessoryId === accessory.id)
                    return (
                      <button
                        key={accessory.id}
                        className={`scene-edit-picker-row ${isInScene ? 'is-selected' : ''}`}
                        onClick={() => handleToggleAccessory(accessory.id)}
                      >
                        <DeviceIcon type={accessory.deviceType} iconId={accessory.icon} size={18} />
                        <span className="scene-edit-picker-name">{accessory.friendlyName}</span>
                        <div className={`scene-edit-checkbox ${isInScene ? 'is-checked' : ''}`}>
                          {isInScene && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
              <button className="scene-edit-cancel-btn" onClick={() => setShowAddPicker(false)}>
                Done
              </button>
            </div>
          )}

          <div className="edit-toggle-list">
            <button className="edit-toggle-row with-divider" onClick={() => activateScene(scene.id)}>
              <span>Test This Scene</span>
            </button>
            <button className={`edit-toggle-row with-divider ${showAddPicker ? 'is-active' : ''}`} onClick={() => setShowAddPicker(!showAddPicker)}>
              <span>Add or Remove Accessories</span>
            </button>
            <button className="edit-toggle-row with-divider" onClick={handleFavoriteToggle}>
              <span>{scene.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
            </button>
            <button className="edit-toggle-row with-divider" onClick={handleShowOnHomeToggle}>
              <span>{showOnHome ? 'Remove from Home View' : 'Add to Home View'}</span>
            </button>
            <button className="edit-toggle-row" style={{ color: 'var(--red)' }} onClick={handleDelete}>
              <span>Remove Scene</span>
            </button>
          </div>
        </div>
      </div>

      {showStylePicker && (
        <SceneIconPicker
          onClose={() => setShowStylePicker(false)}
          iconId={iconId}
          color={color}
          onIconSelect={setIconId}
          onColorSelect={setColor}
        />
      )}
    </>
  )
}
