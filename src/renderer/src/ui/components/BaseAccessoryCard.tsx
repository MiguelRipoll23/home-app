import React, { useCallback, useMemo } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useUiStore } from '../../state/ui-store'
import { useDeviceStore } from '../../state/device-store'
import { usePreferencesStore } from '../../state/preferences-store'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BaseAccessory } from '../../models/BaseAccessory'
import './AccessoryCard.css'

interface BaseAccessoryCardProps {
  vm: BaseAccessory
}

export const BaseAccessoryCard: React.FC<BaseAccessoryCardProps> = ({
  vm,
}) => {
  const { editMode, editModeType, openModal } = useUiStore()
  const hasFailed = useDeviceStore(s => s.failedCommandIds[vm.id])
  const loading = useDeviceStore(s => s.loading)
  const initialLoad = useDeviceStore(s => s.initialLoad)
  const { setCardSize, getCardSize } = usePreferencesStore()
  const isOffline = !vm.isReachable
  const isEffectivelyOn = vm.isEffectivelyOn()
  const cardSize = getCardSize(vm.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: vm.id,
    disabled: !editMode,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
  }

  const stateLabel = useMemo(() => {
    if (loading && initialLoad) return 'Updating...'
    if (hasFailed) return 'No response'
    return vm.getStateLabel()
  }, [loading, initialLoad, hasFailed, vm])

  const icon = React.createElement(vm.getIconComponent(), { size: 24 })

  const toggleDevice = useDeviceStore(s => s.toggleDevice)

  const handleIconClick = useCallback((e: React.MouseEvent) => {
    if (isOffline || !vm.supportsOnOff) return
    e.stopPropagation()
    toggleDevice(vm.id)
  }, [isOffline, vm, toggleDevice])

  const handleCardClick = useCallback(() => {
    if (!isOffline) {
      if (editMode) {
        openModal('edit-accessory', vm.id)
      } else {
        openModal('detail-accessory', vm.id)
      }
    }
  }, [isOffline, editMode, vm.id, openModal])

  const handleResizeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setCardSize(vm.id, cardSize === 'large' ? 'small' : 'large')
  }, [vm.id, cardSize, setCardSize])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`accessory-card ${isEffectivelyOn ? 'is-on' : ''} ${isOffline ? 'is-offline' : ''} size-${cardSize} ${editMode ? 'edit-mode' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onClick={handleCardClick}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
    >
      {editModeType === 'accessories' && (
        <button
          className="card-resize-btn"
          onClick={handleResizeClick}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          title={cardSize === 'large' ? 'Make small' : 'Make large'}
        >
          {cardSize === 'large' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      )}

      <div className="accessory-card-content">
        <div className={`accessory-card-icon${vm.supportsOnOff ? '' : ' no-onoff'}`} onClick={handleIconClick}>
          {icon}
        </div>
        <div className="accessory-card-info">
          <span className="accessory-card-name">{vm.friendlyName}</span>
          <div className={`accessory-card-state ${vm.isOn ? 'is-on' : 'is-off'}`}>{stateLabel}</div>
        </div>
      </div>
    </div>
  )
}
