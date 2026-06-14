export const DEFAULT_ROOM_ID = 'default-room'
export const DEFAULT_ROOM_NAME = 'Default Room'

export interface RoomLike {
  id: string
  name: string
  order?: number
}

export function ensureDefaultRoom<T extends RoomLike>(rooms: T[]): RoomLike[] {
  const withoutDefault = rooms.filter(room => room.id !== DEFAULT_ROOM_ID)
  return [
    { id: DEFAULT_ROOM_ID, name: DEFAULT_ROOM_NAME, order: 0 },
    ...withoutDefault.map((room, index) => ({ ...room, order: index + 1 })),
  ]
}

export function getDefaultRoomAssignment(roomId?: string): string {
  return roomId || DEFAULT_ROOM_ID
}
