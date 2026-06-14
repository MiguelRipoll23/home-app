import React, { useState } from 'react'
import { ArrowLeft, Lightbulb, Plug, Sun, Pencil } from 'lucide-react'
import { Accessory } from '../../types/device'
import { useDeviceStore } from '../../state/device-store'
import { PRESET_COLORS, isColorMatch } from '../../utils/category-utils'
import './DetailView.css'

interface DetailViewProps {
  accessory: Accessory
  onClose: () => void
  onColorWheelOpen?: (accessory: Accessory) => void
}

export const DetailView: React.FC<DetailViewProps> = ({ accessory, onClose, onColorWheelOpen }) => {
  const { devices, toggleDevice, setBrightness: setDeviceBrightness, setColor, setDeviceName } = useDeviceStore()
  const liveAccessory = devices.find(device => device.id === accessory.id) ?? accessory
  const [brightness, setBrightness] = useState(liveAccessory.brightness ?? 100)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(liveAccessory.friendlyName)

  const handleToggle = async () => {
    await toggleDevice(liveAccessory.id)
  }

  const handleBrightnessChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    setBrightness(val)
    await setDeviceBrightness(liveAccessory.id, val)
  }

  const selectedColor = liveAccessory.color

  const handlePresetColor = async (hue: number, sat: number) => {
    await setColor(liveAccessory.id, { hue, saturation: sat })
  }

  const handleRename = async () => {
    if (newName.trim() && newName.trim() !== liveAccessory.friendlyName) {
      await setDeviceName(liveAccessory.id, newName.trim())
    }
    setIsEditingName(false)
  }

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="detail-back-btn" onClick={onClose}>
          <ArrowLeft size={24} />
        </button>
        {isEditingName ? (
          <input
            type="text"
            className="detail-title-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            autoFocus
          />
        ) : (
          <div className="detail-title-container" onClick={() => setIsEditingName(true)}>
            <span className="detail-title">{liveAccessory.friendlyName}</span>
            <Pencil size={14} className="detail-edit-icon" />
          </div>
        )}
        <div style={{ width: 44 }} />
      </div>

      <div className="detail-body">
        <button
          className={`detail-toggle ${liveAccessory.isOn ? 'is-on' : ''}`}
          onClick={handleToggle}
        >
          <div className="detail-toggle-icon">
            {liveAccessory.deviceType === 'plug' ? (
              <Plug size={64} />
            ) : (
              <Lightbulb size={64} />
            )}
          </div>
          <span className="detail-toggle-label">{liveAccessory.isOn ? 'On' : 'Off'}</span>
        </button>

        {liveAccessory.deviceType === 'light' && liveAccessory.supportsLevelControl && (
          <div className="detail-section">
            <div className="brightness-slider-container">
              <Sun size={16} color={liveAccessory.isOn ? '#ffcc00' : '#8e8e93'} />
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={handleBrightnessChange}
                className="brightness-slider"
              />
              <span className="brightness-label">{brightness}%</span>
            </div>
          </div>
        )}

        {liveAccessory.deviceType === 'light' && liveAccessory.supportsColorControl && (
          <div className="detail-section">
            <div className="preset-colors">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.name}
                  className={`preset-color ${isColorMatch(selectedColor, c.hue, c.saturation) ? 'selected' : ''}`}
                  style={{
                    background: `hsl(${c.hue}, ${c.saturation}%, ${c.saturation === 0 ? 80 : 50}%)`,
                  }}
                  onClick={() => handlePresetColor(c.hue, c.saturation)}
                  title={c.name}
                />
              ))}
            </div>
            <button className="color-wheel-button" onClick={() => onColorWheelOpen?.(liveAccessory)}>
              Color Wheel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
