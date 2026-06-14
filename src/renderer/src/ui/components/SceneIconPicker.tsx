import React from 'react'
import { X } from 'lucide-react'
import { AVAILABLE_ICONS } from '../types/icons'
import './SceneIconPicker.css'

interface SceneIconPickerProps {
  onClose: () => void
  iconId: string
  color: string
  onIconSelect: (id: string) => void
  onColorSelect: (color: string) => void
}

const COLORS = ['#ffcc00', '#ff3b30', '#ff9500', '#34c759', '#5ac8fa', '#007aff', '#af52de', '#ff2d55', '#8e8e93']
const SCENE_ICONS = AVAILABLE_ICONS.scene

export const SceneIconPicker: React.FC<SceneIconPickerProps> = ({ onClose, iconId, color, onIconSelect, onColorSelect }) => {
  return (
    <div className="icon-picker-overlay" onClick={onClose}>
      <div className="icon-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-view-header">
          <button className="edit-view-close" onClick={onClose}>
            <X size={20} />
          </button>
          <h2 className="edit-view-title">Choose Icon</h2>
          <div style={{ width: 32 }} />
        </div>
        
        <div className="picker-section">
          <div className="color-grid">
            {COLORS.map(c => (
              <button
                key={c}
                className={`color-option ${color === c ? 'is-selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => onColorSelect(c)}
              />
            ))}
          </div>
        </div>

        <div className="picker-section">
          <div className="edit-icon-grid">
            {SCENE_ICONS.map((icon) => {
              const IconComp = icon.Icon
              return (
                <button
                  key={icon.id}
                  className={`edit-icon-btn ${iconId === icon.id ? 'is-active' : ''}`}
                  onClick={() => onIconSelect(icon.id)}
                  type="button"
                >
                  <IconComp size={24} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
