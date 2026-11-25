'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Briefcase,
  ChatsCircle,
  DotsSixVertical,
  DownloadSimple,
  EnvelopeSimple,
  FileText,
  Kanban,
  LinkSimple,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  Plus,
  Sparkle,
  Table,
  TrendUp,
  Trophy,
  X,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatedTabs } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { WorkspaceBackupControls } from '@/components/workspace-backup-controls'
import { listCvs, subscribeToCvChanges, type CvRecord } from '@/lib/cv-repository'
import { applicationsIn, columnName, formatDateValue, KANBAN_COLUMNS, moveApplication, todoProgress } from '@/lib/kanban'
import {
  APPLICATION_KEY,
  deleteApplication,
  getApplications,
  getLetterList,
  LETTER_KEY,
  sampleApplications,
  saveAllApplications,
  subscribeToStorageKey,
} from '@/lib/storage'
import type { JobApplication, KanbanColumnId, LetterDocument } from '@/types/resume'
import { ApplicationDialog } from './application-dialog'

const COLUMN_PREFIX = 'col:'

// Trạng thái cột chỉ thể hiện bằng chấm màu cạnh tên — không thêm vạch màu trên đầu cột.
const COLUMN_DOT: Record<KanbanColumnId, string> = {
  wishlist: 'bg-ink-3',
  applied: 'bg-pen',
  interview: 'bg-ochre',
  offer: 'bg-mint',
  rejected: 'bg-seal',
}

// Prefer the column under the pointer (so dropping on empty space works), else the nearest card.
const collision: CollisionDetection = (args) => {
  const within = pointerWithin(args)
  return within.length > 0 ? within : closestCenter(args)
}

function safeExternalUrl(raw?: string): string | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function celebrateOffer() {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  void import('canvas-confetti')
    .then((mod) => {
      const fire = mod.default
      fire({
        particleCount: 48,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2448a8', '#1f7a4d', '#d8c4a0'],
      })
    })
    .catch(() => {})
}

function CardBody({ card, cvs, letters }: { card: JobApplication; cvs: CvRecord[]; letters: LetterDocument[] }) {
  const cv = cvs.find((c) => c.id === card.linkedCvId)
  const letter = letters.find((l) => l.id === card.linkedLetterId)
  const { done, total } = todoProgress(card)
  const externalUrl = safeExternalUrl(card.url)
  const dateLine =
    card.columnId === 'interview' && card.interviewDate
      ? `Phỏng vấn ${formatDateValue(card.interviewDate)}`
      : card.appliedDate
        ? `Nộp ${formatDateValue(card.appliedDate)}`
        : ''

  return (
    <>
      <p className="font-semibold leading-snug text-ink">{card.company}</p>
      <p className="text-sm text-ink-2">{card.role}</p>
      {(dateLine || card.salary || card.location) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-3">
          {dateLine && <span>{dateLine}</span>}
          {card.salary && <span className="font-medium text-ink-2">{card.salary}</span>}
          {card.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" />
              {card.location}
            </span>
          )}
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
        {cv && (
          <Link href={`/cv/${cv.id}`} className="inline-flex items-center gap-1 font-semibold text-pen hover:underline">
            <FileText size={13} aria-hidden="true" />
            CV
          </Link>
        )}
        {letter && (
          <Link href={`/thu-xin-viec/${letter.id}`} className="inline-flex items-center gap-1 font-semibold text-pen hover:underline">
            <EnvelopeSimple size={13} aria-hidden="true" />
            Thư
          </Link>
        )}
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-pen hover:underline"
          >
            <ArrowSquareOut size={13} aria-hidden="true" />
            JD gốc
          </a>
        )}
        <Link
          href={`/luyen-phong-van?appId=${encodeURIComponent(card.id)}`}
          className="inline-flex items-center gap-1 font-semibold text-pen hover:underline"
        >
          <Sparkle size={12} weight="fill" aria-hidden="true" />
          Phỏng vấn AI
        </Link>
      </div>
      {total > 0 && (
        <p className="mt-2 text-xs text-ink-3">
          Việc cần làm: {done}/{total}
        </p>
      )}
    </>
  )
}

