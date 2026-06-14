import { LevelControlClient } from '@matter/main/behaviors/level-control'
import { OnOffClient } from '@matter/main/behaviors/on-off'
import { Endpoint } from '@matter/main'
import { BaseDeviceControl } from './base-control'
import { OnOffControl } from './on-off-control'

export class LevelControl extends BaseDeviceControl {
  findEndpoint(endpointNumber?: number): Endpoint | undefined {
    const requestedEndpoint = this.findEndpointByNumber(endpointNumber)
    if (requestedEndpoint?.maybeStateOf(LevelControlClient) !== undefined) return requestedEndpoint
    if (endpointNumber !== undefined) return undefined

    for (const ep of this.node.endpoints) {
      if (ep.maybeStateOf(LevelControlClient) !== undefined) return ep
    }
    return undefined
  }

  getLevel(endpointNumber?: number): number | undefined {
    const ep = this.findEndpoint(endpointNumber)
    if (!ep) return undefined
    const state = ep.maybeStateOf(LevelControlClient)
    if (!state || state.currentLevel === null) return undefined
    return Math.round(state.currentLevel / 254 * 100)
  }

  async setLevel(level: number, endpointNumber?: number): Promise<void> {
    const ep = this.findEndpoint(endpointNumber)
    if (!ep) throw new Error('No LevelControl endpoint found')
    const onOff = new OnOffControl(this.node)
    const onOffEp = onOff.findEndpoint(endpointNumber)

    const matterLevel = Math.round(Math.max(1, Math.min(254, level / 100 * 254)))

    if (level === 0) {
      if (onOffEp) await onOffEp.commandsOf(OnOffClient).off()
      return
    }

    if (onOffEp) await onOffEp.commandsOf(OnOffClient).on()

    await ep.commandsOf(LevelControlClient).moveToLevel({
      level: matterLevel,
      transitionTime: 0,
      optionsMask: {},
      optionsOverride: {},
    })
  }
}
