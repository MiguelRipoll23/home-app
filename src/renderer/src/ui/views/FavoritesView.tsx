import React, { useState } from 'react'
import { Star } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useDeviceStore } from '../../state/device-store'
import { useUiStore } from '../../state/ui-store'
import { usePreferencesStore } from '../../state/preferences-store'
import { AccessoryCard, AccessoryCardSkeleton } from '../components/AccessoryCard'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { Header } from '../components/Header'
import { useOrderedDevices } from '../../hooks/useOrderedDevices'

import { useTranslation } from 'react-i18next'



export const FavoritesView: React.FC = () => {
  const { t } = useTranslation()
  const { devices, loading, error, fetchDevices } = useDeviceStore()
  const { editModeType } = useUiStore()
  const { setCardOrder } = usePreferencesStore()
  const orderedDevices = useOrderedDevices()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = orderedDevices.findIndex(d => d.id === active.id)
      const newIndex = orderedDevices.findIndex(d => d.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrdered = arrayMove(orderedDevices, oldIndex, newIndex)
        setCardOrder(newOrdered.map(d => d.id))
      }
    }
  }

  if (loading) {
    return (
      <div className="view-content">
        <Header title={t('sidebar.favorites')} />
        <div className="card-grid">
          {Array.from({ length: 4 }).map((_, i) => <AccessoryCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDevices} />
  }

  const favorites = orderedDevices.filter(d => d.isFavorite)
  const activeDevice = activeId ? devices.find(d => d.id === activeId) : null

  if (favorites.length === 0) {
    return (
      <div className="view-content">
        <Header title={t('sidebar.favorites')} />
        <EmptyState
          icon={<Star size={48} />}
          title={t('sidebar.noFavorites', { defaultValue: 'No Favorites' })}
          description={t('sidebar.addFavoritesDescription', { defaultValue: 'Add accessories to your favorites for quick access.' })}
        />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="view-content">
        <Header title={t('sidebar.favorites')} />
        <div className="card-grid">
          <SortableContext items={favorites.map(d => d.id)} strategy={rectSortingStrategy} disabled={editModeType !== 'accessories'}>
            {favorites.map(device => (
              <AccessoryCard
                key={device.id}
                accessory={device}
              />
            ))}
          </SortableContext>
        </div>
      </div>
      <DragOverlay adjustScale={true}>
        {activeDevice ? (
          <AccessoryCard
            accessory={activeDevice}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
