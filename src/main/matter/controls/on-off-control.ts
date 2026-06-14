import { OnOffClient } from '@matter/main/behaviors/on-off'
import { Endpoint } from '@matter/main'
import { BaseDeviceControl } from './base-control'

export class OnOffControl extends BaseDeviceControl {
  findEndpoint(endpointNumber?: number): Endpoint | undefined {
    const requestedEndpoint = this.findEndpointByNumber(endpointNumber)
    if (requestedEndpoint?.maybeStateOf(OnOffClient) !== undefined) return requestedEndpoint
    if (endpointNumber !== undefined) return undefined

    for (const ep of this.node.endpoints) {
      if (ep.maybeStateOf(OnOffClient) !== undefined) return ep
    }
    return undefined
  }

  async getState(endpointNumber?: number): Promise<boolean | undefined> {
    const ep = this.findEndpoint(endpointNumber)
    if (!ep) return undefined
    return ep.stateOf(OnOffClient).onOff
  }

  async toggle(endpointNumber?: number): Promise<boolean> {
    const ep = this.findEndpoint(endpointNumber)
    if (!ep) throw new Error('No OnOff endpoint found')
    const newState = !ep.stateOf(OnOffClient).onOff
    const commands = ep.commandsOf(OnOffClient)
    if (newState) {
      await commands.on()
    } else {
      await commands.off()
    }
    return newState
  }

  async set(on: boolean, endpointNumber?: number): Promise<boolean> {
    const ep = this.findEndpoint(endpointNumber)
    if (!ep) throw new Error('No OnOff endpoint found')
    const commands = ep.commandsOf(OnOffClient)
    if (on) {
      await commands.on()
    } else {
      await commands.off()
    }
    return on
  }
}
