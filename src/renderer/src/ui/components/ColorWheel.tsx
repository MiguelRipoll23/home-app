import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Sun } from 'lucide-react'
import './ColorWheel.css'

interface ColorWheelProps {
  initialHue?: number
  initialSaturation?: number
  onColorChange: (hue: number, saturation: number) => void
  onClose: () => void
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  initialHue = 0,
  initialSaturation = 0,
  onColorChange,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hue, setHue] = useState(initialHue)
  const [saturation, setSaturation] = useState(initialSaturation)
  const [brightness, setBrightness] = useState(100)

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const r = cx - 8

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > r) continue
        const a = Math.atan2(dy, dx) * (180 / Math.PI) + 180
        const sat = (dist / r) * 100
        ctx.fillStyle = `hsl(${a}, ${sat}%, 50%)`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }, [])

  useEffect(() => {
    drawWheel()
  }, [drawWheel])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const dx = x * scaleX - cx
    const dy = y * scaleY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const r = cx - 8
    if (dist > r) return
    const h = Math.atan2(dy, dx) * (180 / Math.PI) + 180
    const s = (dist / r) * 100
    setHue(Math.round(h))
    setSaturation(Math.round(s))
  }, [])

  const handleApply = useCallback(() => {
    onColorChange(hue, saturation)
    onClose()
  }, [hue, saturation, onColorChange, onClose])

  return (
    <div className="color-wheel-container">
      <div className="color-wheel-header">
        <button className="color-wheel-cancel" onClick={onClose}>Cancel</button>
        <h2 className="color-wheel-title">Colors</h2>
        <button className="color-wheel-done" onClick={handleApply}>Done</button>
      </div>

      <div className="color-wheel-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          onClick={handleCanvasClick}
          className="color-wheel-canvas"
        />
      </div>

      <div className="color-wheel-preview" style={{ background: `hsl(${hue}, ${saturation}%, 50%)` }} />

      <div className="color-wheel-slider-group">
        <Sun size={16} color="#ffcc00" />
        <input
          type="range"
          min="0"
          max="100"
          value={brightness}
          onChange={e => setBrightness(parseInt(e.target.value, 10))}
          className="brightness-slider"
        />
        <span className="brightness-label">{brightness}%</span>
      </div>
    </div>
  )
}
