import { useMemo } from 'react'
import { Accessory } from '../types/device'
import { useDeviceStore } from '../state/device-store'
import { usePreferencesStore } from '../state/preferences-store'

export function useOrderedDevices(): Accessory[] {
  const devices = useDeviceStore(state => state.devices)
  const cardOrder = usePreferencesStore(state => state.cardOrder)

  return useMemo(() => {
    if (cardOrder.length === 0) return devices
    const deviceMap = new Map(devices.map(d => [d.id, d]))
    const ordered: Accessory[] = []
    for (const id of cardOrder) {
      const device = deviceMap.get(id)
      if (device) {
        ordered.push(device)
        deviceMap.delete(id)
      }
    }
    return [...ordered, ...Array.from(deviceMap.values())]
  }, [devices, cardOrder])
}
