'use client'

import type { ReactNode } from 'react'

export type AnimatedTabItem<T extends string = string> = {
  id: T
  label: string
  badge?: string
  icon?: ReactNode
}

export function AnimatedTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel = 'Chuyển chế độ xem',
  className = '',
}: {
  items: AnimatedTabItem<T>[]
  value: T
  onChange: (next: T) => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex max-w-full flex-wrap items-center gap-1 rounded-control border border-rule bg-desk p-1 sm:flex-nowrap ${className}`}
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
              active
                ? 'border border-rule bg-paper text-ink'
                : 'border border-transparent text-ink-2 hover:bg-paper/60 hover:text-ink'
            }`}
          >
            {item.icon && <span className="max-xs:hidden inline-flex shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-extrabold tabular-nums ${
                  active ? 'bg-mint-wash text-mint' : 'bg-pen-wash text-pen'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
