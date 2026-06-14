export const DEVICE_TYPE_MAP: Record<string, string> = {
  climate: 'climate',
  lights: 'light',
  security: 'security',
  'speakers-tvs': 'speaker',
  energy: 'plug',
}

export function hasEnergyMonitoring(d: { powerConsumption?: number; cumulativeEnergyConsumed?: number }): boolean {
  return d.powerConsumption !== undefined || d.cumulativeEnergyConsumed !== undefined
}

export function categoryFilter(pillId: string, d: { deviceType: string; powerConsumption?: number; cumulativeEnergyConsumed?: number }): boolean {
  const dt = DEVICE_TYPE_MAP[pillId]
  if (!dt) return false
  if (d.deviceType !== dt) return false
  if (pillId === 'energy') return hasEnergyMonitoring(d)
  return true
}

export function formatPowerConsumption(w: number): string {
  return w >= 1000 ? `${(w / 1000).toFixed(2)}kW` : `${w.toFixed(1)}W`
}

export const PRESET_COLORS = [
  { name: 'White', hue: 0, saturation: 0 },
  { name: 'Warm', hue: 30, saturation: 100 },
  { name: 'Soft', hue: 60, saturation: 50 },
  { name: 'Daylight', hue: 200, saturation: 100 },
  { name: 'Red', hue: 0, saturation: 100 },
  { name: 'Green', hue: 120, saturation: 100 },
  { name: 'Blue', hue: 240, saturation: 100 },
  { name: 'Purple', hue: 280, saturation: 100 },
]

export function groupItemsByRoom<T>(
  items: T[],
  rooms: { id: string; name: string }[],
  getRoomId: (item: T) => string | null | undefined,
  unknownLabel = 'Other'
): { roomId: string; roomName: string; items: T[] }[] {
  const roomMap = new Map(rooms.map(r => [r.id, r.name]))
  const groups: { roomId: string; roomName: string; items: T[] }[] = []

  for (const item of items) {
    const rawRoomId = getRoomId(item)
    const roomId = rawRoomId ?? ''
    let group = groups.find(g => g.roomId === roomId)
    if (!group) {
      group = {
        roomId,
        roomName: roomId ? (roomMap.get(roomId) ?? unknownLabel) : unknownLabel,
        items: [],
      }
      groups.push(group)
    }
    group.items.push(item)
  }

  return groups
}

export function isColorMatch(
  selectedColor: { hue: number; saturation: number } | null | undefined,
  hue: number,
  saturation: number
): boolean {
  if (!selectedColor) return false
  const matchesHue = Math.abs(selectedColor.hue - hue) <= 5
  const matchesSat = Math.abs(selectedColor.saturation - saturation) <= 5
  return matchesHue && matchesSat
}
