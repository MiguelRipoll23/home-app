import { Accessory } from '../types/device'
import { AVAILABLE_ICONS } from '../ui/types/icons'
import { BaseAccessory } from './BaseAccessory'

export class LightAccessory extends BaseAccessory {
  constructor(accessory: Accessory) {
    super(accessory)

    const lightIcons = AVAILABLE_ICONS.light
    const found = lightIcons.find(i => i.id === accessory.icon)
    this.iconComponent = found ? found.Icon : lightIcons[0].Icon

    if (!accessory.isOn || accessory.brightness === 0) {
      this.stateLabel = 'Off'
    } else if (accessory.brightness !== undefined) {
      this.stateLabel = `${accessory.brightness}%`
    } else {
      this.stateLabel = 'On'
    }
  }

  override isEffectivelyOn(): boolean {
    return this.isOn && (this.accessory.brightness ?? 100) > 0
  }
}
