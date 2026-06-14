export interface ParsedAccessoryId {
  nodeId: string
  endpointNumber: number
}

export function makeAccessoryId(nodeId: string, endpointNumber: number): string {
  return `${nodeId}:${endpointNumber}`
}

export function parseAccessoryId(id: string): ParsedAccessoryId | null {
  const separatorIndex = id.lastIndexOf(':')
  if (separatorIndex <= 0 || separatorIndex === id.length - 1) return null

  const nodeId = id.slice(0, separatorIndex)
  const endpointNumber = Number(id.slice(separatorIndex + 1))
  if (!Number.isInteger(endpointNumber) || endpointNumber < 0) return null

  return { nodeId, endpointNumber }
}
