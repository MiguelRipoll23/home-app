import React, { useState, useCallback } from 'react'
import { X, Settings } from 'lucide-react'
import { Accessory } from '../../types/device'
import './AccessoryControlBase.css'

interface AccessoryControlBaseProps {
  accessory: Accessory
  onClose: () => void
  onGearClick?: () => void
  stateText?: string
  stateTextOn?: boolean
  children?: React.ReactNode
}

export const AccessoryControlBase: React.FC<AccessoryControlBaseProps> = ({
  accessory,
  onClose,
  onGearClick,
  stateText,
  stateTextOn = true,
  children
}) => {
  const [closing, setClosing] = useState(false)

  const handleClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 200)
  }, [closing, onClose])

  return (
    <div className={`accessory-control-overlay ${closing ? 'is-closing' : ''}`} onClick={handleClose} role="dialog" aria-modal="true">
      <div className={`control-panel ${closing ? 'is-closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="control-header">
          <div className="control-title">{accessory.friendlyName}</div>
          <button className="control-close" onClick={handleClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {stateText !== undefined && (
          <div style={{ textAlign: 'center' }}>
            <div className={`control-state-text ${stateTextOn ? 'is-on' : 'is-off'}`}>
              {stateText}
            </div>
          </div>
        )}

        <div className="control-body">
          {children}
        </div>

        <div className="control-footer">
          <button className="control-gear" onClick={onGearClick || handleClose} aria-label="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
