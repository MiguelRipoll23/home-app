import { create } from 'zustand'
import { api } from '../services/ipc'
import i18n from 'i18next'

const DEFAULT_ROOM_ID = 'default-room'

interface RoomData {
  id: string
  name: string
  order: number
}

interface RoomState {
  rooms: RoomData[]
  rawRooms: RoomData[]
  loading: boolean
  fetchRooms: () => Promise<void>
  addRoom: (id: string, name: string) => Promise<void>
  removeRoom: (id: string) => Promise<void>
}

function translateRoom(room: RoomData): RoomData {
  if (room.id === DEFAULT_ROOM_ID) {
    return { ...room, name: i18n.t('settings.defaultRoom') }
  }
  return room
}

function translateRooms(rooms: RoomData[]): RoomData[] {
  return rooms.map(translateRoom)
}

export const useRoomStore = create<RoomState>((set, get) => {
  i18n.on('languageChanged', () => {
    const { rawRooms } = get()
    if (rawRooms.length > 0) {
      set({ rooms: translateRooms(rawRooms) })
    }
  })

  return {
    rooms: [],
    rawRooms: [],
    loading: true,

    fetchRooms: async () => {
      set({ loading: true })
      try {
        const rooms = await api().storage.getRooms()
        set({ rawRooms: rooms, rooms: translateRooms(rooms), loading: false })
      } catch {
        set({ loading: false })
      }
    },

    addRoom: async (id: string, name: string) => {
      await api().storage.addRoom(id, name)
      const room = { id, name, order: get().rooms.length }
      set(state => ({
        rawRooms: [...state.rawRooms, room],
        rooms: [...state.rooms, translateRoom(room)],
      }))
    },

    removeRoom: async (id: string) => {
      await api().storage.removeRoom(id)
      set(state => ({
        rooms: state.rooms.filter(r => r.id !== id),
        rawRooms: state.rawRooms.filter(r => r.id !== id),
      }))
    },
  }
})
