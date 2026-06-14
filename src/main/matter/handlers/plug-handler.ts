import { ClientNode, Endpoint } from '@matter/main'
import { LevelControlClient } from '@matter/main/behaviors/level-control'
import { ElectricalPowerMeasurementClient } from '@matter/main/behaviors/electrical-power-measurement'
import { ElectricalEnergyMeasurementClient } from '@matter/main/behaviors/electrical-energy-measurement'
import { Accessory } from '../../../shared/types/device'
import { BaseDeviceHandler } from '../device-handler'
import { LevelControl } from '../controls/level-control'
import { ElectricalPowerControl } from '../controls/electrical-power-control'
import { ElectricalEnergyControl } from '../controls/electrical-energy-control'

export class PlugHandler extends BaseDeviceHandler {
  readonly deviceType = 'plug'

  protected async fetchExtra(node: ClientNode, endpoint: Endpoint, _friendlyName: string): Promise<Partial<Accessory>> {
    const endpointNumber = Number(endpoint.number)
    const powerControl = new ElectricalPowerControl(node)
    const energyControl = new ElectricalEnergyControl(node)
    const powerConsumption = powerControl.getActivePower()
    const cumulativeEnergyConsumed = energyControl.getCumulativeEnergy()
    const levelControl = new LevelControl(node)
    const supportsLevelControl = levelControl.findEndpoint(endpointNumber) !== undefined

    return {
      powerConsumption,
      cumulativeEnergyConsumed,
      supportsLevelControl,
      supportsColorControl: false,
    }
  }

  subscribe(node: ClientNode, endpoint: Endpoint, onUpdate: () => void): void {
    const epNum = Number(endpoint.number)
    const levelControl = new LevelControl(node)

    if (levelControl.findEndpoint(epNum)) {
      try {
        const lcEvents = endpoint.eventsOf(LevelControlClient) as { currentLevel$Changed?: { on: (cb: () => void) => void } }
        lcEvents.currentLevel$Changed?.on(onUpdate)
      } catch { void 0 }
    }

    const powerControl = new ElectricalPowerControl(node)
    const powerEp = powerControl.findEndpoint()
    if (powerEp) {
      try {
        const pmEvents = powerEp.eventsOf(ElectricalPowerMeasurementClient) as { activePower$Changed?: { on: (cb: () => void) => void } }
        pmEvents.activePower$Changed?.on(onUpdate)
      } catch { void 0 }
    }

    const energyControl = new ElectricalEnergyControl(node)
    const energyEp = energyControl.findEndpoint()
    if (energyEp) {
      try {
        const emEvents = energyEp.eventsOf(ElectricalEnergyMeasurementClient) as { cumulativeEnergyImported$Changed?: { on: (cb: () => void) => void } }
        emEvents.cumulativeEnergyImported$Changed?.on(onUpdate)
      } catch { void 0 }
    }
  }
}
