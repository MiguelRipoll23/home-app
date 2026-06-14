import React, { useMemo } from 'react'
import { Accessory } from '../../types/device'
import { LightAccessory } from '../../models/LightAccessory'
import { BaseAccessoryCard } from './BaseAccessoryCard'

interface LightAccessoryCardProps {
  accessory: Accessory
}

export const LightAccessoryCard: React.FC<LightAccessoryCardProps> = ({ accessory }) => {
  const vm = useMemo(() => new LightAccessory(accessory), [accessory])
  return <BaseAccessoryCard vm={vm} />
}
