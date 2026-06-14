import { DeviceHandlerRegistry } from './device-handler'
import { PlugHandler } from './handlers/plug-handler'
import { LightHandler } from './handlers/light-handler'
import { DefaultHandler } from './handlers/default-handler'

export function initializeDeviceHandlers(): void {
  DeviceHandlerRegistry.registerDefault(new DefaultHandler())

  DeviceHandlerRegistry.register('light', new LightHandler())
  DeviceHandlerRegistry.register('plug', new PlugHandler())
}
