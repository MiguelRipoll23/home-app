import React from 'react'
import { Accessory } from '../../types/device'
import { Skeleton } from './common/Skeleton'
import { AccessoryRegistry } from '../../models/AccessoryRegistry'

interface AccessoryCardProps {
  accessory: Accessory
}

export const AccessoryCard: React.FC<AccessoryCardProps> = ({ accessory }) => {
  const Entry = AccessoryRegistry.getEntry(accessory.deviceType)
  const CardComponent = Entry.card
  
  return <CardComponent accessory={accessory} />
}

export const AccessoryCardSkeleton: React.FC = () => (
  <div className="accessory-card size-large">
    <div className="accessory-card-header">
      <Skeleton width={44} height={44} borderRadius="50%" />
      <Skeleton width="60%" height={16} />
    </div>
  </div>
)
