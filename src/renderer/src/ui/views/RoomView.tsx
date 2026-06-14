import React, { useState } from 'react'
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
import { useSceneStore } from '../../state/scene-store'
import { AccessoryCard, AccessoryCardSkeleton } from '../components/AccessoryCard'
import { SceneCard } from '../components/SceneCard'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { Header } from '../components/Header'
import { useOrderedDevices } from '../../hooks/useOrderedDevices'
import { useTranslation } from 'react-i18next'

export const RoomView: React.FC = () => {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<string | null>(null)
  const { devices, loading, error, fetchDevices } = useDeviceStore()
  const { rooms } = useRoomStore()
  const { selectedRoomId, editModeType } = useUiStore()
  const { setCardOrder } = usePreferencesStore()
  const { scenes } = useSceneStore()
  const orderedDevices = useOrderedDevices()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 3,
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
        <Header title={t('sidebar.rooms')} />
        <div className="card-grid">
          {Array.from({ length: 4 }).map((_, i) => <AccessoryCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDevices} />
  }

  const room = rooms.find(r => r.id === selectedRoomId)
  if (!room) {
    return <EmptyState title={t('sidebar.roomNotFound', { defaultValue: 'Room not found' })} description={t('sidebar.selectRoom', { defaultValue: 'Select a room from the sidebar.' })} />
  }

  const roomDevices = orderedDevices.filter(d => d.roomId === selectedRoomId)
  const roomScenes = scenes.filter(s => {
    if (!s.isAvailable) return false
    if (s.accessories === undefined || s.accessories.length === 0) return false
    return s.accessories.some(entry => {
      const device = devices.find(d => d.id === entry.accessoryId)
      return device?.roomId === selectedRoomId
    })
  })
  const activeDevice = activeId ? devices.find(d => d.id === activeId) : null

  if (roomDevices.length === 0 && roomScenes.length === 0) {
    return (
      <div className="view-content">
        <Header title={room.name} roomId={selectedRoomId} />
        <EmptyState
          description={t('sidebar.noAccessoriesInRoom', { defaultValue: 'No accessories in this room yet.' })}
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
        <Header title={room.name} roomId={selectedRoomId} />
        {roomScenes.length > 0 && (
          <section className="home-section">
            <h2 className="section-title">{t('sidebar.scenes')}</h2>
            <div className="scene-row">
              {roomScenes.map(scene => (
                <SceneCard key={scene.id} scene={scene} />
              ))}
            </div>
          </section>
        )}
        {roomDevices.length > 0 && (
          <div className="card-grid">
            <SortableContext items={roomDevices.map(d => d.id)} strategy={rectSortingStrategy} disabled={editModeType !== 'accessories'}>
              {roomDevices.map(device => (
                <AccessoryCard
                  key={device.id}
                  accessory={device}
                />
              ))}
            </SortableContext>
          </div>
        )}
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
