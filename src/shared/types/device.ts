export type DeviceType = 'light' | 'plug' | 'climate' | 'speaker' | 'security'

export interface IAccessory {
  id: string
  friendlyName: string
  deviceType: DeviceType
  roomId: string
  isOn: boolean
  isFavorite: boolean
  isReachable: boolean
  showOnHome?: boolean
  icon?: string
}

export interface Accessory extends IAccessory {
  nodeId?: string
  endpointNumber?: number
  bridgeId?: string
  bridgeName?: string
  brightness?: number
  color?: {
    hue: number
    saturation: number
    colorTemperature?: number
  }
  supportsOnOff: boolean
  supportsLevelControl: boolean
  supportsColorControl: boolean
  size?: 'small' | 'large'
  powerConsumption?: number
  cumulativeEnergyConsumed?: number
}

export interface DiscoveredDevice {
  id: string
  name: string
  vendor?: string
  product?: string
  discriminator: number
  address: string
  port: number
}

export interface AccessoryState {
  isOn: boolean
  isReachable: boolean
  brightness?: number
  color?: { hue: number; saturation: number; colorTemperature?: number }
}

export interface BridgeInfo {
  id: string
  name: string
  accessoryCount: number
  isReachable: boolean
}
