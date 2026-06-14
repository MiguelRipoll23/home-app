import { ClientNode, Endpoint } from '@matter/main'

export abstract class BaseDeviceControl {
  constructor(protected node: ClientNode) {}

  findEndpointByNumber(endpointNumber?: number): Endpoint | undefined {
    if (endpointNumber === undefined) return undefined
    return this.node.endpoints.find(ep => Number(ep.number) === endpointNumber)
  }
}
