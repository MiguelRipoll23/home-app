import React, { useState, useMemo } from 'react'
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CategoryPills } from '../components/CategoryPills'
import { SceneCard } from '../components/SceneCard'
import { Sparkles } from 'lucide-react'
import { useDeviceStore } from '../../state/device-store'
import { useRoomStore } from '../../state/room-store'
import { useUiStore } from '../../state/ui-store'
import { usePreferencesStore } from '../../state/preferences-store'
import { useSceneStore } from '../../state/scene-store'
import { AccessoryCard, AccessoryCardSkeleton } from '../components/AccessoryCard'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { Header } from '../components/Header'
import { useOrderedDevices } from '../../hooks/useOrderedDevices'
import { useTranslation } from 'react-i18next'
import { DEVICE_TYPE_MAP, hasEnergyMonitoring, groupItemsByRoom } from '../../utils/category-utils'

const SortableSection = ({ id, title, children, disabled }: { id: string; title: string; children: React.ReactNode; disabled: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1,
    cursor: !disabled ? 'grab' : 'default'
  }
  return (
    <section 
      ref={setNodeRef} 
      style={style} 
      className={`home-section ${!disabled ? 'edit-mode' : ''}`} 
      {...attributes} 
      {...listeners}
    >
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  )
}

export const HomeView: React.FC = () => {
  const { t } = useTranslation()
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { devices, loading, initialLoad, error, fetchDevices } = useDeviceStore()
  const { rooms } = useRoomStore()
  const { editModeType } = useUiStore()
  const { setCardOrder, sectionOrder, setSectionOrder } = usePreferencesStore()
  const { scenes } = useSceneStore()
  const orderedDevices = useOrderedDevices()
  
  const isEditingSections = editModeType === 'sections'
  const isEditingAccessories = editModeType === 'accessories'
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 3,
      },
    })
  )

  const filteredDevices = useMemo(() => {
    let list = orderedDevices.filter(d => d.showOnHome !== false)
    if (categoryFilter) {
      const deviceType = DEVICE_TYPE_MAP[categoryFilter]
      if (deviceType) {
        list = list.filter(d => d.deviceType === deviceType && (categoryFilter !== 'energy' || hasEnergyMonitoring(d)))
      }
    }
    return list
  }, [orderedDevices, categoryFilter])

  const favoriteDevices = filteredDevices.filter(d => d.isFavorite)
  const nonFavoriteDevices = filteredDevices.filter(d => !d.isFavorite)
  const availableScenes = scenes.filter(s => s.isAvailable && s.showOnHome !== false)

  const roomGroups = useMemo(
    () => groupItemsByRoom(nonFavoriteDevices, rooms, d => d.roomId),
    [nonFavoriteDevices, rooms]
  )

  const sections = useMemo(() => {
    const items = []
    if (favoriteDevices.length > 0) items.push({ id: 'favorites', title: t('sidebar.favorites'), type: 'favorites' })
    if (availableScenes.length > 0) items.push({ id: 'scenes', title: t('sidebar.scenes'), type: 'scenes' })
    roomGroups.forEach(g => items.push({ id: g.roomId, title: g.roomName, type: 'room', roomId: g.roomId }))
    return items
  }, [favoriteDevices, availableScenes, roomGroups, t])

  const sortedSections = useMemo(() => {
    const sectionMap = new Map(sections.map(s => [s.id, s]))
    const ordered = []

    for (const id of sectionOrder) {
      const s = sectionMap.get(id)
      if (s) {
        ordered.push(s)
        sectionMap.delete(id)
      }
    }

    const remaining = Array.from(sectionMap.values())
    const defaultFavorites = remaining.filter(s => s.type === 'favorites')
    const defaultScenes = remaining.filter(s => s.type === 'scenes')
    const defaultRooms = remaining.filter(s => s.type === 'room')

    return [...ordered, ...defaultFavorites, ...defaultScenes, ...defaultRooms]
  }, [sections, sectionOrder])

  const handleDragStart = (event: DragStartEvent) => {
    if (isEditingSections) return
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    if (isEditingSections) {
      if (active.id !== over.id) {
        const oldIndex = sortedSections.findIndex(s => s.id === active.id)
        const newIndex = sortedSections.findIndex(s => s.id === over.id)
        const updated = arrayMove(sortedSections, oldIndex, newIndex)
        setSectionOrder(updated.map(s => s.id))
      }
    } else {
      if (active.id !== over.id) {
        const list = favoriteDevices.some(d => d.id === active.id) ? favoriteDevices : nonFavoriteDevices
        const oldIndex = list.findIndex(d => d.id === active.id)
        const newIndex = list.findIndex(d => d.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(list, oldIndex, newIndex)
          const allIds = devices.map(d => d.id)
          const newOrder = allIds.map(id => {
            const indexInReordered = reordered.findIndex(d => d.id === id)
            if (indexInReordered !== -1) return reordered[indexInReordered].id
            const listDevice = list[oldIndex]
            if (id === listDevice.id) return reordered[newIndex].id
            return id
          })
          setCardOrder(newOrder)
        }
      }
    }
    setActiveId(null)
  }

  const activeDevice = activeId ? devices.find(d => d.id === activeId) : null

  if (loading && initialLoad) {
    return (
      <div className="view-content">
        <Header title={t('sidebar.home')} />
        <div className="card-grid">
          {Array.from({ length: 4 }).map((_, i) => <AccessoryCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error && devices.length === 0) {
    return (
      <div className="view-content">
        <Header title={t('sidebar.home')} />
        <ErrorState message={error} onRetry={fetchDevices} />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="view-content">
        <Header title={t('sidebar.home')} />
        <CategoryPills activeFilterId={categoryFilter} onFilterChange={setCategoryFilter} />
        
        <SortableContext items={sortedSections.map(s => s.id)} strategy={verticalListSortingStrategy} disabled={!isEditingSections}>
          {sortedSections.map(section => (
            <SortableSection key={section.id} id={section.id} title={section.title} disabled={!isEditingSections}>
              {section.type === 'favorites' && (
                <div className="card-row">
                  <SortableContext items={favoriteDevices.map(d => d.id)} strategy={rectSortingStrategy} disabled={!isEditingAccessories}>
                    {favoriteDevices.map(device => (
                      <AccessoryCard key={device.id} accessory={device} />
                    ))}
                  </SortableContext>
                </div>
              )}
              {section.type === 'scenes' && (
                <div className="scene-row">
                  {availableScenes.map(scene => (
                    <SceneCard key={scene.id} scene={scene} />
                  ))}
                </div>
              )}
              {section.type === 'room' && (
                <div className="card-grid">
                  <SortableContext items={roomGroups.find(g => g.roomId === section.roomId)?.items.map(d => d.id) || []} strategy={rectSortingStrategy} disabled={!isEditingAccessories}>
                    {roomGroups.find(g => g.roomId === section.roomId)?.items.map(device => (
                      <AccessoryCard key={device.id} accessory={device} />
                    ))}
                  </SortableContext>
                </div>
              )}
            </SortableSection>
          ))}
        </SortableContext>
        
        {filteredDevices.length === 0 && !categoryFilter && (
          <EmptyState icon={<Sparkles size={48} />} title={t('sidebar.noAccessories')} description={t('sidebar.pairFirst')} />
        )}
      </div>
      <DragOverlay adjustScale={true}>
        {activeDevice ? (
          <AccessoryCard accessory={activeDevice} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
