import { ClientNode, Endpoint } from '@matter/main'
import { LevelControlClient } from '@matter/main/behaviors/level-control'
import { ColorControlClient } from '@matter/main/behaviors/color-control'
import { Accessory } from '../../../shared/types/device'
import { BaseDeviceHandler } from '../device-handler'
import { LevelControl } from '../controls/level-control'
import { ColorControl } from '../controls/color-control'

export class LightHandler extends BaseDeviceHandler {
  readonly deviceType = 'light'

  protected async fetchExtra(node: ClientNode, endpoint: Endpoint): Promise<Partial<Accessory>> {
    const endpointNumber = Number(endpoint.number)
    const levelControl = new LevelControl(node)
    const colorControl = new ColorControl(node)
    return {
      brightness: levelControl.getLevel(endpointNumber),
      color: colorControl.getColor(endpointNumber),
      supportsLevelControl: levelControl.findEndpoint(endpointNumber) !== undefined,
      supportsColorControl: colorControl.findEndpoint(endpointNumber) !== undefined,
    }
  }

  subscribe(node: ClientNode, endpoint: Endpoint, onUpdate: () => void): void {
    const epNum = Number(endpoint.number)
    const levelControl = new LevelControl(node)
    const colorControl = new ColorControl(node)

    if (levelControl.findEndpoint(epNum)) {
      try {
        const lcEvents = endpoint.eventsOf(LevelControlClient) as { currentLevel$Changed?: { on: (cb: () => void) => void } }
        lcEvents.currentLevel$Changed?.on(onUpdate)
      } catch { void 0 }
    }

    if (colorControl.findEndpoint(epNum)) {
      try {
        const ccEvents = endpoint.eventsOf(ColorControlClient) as {
          currentHue$Changed?: { on: (cb: () => void) => void }
          currentSaturation$Changed?: { on: (cb: () => void) => void }
        }
        ccEvents.currentHue$Changed?.on(onUpdate)
        ccEvents.currentSaturation$Changed?.on(onUpdate)
      } catch { void 0 }
    }
  }
}
