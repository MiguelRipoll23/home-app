import { Accessory } from '../types/device'
import { AVAILABLE_ICONS } from '../ui/types/icons'
import { BaseAccessory } from './BaseAccessory'

export class GenericAccessory extends BaseAccessory {
  constructor(accessory: Accessory) {
    super(accessory)

    const typeIcons = AVAILABLE_ICONS[accessory.deviceType] ?? AVAILABLE_ICONS.plug
    const found = typeIcons.find(i => i.id === accessory.icon)
    this.iconComponent = found ? found.Icon : typeIcons[0].Icon

    this.stateLabel = accessory.isOn ? 'On' : 'Off'
  }
}
