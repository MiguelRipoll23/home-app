const MAX_SETUP_CODE_DIGITS = 11

export function normalizeSetupCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, MAX_SETUP_CODE_DIGITS)
}

export function formatSetupCodeInput(value: string): string {
  const digits = normalizeSetupCode(value)
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)].filter(Boolean)
  return parts.join('-')
}
