import { Accessory } from '../types/device'
import { BaseAccessory } from './BaseAccessory'
import { AccessoryRegistry } from './AccessoryRegistry'

export function createAccessory(accessory: Accessory): BaseAccessory {
  const Entry = AccessoryRegistry.getEntry(accessory.deviceType)
  return new Entry.model(accessory)
}
