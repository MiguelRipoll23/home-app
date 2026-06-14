import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Plus, Pencil, Lightbulb, Sparkles, Home, Check, LayoutGrid, LayoutList, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../state/ui-store'
import { useSceneStore } from '../../state/scene-store'
import { useRoomStore } from '../../state/room-store'
import './Header.css'

interface HeaderProps {
  title: string
  showActions?: boolean
  roomId?: string
}

interface ModalProps {
  title: string
  placeholder: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

const NameModal: React.FC<ModalProps> = ({ title, placeholder, onConfirm, onCancel }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleConfirm = () => {
    if (name.trim()) onConfirm(name.trim())
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <input
            ref={inputRef}
            className="modal-input"
            type="text"
            placeholder={placeholder}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          />
        </div>
         <div className="modal-footer">
           <button className="modal-btn-secondary" onClick={onCancel}>{t('modal.cancel')}</button>
           <button className="modal-btn-primary" onClick={handleConfirm} disabled={!name.trim()}>{t('modal.create')}</button>
         </div>
      </div>
    </div>,
    document.body
  )
}

const MenuPortal = ({ children, onClose, anchorName }: { children: React.ReactNode, onClose: () => void, anchorName: string }) => {
  return ReactDOM.createPortal(
    <div className="menu-overlay" onClick={onClose}>
      <div className="add-menu" style={{ positionAnchor: anchorName } as React.CSSProperties}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export const Header: React.FC<HeaderProps> = ({ title, showActions = true, roomId: _roomId }) => {
  const { t } = useTranslation()
  const { editModeType, setEditMode, openModal } = useUiStore()
  const addRoom = useRoomStore(s => s.addRoom)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [showSceneModal, setShowSceneModal] = useState(false)
  const isEditing = editModeType !== null

  const handleAddRoom = (name: string) => {
    addRoom(crypto.randomUUID(), name)
    setShowRoomModal(false)
  }

  const addScene = useSceneStore(s => s.addScene)

  const handleAddScene = (name: string) => {
    addScene(name)
    setShowSceneModal(false)
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>
      {showActions && (
        <div className="header-right">
          <div className="header-controls">
            <button
              className={`header-btn ${isEditing ? 'active' : ''}`}
              onClick={() => {
                if (isEditing) {
                  setEditMode(false, null)
                } else {
                  setShowEditMenu(!showEditMenu)
                  setShowAddMenu(false)
                }
              }}
               title={isEditing ? t('header.stopEditing') : t('header.edit')}
               style={{ anchorName: '--edit-btn' } as React.CSSProperties}
            >
              {isEditing ? <Check size={18} /> : <Pencil size={18} />}
            </button>
            
             {showEditMenu && !isEditing && (
               <MenuPortal onClose={() => setShowEditMenu(false)} anchorName="--edit-btn">
                 <button onClick={() => { setEditMode(true, 'sections'); setShowEditMenu(false); }}>
                   <LayoutList size={16} /> {t('header.reorderSections')}
                 </button>
                 <button onClick={() => { setEditMode(true, 'accessories'); setShowEditMenu(false); }}>
                   <LayoutGrid size={16} /> {t('header.reorderAccessories')}
                 </button>
               </MenuPortal>
             )}

            <button 
              className="header-btn" 
              onClick={() => {
                setShowAddMenu(!showAddMenu)
                setShowEditMenu(false)
              }} 
              title={t('common.add')}
              style={{ anchorName: '--add-btn' } as React.CSSProperties}
            >
              <Plus size={20} />
            </button>
            
             {showAddMenu && (
               <MenuPortal onClose={() => setShowAddMenu(false)} anchorName="--add-btn">
                 <button onClick={() => { openModal('pair'); setShowAddMenu(false); }}>
                   <Lightbulb size={16} /> {t('header.addAccessory')}
                 </button>
                 <button onClick={() => { setShowAddMenu(false); setShowSceneModal(true); }}>
                   <Sparkles size={16} /> {t('header.addScene')}
                 </button>
                 <button onClick={() => { setShowAddMenu(false); setShowRoomModal(true); }}>
                   <Home size={16} /> {t('header.addRoom')}
                 </button>
               </MenuPortal>
             )}

             {showRoomModal && (
               <NameModal
                 title={t('modal.addRoom')}
                 placeholder={t('modal.roomNamePlaceholder')}
                 onConfirm={handleAddRoom}
                 onCancel={() => setShowRoomModal(false)}
               />
             )}
             {showSceneModal && (
               <NameModal
                 title={t('modal.addScene')}
                 placeholder={t('modal.sceneNamePlaceholder')}
                 onConfirm={handleAddScene}
                 onCancel={() => setShowSceneModal(false)}
               />
             )}
          </div>
        </div>
      )}
    </header>
  )
}
