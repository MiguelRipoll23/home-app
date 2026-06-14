import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { ensureDefaultRoom } from '../../shared/default-room'

const STORAGE_FILE = 'home-controller-data.json'
const SCHEMA_VERSION = 2

interface StoredPreferences {
  favoriteIds: string[]
  sceneFavoriteIds: string[]
  /** Accessory IDs explicitly hidden from the home view. Empty = show all. */
  hiddenAccessoryIds: string[]
  customNames: Record<string, string>
  customIcons: Record<string, string>
  roomAssignments: Record<string, string>
}

interface Room {
  id: string
  name: string
  order: number
}

interface StorageSchema {
  version: number
  rooms: Room[]
  preferences: StoredPreferences
}

export interface PreferencesDTO {
  favoriteIds: string[]
  hiddenIds: string[]
  rooms: Room[]
  roomAssignments: Record<string, string>
  customIcons: Record<string, string>
  customNames: Record<string, string>
}

const defaultPreferences: StoredPreferences = {
  favoriteIds: [],
  sceneFavoriteIds: [],
  hiddenAccessoryIds: [],
  customNames: {},
  customIcons: {},
  roomAssignments: {},
}

const defaultStorage: StorageSchema = {
  version: SCHEMA_VERSION,
  rooms: [],
  preferences: { ...defaultPreferences },
}

