import React from 'react'
import { Accessory, IAccessory, DeviceType } from '../types/device'

export abstract class BaseAccessory implements IAccessory {
  protected readonly accessory: Accessory
  protected iconComponent!: React.ComponentType<{ size?: number; color?: string }>
  protected stateLabel!: string

  constructor(accessory: Accessory) {
    this.accessory = accessory
  }

  // IAccessory implementation
  get id(): string { return this.accessory.id }
  get friendlyName(): string { return this.accessory.friendlyName }
  get deviceType(): DeviceType { return this.accessory.deviceType }
  get roomId(): string { return this.accessory.roomId }
  get isOn(): boolean { return this.accessory.isOn }
  get supportsOnOff(): boolean { return this.accessory.supportsOnOff }
  get isFavorite(): boolean { return this.accessory.isFavorite }
  get isReachable(): boolean { return this.accessory.isReachable }
  get showOnHome(): boolean | undefined { return this.accessory.showOnHome }
  get icon(): string | undefined { return this.accessory.icon }

  // View Model Methods
  getIconComponent(): React.ComponentType<{ size?: number; color?: string }> {
    return this.iconComponent
  }

  getStateLabel(): string {
    if (!this.isReachable) return 'Offline'
    return this.stateLabel
  }

  isEffectivelyOn(): boolean {
    return this.isOn
  }
}
