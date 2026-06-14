import { DeviceType } from './device'

// Base — truly universal fields only (not all Matter device types have On/Off)
interface SceneAccessoryStateBase {
  accessoryId: string
  deviceType: DeviceType
}

// Light — OnOff + LevelControl + ColorControl clusters
export interface SceneLightState extends SceneAccessoryStateBase {
  deviceType: 'light'
  isOn: boolean
  brightness?: number
  color?: { hue: number; saturation: number }
}

// Plug — OnOff cluster only
export interface ScenePlugState extends SceneAccessoryStateBase {
  deviceType: 'plug'
  isOn: boolean
}

// Discriminated union — extend here when adding climate/speaker/etc.
export type SceneAccessoryState = SceneLightState | ScenePlugState

export interface Scene {
  id: string
  name: string
  icon?: string
  color?: string
  isAvailable: boolean
  isFavorite: boolean
  roomId?: string
  showOnHome?: boolean
  // Only present on custom scenes (Matter scenes have their own execution)
  accessories?: SceneAccessoryState[]
  // Matter scene fields (optional — only on Matter scenes)
  accessoryId?: string
  groupId?: number
  sceneId?: number
}
