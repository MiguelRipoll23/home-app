import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 20, borderRadius = '8px' }) => (
  <div
    className="skeleton"
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius,
      background: 'var(--skeleton-color, rgba(0,0,0,0.06))',
      animation: 'pulse 1.5s ease-in-out infinite'
    }}
  />
)

export const SkeletonCard: React.FC = () => (
  <div className="accessory-card skeleton-card">
    <div className="card-header">
      <Skeleton width={40} height={40} borderRadius="50%" />
      <div style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    <div className="card-body" style={{ padding: '12px 0' }}>
      <Skeleton width="30%" height={32} borderRadius="16px" />
    </div>
  </div>
)
