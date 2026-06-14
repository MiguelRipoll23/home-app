import React, { useState, useCallback } from 'react'
import { Accessory } from '../../types/device'
import { AVAILABLE_ICONS, DeviceIcon } from '../types/icons'
import { BaseAccessoryEditView } from './BaseAccessoryEditView'
import { IconPickerModal } from './IconPickerModal'
import { api } from '../../services/ipc'

interface LightAccessoryEditViewProps {
  accessory: Accessory
  onClose: () => void
}

export const LightAccessoryEditView: React.FC<LightAccessoryEditViewProps> = ({ accessory, onClose }) => {
  const [iconId, setIconId] = useState(accessory.icon || AVAILABLE_ICONS.light[0].id)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleSave = useCallback(async () => {
    let changed = false
    if (iconId !== accessory.icon) {
      await api().storage.setCustomIcon(accessory.id, iconId)
      changed = true
    }
    return changed
  }, [iconId, accessory.icon, accessory.id])

  const handleIconSelect = useCallback((id: string) => {
    setIconId(id)
    setShowIconPicker(false)
  }, [])

  const icons = AVAILABLE_ICONS.light

  const customIcon = (
    <button className="edit-identity-icon" onClick={() => setShowIconPicker(true)}>
      <DeviceIcon type="light" iconId={iconId} size={24} color="#ffcc00" />
    </button>
  )

  const customIconPicker = (
    <IconPickerModal
      show={showIconPicker}
      icons={icons}
      selectedIconId={iconId}
      onSelect={handleIconSelect}
      onClose={() => setShowIconPicker(false)}
    />
  )

  return (
    <BaseAccessoryEditView
      accessory={accessory}
      onClose={onClose}
      customIcon={customIcon}
      customIconPicker={customIconPicker}
      onSave={handleSave}
    />
  )
}
