import React, { useState, useMemo } from 'react'
import { Home, Bed, Monitor, Sofa, CookingPot, Settings, Thermometer, Lightbulb, Tv, Shield, ChevronRight, ChevronDown, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../state/ui-store'
import { useRoomStore } from '../../state/room-store'
import { useDeviceStore } from '../../state/device-store'

const defaultRoomIcons: Record<string, React.FC<{ size?: number }>> = {
  'default-room': Home,
  bedroom: Bed,
  office: Monitor,
  'living-room': Sofa,
  kitchen: CookingPot
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation()
  const { currentView, selectedRoomId, selectedCategoryId, setView, selectRoom, selectCategory } = useUiStore()
  const { rooms } = useRoomStore()
  const { devices } = useDeviceStore()

  const [categoriesExpanded, setCategoriesExpanded] = useState(true)
  const [roomsExpanded, setRoomsExpanded] = useState(true)

  const categoryCounts = useMemo(() => ({
    climate: devices.filter(d => d.deviceType === 'climate').length,
    lights: devices.filter(d => d.deviceType === 'light').length,
    'speakers-tvs': devices.filter(d => d.deviceType === 'speaker').length,
    security: devices.filter(d => d.deviceType === 'security').length,
    energy: devices.filter(d => d.deviceType === 'plug' && (d.powerConsumption !== undefined || d.cumulativeEnergyConsumed !== undefined)).length,
  }), [devices])

  const showCategories = categoryCounts.climate > 0 || categoryCounts.lights > 0 || categoryCounts['speakers-tvs'] > 0 || categoryCounts.security > 0 || categoryCounts.energy > 0

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
         <button
           className={`sidebar-item ${currentView === 'home' ? 'active' : ''}`}
           onClick={() => setView('home')}
         >
           <Home size={20} />
           <span>{t('sidebar.home')}</span>
         </button>

         <button
           className={`sidebar-item ${currentView === 'settings' ? 'active' : ''}`}
           onClick={() => setView('settings')}
         >
           <Settings size={20} />
           <span>{t('sidebar.settings')}</span>
         </button>
        
         {showCategories && (
           <div className="sidebar-section-header" onClick={() => setCategoriesExpanded(!categoriesExpanded)}>
             <div className="sidebar-section-label">{t('sidebar.categories')}</div>
             {categoriesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
           </div>
         )}
        
        {categoriesExpanded && showCategories && (
          <div className="sidebar-sub-nav">
             {categoryCounts.climate > 0 && (
               <button
                 className={`sidebar-item ${currentView === 'category' && selectedCategoryId === 'climate' ? 'active' : ''}`}
                 onClick={() => selectCategory('climate')}
               >
                 <Thermometer size={20} />
                 <span>{t('sidebar.climate')}</span>
               </button>
             )}
             {categoryCounts.lights > 0 && (
               <button
                 className={`sidebar-item ${currentView === 'category' && selectedCategoryId === 'lights' ? 'active' : ''}`}
                 onClick={() => selectCategory('lights')}
               >
                 <Lightbulb size={20} />
                 <span>{t('sidebar.lights')}</span>
               </button>
             )}
             {categoryCounts['speakers-tvs'] > 0 && (
               <button
                 className={`sidebar-item ${currentView === 'category' && selectedCategoryId === 'speakers-tvs' ? 'active' : ''}`}
                 onClick={() => selectCategory('speakers-tvs')}
               >
                 <Tv size={20} />
                 <span>{t('sidebar.speakersAndTvs')}</span>
               </button>
             )}
              {categoryCounts.security > 0 && (
                <button
                  className={`sidebar-item ${currentView === 'category' && selectedCategoryId === 'security' ? 'active' : ''}`}
                  onClick={() => selectCategory('security')}
                >
                  <Shield size={20} />
                  <span>{t('sidebar.security')}</span>
                </button>
              )}
              {categoryCounts.energy > 0 && (
                <button
                  className={`sidebar-item ${currentView === 'category' && selectedCategoryId === 'energy' ? 'active' : ''}`}
                  onClick={() => selectCategory('energy')}
                >
                  <Zap size={20} />
                  <span>{t('sidebar.energy')}</span>
                </button>
              )}
          </div>
        )}

         <div className="sidebar-section-header" onClick={() => setRoomsExpanded(!roomsExpanded)}>
           <div className="sidebar-section-label">{t('sidebar.rooms')}</div>
           {roomsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
         </div>

        {roomsExpanded && (
          <div className="sidebar-sub-nav">
            {rooms.map(room => {
              const RoomIcon = defaultRoomIcons[room.id] || Home
              return (
                <button
                  key={room.id}
                  className={`sidebar-item ${currentView === 'room' && selectedRoomId === room.id ? 'active' : ''}`}
                  onClick={() => selectRoom(room.id)}
                >
                  <RoomIcon size={20} />
                  <span>{room.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </nav>
    </aside>
  )
}
