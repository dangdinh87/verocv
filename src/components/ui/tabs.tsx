'use client'

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

export type TabItem<T extends string> = { id: T; label: string }

// Content navigation = underline tabs (filters/toggles use filled pills elsewhere). Arrow keys, Home and End move focus.
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className = '',
  children,
}: {
  tabs: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
  children: ReactNode
}) {
  const base = useId()
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === value)
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[tabs[next].id]?.focus()
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="-mb-px flex gap-0 overflow-x-auto border-b border-rule">
        {tabs.map((t) => {
          const active = t.id === value
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${t.id}`}
              aria-selected={active}
              aria-controls={`${base}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={`-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-2.5 py-3 text-[0.875rem] font-semibold transition-colors ${
                active ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${value}`} className="pt-5">
        {children}
      </div>
    </div>
  )
}
