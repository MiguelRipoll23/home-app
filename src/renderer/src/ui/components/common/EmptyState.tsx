import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon && <div className="empty-state-icon">{icon}</div>}
    {title && <h3 className="empty-state-title">{title}</h3>}
    {description && <p className="empty-state-description">{description}</p>}
    {action && (
      <button className="empty-state-action" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
)
