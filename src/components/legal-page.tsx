import type { ReactNode } from 'react'
import { BRAND } from '@/config/brand'

export type LegalSection = { title: string; body: ReactNode[] }

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <article className="wrap max-w-[48rem] pb-24 pt-10 lg:pt-16">
      <div className="rounded-sheet border border-rule bg-paper p-6 sm:p-10">
        <h1 className="display text-[clamp(2rem,4.6vw,3.1rem)] text-ink">{title}</h1>
        <p className="mt-3 text-sm text-ink-3">
          Cập nhật gần nhất: {updated} · Áp dụng cho nền tảng {BRAND.name}.
        </p>
        <div className="mt-8 space-y-8 border-t border-rule pt-8">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-[1.25rem] font-bold text-ink">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 space-y-3 leading-[1.75] text-ink-2">
                {s.body.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}
