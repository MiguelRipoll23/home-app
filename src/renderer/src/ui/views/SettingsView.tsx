import React, { useEffect, useState } from 'react'
import { Network, WifiOff, Palette, Image as ImageIcon, Database, Upload, Download, Trash2, Globe, RefreshCw } from 'lucide-react'
import { BridgeInfo, Accessory } from '../../types/device'
import { api } from '../../services/ipc'
import { usePreferencesStore } from '../../state/preferences-store'
import { useTranslation } from 'react-i18next'
import { changeLanguage } from '../../services/i18n'
import { PostPairingModal } from '../components/PostPairingModal'
import './SettingsView.css'

const BG_PRESETS = [
  { colorKey: 'none', color: null },
  { colorKey: 'white', color: '#ffffff' },
  { colorKey: 'red', color: '#e53935' },
  { colorKey: 'orange', color: '#fb8c00' },
  { colorKey: 'yellow', color: '#fdd835' },
  { colorKey: 'green', color: '#43a047' },
  { colorKey: 'teal', color: '#00acc1' },
  { colorKey: 'blue', color: '#1e88e5' },
  { colorKey: 'purple', color: '#8e24aa' },
  { colorKey: 'pink', color: '#d81b60' },
  { colorKey: 'gray', color: '#9e9e9e' },
  { colorKey: 'dark', color: '#2c2c2e' },
]

