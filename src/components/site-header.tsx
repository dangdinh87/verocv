'use client'

import { List, UserCircle, X } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { NAV_LINKS } from '@/config/brand'
import { Logo } from './logo'
import { Button } from './ui/button'

export function SiteHeader() {
  const pathname = usePathname()
  const { user, loading, openAuthModal } = useAuth()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-2 sm:gap-3">
        <Logo />

        <nav aria-label="Menu chính" className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`whitespace-nowrap rounded-control px-2 py-1.5 text-[0.82rem] font-medium transition-colors lg:px-2.5 lg:text-sm xl:px-3.5 ${
                l.href === '/luyen-phong-van' ? 'hidden xl:inline-flex' : 'inline-flex'
              } ${isActive(l.href) ? 'bg-pen-wash font-semibold text-pen' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="max-xs:hidden" />
          {!loading &&
            (user ? (
              <Link
                href="/tai-khoan"
                className="hidden h-10 items-center gap-2 rounded-control border border-rule bg-paper px-3 text-sm font-semibold text-ink hover:border-pen sm:inline-flex"
              >
                <UserCircle size={18} weight="fill" className="text-pen" aria-hidden="true" />
                <span className="max-w-[7.5rem] truncate">{user.name}</span>
                {user.plan !== 'free' && (
                  <span className="rounded-full bg-pen-wash px-2 py-0.5 text-[0.7rem] font-bold text-pen">
                    {user.plan === 'pass_14d' ? 'Pass' : 'Pro'}
                  </span>
                )}
              </Link>
            ) : (
              <Button variant="ghost" onClick={openAuthModal} className="max-sm:hidden">
                Đăng nhập
              </Button>
            ))}
          <Button href="/cv" size="sm" className="sm:h-10 sm:px-4">
            CV Studio
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-di-dong"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            className="inline-flex size-10 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.05] md:hidden"
          >
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-di-dong" aria-label="Menu chính" className="wrap flex flex-col gap-1 border-t border-rule pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`rounded-control px-3 py-2.5 text-sm font-medium ${isActive(l.href) ? 'bg-pen-wash font-semibold text-pen' : 'text-ink-2'}`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link href="/tai-khoan" onClick={() => setOpen(false)} className="rounded-control px-3 py-2.5 text-sm font-semibold text-pen">
              Tài khoản ({user.name})
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                openAuthModal()
              }}
              className="rounded-control px-3 py-2.5 text-left text-sm font-semibold text-pen"
            >
              Đăng nhập / Đồng bộ Cloud
            </button>
          )}
          <div className="mt-1 flex items-center justify-between border-t border-rule pt-3">
            <span className="px-3 text-xs font-semibold text-ink-3">Giao diện hiển thị</span>
            <ThemeToggle showLabel />
          </div>
        </nav>
      )}
    </header>
  )
}
