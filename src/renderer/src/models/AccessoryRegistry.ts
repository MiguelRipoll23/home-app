import React from 'react'
import { DeviceType, Accessory } from '../types/device'
import { BaseAccessory } from './BaseAccessory'

export interface AccessoryRegistryEntry {
  model: new (accessory: Accessory) => BaseAccessory
  card: React.FC<{ accessory: Accessory }>
  editView: React.FC<{ accessory: Accessory; onClose: () => void }>
  controlView: React.FC<{
    accessory: Accessory
    onClose: () => void
    onGearClick?: () => void
    onToggle?: (isOn: boolean) => void
    onBrightnessChange?: (brightness: number) => void
    onColorChange?: (color: { hue: number; saturation: number }) => void
  }>
}

const registry: Record<string, AccessoryRegistryEntry> = {}
let defaultEntry: AccessoryRegistryEntry | null = null

export const AccessoryRegistry = {
  getEntry(type: DeviceType | string): AccessoryRegistryEntry {
    const entry = registry[type] || defaultEntry
    if (!entry) {
      throw new Error(`AccessoryRegistry: No entry or default entry found for type "${type}". Did you forget to call initializeAccessoryRegistry()?`)
    }
    return entry
  },

  register(type: string, entry: AccessoryRegistryEntry) {
    registry[type] = entry
  },

  registerDefault(entry: AccessoryRegistryEntry) {
    defaultEntry = entry
  }
}
