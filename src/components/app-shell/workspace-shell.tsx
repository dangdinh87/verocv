'use client'

import {
  CloudCheck,
  Columns,
  Crown,
  EnvelopeSimple,
  FileText,
  MagnifyingGlass,
  Plus,
  Sparkle,
  SquaresFour,
  UserCircle,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { listCvs, subscribeToCvChanges } from '@/lib/cv-repository'
import { APPLICATION_KEY, getApplications, getLetterList, LETTER_KEY, subscribeToStorageKey } from '@/lib/storage'
import { CommandPalette } from './command-palette'

const PLAN_LABEL: Record<string, string> = {
  free: 'Miễn phí',
  pass_14d: 'Pass 14 ngày',
  pro: 'Pro',
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, quota, loading, openAuthModal } = useAuth()
  const [cvCount, setCvCount] = useState<number>(0)
  const [letterCount, setLetterCount] = useState<number>(0)
  const [appCount, setAppCount] = useState<number>(0)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const refreshCounts = useCallback(() => {
    void listCvs()
      .then((list) => setCvCount(list.length))
      .catch(() => {})
    setLetterCount(getLetterList().length)
    setAppCount(getApplications().length)
  }, [])

  useEffect(() => {
    refreshCounts()
    const unsubCv = subscribeToCvChanges(refreshCounts)
    const unsubLetters = subscribeToStorageKey(LETTER_KEY, refreshCounts)
    const unsubApps = subscribeToStorageKey(APPLICATION_KEY, refreshCounts)
    return () => {
      unsubCv()
      unsubLetters()
      unsubApps()
    }
  }, [refreshCounts])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const navItems = [
    { href: '/cv', label: 'Hồ sơ CV', Icon: FileText, count: cvCount },
    { href: '/thu-xin-viec', label: 'Thư xin việc', Icon: EnvelopeSimple, count: letterCount },
    { href: '/theo-doi-ung-tuyen', label: 'Bảng ứng tuyển', Icon: Columns, count: appCount },
    { href: '/luyen-phong-van', label: 'Phỏng vấn AI', Icon: Sparkle, count: null },
    { href: '/mau-cv', label: 'Kho 12 mẫu CV', Icon: SquaresFour, count: null },
    { href: '/tai-khoan', label: 'Tài khoản & Link', Icon: UserCircle, count: null },
  ]

  const mobileTabs = [
    { href: '/cv', label: 'CV', Icon: FileText },
    { href: '/thu-xin-viec', label: 'Thư', Icon: EnvelopeSimple },
    { href: '/theo-doi-ung-tuyen', label: 'Kanban', Icon: Columns },
    { href: '/luyen-phong-van', label: 'Phỏng vấn', Icon: Sparkle },
    { href: '/tai-khoan', label: 'Tài khoản', Icon: UserCircle },
  ]

  const planId = user?.plan ?? quota?.planId ?? 'free'
  const quotaText = quota ? `${quota.remaining}/${quota.dailyLimit} lượt` : '8 lượt AI/ngày'
  const quotaRatio = quota && quota.dailyLimit > 0 ? Math.min(100, Math.round((quota.remaining / quota.dailyLimit) * 100)) : 100

  return (
    <div className="flex min-h-dvh flex-col bg-desk lg:flex-row">
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-pen focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Desktop SaaS Sidebar */}
      <aside
        aria-label="Thanh điều hướng Workspace"
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-rule bg-paper lg:flex"
      >
        <div className="flex items-center justify-between overflow-hidden border-b border-rule px-4 py-3.5">
          <Logo badgeText="WORKSPACE" />
        </div>

        <div className="space-y-2 p-3.5 pb-2">
          <Button href="/cv?new=1" size="md" className="w-full gap-1.5">
            <Plus size={16} weight="bold" aria-hidden="true" />
            Tạo CV mới
          </Button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-control border border-rule bg-desk px-2.5 text-xs font-medium text-ink-3 transition-colors hover:border-pen/60 hover:text-ink"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <MagnifyingGlass size={14} className="shrink-0" aria-hidden="true" />
              <span className="truncate">Tìm nhanh CV, Thư, Kanban…</span>
            </span>
            <kbd className="shrink-0 rounded-[4px] border border-rule bg-paper px-1.5 py-0.5 text-[10px] font-bold text-ink-3">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav aria-label="Các công cụ trong Workspace" className="flex-1 space-y-1 overflow-y-auto px-3 py-1.5">
          {navItems.map(({ href, label, Icon, count }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between gap-2 rounded-control px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-pen-wash font-semibold text-pen' : 'font-medium text-ink-2 hover:bg-ink/[0.04] hover:text-ink'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon size={18} weight={active ? 'fill' : 'regular'} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </span>
                {count !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                      active ? 'bg-paper text-pen' : 'border border-rule bg-desk text-ink-3'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-2.5 border-t border-rule p-3">
          <div className="rounded-control border border-rule bg-desk p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink">AI Quota hôm nay</span>
              <span className="text-xs font-bold tabular-nums text-pen">{quotaText}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-rule">
              <div className="h-full rounded-full bg-pen transition-[width]" style={{ width: `${quotaRatio}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-2">
                <Crown size={11} weight="fill" className="text-pen" aria-hidden="true" />
                {PLAN_LABEL[planId] ?? 'Miễn phí'}
              </span>
              <Link href="/bang-gia" className="text-xs font-semibold text-pen underline-offset-2 hover:underline">
                {planId === 'pro' ? 'Xem gói' : 'Nâng cấp'}
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {!loading &&
              (user ? (
                <Link
                  href="/tai-khoan"
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-control border border-rule bg-desk px-2.5 py-1.5 text-left hover:border-pen"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pen text-xs font-bold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-ink">{user.name}</span>
                    <span className="block truncate text-[11px] text-ink-3">{user.email}</span>
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-rule bg-desk px-2.5 py-2 text-xs font-semibold text-ink hover:border-pen hover:text-pen"
                >
                  <CloudCheck size={15} weight="bold" className="shrink-0 text-pen" aria-hidden="true" />
                  <span className="truncate">Đăng nhập Cloud</span>
                </button>
              ))}
            <ThemeToggle className="size-9 shrink-0" />
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Top Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-rule bg-paper/95 px-3 backdrop-blur-md sm:px-4 lg:hidden">
        <Logo badgeText={false} />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Tìm kiếm nhanh (Ctrl+K)"
            title="Tìm kiếm nhanh (⌘K)"
            className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-rule bg-desk text-ink-2 hover:border-pen hover:text-ink"
          >
            <MagnifyingGlass size={17} weight="bold" />
          </button>
          <ThemeToggle className="size-9 shrink-0" />
          {!loading &&
            (user ? (
              <Link
                href="/tai-khoan"
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-rule bg-desk px-2.5 text-xs font-semibold text-ink hover:border-pen"
              >
                <UserCircle size={16} weight="fill" className="text-pen" aria-hidden="true" />
                <span className="max-w-[6rem] truncate">{user.name}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control border border-rule bg-desk px-2.5 text-xs font-semibold text-pen hover:border-pen"
              >
                <CloudCheck size={15} weight="bold" aria-hidden="true" />
                <span>Đăng nhập</span>
              </button>
            ))}
        </div>
      </header>

      <main id="noi-dung-chinh" className="min-w-0 flex-1 pb-20 lg:pb-12">
        {children}
      </main>

      {/* Mobile / Tablet Sticky Bottom App Bar */}
      <nav
        aria-label="Thanh điều hướng Workspace trên di động"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {mobileTabs.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                active ? 'text-pen' : 'text-ink-3 hover:text-ink'
              }`}
            >
              <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
