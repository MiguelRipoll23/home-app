import React from 'react'
import { Accessory } from '../../types/device'
import { AccessoryRegistry } from '../../models/AccessoryRegistry'

interface AccessoryControlViewProps {
  accessory: Accessory
  onClose: () => void
  onGearClick?: () => void
  onToggle?: (isOn: boolean) => void
  onBrightnessChange?: (brightness: number) => void
  onColorChange?: (color: { hue: number; saturation: number }) => void
}

export const AccessoryControlView: React.FC<AccessoryControlViewProps> = ({
  accessory,
  onClose,
  onGearClick,
  onToggle,
  onBrightnessChange,
  onColorChange,
}) => {
  const Entry = AccessoryRegistry.getEntry(accessory.deviceType)
  const ControlComponent = Entry.controlView

  return (
    <ControlComponent
      accessory={accessory}
      onClose={onClose}
      onGearClick={onGearClick}
      onToggle={onToggle}
      onBrightnessChange={onBrightnessChange}
      onColorChange={onColorChange}
    />
  )
}
