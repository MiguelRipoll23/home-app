import React from 'react'
import { Accessory } from '../../types/device'
import { AccessoryRegistry } from '../../models/AccessoryRegistry'

interface AccessoryEditViewProps {
  accessory: Accessory
  onClose: () => void
}

export const AccessoryEditView: React.FC<AccessoryEditViewProps> = ({ accessory, onClose }) => {
  const Entry = AccessoryRegistry.getEntry(accessory.deviceType)
  const EditViewComponent = Entry.editView
  
  return <EditViewComponent accessory={accessory} onClose={onClose} />
}