function KanbanCard({
  card,
  cvs,
  letters,
  onEdit,
  onMove,
}: {
  card: JobApplication
  cvs: CvRecord[]
  letters: LetterDocument[]
  onEdit: (card: JobApplication) => void
  onMove: (card: JobApplication, direction: -1 | 1) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const index = KANBAN_COLUMNS.findIndex((c) => c.id === card.columnId)
  const prev = KANBAN_COLUMNS[index - 1]
  const next = KANBAN_COLUMNS[index + 1]

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`list-none rounded-control border border-rule bg-paper p-3 ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="-mt-1 flex items-center justify-between">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Kéo thẻ ${card.company} sang cột khác`}
          title="Kéo để chuyển cột"
          className="-ml-1.5 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink active:cursor-grabbing"
        >
          <DotsSixVertical size={17} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(card)}
          aria-label={`Sửa ${card.company}`}
          className="-mr-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
        >
          <PencilSimple size={16} />
        </button>
      </div>
      <div className="min-w-0">
        <CardBody card={card} cvs={cvs} letters={letters} />
      </div>
      {/* Tiến tới là thao tác chính → giữ tên cột; lùi về chỉ là mũi tên (tên cột trong title + sr-only) để hai nút không cùng bị cắt chữ. */}
      <div className="mt-2.5 flex items-center justify-between gap-1 border-t border-rule pt-2 text-xs">
        {prev ? (
          <button
            type="button"
            title={`Chuyển về ${prev.name}`}
            onClick={() => onMove(card, -1)}
            className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span className="sr-only">Chuyển về {prev.name}</span>
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button
            type="button"
            title={`Chuyển sang ${next.name}`}
            onClick={() => onMove(card, 1)}
            className="inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-control px-1.5 py-1 font-medium text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
          >
            <span className="sr-only">Chuyển sang</span>
            <span className="truncate">{next.name}</span>
            <ArrowRight size={13} className="shrink-0" aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  )
}

function KanbanColumn({
  column,
  cards,
  cvs,
  letters,
  onAdd,
  onEdit,
  onMove,
}: {
  column: { id: KanbanColumnId; name: string }
  cards: JobApplication[]
  cvs: CvRecord[]
  letters: LetterDocument[]
  onAdd: (column: KanbanColumnId) => void
  onEdit: (card: JobApplication) => void
  onMove: (card: JobApplication, direction: -1 | 1) => void
}) {
  // The column itself is a drop target, so a card can be dropped into an empty column.
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${column.id}` })
  const dot = COLUMN_DOT[column.id]

  return (
    <section
      aria-label={`${column.name}, ${cards.length} thẻ`}
      className={`flex min-h-[17rem] flex-col rounded-sheet border p-3 transition-colors ${
        isOver ? 'border-pen bg-pen-wash/40' : 'border-rule bg-ink/[0.03]'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5 px-0.5 pb-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
          <h3 className="whitespace-nowrap text-[0.82rem] font-bold tracking-tight text-ink">{column.name}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-rule bg-paper px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-3">
          {cards.length}
        </span>
      </div>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex-1 space-y-2.5 p-0">
          {cards.length === 0 ? (
            <li className="list-none rounded-control border border-dashed border-rule bg-paper/50 px-3 py-6 text-center text-xs text-ink-3">
              Chưa có vị trí nào
            </li>
          ) : (
            cards.map((card) => <KanbanCard key={card.id} card={card} cvs={cvs} letters={letters} onEdit={onEdit} onMove={onMove} />)
          )}
        </ul>
      </SortableContext>
      <button
        type="button"
        onClick={() => onAdd(column.id)}
        className="mt-3 flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-dashed border-ink/25 text-xs font-semibold text-ink-2 hover:border-pen hover:text-pen"
      >
        <Plus size={14} weight="bold" aria-hidden="true" />
        <span aria-hidden="true">Thêm thẻ</span>
        <span className="sr-only">Thêm vị trí vào cột {column.name}</span>
      </button>
    </section>
  )
}

