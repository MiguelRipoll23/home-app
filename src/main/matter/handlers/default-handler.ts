import { Accessory } from '../../../shared/types/device'
import { BaseDeviceHandler } from '../device-handler'

export class DefaultHandler extends BaseDeviceHandler {
  readonly deviceType = '__default__'

  protected async fetchExtra(): Promise<Partial<Accessory>> {
    return {
      supportsLevelControl: false,
      supportsColorControl: false,
    }
  }

  subscribe(): void {
  }
}
