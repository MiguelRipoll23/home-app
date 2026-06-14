import React, { useEffect, useState, useMemo } from 'react'
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
import { useRoomStore } from '../../state/room-store'
import { useUiStore } from '../../state/ui-store'
import { usePreferencesStore } from '../../state/preferences-store'
import { AccessoryCard, AccessoryCardSkeleton } from '../components/AccessoryCard'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { Accessory } from '../../types/device'
import { useOrderedDevices } from '../../hooks/useOrderedDevices'
import { groupItemsByRoom } from '../../utils/category-utils'
import { Thermometer, Lightbulb, Tv, Shield, Zap } from 'lucide-react'



const categoryMeta: Record<string, { name: string; icon: React.ReactNode; match: (d: Accessory) => boolean }> = {
  climate: {
    name: 'Climate',
    icon: <Thermometer size={48} />,
    match: (d) => d.deviceType === 'climate'
  },
  lights: {
    name: 'Lights',
    icon: <Lightbulb size={48} />,
    match: (d) => d.deviceType === 'light'
  },
  'speakers-tvs': {
    name: 'Speakers & TVs',
    icon: <Tv size={48} />,
    match: (d) => d.deviceType === 'speaker'
  },
  security: {
    name: 'Security',
    icon: <Shield size={48} />,
    match: (d) => d.deviceType === 'security'
  },
  energy: {
    name: 'Energy',
    icon: <Zap size={48} />,
    match: (d) => d.deviceType === 'plug' && (d.powerConsumption !== undefined || d.cumulativeEnergyConsumed !== undefined)
  }
}

export const CategoryView: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { devices, loading, error, fetchDevices } = useDeviceStore()
  const { rooms, fetchRooms } = useRoomStore()
  const { selectedCategoryId } = useUiStore()
  const { setCardOrder } = usePreferencesStore()
  const orderedDevices = useOrderedDevices()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const meta = selectedCategoryId ? categoryMeta[selectedCategoryId] : null

  const categoryDevices = useMemo(
    () => (meta ? orderedDevices.filter(meta.match) : []),
    [orderedDevices, meta],
  )

  const roomGroups = useMemo(
    () => groupItemsByRoom(categoryDevices, rooms, d => d.roomId),
    [categoryDevices, rooms]
  )

  const allDeviceIds = categoryDevices.map(d => d.id)
  const activeDevice = activeId ? devices.find(d => d.id === activeId) : null

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
        <div className="card-grid">
          {Array.from({ length: 4 }).map((_, i) => <AccessoryCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDevices} />
  }

  if (!meta) {
    return <EmptyState title="Category not found" description="Select a category from the sidebar." />
  }

  if (categoryDevices.length === 0) {
    return (
      <EmptyState
        icon={meta.icon}
        title={meta.name}
        description={`No accessories in the ${meta.name} category yet.`}
      />
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
        <h1 className="view-title">{meta.name}</h1>
        <SortableContext items={allDeviceIds} strategy={rectSortingStrategy}>
                  {roomGroups.map(group => (
            <div key={group.roomId} className="home-section">
              <h2 className="section-title">{group.roomName}</h2>
              <div className="card-grid">
                {group.items.map(device => (
                  <AccessoryCard
                    key={device.id}
                    accessory={device}
                  />
                ))}
              </div>
            </div>
          ))}
        </SortableContext>
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
