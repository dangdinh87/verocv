import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type Tag = 'div' | 'article' | 'li' | 'section'

export type CardProps = ComponentPropsWithoutRef<'div'> & {
  as?: Tag
  children: ReactNode
}

/** Thẻ phẳng của hệ thống: nền giấy, viền 1px `rule`, không đổ bóng. */
export function Card({ as = 'div', className = '', children, ...rest }: CardProps) {
  const TagEl = as as 'div'
  return (
    <TagEl className={`rounded-sheet border border-rule bg-paper ${className}`} {...rest}>
      {children}
    </TagEl>
  )
}
