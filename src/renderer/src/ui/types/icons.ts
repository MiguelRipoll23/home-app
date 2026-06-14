import React from 'react'
import { Lightbulb, Plug, Lamp, Zap, Target, Fan, Camera, Bell, Lock, LampCeiling, Sparkles, Play, Timer, Sunrise, Sunset, Moon, Home, Palette, Music, Coffee, Book, Tv, Film, Gamepad2 } from 'lucide-react'

export const AVAILABLE_ICONS: Record<string, { id: string; name: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[]> = {
  light: [
    { id: 'lightbulb', name: 'Light Bulb', Icon: Lightbulb },
    { id: 'lamp', name: 'Lamp', Icon: Lamp },
    { id: 'lamp-ceiling', name: 'Ceiling Lamp', Icon: LampCeiling },
    { id: 'zap', name: 'Ceiling Light', Icon: Zap },
  ],
  plug: [
    { id: 'plug', name: 'Plug', Icon: Plug },
    { id: 'outlet', name: 'Outlet', Icon: Target },
  ],
  climate: [
    { id: 'fan', name: 'Fan', Icon: Fan },
  ],
  speaker: [
    { id: 'speaker', name: 'Speaker', Icon: Lightbulb },
  ],
  security: [
    { id: 'camera', name: 'Camera', Icon: Camera },
    { id: 'bell', name: 'Bell', Icon: Bell },
    { id: 'lock', name: 'Lock', Icon: Lock },
  ],
  scene: [
    { id: 'sparkles', name: 'Scene', Icon: Sparkles },
    { id: 'play', name: 'Play', Icon: Play },
    { id: 'timer', name: 'Timer', Icon: Timer },
    { id: 'sunrise', name: 'Sunrise', Icon: Sunrise },
    { id: 'sunset', name: 'Sunset', Icon: Sunset },
    { id: 'moon', name: 'Night', Icon: Moon },
    { id: 'home', name: 'Home', Icon: Home },
    { id: 'palette', name: 'Colors', Icon: Palette },
    { id: 'music', name: 'Music', Icon: Music },
    { id: 'coffee', name: 'Coffee', Icon: Coffee },
    { id: 'book', name: 'Book', Icon: Book },
    { id: 'tv', name: 'TV', Icon: Tv },
    { id: 'film', name: 'Film', Icon: Film },
    { id: 'gamepad', name: 'Gamepad', Icon: Gamepad2 },
  ],
}

export const DeviceIcon: React.FC<{ type: string; iconId?: string; size?: number; color?: string }> = ({ type, iconId, size = 24, color }) => {
  const typeIcons = AVAILABLE_ICONS[type] || AVAILABLE_ICONS.light
  const found = typeIcons.find(i => i.id === iconId)
  const Icon = found ? found.Icon : typeIcons[0].Icon
  return React.createElement(Icon, { size, color })
}