const announcements = (find: (id: string) => JobApplication | undefined): Announcements => {
  const label = (id: unknown) => find(String(id))?.company ?? 'thẻ'
  const where = (id: unknown) => {
    const text = String(id)
    if (text.startsWith(COLUMN_PREFIX)) return `cột ${columnName(text.slice(COLUMN_PREFIX.length) as KanbanColumnId)}`
    const over = find(text)
    return over ? `cột ${columnName(over.columnId)}` : 'vị trí khác'
  }
  return {
    onDragStart: ({ active }) => `Đã nhấc thẻ ${label(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `Thẻ ${label(active.id)} đang ở trên ${where(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) =>
      over ? `Đã thả thẻ ${label(active.id)} vào ${where(over.id)}.` : `Đã thả thẻ ${label(active.id)} về chỗ cũ.`,
    onDragCancel: ({ active }) => `Đã huỷ di chuyển thẻ ${label(active.id)}.`,
  }
}

type FilterMode = 'all' | 'interview' | 'todos'
type TrackerView = 'kanban' | 'table'

export function KanbanTracker() {
  const [apps, setApps] = useState<JobApplication[] | null>(null)
  const [cvs, setCvs] = useState<CvRecord[]>([])
  const [letters, setLetters] = useState<LetterDocument[]>([])
  const [editing, setEditing] = useState<{
    app: JobApplication | null
    initialDraft?: Partial<JobApplication> | null
    column: KanbanColumnId
  } | null>(null)
  const [dragging, setDragging] = useState<JobApplication | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [view, setView] = useState<TrackerView>('kanban')
  const [clipUrl, setClipUrl] = useState('')
  const [clipBusy, setClipBusy] = useState(false)
  const [clipFeedback, setClipFeedback] = useState<{ text: string; isError: boolean } | null>(null)

  const reloadAll = useCallback(() => {
    setApps(getApplications())
    setLetters(getLetterList())
    void listCvs().then(setCvs)
  }, [])

  useEffect(() => {
    reloadAll()
    const unsubApps = subscribeToStorageKey(APPLICATION_KEY, () => setApps(getApplications()))
    const unsubLetters = subscribeToStorageKey(LETTER_KEY, () => setLetters(getLetterList()))
    const unsubCvs = subscribeToCvChanges(() => void listCvs().then(setCvs))
    return () => {
      unsubApps()
      unsubLetters()
      unsubCvs()
    }
  }, [reloadAll])

  const commit = useCallback((next: JobApplication[], movedToOffer = false) => {
    setApps(next)
    if (!saveAllApplications(next)) {
      setNotice('Không lưu được thay đổi (bộ nhớ trình duyệt đã đầy). Hãy xoá bớt dữ liệu cũ.')
    } else if (movedToOffer) {
      celebrateOffer()
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filteredApps = useMemo(() => {
    if (!apps) return []
    const q = search.trim().toLowerCase()
    return apps.filter((a) => {
      if (filter === 'interview' && !a.interviewDate && a.columnId !== 'interview') return false
      if (filter === 'todos' && !a.todos.some((t) => !t.done)) return false
      if (!q) return true
      return (
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        (a.location?.toLowerCase().includes(q) ?? false) ||
        (a.notes?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [apps, search, filter])

  const handleInlineClip = async () => {
    const trimmed = clipUrl.trim()
    if (!trimmed) {
      setClipFeedback({ text: 'Hãy dán đường dẫn tin tuyển dụng vào ô trên trước.', isError: true })
      return
    }
    setClipBusy(true)
    setClipFeedback(null)
    try {
      const res = await fetch('/api/jobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const json = (await res.json()) as {
        job?: { company?: string; role?: string; salary?: string; location?: string; jdText?: string }
        error?: string
      }
      if (!res.ok || !json.job) {
        setClipFeedback({
          text: json.error || 'Trang tuyển dụng chặn truy cập tự động — bạn có thể bấm "Điền thủ công ngay" để tạo thẻ với URL này.',
          isError: true,
        })
        return
      }
      setClipUrl('')
      setClipFeedback(null)
      setEditing({
        app: null,
        column: 'wishlist',
        initialDraft: {
          company: json.job.company ?? '',
          role: json.job.role ?? '',
          salary: json.job.salary ?? '',
          location: json.job.location ?? '',
          url: trimmed,
          jdText: json.job.jdText ?? '',
          columnId: 'wishlist',
        },
      })
    } catch {
      setClipFeedback({
        text: 'Không kết nối được tới trang tuyển dụng — bạn có thể mở form tạo thẻ và dán JD trực tiếp.',
        isError: true,
      })
    } finally {
      setClipBusy(false)
    }
  }

  if (apps === null) {
    return (
      <div
        className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        role="status"
        aria-label="Đang tải bảng theo dõi"
      >
        {KANBAN_COLUMNS.map((c) => (
          <div key={c.id} className="min-h-[17rem] animate-pulse rounded-sheet border border-rule bg-ink/[0.035]" />
        ))}
      </div>
    )
  }

  const move = (card: JobApplication, direction: -1 | 1) => {
    const target = KANBAN_COLUMNS[KANBAN_COLUMNS.findIndex((c) => c.id === card.columnId) + direction]
    if (target) {
      commit(moveApplication(apps, card.id, target.id), card.columnId !== 'offer' && target.id === 'offer')
    }
  }

  const changeColumn = (card: JobApplication, targetColumn: KanbanColumnId) => {
    if (card.columnId === targetColumn) return
    commit(moveApplication(apps, card.id, targetColumn), card.columnId !== 'offer' && targetColumn === 'offer')
  }

  const onDragStart = ({ active }: DragStartEvent) => setDragging(apps.find((a) => a.id === active.id) ?? null)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const activeCard = apps.find((a) => a.id === String(active.id))
    setDragging(null)
    if (!over || !activeCard) return
    const overId = String(over.id)
    if (overId === String(active.id)) return
    if (overId.startsWith(COLUMN_PREFIX)) {
      const targetCol = overId.slice(COLUMN_PREFIX.length) as KanbanColumnId
      commit(moveApplication(apps, activeCard.id, targetCol), activeCard.columnId !== 'offer' && targetCol === 'offer')
      return
    }
    const target = apps.find((a) => a.id === overId)
    if (target) {
      commit(
        moveApplication(apps, activeCard.id, target.columnId, target.id),
        activeCard.columnId !== 'offer' && target.columnId === 'offer',
      )
    }
  }

  const totalApps = apps.length
  const interviewingCount = apps.filter((a) => a.columnId === 'interview').length
  const offerCount = apps.filter((a) => a.columnId === 'offer').length
  const progressedCount = apps.filter((a) => a.columnId === 'interview' || a.columnId === 'offer').length
  const interviewRate = totalApps > 0 ? Math.round((progressedCount / totalApps) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Single Unified Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-[clamp(1.7rem,3.4vw,2.35rem)] text-ink">Bảng theo dõi ứng tuyển</h1>
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-ink-2">
            Dán link tin tuyển dụng để tạo thẻ, rồi theo dõi từng vòng tới khi có offer. Lưu ngay trên trình duyệt; đăng nhập để đồng bộ
            giữa các máy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {apps.length === 0 && (
            <Button variant="secondary" onClick={() => commit(sampleApplications())}>
              Thêm dữ liệu mẫu
            </Button>
          )}
          <Button onClick={() => setEditing({ app: null, initialDraft: null, column: 'wishlist' })} className="gap-1.5">
            <Plus size={16} weight="bold" aria-hidden="true" />
            Thêm vị trí
          </Button>
        </div>
      </header>

      {/* Inline Job URL Clipper Bar */}
      <section aria-label="Hút thông tin tin tuyển dụng từ đường dẫn" className="rounded-sheet border border-rule bg-paper p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <LinkSimple size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input
              type="url"
              inputMode="url"
              aria-label="Đường dẫn tin tuyển dụng"
              value={clipUrl}
              onChange={(e) => {
                setClipUrl(e.target.value)
                if (clipFeedback) setClipFeedback(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleInlineClip()
                }
              }}
              placeholder="Dán link tin tuyển dụng TopCV, ITviec, LinkedIn… để hút JD tự động"
              className="h-11 w-full rounded-control border border-rule bg-desk pl-9 pr-3 text-sm text-ink placeholder:text-ink-3/80 focus-visible:border-pen focus-visible:outline-none"
            />
          </div>
          <Button variant="secondary" disabled={clipBusy} onClick={() => void handleInlineClip()} className="h-11 shrink-0 gap-1.5">
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            {clipBusy ? 'Đang hút JD…' : 'Hút JD & Tạo thẻ'}
          </Button>
        </div>
        {clipFeedback && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-control border border-seal/30 bg-seal/5 px-3 py-2 text-xs text-seal">
            <span>{clipFeedback.text}</span>
            <button
              type="button"
              onClick={() => {
                setClipFeedback(null)
                setEditing({ app: null, column: 'wishlist', initialDraft: { url: clipUrl.trim(), columnId: 'wishlist' } })
              }}
              className="cursor-pointer font-bold text-pen hover:underline"
            >
              Điền thủ công ngay →
            </button>
          </div>
        )}
      </section>

      {/* Số liệu phễu — chỉ hiện khi đã có ít nhất một vị trí (toàn số 0 không nói được gì). */}
      {totalApps > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Thống kê phễu ứng tuyển">
          <div className="rounded-sheet border border-rule bg-paper p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-3">Tổng vị trí</p>
              <Briefcase size={16} className="text-pen" aria-hidden="true" />
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">
              <span className="tabular-nums">{totalApps}</span>
            </p>
          </div>
          <div className="rounded-sheet border border-rule bg-paper p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-3">Đang phỏng vấn</p>
              <ChatsCircle size={16} className="text-pen" aria-hidden="true" />
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-pen">
              <span className="tabular-nums">{interviewingCount}</span>
            </p>
          </div>
          <div className="rounded-sheet border border-rule bg-paper p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-3">Tỷ lệ vào phỏng vấn</p>
              <TrendUp size={16} className="text-ink-2" aria-hidden="true" />
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">
              <span className="tabular-nums">{interviewRate}%</span>
            </p>
          </div>
          <div className="rounded-sheet border border-rule bg-paper p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-3">Offer nhận được</p>
              <Trophy size={16} className="text-mint" aria-hidden="true" />
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-mint">
              <span className="tabular-nums">{offerCount}</span>
            </p>
          </div>
        </div>
      )}

      {/* Toolbar: AnimatedTabs View Switcher + Search + Quick Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <AnimatedTabs
            ariaLabel="Chế độ xem bảng ứng tuyển"
            value={view}
            onChange={setView}
            items={[
              { id: 'kanban', label: 'Bảng Kanban', icon: <Kanban size={14} weight="bold" aria-hidden="true" /> },
              { id: 'table', label: 'Danh sách chi tiết', icon: <Table size={14} weight="bold" aria-hidden="true" /> },
            ]}
          />

          <div className="relative min-w-[14rem] flex-1 sm:w-64 sm:flex-none">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm vị trí ứng tuyển"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm công ty, vị trí…"
              className="h-9 w-full rounded-control border border-rule bg-paper pl-9 pr-8 text-sm text-ink placeholder:text-ink-3/80 focus-visible:border-pen focus-visible:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Xoá từ khoá tìm kiếm"
                className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:text-ink"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>
        </div>

        <div role="group" aria-label="Lọc nhanh" className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', `Tất cả (${apps.length})`],
              ['interview', 'Lịch phỏng vấn'],
              ['todos', 'Còn việc cần làm'],
            ] as const
          ).map(([key, label]) => {
            const active = filter === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(key)}
                className={`h-9 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors ${
                  active ? 'bg-pen-fill text-white' : 'border border-rule bg-paper text-ink-2 hover:border-ink/40 hover:text-ink'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {notice && (
        <p role="alert" className="rounded-control border border-seal/40 px-4 py-3 text-sm text-seal">
          {notice}
        </p>
      )}

      {apps.length > 0 && filteredApps.length === 0 && (
        <p role="status" className="rounded-control border border-dashed border-rule bg-paper px-5 py-4 text-center text-sm text-ink-3">
          Không có thẻ nào khớp bộ lọc hiện tại.
        </p>
      )}

      {/* Kanban or Table View */}
      {view === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={collision}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragging(null)}
          accessibility={{
            announcements: announcements((id) => apps.find((a) => a.id === id)),
            screenReaderInstructions: {
              draggable: 'Nhấn phím cách để nhấc thẻ, dùng phím mũi tên để chọn vị trí, nhấn phím cách lần nữa để thả. Nhấn Esc để huỷ.',
            },
          }}
        >
          <div className="grid grid-cols-1 items-start gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={applicationsIn(filteredApps, column.id)}
                cvs={cvs}
                letters={letters}
                onAdd={(col) => setEditing({ app: null, initialDraft: null, column: col })}
                onEdit={(app) => setEditing({ app, initialDraft: null, column: app.columnId })}
                onMove={move}
              />
            ))}
          </div>
          <DragOverlay>
            {dragging && (
              <div className="rounded-control border border-pen bg-paper p-3">
                <CardBody card={dragging} cvs={cvs} letters={letters} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="overflow-x-auto rounded-sheet border border-rule bg-paper">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-rule bg-desk text-xs font-bold uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3">Vị trí &amp; Công ty</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Lương / Địa điểm</th>
                <th className="px-4 py-3">Hồ sơ gắn kèm</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-3">
                    Chưa có vị trí ứng tuyển nào. Dán link JD ở trên hoặc bấm “+ Thêm vị trí” để bắt đầu.
                  </td>
                </tr>
              ) : (
                filteredApps.map((card) => {
                  const cv = cvs.find((c) => c.id === card.linkedCvId)
                  const letter = letters.find((l) => l.id === card.linkedLetterId)
                  const externalUrl = safeExternalUrl(card.url)
                  return (
                    <tr key={card.id} className="hover:bg-desk/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{card.role}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                          <span>{card.company}</span>
                          {externalUrl && (
                            <a
                              href={externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 font-semibold text-pen hover:underline"
                            >
                              <ArrowSquareOut size={12} aria-hidden="true" />
                              Link JD
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Trạng thái của ${card.company}`}
                          value={card.columnId}
                          onChange={(e) => changeColumn(card, e.target.value as KanbanColumnId)}
                          className="h-8 rounded-control border border-rule bg-desk px-2 text-xs font-semibold text-ink focus-visible:border-pen focus-visible:outline-none"
                        >
                          {KANBAN_COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-2">
                        <p>{card.salary || '—'}</p>
                        <p className="text-ink-3">{card.location || 'Chưa rõ địa điểm'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {cv ? (
                            <Link
                              href={`/cv/${cv.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-pen/30 bg-pen-wash px-2.5 py-0.5 font-semibold text-pen"
                            >
                              <FileText size={12} aria-hidden="true" />
                              CV
                            </Link>
                          ) : (
                            <span className="text-ink-3">Chưa gắn CV</span>
                          )}
                          {letter && (
                            <Link
                              href={`/thu-xin-viec/${letter.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-rule bg-desk px-2.5 py-0.5 font-semibold text-ink-2"
                            >
                              <EnvelopeSimple size={12} aria-hidden="true" />
                              Thư
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            href={`/luyen-phong-van?appId=${encodeURIComponent(card.id)}`}
                            className="inline-flex h-8 items-center gap-1 rounded-control border border-mint/30 bg-mint-wash/60 px-2.5 text-xs font-semibold text-mint hover:border-mint"
                          >
                            <Sparkle size={12} weight="fill" aria-hidden="true" />
                            Phỏng vấn AI
                          </Link>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditing({ app: card, initialDraft: null, column: card.columnId })}
                          >
                            Sửa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <WorkspaceBackupControls onRestored={reloadAll} />

      <ApplicationDialog
        open={editing !== null}
        application={editing?.app ?? null}
        initialDraft={editing?.initialDraft ?? null}
        defaultColumn={editing?.column ?? 'wishlist'}
        cvs={cvs}
        letters={letters}
        onClose={() => setEditing(null)}
        onSave={(app) => {
          const prev = apps.find((a) => a.id === app.id)
          const movedToOffer = app.columnId === 'offer' && prev?.columnId !== 'offer'
          commit(prev ? apps.map((a) => (a.id === app.id ? app : a)) : [app, ...apps], movedToOffer)
          setEditing(null)
        }}
        onDelete={(id) => {
          deleteApplication(id)
          setApps(getApplications())
          setEditing(null)
        }}
      />
    </div>
  )
}
