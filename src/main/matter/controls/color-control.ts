import { ColorControlClient } from '@matter/main/behaviors/color-control'
import { Endpoint } from '@matter/main'
import { BaseDeviceControl } from './base-control'

export class ColorControl extends BaseDeviceControl {
  findEndpoint(endpointNumber?: number): Endpoint | undefined {
    const requestedEndpoint = this.findEndpointByNumber(endpointNumber)
    if (requestedEndpoint?.maybeStateOf(ColorControlClient) !== undefined) return requestedEndpoint
    if (endpointNumber !== undefined) return undefined

    for (const ep of this.node.endpoints) {
      if (ep.maybeStateOf(ColorControlClient) !== undefined) return ep
    }
    return undefined
  }

  getColor(endpointNumber?: number): { hue: number; saturation: number } | undefined {
    const ep = this.findEndpoint(endpointNumber)
    if (!ep) return undefined
    const state = ep.maybeStateOf(ColorControlClient)
    if (!state || state.currentHue === undefined || state.currentSaturation === undefined) return undefined
    return {
      hue: Math.round(state.currentHue / 254 * 360),
      saturation: Math.round(state.currentSaturation / 254 * 100),
    }
  }

  async setColor(color: { hue: number; saturation: number }, endpointNumber?: number): Promise<void> {
    const ep = this.findEndpoint(endpointNumber)
    if (!ep) throw new Error('No ColorControl endpoint found')
    const matterHue = Math.round(Math.min(254, color.hue / 360 * 254))
    const matterSat = Math.round(Math.min(254, color.saturation / 100 * 254))
    await ep.commandsOf(ColorControlClient).moveToHueAndSaturation({
      hue: matterHue,
      saturation: matterSat,
      transitionTime: 0,
      optionsMask: {},
      optionsOverride: {},
    })
  }
}
