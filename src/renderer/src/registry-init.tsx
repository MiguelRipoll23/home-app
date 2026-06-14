import React from 'react'
import { AccessoryRegistry } from './models/AccessoryRegistry'
import { GenericAccessory } from './models/GenericAccessory'
import { LightAccessory } from './models/LightAccessory'
import { PlugAccessory } from './models/PlugAccessory'

// UI Components
import { LightAccessoryCard } from './ui/components/LightAccessoryCard'
import { PlugAccessoryCard } from './ui/components/PlugAccessoryCard'
import { BaseAccessoryCard } from './ui/components/BaseAccessoryCard'

import { LightAccessoryEditView } from './ui/components/LightAccessoryEditView'
import { PlugAccessoryEditView } from './ui/components/PlugAccessoryEditView'
import { BaseAccessoryEditView } from './ui/components/BaseAccessoryEditView'

import { LightControlView } from './ui/controls/LightControlView'
import { PlugControlView } from './ui/controls/PlugControlView'

export function initializeAccessoryRegistry() {
  // Default Entry
  AccessoryRegistry.registerDefault({
    model: GenericAccessory,
    card: ({ accessory }) => (
      <BaseAccessoryCard vm={new GenericAccessory(accessory)} />
    ),
    editView: BaseAccessoryEditView,
    controlView: () => <div>Control not implemented</div>,
  })

  // Light Registration
  AccessoryRegistry.register('light', {
    model: LightAccessory,
    card: LightAccessoryCard,
    editView: LightAccessoryEditView,
    controlView: LightControlView,
  })

  // Plug Registration
  AccessoryRegistry.register('plug', {
    model: PlugAccessory,
    card: PlugAccessoryCard,
    editView: PlugAccessoryEditView,
    controlView: PlugControlView,
  })
}
