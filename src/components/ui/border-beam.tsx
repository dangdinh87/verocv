import type { CSSProperties, ReactNode } from 'react'

export function BorderBeam({
  children,
  className = '',
  durationSec = 9,
  active = true,
}: {
  children: ReactNode
  className?: string
  durationSec?: number
  active?: boolean
}) {
  return (
    <div
      className={`border-beam-frame ${className}`}
      style={{ '--beam-duration': `${durationSec}s` } as CSSProperties}
    >
      {active && <div className="border-beam-overlay" aria-hidden="true" />}
      {children}
    </div>
  )
}
