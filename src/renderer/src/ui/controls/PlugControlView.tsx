import React, { useCallback } from 'react'
import { Plug } from 'lucide-react'
import { Accessory } from '../../types/device'
import { useDeviceStore } from '../../state/device-store'
import { AccessoryControlBase } from './AccessoryControlBase'
import { formatPowerConsumption } from '../../utils/category-utils'
import './PlugControlView.css'

interface PlugControlViewProps {
  accessory: Accessory
  onClose: () => void
  onGearClick?: () => void
  onToggle?: (isOn: boolean) => void
}

export const PlugControlView: React.FC<PlugControlViewProps> = ({ accessory, onClose, onGearClick, onToggle }) => {
  const { setDeviceOn } = useDeviceStore()
  const hasFailed = useDeviceStore(s => s.failedCommandIds[accessory.id])

  const handleToggle = useCallback(async () => {
    if (onToggle) {
      onToggle(!accessory.isOn)
    } else {
      await setDeviceOn(accessory.id, !accessory.isOn)
    }
  }, [accessory.id, accessory.isOn, setDeviceOn, onToggle])

  const stateText = hasFailed
    ? 'No response'
    : !accessory.isOn
      ? 'Off'
      : accessory.powerConsumption !== undefined
        ? `On \u00b7 ${formatPowerConsumption(accessory.powerConsumption)}`
        : 'On'

  return (
    <AccessoryControlBase
      accessory={accessory}
      onClose={onClose}
      onGearClick={onGearClick}
      stateText={stateText}
      stateTextOn={!hasFailed && accessory.isOn}
    >
      <div className="level-track" onClick={handleToggle}>
        <div
          className={`level-fill plug-level-fill ${accessory.isOn ? 'is-on' : 'is-off'}`}
        >
          <div
            className="level-icon"
            style={{
              color: accessory.isOn ? '#ffffff' : '#ffcc00',
              fontSize: 20,
              zIndex: 4,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              position: 'absolute'
            }}
          >
            <Plug size={20} />
          </div>
        </div>
      </div>
    </AccessoryControlBase>
  )
}
