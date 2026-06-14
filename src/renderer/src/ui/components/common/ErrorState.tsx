import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="error-state">
    <AlertCircle size={48} className="error-icon" />
    <p className="error-message">{message}</p>
    {onRetry && (
      <button className="error-retry" onClick={onRetry}>
        <RefreshCw size={16} />
        Retry
      </button>
    )}
  </div>
)
