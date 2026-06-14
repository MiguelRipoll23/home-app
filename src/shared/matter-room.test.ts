import { describe, expect, it } from 'vitest'
import { roomIdFromName, roomNameFromMatterTags } from './matter-room'

describe('Matter room helpers', () => {
  it('uses a descriptor tag label as the room name', () => {
    expect(roomNameFromMatterTags([{ namespaceId: 16, tag: 7, label: 'Kids Room' }])).toBe('Kids Room')
  })

  it('maps known Matter area tags to readable names', () => {
    expect(roomNameFromMatterTags([{ namespaceId: 16, tag: 7 }])).toBe('Bedroom')
    expect(roomNameFromMatterTags([{ namespaceId: 16, tag: 0x31 }])).toBe('Kitchen')
  })

  it('ignores non-area tags', () => {
    expect(roomNameFromMatterTags([{ namespaceId: 1, tag: 7, label: 'Bedroom' }])).toBeUndefined()
  })

  it('creates stable room ids from names', () => {
    expect(roomIdFromName('Kids Room')).toBe('kids-room')
    expect(roomIdFromName('  Living   Room  ')).toBe('living-room')
  })
})
