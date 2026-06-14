import { Accessory } from '../types/device'
import { AVAILABLE_ICONS } from '../ui/types/icons'
import { BaseAccessory } from './BaseAccessory'
import { formatPowerConsumption } from '../utils/category-utils'

export class PlugAccessory extends BaseAccessory {
  constructor(accessory: Accessory) {
    super(accessory)

    const plugIcons = AVAILABLE_ICONS.plug
    const found = plugIcons.find(i => i.id === accessory.icon)
    this.iconComponent = found ? found.Icon : plugIcons[0].Icon

    if (accessory.isOn) {
      if (accessory.powerConsumption !== undefined) {
        const w = accessory.powerConsumption
        const display = formatPowerConsumption(w)
        this.stateLabel = `On \u00b7 ${display}`
      } else {
        this.stateLabel = 'On'
      }
    } else {
      this.stateLabel = 'Off'
    }
  }
}
