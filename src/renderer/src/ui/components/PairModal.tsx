import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useDeviceStore } from '../../state/device-store'
import { ScanView } from './ScanView'
import { formatSetupCodeInput, normalizeSetupCode } from '../../../../shared/pairing-code'

interface PairModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PairModal: React.FC<PairModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const [pairingCode, setPairingCode] = useState('')
  const { pairDevice, pairing } = useDeviceStore()

  if (!isOpen) return null

  const handlePair = async () => {
    const normalizedCode = normalizeSetupCode(pairingCode)
    if (!normalizedCode) return
    await pairDevice(normalizedCode)
    setPairingCode('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-compact" onClick={e => e.stopPropagation()}>
        <div className="modal-header modal-header-compact">
          <h2 className="modal-title">Add Accessory</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body modal-body-compact">
          {mode === 'scan' ? (
            <>
              <ScanView />
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  className="modal-btn-amber modal-btn-amber-wide"
                  onClick={() => setMode('manual')}
                >
                  Enter Code Manually
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="modal-description">
                Enter the pairing code from your accessory.
              </p>
              <input
                type="text"
                className="modal-input"
                placeholder="Pairing code"
                value={pairingCode}
                onChange={e => setPairingCode(formatSetupCodeInput(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && handlePair()}
                disabled={pairing}
                autoFocus
              />
              <div className="modal-footer" style={{ padding: '12px 0 0' }}>
                <button className="modal-btn-secondary" onClick={() => setMode('scan')} disabled={pairing}>
                  Back
                </button>
                <button
                  className="modal-btn-primary"
                  onClick={handlePair}
                  disabled={!normalizeSetupCode(pairingCode) || pairing}
                >
                  <Plus size={16} />
                  {pairing ? 'Pairing...' : 'Pair'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
