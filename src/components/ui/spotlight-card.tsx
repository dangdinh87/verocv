'use client'

import { useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

type Tag = 'div' | 'article' | 'li' | 'section'

export type SpotlightCardProps = ComponentPropsWithoutRef<'div'> & {
  as?: Tag
  children: ReactNode
}

export function SpotlightCard({ as = 'div', className = '', children, onPointerMove, onPointerEnter, onPointerLeave, ...rest }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  const updatePointer = (clientX: number, clientY: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${clientX - rect.left}px`)
    el.style.setProperty('--my', `${clientY - rect.top}px`)
  }

  const TagEl = as as 'div'

  return (
    <TagEl
      ref={ref}
      onPointerMove={(e) => {
        updatePointer(e.clientX, e.clientY)
        onPointerMove?.(e)
      }}
      onPointerEnter={(e) => {
        ref.current?.setAttribute('data-hovered', 'true')
        updatePointer(e.clientX, e.clientY)
        onPointerEnter?.(e)
      }}
      onPointerLeave={(e) => {
        ref.current?.removeAttribute('data-hovered')
        onPointerLeave?.(e)
      }}
      className={`spotlight-card rounded-sheet border border-rule bg-paper ${className}`}
      {...rest}
    >
      {children}
    </TagEl>
  )
}
