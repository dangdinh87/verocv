import type { ReactNode } from 'react'

export function PageIntro({ title, children, narrow = false }: { title: string; children?: ReactNode; narrow?: boolean }) {
  return (
    <header className={`wrap ${narrow ? 'max-w-[50rem]' : ''} pb-10 pt-10 lg:pb-14 lg:pt-16`}>
      <h1 className="display max-w-[20ch] text-[clamp(2.2rem,5vw,3.8rem)]">{title}</h1>
      {children && <div className="mt-5 max-w-[52ch] text-[1.15rem] leading-[1.6] text-ink-2">{children}</div>}
    </header>
  )
}
