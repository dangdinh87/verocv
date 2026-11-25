import type { ReactNode } from 'react'

export function Marquee({
  children,
  className = '',
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <div
      className={`marquee-group marquee-fade-mask overflow-hidden ${className}`}
      aria-label={ariaLabel}
    >
      <div className="marquee-track items-center">
        <div className="flex shrink-0 items-center gap-3 pr-3">{children}</div>
        <div className="flex shrink-0 items-center gap-3 pr-3" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
