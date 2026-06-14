import React, { useState, useRef, useCallback } from 'react'
import { Accessory } from '../../types/device'
import { useDeviceStore } from '../../state/device-store'
import { AccessoryControlBase } from './AccessoryControlBase'
import { PRESET_COLORS, isColorMatch } from '../../utils/category-utils'
import './LightControlView.css'

interface LightControlViewProps {
  accessory: Accessory
  onClose: () => void
  onGearClick?: () => void
  onToggle?: (isOn: boolean) => void
  onBrightnessChange?: (brightness: number) => void
  onColorChange?: (color: { hue: number; saturation: number }) => void
}

export const LightControlView: React.FC<LightControlViewProps> = ({
  accessory,
  onClose,
  onGearClick,
  onToggle,
  onBrightnessChange,
  onColorChange,
}) => {
  const { setBrightness, setColor } = useDeviceStore()
  const hasFailed = useDeviceStore(s => s.failedCommandIds[accessory.id])
  const [brightness, setBrightnessState] = useState(accessory.brightness ?? 100)
  const [isDragging, setIsDragging] = useState(false)
  const [stagedColor, _setStagedColor] = useState<{ hue: number; saturation: number } | null>(null)
  const stagedColorRef = useRef<{ hue: number; saturation: number } | null>(null)
  const colorTriggeredRef = useRef(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const setStagedColor = (color: { hue: number; saturation: number } | null) => {
    stagedColorRef.current = color
    _setStagedColor(color)
  }

  const isEffectivelyOn = accessory.isOn && (accessory.brightness === undefined || accessory.brightness > 0)
  const stateText = hasFailed ? 'No response' : (isEffectivelyOn ? `${brightness}%` : 'Off')

  const calculateLevel = useCallback((clientY: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height))
    const level = Math.round((1 - y / rect.height) * 100)
    return Math.max(0, Math.min(100, level))
  }, [])

  const handleTrackMouseDown = useCallback((e: React.MouseEvent) => {
    if (!accessory.supportsLevelControl) return
    e.preventDefault()

    const level = calculateLevel(e.clientY)
    if (level === undefined) return
    
    setBrightnessState(level)
    setIsDragging(true)
    colorTriggeredRef.current = false

    const applyStagedColor = () => {
      if (stagedColorRef.current && !colorTriggeredRef.current) {
        colorTriggeredRef.current = true
        const colorToSend = stagedColorRef.current
        setTimeout(() => {
          if (onColorChange) onColorChange(colorToSend)
          else setColor(accessory.id, colorToSend)
          setStagedColor(null)
        }, 200)
      }
    }
    
    if (onBrightnessChange) {
      onBrightnessChange(level)
      if (onToggle) {
        if (level === 0 && brightness > 0) onToggle(false)
        else if (level > 0 && !isEffectivelyOn) {
          onToggle(true)
          applyStagedColor()
        }
      }
    } else {
      setBrightness(accessory.id, level)
      if (level > 0 && !isEffectivelyOn) {
        applyStagedColor()
      }
    }
    let lastSetBrightness = Date.now()

    const handleMouseMove = (e: MouseEvent) => {
      const l = calculateLevel(e.clientY)
      if (l === undefined) return
      
      setBrightnessState(l)
      
      const now = Date.now()
      if (now - lastSetBrightness > 300) {
        if (onBrightnessChange) {
          onBrightnessChange(l)
          if (onToggle) {
            if (l === 0 && brightness > 0) onToggle(false)
            else if (l > 0 && !isEffectivelyOn) {
              onToggle(true)
              applyStagedColor()
            }
          }
        } else {
          setBrightness(accessory.id, l)
          if (l > 0 && !isEffectivelyOn) {
            applyStagedColor()
          }
        }
        lastSetBrightness = now
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [accessory, setBrightness, calculateLevel, onBrightnessChange, onToggle, brightness, isEffectivelyOn, setColor, onColorChange])

  const selectedColor = !isEffectivelyOn && stagedColor ? stagedColor : accessory.color

  const handlePresetColor = async (hue: number, saturation: number) => {
    if (!isEffectivelyOn) {
      setStagedColor({ hue, saturation })
      return
    }

    if (onColorChange) {
      onColorChange({ hue, saturation })
    } else {
      await setColor(accessory.id, { hue, saturation })
    }
  }

  const fillHeight = isEffectivelyOn && accessory.supportsLevelControl ? brightness : 0

  const getFillStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = { height: `${fillHeight}%` }
    const colorToShow = !isEffectivelyOn && stagedColor ? stagedColor : accessory.color
    if (accessory.supportsColorControl && colorToShow) {
      const { hue, saturation } = colorToShow
      if (saturation === 0) {
        style.background = '#f0f0f0'
      } else {
        style.background = `hsl(${hue}, ${saturation}%, 50%)`
      }
    }
    return style
  }

  const fillClass = `level-fill light-level-fill${!accessory.supportsColorControl || !accessory.color ? ' default-fill' : ''}`

  return (
    <AccessoryControlBase
      accessory={accessory}
      onClose={onClose}
      onGearClick={onGearClick}
      stateText={stateText}
      stateTextOn={!hasFailed && isEffectivelyOn}
    >
      {accessory.supportsLevelControl && (
        <div
          ref={trackRef}
          className="level-track"
          onMouseDown={handleTrackMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
        >
          <div className={fillClass} style={getFillStyle()} />
        </div>
      )}

      {accessory.supportsColorControl && (
        <div className="colors-section">
          <div className="colors-grid">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.name}
                className={`color-swatch ${isColorMatch(selectedColor, preset.hue, preset.saturation) ? 'selected' : ''}`}
                style={{
                  background: `hsl(${preset.hue}, ${preset.saturation}%, ${preset.saturation === 0 ? 95 : 50}%)`
                }}
                onClick={() => handlePresetColor(preset.hue, preset.saturation)}
                title={preset.name}
                aria-label={`Set color to ${preset.name}`}
              />
            ))}
          </div>
        </div>
      )}
    </AccessoryControlBase>
  )
}
