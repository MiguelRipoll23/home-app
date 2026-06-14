import React from 'react'
import { Home, Lightbulb, Thermometer, Tv, Shield, Wifi, Zap, Sun, Moon, Battery, Fan, Music, Lock, Bell, Camera } from 'lucide-react'
import { usePreferencesStore } from '../../state/preferences-store'

const icons = [
  { Icon: Home, x: 5, y: 8, size: 36, opacity: 0.08 },
  { Icon: Lightbulb, x: 78, y: 12, size: 28, opacity: 0.07 },
  { Icon: Thermometer, x: 25, y: 55, size: 32, opacity: 0.08 },
  { Icon: Tv, x: 60, y: 70, size: 34, opacity: 0.06 },
  { Icon: Shield, x: 88, y: 38, size: 26, opacity: 0.07 },
  { Icon: Wifi, x: 15, y: 82, size: 24, opacity: 0.06 },
  { Icon: Zap, x: 45, y: 5, size: 26, opacity: 0.07 },
  { Icon: Sun, x: 92, y: 88, size: 30, opacity: 0.06 },
  { Icon: Moon, x: 35, y: 42, size: 24, opacity: 0.06 },
  { Icon: Battery, x: 70, y: 52, size: 22, opacity: 0.06 },
  { Icon: Home, x: 50, y: 92, size: 30, opacity: 0.07 },
  { Icon: Lightbulb, x: 10, y: 35, size: 22, opacity: 0.06 },
  { Icon: Wifi, x: 82, y: 78, size: 26, opacity: 0.06 },
  { Icon: Zap, x: 55, y: 30, size: 28, opacity: 0.07 },
  { Icon: Shield, x: 42, y: 65, size: 24, opacity: 0.06 },
  { Icon: Camera, x: 68, y: 25, size: 22, opacity: 0.05 },
  { Icon: Music, x: 20, y: 18, size: 26, opacity: 0.06 },
  { Icon: Lock, x: 75, y: 42, size: 20, opacity: 0.05 },
  { Icon: Bell, x: 30, y: 75, size: 22, opacity: 0.05 },
  { Icon: Fan, x: 65, y: 88, size: 28, opacity: 0.06 },
]

export const BackgroundLayer: React.FC = () => {
  const { bgImage, bgColor } = usePreferencesStore()

  return (
    <div className="background-layer" style={{ background: bgImage || bgColor ? (bgColor || 'transparent') : 'var(--bg)' }}>
      {bgImage && (
        <>
          <div 
            className="bg-custom-image" 
            style={{ 
              backgroundImage: `url(${bgImage})`,
              position: 'fixed',
              inset: 0,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 1,
              zIndex: -1
            }} 
          />
          <div className="bg-overlay" />
        </>
      )}
      {!bgImage && !bgColor && icons.map(({ Icon, x, y, size, opacity }, i) => (
        <div
          key={i}
          className="bg-icon"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            opacity,
            transform: `translate(-50%, -50%)`,
          }}
        >
          <Icon size={size} color="#ffcc00" />
        </div>
      ))}
    </div>
  )
}
