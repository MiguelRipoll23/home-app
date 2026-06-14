import { ElectricalPowerMeasurementClient } from '@matter/main/behaviors/electrical-power-measurement'
import { DescriptorClient } from '@matter/main/behaviors/descriptor'
import { Endpoint } from '@matter/main'
import { BaseDeviceControl } from './base-control'

const POWER_CLUSTER_ID = 0x90

export class ElectricalPowerControl extends BaseDeviceControl {
  findEndpoint(endpointNumber?: number): Endpoint | undefined {
    const check = (ep: Endpoint) =>
      ep.maybeStateOf(ElectricalPowerMeasurementClient) !== undefined || this.hasPowerInDescriptor(ep)

    if (endpointNumber !== undefined) {
      const specific = this.findEndpointByNumber(endpointNumber)
      if (specific && check(specific)) return specific
      return undefined
    }

    for (const ep of this.node.endpoints) {
      if (Number(ep.number) === 0) continue
      if (check(ep)) return ep
    }
    return undefined
  }

  getActivePower(): number | undefined {
    const ep = this.findEndpoint()
    if (!ep) return undefined
    try {
      const state = ep.stateOf(ElectricalPowerMeasurementClient)
      if (state.activePower === null) return undefined
      return state.activePower / 1000
    } catch {
      return undefined
    }
  }

  private hasPowerInDescriptor(endpoint: Endpoint): boolean {
    try {
      const desc = endpoint.maybeStateOf(DescriptorClient)
      if (!desc?.serverList) return false
      return desc.serverList.some((id: number) => id === POWER_CLUSTER_ID)
    } catch { return false }
  }
}
