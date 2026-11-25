'use client'

import {
  Briefcase,
  Columns,
  EnvelopeSimple,
  FileText,
  MagnifyingGlass,
  Moon,
  Plus,
  Sparkle,
  SquaresFour,
  Sun,
} from '@phosphor-icons/react/dist/ssr'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ROLE_STARTER_KITS } from '@/components/resume/resume-data'
import { useTheme } from '@/components/theme/theme-provider'
import { BRAND } from '@/config/brand'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { createCv, listCvs, saveCv, type CvRecord } from '@/lib/cv-repository'
import { getApplications, getLetterList } from '@/lib/storage'
import type { JobApplication, LetterDocument } from '@/types/resume'
import { migrateToV2 } from '@/types/schema'

type CommandItem = {
  id: string
  group: string
  label: string
  subtitle?: string
  icon: 'plus' | 'cv' | 'letter' | 'kanban' | 'interview' | 'templates' | 'theme' | 'kit'
  run: () => void | Promise<void>
}

function foldVi(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function CommandIcon({ kind, isDark }: { kind: CommandItem['icon']; isDark: boolean }) {
  switch (kind) {
    case 'plus':
      return <Plus size={16} weight="bold" className="shrink-0 text-pen" aria-hidden="true" />
    case 'cv':
      return <FileText size={16} className="shrink-0 text-pen" aria-hidden="true" />
    case 'letter':
      return <EnvelopeSimple size={16} className="shrink-0 text-pen" aria-hidden="true" />
    case 'kanban':
      return <Columns size={16} className="shrink-0 text-mint" aria-hidden="true" />
    case 'interview':
      return <Sparkle size={16} weight="fill" className="shrink-0 text-pen" aria-hidden="true" />
    case 'templates':
      return <SquaresFour size={16} className="shrink-0 text-ink-2" aria-hidden="true" />
    case 'theme':
      return isDark ? (
        <Sun size={16} weight="bold" className="shrink-0 text-mint" aria-hidden="true" />
      ) : (
        <Moon size={16} weight="bold" className="shrink-0 text-pen" aria-hidden="true" />
      )
    case 'kit':
      return <Briefcase size={16} className="shrink-0 text-mint" aria-hidden="true" />
  }
}

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { resolvedTheme, toggleTheme } = useTheme()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [cvs, setCvs] = useState<CvRecord[]>([])
  const [letters, setLetters] = useState<LetterDocument[]>([])
  const [apps, setApps] = useState<JobApplication[]>([])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()

    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'

    void listCvs()
      .then(setCvs)
      .catch(() => {})
    setLetters(getLetterList())
    setApps(getApplications())

    return () => {
      root.style.overflow = prevOverflow
    }
  }, [])

  const items = useMemo<CommandItem[]>(() => {
    const go = (href: string) => () => {
      onClose()
      router.push(href)
    }

    const quickActions: CommandItem[] = [
      {
        id: 'act-new-cv',
        group: 'Thao tác nhanh',
        label: 'Tạo CV mới',
        subtitle: 'Chọn từ 12 mẫu ATS hoặc Role Kits',
        icon: 'plus',
        run: go('/cv?new=1'),
      },
      {
        id: 'act-new-letter',
        group: 'Thao tác nhanh',
        label: 'Viết Thư xin việc mới',
        subtitle: 'Đồng bộ từ CV có sẵn',
        icon: 'plus',
        run: go('/thu-xin-viec?new=1'),
      },
      {
        id: 'act-kanban',
        group: 'Thao tác nhanh',
        label: 'Mở Bảng ứng tuyển Kanban',
        subtitle: 'Theo dõi phỏng vấn & Job Clipper',
        icon: 'kanban',
        run: go('/theo-doi-ung-tuyen'),
      },
      {
        id: 'act-interview',
        group: 'Thao tác nhanh',
        label: 'Vào phòng Phỏng vấn AI',
        subtitle: 'Luyện trả lời theo mô hình STAR',
        icon: 'interview',
        run: go('/luyen-phong-van'),
      },
      {
        id: 'act-templates',
        group: 'Thao tác nhanh',
        label: 'Xem 12 mẫu CV',
        subtitle: 'Thử màu nhấn & ảnh chân dung trực tiếp',
        icon: 'templates',
        run: go('/mau-cv'),
      },
      {
        id: 'act-theme',
        group: 'Thao tác nhanh',
        label: 'Chuyển giao diện Sáng / Tối',
        subtitle: resolvedTheme === 'dark' ? 'Đang dùng giao diện Tối' : 'Đang dùng giao diện Sáng',
        icon: 'theme',
        run: () => {
          toggleTheme()
          onClose()
        },
      },
    ]

    const userCvs: CommandItem[] = cvs.map((cv) => ({
      id: `cv-${cv.id}`,
      group: 'Hồ sơ của bạn',
      label: cv.title,
      subtitle: [cv.data.name || 'Chưa điền tên', cv.data.role].filter(Boolean).join(' · '),
      icon: 'cv',
      run: go(`/cv/${cv.id}`),
    }))

    const userLetters: CommandItem[] = letters.map((l) => ({
      id: `let-${l.id}`,
      group: 'Hồ sơ của bạn',
      label: l.title,
      subtitle: l.recipientCompany ? `Gửi tới ${l.recipientCompany}` : 'Thư xin việc',
      icon: 'letter',
      run: go(`/thu-xin-viec/${l.id}`),
    }))

    const userApps: CommandItem[] = apps.map((a) => ({
      id: `app-${a.id}`,
      group: 'Hồ sơ của bạn',
      label: `${a.role || 'Vị trí'} — ${a.company || 'Công ty'}`,
      subtitle: 'Mở trên Bảng ứng tuyển Kanban',
      icon: 'kanban',
      run: go('/theo-doi-ung-tuyen'),
    }))

    const kitItems: CommandItem[] = ROLE_STARTER_KITS.map((kit) => ({
      id: `kit-${kit.id}`,
      group: 'Bộ CV theo ngành nghề',
      label: `Bộ CV ${kit.roleTitle}`,
      subtitle: `${kit.industry} · ${kit.badge}`,
      icon: 'kit',
      run: async () => {
        if (BRAND.enforceFreeLimits && cvs.length >= 1) {
          onClose()
          router.push(`/mau-cv/${kit.recommendedLayout}`)
          return
        }
        const title = `CV ${kit.roleTitle}`
        const doc = createCv({ templateSlug: kit.recommendedLayout, title })
        const populated = migrateToV2({
          ...doc,
          title,
          data: JSON.parse(JSON.stringify(kit.data)),
          settings: {
            ...doc.settings,
            accentColor: kit.accentColor,
            fontFamily: kit.recommendedLayout === 'ke-ngang' || kit.recommendedLayout === 'harvard' ? 'serif' : 'sans',
          },
        })
        await saveCv(populated)
        onClose()
        router.push(`/cv/${populated.id}`)
      },
    }))

    const templateItems: CommandItem[] = CV_TEMPLATES.map((t) => ({
      id: `tpl-${t.slug}`,
      group: '12 Mẫu CV chuẩn ATS',
      label: `Mẫu ${t.name}`,
      subtitle: `${t.columns} · ${t.tags.join(', ')}`,
      icon: 'templates',
      run: go(`/mau-cv/${t.slug}`),
    }))

    return [...quickActions, ...userCvs, ...userLetters, ...userApps, ...kitItems, ...templateItems]
  }, [apps, cvs, letters, onClose, resolvedTheme, router, toggleTheme])

  const filtered = useMemo(() => {
    const q = foldVi(query.trim())
    if (!q) return items
    const tokens = q.split(/\s+/).filter(Boolean)
    return items.filter((item) => {
      const hay = foldVi(`${item.group} ${item.label} ${item.subtitle ?? ''}`)
      return tokens.every((tok) => hay.includes(tok))
    })
  }, [items, query])

  const clampedActive = filtered.length === 0 ? -1 : Math.min(active, filtered.length - 1)

  useEffect(() => {
    if (clampedActive < 0) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${clampedActive}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [clampedActive])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length))
    } else if (e.key === 'Enter' && clampedActive >= 0 && filtered[clampedActive]) {
      e.preventDefault()
      void filtered[clampedActive].run()
    }
  }

  let lastGroup = ''

  return (
    <dialog
      ref={dialogRef}
      aria-label="Tìm kiếm nhanh trong Workspace"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClose={(e) => {
        if (!e.currentTarget.open) onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      className="sheet-dialog m-auto mt-14 max-h-[78dvh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-sheet border border-rule bg-paper p-0 text-ink sm:mt-20"
    >
      <div className="flex items-center gap-2.5 border-b border-rule px-4 py-3">
        <MagnifyingGlass size={18} className="shrink-0 text-ink-3" aria-hidden="true" />
        <input
          type="search"
          value={query}
          data-autofocus
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Tìm CV, Thư xin việc, Kanban, Mẫu CV hoặc lệnh nhanh…"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={clampedActive >= 0 && filtered[clampedActive] ? `${listId}-${filtered[clampedActive].id}` : undefined}
          className="h-9 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-3 focus:outline-none"
        />
        <kbd className="hidden rounded-[5px] border border-rule bg-desk px-1.5 py-0.5 text-[11px] font-semibold text-ink-3 sm:inline-block">
          ESC
        </kbd>
      </div>

      <ul ref={listRef} id={listId} role="listbox" className="max-h-[58dvh] overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <li className="list-none px-4 py-8 text-center text-sm text-ink-3">Không tìm thấy kết quả phù hợp với “{query}”.</li>
        ) : (
          filtered.map((item, idx) => {
            const showGroup = item.group !== lastGroup
            lastGroup = item.group
            const isSelected = idx === clampedActive
            return (
              <li key={item.id} className="list-none">
                {showGroup && <p className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-3">{item.group}</p>}
                <button
                  type="button"
                  id={`${listId}-${item.id}`}
                  data-idx={idx}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => void item.run()}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors ${
                    isSelected ? 'bg-pen-wash text-pen' : 'text-ink hover:bg-ink/[0.04]'
                  }`}
                >
                  <CommandIcon kind={item.icon} isDark={resolvedTheme === 'dark'} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.label}</span>
                    {item.subtitle && <span className="block truncate text-xs text-ink-3">{item.subtitle}</span>}
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-desk px-4 py-2 text-[11px] text-ink-3">
        <span>↑↓ di chuyển · Enter mở · Esc đóng</span>
        <span>Tìm nhanh mọi lúc với ⌘K / Ctrl+K</span>
      </div>
    </dialog>
  )
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return <CommandPaletteDialog onClose={onClose} />
}
