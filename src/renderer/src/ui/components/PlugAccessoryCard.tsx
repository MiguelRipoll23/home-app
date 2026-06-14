import React, { useMemo } from 'react'
import { Accessory } from '../../types/device'
import { PlugAccessory } from '../../models/PlugAccessory'
import { BaseAccessoryCard } from './BaseAccessoryCard'

interface PlugAccessoryCardProps {
  accessory: Accessory
}

export const PlugAccessoryCard: React.FC<PlugAccessoryCardProps> = ({ accessory }) => {
  const vm = useMemo(() => new PlugAccessory(accessory), [accessory])
  return <BaseAccessoryCard vm={vm} />
}
