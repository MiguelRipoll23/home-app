import React, { useEffect, useRef } from 'react'
import { Radar, Wifi, Search } from 'lucide-react'
import { useDeviceStore } from '../../state/device-store'
import { DiscoveredDevice } from '../../types/device'

export const ScanView: React.FC = () => {
  const { discoveredDevices, scanning, scanForDevices, pairDiscovered, pairing } = useDeviceStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    scanForDevices()
    intervalRef.current = setInterval(() => {
      scanForDevices()
    }, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [scanForDevices])

  const handlePairDevice = async (device: DiscoveredDevice) => {
    await pairDiscovered({ shortDiscriminator: device.discriminator }, 20202021)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, width: '100%' }}>
      {discoveredDevices.length === 0 && (
        <div style={{ textAlign: 'center' }}>
          <Radar size={48} style={{ color: 'var(--text-secondary)', marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>
            No unpaired accessories nearby
          </p>
          {scanning && (
            <div style={{ marginTop: 12 }}>
              <Search size={16} style={{ color: 'var(--accent)', animation: 'scanPulse 1s ease-in-out infinite' }} />
            </div>
          )}
        </div>
      )}

      {discoveredDevices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {discoveredDevices.map(device => (
            <button
              key={device.id}
              disabled={pairing}
              onClick={() => handlePairDevice(device)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border)',
                background: 'none',
                cursor: pairing ? 'not-allowed' : 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!pairing) (e.target as HTMLElement).style.background = 'var(--surface-hover)' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '' }}
            >
              <Wifi size={20} color="var(--accent)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {device.name}
                </div>
                {device.vendor && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {device.vendor}
                  </div>
                )}
              </div>
            </button>
          ))}
          {scanning && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Search size={16} style={{ color: 'var(--accent)', animation: 'scanPulse 1s ease-in-out infinite' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
