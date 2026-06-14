import React from 'react'
import { X } from 'lucide-react'

interface IconPickerModalProps {
  show: boolean
  icons: { id: string; Icon: React.ComponentType<{ size?: number }> }[]
  selectedIconId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ show, icons, selectedIconId, onSelect, onClose }) => {
  if (!show) return null

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
        <div className="edit-icon-grid">
          {icons.map((icon) => {
            const IconComp = icon.Icon
            return (
              <button
                key={icon.id}
                className={`edit-icon-btn ${selectedIconId === icon.id ? 'is-active' : ''}`}
                onClick={() => onSelect(icon.id)}
                type="button"
              >
                <IconComp size={24} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
