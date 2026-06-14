import React, { useState, useCallback } from 'react'
import { Accessory } from '../../types/device'
import { AVAILABLE_ICONS, DeviceIcon } from '../types/icons'
import { BaseAccessoryEditView } from './BaseAccessoryEditView'
import { IconPickerModal } from './IconPickerModal'
import { api } from '../../services/ipc'
import { formatPowerConsumption } from '../../utils/category-utils'

interface PlugAccessoryEditViewProps {
  accessory: Accessory
  onClose: () => void
}

export const PlugAccessoryEditView: React.FC<PlugAccessoryEditViewProps> = ({ accessory, onClose }) => {
  const [iconId, setIconId] = useState(accessory.icon || AVAILABLE_ICONS.plug[0].id)
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

  const icons = AVAILABLE_ICONS.plug

  const customIcon = (
    <button className="edit-identity-icon" onClick={() => setShowIconPicker(true)}>
      <DeviceIcon type="plug" iconId={iconId} size={24} color="#ffcc00" />
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

  const powerRow = accessory.powerConsumption !== undefined && (
    <button className="edit-toggle-row with-divider" style={{ cursor: 'default' }}>
      <span className="edit-toggle-label">Power</span>
      <span className="edit-toggle-value">
        {!accessory.isOn
          ? '0.0W'
          : formatPowerConsumption(accessory.powerConsumption)}
      </span>
    </button>
  )

  const energyRow = accessory.cumulativeEnergyConsumed !== undefined && (
    <button className="edit-toggle-row with-divider" style={{ cursor: 'default' }}>
      <span className="edit-toggle-label">Energy Consumed</span>
      <span className="edit-toggle-value">
        {`${accessory.cumulativeEnergyConsumed.toFixed(2)}kWh`}
      </span>
    </button>
  )

  const customFields = (powerRow || energyRow) && (
    <>
      {powerRow}
      {energyRow}
    </>
  )

  return (
    <BaseAccessoryEditView
      accessory={accessory}
      onClose={onClose}
      customIcon={customIcon}
      customIconPicker={customIconPicker}
      customFields={customFields}
      onSave={handleSave}
    />
  )
}
