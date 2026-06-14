import React from 'react'

interface StatusWidgetProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
}

export const StatusWidget: React.FC<StatusWidgetProps> = ({ icon, label, value, unit }) => (
  <div className="status-widget">
    <div className="status-icon">{icon}</div>
    <div className="status-info">
      <div className="status-label">{label}</div>
      <div className="status-value">{value}{unit}</div>
    </div>
  </div>
)
