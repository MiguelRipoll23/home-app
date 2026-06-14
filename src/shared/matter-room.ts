const AREA_NAMESPACE_ID = 16

const AREA_TAG_NAMES: Record<number, string> = {
  6: 'Bathroom',
  7: 'Bedroom',
  17: 'Dining Room',
  21: 'Entrance',
  24: 'Garage',
  32: 'Hallway',
  49: 'Kitchen',
  59: 'Living Room',
  81: 'Office',
  97: 'Terrace',
}

export interface MatterSemanticTag {
  namespaceId?: number
  tag?: number
  label?: string | null
}

export function roomNameFromMatterTags(tags?: MatterSemanticTag[]): string | undefined {
  const areaTag = tags?.find(tag => tag.namespaceId === AREA_NAMESPACE_ID)
  if (!areaTag) return undefined

  const label = areaTag.label?.trim()
  if (label) return label

  return areaTag.tag === undefined ? undefined : AREA_TAG_NAMES[areaTag.tag]
}

export function roomIdFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
