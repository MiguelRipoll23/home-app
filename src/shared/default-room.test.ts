import { describe, expect, it } from 'vitest'
import { DEFAULT_ROOM_ID, DEFAULT_ROOM_NAME, ensureDefaultRoom, getDefaultRoomAssignment } from './default-room'

describe('default room helpers', () => {
  it('inserts Default room first when it is missing', () => {
    const rooms = ensureDefaultRoom([{ id: 'living-room', name: 'Living Room', order: 0 }])

    expect(rooms[0]).toEqual({ id: DEFAULT_ROOM_ID, name: DEFAULT_ROOM_NAME, order: 0 })
    expect(rooms[1]).toEqual({ id: 'living-room', name: 'Living Room', order: 1 })
  })

  it('keeps Default room when it already exists', () => {
    const rooms = ensureDefaultRoom([{ id: DEFAULT_ROOM_ID, name: DEFAULT_ROOM_NAME, order: 2 }])

    expect(rooms).toEqual([{ id: DEFAULT_ROOM_ID, name: DEFAULT_ROOM_NAME, order: 0 }])
  })

  it('uses explicit room assignments as-is', () => {
    expect(getDefaultRoomAssignment('office')).toBe('office')
  })

  it('uses Default room for missing assignments', () => {
    expect(getDefaultRoomAssignment()).toBe(DEFAULT_ROOM_ID)
  })
})
