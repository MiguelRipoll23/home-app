import React from 'react'
import { Sparkles } from 'lucide-react'
import { EmptyState } from '../components/common/EmptyState'
import { SceneCard } from '../components/SceneCard'
import { useSceneStore } from '../../state/scene-store'
import { useTranslation } from 'react-i18next'

export const ScenesView: React.FC = () => {
  const { t } = useTranslation()
  const { scenes, loading } = useSceneStore()

  if (loading) {
    return (
      <EmptyState
        icon={<Sparkles size={48} />}
        title={t('sidebar.scenes')}
        description={t('common.loading')}
      />
    )
  }

  if (scenes.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles size={48} />}
        title={t('sidebar.scenes')}
        description={t('sidebar.noScenes', { defaultValue: 'No scenes found. Add one with the + button.' })}
      />
    )
  }

  return (
    <div className="view-content">
      <h1 className="view-title">{t('sidebar.scenes')}</h1>
      <div className="scene-grid">
        {scenes.map(scene => (
          <SceneCard
            key={scene.id}
            scene={scene}
          />
        ))}
      </div>
    </div>
  )
}
