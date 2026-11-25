import { Plus } from '@phosphor-icons/react/dist/ssr'
import type { ReactNode } from 'react'

export type FaqItem = { q: string; a: ReactNode }

// Native <details>: keyboard and screen-reader friendly, no client JavaScript.
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-b border-rule">
      {items.map((item) => (
        <details key={item.q} className="smooth-details group border-t border-rule">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.05rem] font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus size={20} weight="bold" className="shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" />
          </summary>
          <div className="max-w-[62ch] pb-6 pr-8 text-ink-2">{item.a}</div>
        </details>
      ))}
    </div>
  )
}
