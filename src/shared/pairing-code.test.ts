import { describe, expect, it } from 'vitest'
import { formatSetupCodeInput, normalizeSetupCode } from './pairing-code'

describe('pairing code helpers', () => {
  it('formats eleven digits as xxxx-xxx-xxxx', () => {
    expect(formatSetupCodeInput('12345678901')).toBe('1234-567-8901')
  })

  it('normalizes a formatted setup code to digits', () => {
    expect(normalizeSetupCode('1234-567-8901')).toBe('12345678901')
  })

  it('removes non-digits while formatting', () => {
    expect(formatSetupCodeInput('12ab34 567.890')).toBe('1234-567-890')
  })

  it('caps setup codes to eleven digits', () => {
    expect(formatSetupCodeInput('1234567890123')).toBe('1234-567-8901')
  })
})