export class StorageService {
  private filePath: string
  private data: StorageSchema

  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, STORAGE_FILE)
    this.data = this.load()
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private migrate(raw: Record<string, unknown>): Record<string, unknown> {
    const version = (raw.version as number) || 0
    if (version < 2) {
      // v1 → v2: homeAccessoryIds (allowlist) replaced with hiddenAccessoryIds (denylist).
      // Cannot safely invert without knowing all device IDs, so reset to show-all.
      const prefs = { ...(raw.preferences as Record<string, unknown> || {}) }
      delete prefs['homeAccessoryIds']
      return { ...raw, version: 2, preferences: { ...prefs, hiddenAccessoryIds: [] } }
    }
    return raw
  }

  private load(): StorageSchema {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { ...defaultStorage, rooms: ensureDefaultRoom(defaultStorage.rooms) as Room[], preferences: { ...defaultPreferences } }
      }
      const raw = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as Record<string, unknown>
      const migrated = this.migrate(raw) as StorageSchema
      return {
        ...migrated,
        rooms: (ensureDefaultRoom(migrated.rooms ?? []) as Room[]).map((r, i) => ({ ...r, order: r.order ?? i })),
        preferences: { ...defaultPreferences, ...(migrated.preferences || {}) },
      }
    } catch {
      return { ...defaultStorage, rooms: ensureDefaultRoom(defaultStorage.rooms) as Room[], preferences: { ...defaultPreferences } }
    }
  }

  private save(): void {
    const tmpPath = this.filePath + '.tmp.' + crypto.randomBytes(4).toString('hex')
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8')
      fs.renameSync(tmpPath, this.filePath)
    } catch (e) {
      try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath) } catch { void 0 }
      throw e
    }
  }

  private setInList(
    key: 'favoriteIds' | 'sceneFavoriteIds' | 'hiddenAccessoryIds',
    id: string,
    add: boolean,
  ): void {
    const arr = this.data.preferences[key]
    if (add) {
      if (!arr.includes(id)) arr.push(id)
    } else {
      this.data.preferences[key] = arr.filter(item => item !== id)
    }
    this.save()
  }

  private removeKeysByPrefix(record: Record<string, unknown>, prefix: string): void {
    for (const key of Object.keys(record)) {
      if (key.startsWith(prefix)) delete record[key]
    }
  }

  // ---------------------------------------------------------------------------
  // Rooms
  // ---------------------------------------------------------------------------

  getRooms(): Room[] {
    return [...this.data.rooms]
  }

  addRoom(id: string, name: string): void {
    if (!this.data.rooms.find(r => r.id === id)) {
      this.data.rooms.push({ id, name, order: this.data.rooms.length })
      this.save()
    }
  }

  removeRoom(id: string): void {
    this.data.rooms = this.data.rooms.filter(r => r.id !== id)
    // Clean up orphaned room assignments that pointed at the deleted room.
    for (const key of Object.keys(this.data.preferences.roomAssignments)) {
      if (this.data.preferences.roomAssignments[key] === id) {
        delete this.data.preferences.roomAssignments[key]
      }
    }
    this.save()
  }

  // ---------------------------------------------------------------------------
  // Favorites
  // ---------------------------------------------------------------------------

  getFavorites(): string[] {
    return [...this.data.preferences.favoriteIds]
  }

  setFavorite(accessoryId: string, favorite: boolean): void {
    this.setInList('favoriteIds', accessoryId, favorite)
  }

  // ---------------------------------------------------------------------------
  // Scene favorites
  // ---------------------------------------------------------------------------

  getSceneFavorites(): string[] {
    return [...this.data.preferences.sceneFavoriteIds]
  }

  setSceneFavorite(sceneId: string, favorite: boolean): void {
    this.setInList('sceneFavoriteIds', sceneId, favorite)
  }

  // ---------------------------------------------------------------------------
  // Home visibility — hiddenAccessoryIds is a denylist (empty = show all)
  // ---------------------------------------------------------------------------

  getHiddenAccessories(): string[] {
    return [...this.data.preferences.hiddenAccessoryIds]
  }

  setHomeAccessory(accessoryId: string, show: boolean): void {
    // show=true  → remove from denylist
    // show=false → add to denylist
    this.setInList('hiddenAccessoryIds', accessoryId, !show)
  }

  // ---------------------------------------------------------------------------
  // Room assignments
  // ---------------------------------------------------------------------------

  getRoomAssignment(accessoryId: string): string | undefined {
    return this.data.preferences.roomAssignments[accessoryId]
  }

  setRoomAssignment(accessoryId: string, roomId: string): void {
    this.data.preferences.roomAssignments[accessoryId] = roomId
    this.save()
  }

  // ---------------------------------------------------------------------------
  // Custom names
  // ---------------------------------------------------------------------------

  getCustomName(accessoryId: string): string | undefined {
    return this.data.preferences.customNames[accessoryId]
  }

  setCustomName(accessoryId: string, name: string): void {
    this.data.preferences.customNames[accessoryId] = name
    this.save()
  }

  removeCustomName(accessoryId: string): void {
    delete this.data.preferences.customNames[accessoryId]
    this.save()
  }

  // ---------------------------------------------------------------------------
  // Custom icons (set only — default is determined by device type in the model layer)
  // ---------------------------------------------------------------------------

  getIcon(accessoryId: string): string | undefined {
    return this.data.preferences.customIcons[accessoryId]
  }

  setIcon(accessoryId: string, iconId: string): void {
    this.data.preferences.customIcons[accessoryId] = iconId
    this.save()
  }

  // ---------------------------------------------------------------------------
  // Bulk preferences read (used by fetchDevices to hydrate the renderer in one IPC call)
  // ---------------------------------------------------------------------------

  getAllPreferences(): PreferencesDTO {
    return {
      favoriteIds: this.getFavorites(),
      hiddenIds: this.getHiddenAccessories(),
      rooms: this.getRooms(),
      roomAssignments: { ...this.data.preferences.roomAssignments },
      customIcons: { ...this.data.preferences.customIcons },
      customNames: { ...this.data.preferences.customNames },
    }
  }

  // ---------------------------------------------------------------------------
  // Accessory cleanup on bridge removal
  // ---------------------------------------------------------------------------

  removeAccessoryDataByNodeId(nodeId: string): void {
    const prefix = `${nodeId}:`
    this.data.preferences.favoriteIds = this.data.preferences.favoriteIds.filter(id => !id.startsWith(prefix))
    this.data.preferences.sceneFavoriteIds = this.data.preferences.sceneFavoriteIds.filter(id => !id.startsWith(prefix))
    this.data.preferences.hiddenAccessoryIds = this.data.preferences.hiddenAccessoryIds.filter(id => !id.startsWith(prefix))
    this.removeKeysByPrefix(this.data.preferences.roomAssignments as Record<string, unknown>, prefix)
    this.removeKeysByPrefix(this.data.preferences.customNames as Record<string, unknown>, prefix)
    this.removeKeysByPrefix(this.data.preferences.customIcons as Record<string, unknown>, prefix)
    this.save()
  }

  // ---------------------------------------------------------------------------
  // Export / Import
  // ---------------------------------------------------------------------------

  getData(): StorageSchema {
    return JSON.parse(JSON.stringify(this.data))
  }

  setData(newData: Record<string, unknown>): void {
    if (typeof newData !== 'object' || newData === null || typeof newData.version !== 'number') {
      throw new Error('Invalid storage data: missing or malformed version field')
    }
    const migrated = this.migrate(newData) as StorageSchema
    this.data = {
      ...defaultStorage,
      ...migrated,
      version: SCHEMA_VERSION,
      rooms: (migrated.rooms ?? defaultStorage.rooms).map((r, i) => ({ ...r, order: r.order ?? i })),
      preferences: { ...defaultPreferences, ...(migrated.preferences || {}) },
    }
    this.save()
  }
}

export const storageService = new StorageService()
