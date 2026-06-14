import React, { useRef, useCallback, useMemo } from 'react'
import { Scene } from '../../types/scene'
import { useDeviceStore } from '../../state/device-store'
import { useSceneStore } from '../../state/scene-store'
import { useUiStore } from '../../state/ui-store'
import { AVAILABLE_ICONS } from '../types/icons'

interface SceneCardProps {
  scene: Scene
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene }) => {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const devices = useDeviceStore(s => s.devices)
  const activateScene = useSceneStore(s => s.activateScene)
  const openModal = useUiStore(s => s.openModal)

  const isOn = useMemo(() => {
    if (!scene.accessories || scene.accessories.length === 0) return false
    return scene.accessories.every(entry => {
      const device = devices.find(d => d.id === entry.accessoryId)
      if (!device) return false
      if ('isOn' in entry) {
        if (device.isOn !== entry.isOn) return false
        if (entry.deviceType === 'light') {
          if (entry.brightness !== undefined && device.brightness !== entry.brightness) return false
          if (entry.color !== undefined) {
            if (!device.color || device.color.hue !== entry.color.hue || device.color.saturation !== entry.color.saturation) return false
          }
        }
      }
      return true
    })
  }, [scene.accessories, devices])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    longPressTriggered.current = false
    pressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      pressTimer.current = null
      openModal('edit-scene', scene.id)
    }, 500)
  }, [scene.id, openModal])

  const handleMouseUp = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }, [])

  const handleClick = useCallback(() => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    activateScene(scene.id)
  }, [scene.id, activateScene])

  if (!scene.isAvailable) return null

  const icons = AVAILABLE_ICONS.scene
  const iconData = icons.find(i => i.id === scene.icon) || icons[0]
  const IconComp = iconData.Icon

  return (
    <div
      className={`scene-card ${isOn ? 'is-on' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <IconComp size={20} className="scene-card-icon" color={isOn ? (scene.color || 'var(--accent)') : 'white'} />
      <span className="scene-card-name">{scene.name}</span>
    </div>
  )
}
