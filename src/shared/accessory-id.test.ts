import { describe, expect, it } from 'vitest'
import { makeAccessoryId, parseAccessoryId } from './accessory-id'

describe('accessory id helpers', () => {
  it('combines node id and endpoint number', () => {
    expect(makeAccessoryId('node-a', 3)).toBe('node-a:3')
  })

  it('parses a combined accessory id', () => {
    expect(parseAccessoryId('node-a:3')).toEqual({ nodeId: 'node-a', endpointNumber: 3 })
  })

  it('supports node ids that contain colons', () => {
    expect(parseAccessoryId('fabric:node:12')).toEqual({ nodeId: 'fabric:node', endpointNumber: 12 })
  })

  it('returns null for invalid ids', () => {
    expect(parseAccessoryId('node-a')).toBeNull()
    expect(parseAccessoryId('node-a:not-a-number')).toBeNull()
    expect(parseAccessoryId(':1')).toBeNull()
  })
})