export const SettingsView: React.FC = () => {
  const [bridges, setBridges] = useState<BridgeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [previewType, setPreviewType] = useState<'light' | 'plug'>('light')
  const [showPreview, setShowPreview] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle')
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const { theme, setTheme, bgImage, setBgImage, bgColor, setBgColor } = usePreferencesStore()
  const { t } = useTranslation()
  const { language, setLanguage } = usePreferencesStore()

  useEffect(() => {
    let active = true
    api().devices.listBridges()
      .then(items => {
        if (active) setBridges(items)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleRemoveBridge = async (bridgeId: string, bridgeName: string) => {
    if (!confirm(t('settings.removeBridgeConfirm', { name: bridgeName }))) return
    try {
      await api().devices.removeBridge(bridgeId)
      setBridges(prev => prev.filter(b => b.id !== bridgeId))
    } catch (err) {
      alert(t('settings.removeError') + ' ' + (err as Error).message)
    }
  }

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setBgImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const exportData = async () => {
    try {
      const storageData = await api().storage.export()
      const data = {
        localStorage: { ...localStorage },
        mainStorage: storageData,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matter-controller-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(t('settings.exportError') + ' ' + (err as Error).message)
    }
  }

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          if (data.localStorage) {
            Object.entries(data.localStorage).forEach(([key, value]) => {
              localStorage.setItem(key, value as string)
            })
          }
          if (data.mainStorage) {
            await api().storage.import(data.mainStorage)
          } else {
            window.location.reload()
          }
        } catch (err) {
          alert(t('settings.importError') + ' ' + (err as Error).message)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    const api_obj = api()
    api_obj.onUpdateAvailable((version) => {
      setUpdateStatus('available')
      setUpdateVersion(version)
    })
    api_obj.onDownloadProgress((info) => {
      setUpdateStatus('downloading')
      setDownloadProgress(info.percent)
    })
    api_obj.onUpdateDownloaded(() => {
      setUpdateStatus('downloaded')
    })
  }, [])

  const handleCheckForUpdates = async () => {
    setUpdateStatus('checking')
    try {
      const result = await api().checkForUpdates()
      if (result) {
        setUpdateVersion(result.version)
        setUpdateStatus('available')
      } else {
        setUpdateStatus('up-to-date')
      }
    } catch {
      setUpdateStatus('error')
    }
  }

  return (
    <div className="settings-container">
      <h1 className="view-title">{t('settings.title')}</h1>

      <section className="settings-section">
        <h2 className="settings-section-title">{t('settings.bridges')}</h2>
        <div className="settings-group">
          {loading ? (
            <div className="settings-item">{t('settings.bridgesLoading')}</div>
          ) : bridges.length === 0 ? (
            <div className="settings-item">{t('settings.bridgesNone')}</div>
          ) : (
            bridges.map(bridge => (
              <div key={bridge.id} className="settings-item">
                <div className="settings-item-label">
                  <div className={`settings-item-icon ${bridge.isReachable ? '' : 'is-offline'}`}>
                    {bridge.isReachable ? <Network size={18} /> : <WifiOff size={18} />}
                  </div>
                  <div>
                    <div>{bridge.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' }}>
                      {bridge.accessoryCount} {t('settings.accessories')}
                    </div>
                  </div>
                </div>
                <button
                  className="theme-btn"
                  onClick={() => handleRemoveBridge(bridge.id, bridge.name)}
                  title={t('settings.removeBridge')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">{t('settings.interface')}</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-label">
              <div className="settings-item-icon"><Palette size={18} /></div>
              {t('settings.appearance')}
            </div>
            <div className="settings-action">
              {(['light', 'dark', 'system'] as const).map(themeKey => (
                <button
                  key={themeKey}
                  className={`theme-btn ${theme === themeKey ? 'active' : ''}`}
                  onClick={() => setTheme(themeKey)}
                >
                  {t(`settings.${themeKey}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-item">
            <div className="settings-item-label">
              <div className="settings-item-icon"><ImageIcon size={18} /></div>
              {t('settings.customImage')}
            </div>
            <div className="settings-action">
              {bgImage && (
                <button className="theme-btn" onClick={() => setBgImage(null)}>
                  <Trash2 size={16} />
                </button>
              )}
              <label className="theme-btn">
                <Upload size={16} />
                <input type="file" accept="image/*" onChange={handleBgImageChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <div className="settings-item-label">
              <div className="settings-item-icon"><Palette size={18} /></div>
              {t('settings.solidColor')}
            </div>
            <div className="bg-presets">
              {BG_PRESETS.map(preset => (
                <button
                  key={preset.colorKey}
                  className={`bg-preset-swatch ${bgColor === preset.color ? 'selected' : ''} ${preset.color === null ? 'no-color' : ''}`}
                  style={preset.color ? { background: preset.color } : {}}
                  onClick={() => setBgColor(preset.color)}
                  title={t(`colors.${preset.colorKey}`)}
                >
                  {preset.color === null && <div className="bg-none-icon" />}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-item">
            <div className="settings-item-label">
              <div className="settings-item-icon"><Globe size={18} /></div>
              {t('settings.language')}
            </div>
            <div className="settings-action">
              <select
                className="lang-select"
                value={language}
                onChange={(e) => {
                  const lang = e.target.value as 'en' | 'es' | 'system'
                  setLanguage(lang)
                  changeLanguage(lang)
                }}
              >
                <option value="en">{t('settings.english')}</option>
                <option value="es">{t('settings.spanish')}</option>
                <option value="system">{t('settings.systemDefault')}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">{t('settings.dataManagement')}</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-label">
              <div className="settings-item-icon"><Database size={18} /></div>
              {t('settings.userData')}
            </div>
            <div className="settings-action">
              <button className="theme-btn" onClick={exportData}><Upload size={16} /> {t('settings.export')}</button>
              <label className="theme-btn" tabIndex={0} role="button">
                <Download size={16} /> {t('settings.import')}
                <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
          <div className="settings-item">
            <div className="settings-item-label">
              <div className="settings-item-icon"><RefreshCw size={18} /></div>
              {t('settings.updates')}
            </div>
            <div className="settings-action">
              {updateStatus === 'idle' && (
                <button className="theme-btn" onClick={handleCheckForUpdates}>
                  {t('settings.checkForUpdates')}
                </button>
              )}
              {updateStatus === 'checking' && (
                <button className="theme-btn" disabled>
                  {t('settings.checking')}
                </button>
              )}
              {updateStatus === 'up-to-date' && (
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  {t('settings.upToDate')}
                </span>
              )}
              {updateStatus === 'available' && updateVersion && (
                <span style={{ fontSize: 14, color: 'var(--accent)' }}>
                  {t('settings.updateAvailable', { version: updateVersion })}
                </span>
              )}
              {updateStatus === 'downloading' && (
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  {t('settings.updateDownloading', { progress: Math.round(downloadProgress) })}
                </span>
              )}
              {updateStatus === 'downloaded' && (
                <button className="theme-btn" onClick={() => api().restartAndInstall()}>
                  {t('settings.restartNow')}
                </button>
              )}
              {updateStatus === 'error' && (
                <span style={{ fontSize: 14, color: '#e53935' }}>
                  {t('settings.updateError')}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">{t('settings.credits')}</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-label" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <span>{t('settings.defaultBackground')}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <a
                  href="https://unsplash.com/photos/1616486338812-3dadae4b4ace"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'none' }}
                >
                  {t('settings.unsplashLink')}
                </a>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Developer</h2>
        <div className="settings-group">
          <div className="settings-item">
            <div className="settings-item-label">
              Preview Post-Pairing Modal
            </div>
            <div className="settings-action" style={{ gap: 8 }}>
              <select
                className="lang-select"
                value={previewType}
                onChange={e => setPreviewType(e.target.value as 'light' | 'plug')}
              >
                <option value="light">Light</option>
                <option value="plug">Plug</option>
              </select>
              <button
                className="theme-btn"
                onClick={() => setShowPreview(true)}
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </section>

      {showPreview && (() => {
        const mockAccessory: Accessory = previewType === 'light'
          ? {
              id: 'dev-preview-light',
              friendlyName: 'Living Room Light',
              deviceType: 'light',
              roomId: '',
              isOn: true,
              isFavorite: false,
              isReachable: true,
              showOnHome: true,
              icon: 'ceiling-light',
              brightness: 75,
              supportsLevelControl: true,
              supportsColorControl: true,
              color: { hue: 30, saturation: 100 }
            }
          : {
              id: 'dev-preview-plug',
              friendlyName: 'Coffee Maker',
              deviceType: 'plug',
              roomId: '',
              isOn: false,
              isFavorite: false,
              isReachable: true,
              showOnHome: true,
              icon: 'plug',
              supportsLevelControl: false,
              supportsColorControl: false,
              powerConsumption: 0.2
            }
        return (
          <PostPairingModal
            accessory={mockAccessory}
            onClose={() => setShowPreview(false)}
          />
        )
      })()}
    </div>
  )
}
