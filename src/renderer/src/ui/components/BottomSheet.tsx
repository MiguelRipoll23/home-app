import React, { useEffect, useRef } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  height?: string
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, height = '70vh' }) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - startY.current
    if (sheetRef.current && dy > 0) {
      sheetRef.current.style.transform = `translateY(${dy}px)`
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - startY.current
    if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
    if (dy > 80) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          animation: 'fadeInOverlay 0.3s ease',
        }}
      />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          height: height,
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          animation: 'slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'var(--border)',
            margin: '10px auto',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
