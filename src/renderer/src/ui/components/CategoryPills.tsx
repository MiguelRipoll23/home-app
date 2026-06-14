import React, { useMemo } from 'react'
import { Thermometer, Lightbulb, Tv, Shield, Zap } from 'lucide-react'
import { useDeviceStore } from '../../state/device-store'
import { DEVICE_TYPE_MAP, categoryFilter } from '../../utils/category-utils'
import './CategoryPills.css'

interface PillItem {
  id: string
  label: string
  icon: React.FC<{ size?: number; color?: string }>
  iconColor: string
  getStatusText: (devices: { isOn: boolean; deviceType: string }[]) => string | null
}

const PILLS: PillItem[] = [
  {
    id: 'climate',
    label: 'Climate',
    icon: Thermometer,
    iconColor: '#007aff',
    getStatusText: () => null
  },
  {
    id: 'lights',
    label: 'Lights',
    icon: Lightbulb,
    iconColor: '#ffcc00',
    getStatusText: (devices) => {
      if (devices.length === 0) return null
      const onCount = devices.filter(d => d.isOn).length
      if (onCount > 0) return `${onCount} On`
      return 'All Off'
    }
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    iconColor: '#34c759',
    getStatusText: () => null
  },
  {
    id: 'speakers-tvs',
    label: 'Speakers & TV',
    icon: Tv,
    iconColor: '#8e8e93',
    getStatusText: (devices) => {
      if (devices.length === 0) return null
      const allOff = devices.every(d => !d.isOn)
      return allOff ? 'None Playing' : null
    }
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: Zap,
    iconColor: '#34c759',
    getStatusText: () => null
  },
]

interface CategoryPillsProps {
  activeFilterId?: string | null
  onFilterChange?: (categoryId: string | null) => void
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({ activeFilterId, onFilterChange }) => {
  const devices = useDeviceStore(s => s.devices)

  const statuses = useMemo(() => {
    const result: Record<string, string | null> = {}
    for (const pill of PILLS) {
      const matchingDevices = pill.id === 'energy'
        ? devices.filter(d => categoryFilter(pill.id, d))
        : devices.filter(d => d.deviceType === DEVICE_TYPE_MAP[pill.id])
      result[pill.id] = pill.getStatusText(matchingDevices)
    }
    return result
  }, [devices])

  const visiblePills = useMemo(() => {
    return PILLS.filter(pill => {
      return devices.some(d => categoryFilter(pill.id, d))
    })
  }, [devices])

  const handleClick = (pillId: string) => {
    if (onFilterChange) {
      onFilterChange(activeFilterId === pillId ? null : pillId)
    }
  }

  if (visiblePills.length === 0) return null

  return (
    <div className="category-pills">
      {visiblePills.map(pill => {
        const Icon = pill.icon
        const active = activeFilterId === pill.id
        const statusText = statuses[pill.id]
        return (
          <button
            key={pill.id}
            className={`category-pill ${active ? 'is-active' : ''}`}
            onClick={() => handleClick(pill.id)}
          >
            <span className="pill-icon">
              <Icon size={18} color={pill.iconColor} />
            </span>
            <div className="pill-info">
              <span className="pill-title">{pill.label}</span>
              {statusText && (
                <div className="pill-status">{statusText}</div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
