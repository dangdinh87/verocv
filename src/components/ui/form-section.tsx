import type { ReactNode } from 'react'

// Left column = the "form label", right = the answer. Every long section on the site uses this shape.
export function FormSection({ id, title, hint, children }: { id?: string; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="wrap">
      <div className="form-section">
        <div className="form-label">
          <h2 className="text-[1.65rem] font-bold leading-[1.15] sm:text-[1.9rem]">{title}</h2>
          {hint && <div className="mt-3 text-[0.98rem] text-ink-3">{hint}</div>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  )
}
