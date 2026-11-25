'use client'

import {
  ArrowLeft,
  Briefcase,
  CaretDown,
  CaretRight,
  CheckCircle,
  CircleNotch,
  Eye,
  EyeSlash,
  FileText,
  FolderStar,
  GraduationCap,
  Lightning,
  PencilSimple,
  Plus,
  Printer,
  Sliders,
  Sparkle,
  Translate,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { defaultSectionTitle, printBackdrop } from '@/components/resume/resume-paper'
import { MultiPagePreviewSection } from '@/components/cv/preview-section'
import { Button } from '@/components/ui/button'
import { arrayMove, SortableList } from '@/components/ui/sortable-list'
import { getCv, newId, saveCv, subscribeToCvChanges } from '@/lib/cv-repository'
import { evaluateCvReview } from '@/lib/cv-reviewer'
import { fileSafeName, printDocument, usePrintSetup } from '@/lib/print-document'
import { fetchAiRewrite, type RewriteMode } from '@/lib/ai-suggestions'
import { useEditorStore } from '@/store/editor-store'
import { isCustomSectionKey, migrateToV2, normalizeSectionOrder } from '@/types/schema'
import { AddContentModal, type ContentBlockPreset } from './add-content-modal'
import { AiReviewPanel } from './ai-review-panel'
import { AI_CLOSED, AiSuggestionModal, type AiSuggestionState } from './ai-suggestion-modal'
import { CommandPaletteModal } from './command-palette-modal'
import { CustomSectionForm } from './forms/custom-section-form'
import { DesignSettingsForm } from './forms/design-settings-form'
import { EducationSectionForm } from './forms/education-section-form'
import { JobsSectionForm } from './forms/jobs-section-form'
import { PersonalSectionForm } from './forms/personal-section-form'
import { ExtraSectionFields, LanguagesSectionFields, SkillsSectionFields } from './forms/skills-languages-form'
import { SummarySectionForm } from './forms/summary-section-form'
import { EditorToolbar } from './editor-toolbar'
import { QualityAuditModal, type AuditTab } from './quality-audit-modal'
import { ShareCvModal } from './share-cv-modal'
import { ShortcutsModal } from './shortcuts-modal'
import { VersionHistoryModal } from './version-history-modal'
import { useCvAutosave } from './use-cv-autosave'

type PrimaryPaneTab = 'content' | 'review' | 'design'

const PRIMARY_TAB_KEYS: PrimaryPaneTab[] = ['content', 'review', 'design']

function scoreBadgeTone(score: number): string {
  if (score >= 85) return 'bg-mint-wash text-mint'
  if (score >= 65) return 'bg-pen-wash text-pen'
  return 'bg-seal/10 text-seal'
}

const SECTION_ICON: Record<string, ComponentType<{ size?: number; weight?: 'regular' | 'bold' | 'fill'; className?: string }>> = {
  personal: UserCircle,
  summary: FileText,
  jobs: Briefcase,
  education: GraduationCap,
  skills: Lightning,
  languages: Translate,
  extra: FolderStar,
}

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

function SaveStatus({ onRetry }: { onRetry: () => void }) {
  const status = useEditorStore((s) => s.saveStatus)
  return (
    <span role="status" className="flex shrink-0 items-center gap-1.5 text-sm text-ink-3">
      {status === 'saved' && (
        <>
          <CheckCircle size={16} weight="fill" className="text-pen" aria-hidden="true" />
          <span className="hidden sm:inline">Đã lưu</span>
          <span className="sr-only sm:hidden">Đã lưu</span>
        </>
      )}
      {(status === 'saving' || status === 'dirty') && (
        <>
          <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
          <span className="hidden sm:inline">Đang lưu…</span>
          <span className="sr-only sm:hidden">Đang lưu</span>
        </>
      )}
      {status === 'error' && (
        <>
          <WarningCircle size={16} weight="fill" className="text-seal" aria-hidden="true" />
          <span className="text-seal">Chưa lưu được</span>
          <button type="button" onClick={onRetry} className="cursor-pointer font-semibold text-pen underline underline-offset-2">
            Thử lại
          </button>
        </>
      )}
    </span>
  )
}

function SectionAccordionCard({
  sectionId,
  title,
  badge,
  expanded,
  hiddenOnCv,
  handle,
  Icon,
  onToggle,
  onToggleHide,
  children,
}: {
  sectionId: string
  title: string
  badge?: string
  expanded: boolean
  hiddenOnCv?: boolean
  handle?: ReactNode
  Icon: ComponentType<{ size?: number; weight?: 'regular' | 'bold' | 'fill'; className?: string }>
  onToggle: () => void
  onToggleHide?: () => void
  children: ReactNode
}) {
  return (
    <div
      id={`editor-sec-${sectionId}`}
      className={`rounded-sheet border bg-paper transition-colors ${
        expanded ? 'border-ink/35' : 'border-rule hover:border-ink/25'
      } ${hiddenOnCv ? 'opacity-65' : ''}`}
    >
      <div className="flex items-center gap-1 p-2.5 sm:px-3.5">
        {handle}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-control px-1.5 py-1.5 text-left hover:bg-ink/[0.035]"
        >
          <Icon size={19} weight={expanded ? 'fill' : 'regular'} className="shrink-0 text-pen" />
          <span className="min-w-0 flex-1 truncate text-[0.98rem] font-bold text-ink">{title}</span>
          {hiddenOnCv ? (
            <span className="shrink-0 rounded-full border border-rule bg-desk px-2.5 py-0.5 text-xs font-medium text-ink-3">Đang ẩn</span>
          ) : (
            badge && <span className="shrink-0 text-xs font-medium text-ink-3">{badge}</span>
          )}
          {expanded ? (
            <CaretDown size={16} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
          ) : (
            <CaretRight size={16} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
          )}
        </button>
        {onToggleHide && (
          <button
            type="button"
            onClick={onToggleHide}
            aria-label={hiddenOnCv ? `Hiện mục ${title} trên CV` : `Ẩn mục ${title} khỏi CV`}
            title={hiddenOnCv ? 'Hiện lại mục này trên CV' : 'Ẩn tạm mục này trên CV (dữ liệu vẫn giữ nguyên)'}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
          >
            {hiddenOnCv ? <EyeSlash size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {expanded && <div className="border-t border-rule px-3.5 pb-4 pt-4 sm:px-4">{children}</div>}
    </div>
  )
}

export function CvEditor({ id }: { id: string }) {
  const router = useRouter()
  const { user, openAuthModal } = useAuth()
  const doc = useEditorStore((s) => s.doc)
  const loadState = useEditorStore((s) => s.loadState)
  const activeTab = useEditorStore((s) => s.activeTab)
  const activeSection = useEditorStore((s) => s.activeSection)
  const setActiveTab = useEditorStore((s) => s.setActiveTab)
  const setActiveSection = useEditorStore((s) => s.setActiveSection)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const { flush, markPersisted } = useCvAutosave()

  const [pane, setPane] = useState<'form' | 'preview'>('form')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditTab, setAuditTab] = useState<AuditTab>('audit')
  const [addContentOpen, setAddContentOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [ai, setAi] = useState<AiSuggestionState>(AI_CLOSED)
  const [applyAi, setApplyAi] = useState<((text: string) => void) | null>(null)
  const modeFetcherRef = useRef<((mode: RewriteMode) => Promise<{ options: string[]; note?: string }>) | null>(null)
  const [changedElsewhere, setChangedElsewhere] = useState(false)
  const tabBaseId = useId()
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const reviewScore = useMemo(
    () => (doc ? evaluateCvReview(doc.data, doc.settings.documentLanguage ?? 'vi', doc.settings.hiddenSections).overallScore : 0),
    [doc],
  )

  const primaryTab: PrimaryPaneTab = activeTab === 'design' ? 'design' : activeTab === 'audit' ? 'review' : 'content'
  const setPrimaryTab = useCallback(
    (next: PrimaryPaneTab) => {
      setActiveTab(next === 'review' ? 'audit' : next)
    },
    [setActiveTab],
  )

  const onTabKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const index = PRIMARY_TAB_KEYS.indexOf(primaryTab)
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % PRIMARY_TAB_KEYS.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + PRIMARY_TAB_KEYS.length) % PRIMARY_TAB_KEYS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = PRIMARY_TAB_KEYS.length - 1
    else return
    e.preventDefault()
    const targetTab = PRIMARY_TAB_KEYS[next]
    setPrimaryTab(targetTab)
    tabRefs.current[targetTab]?.focus()
  }

  usePrintSetup(
    `CV-${fileSafeName(doc?.data.name ?? '')}`,
    doc?.settings.paperSize ?? 'a4',
    doc ? printBackdrop(doc.layout, doc.settings) : undefined,
  )

  const openAudit = (tab: AuditTab = 'audit') => {
    setAuditTab(tab)
    setAuditOpen(true)
  }

  const jumpToSection = useCallback(
    (sectionKey: string) => {
      setActiveTab('content')
      setActiveSection(sectionKey)
      setPane('form')
      requestAnimationFrame(() => {
        document.getElementById(`editor-sec-${sectionKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    },
    [setActiveSection, setActiveTab],
  )

  // Load (and reload when another tab saves this CV).
  const load = useCallback(async () => {
    const found = await getCv(id)
    markPersisted(found)
    useEditorStore.getState().loadDoc(found)
    setChangedElsewhere(false)
  }, [id, markPersisted])

  useEffect(() => {
    useEditorStore.getState().reset()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    const unsubscribe = subscribeToCvChanges((changedId) => {
      if (changedId !== id) return
      if (useEditorStore.getState().saveStatus === 'saved') void load()
      else setChangedElsewhere(true)
    })
    return unsubscribe
  }, [id, load])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (document.querySelector('dialog[open]')) return
      const { undo, redo } = useEditorStore.getState()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        redo()
      } else if (e.key === '?' && !isTyping(e.target)) {
        e.preventDefault()
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (loadState === 'loading') {
    return (
      <div className="wrap py-16" role="status">
        <p className="text-ink-3">Đang mở CV…</p>
      </div>
    )
  }

  if (loadState === 'missing' || !doc) {
    return (
      <div className="wrap max-w-xl py-20">
        <h1 className="display text-[2rem]">Không tìm thấy CV này</h1>
        <p className="mt-3 text-ink-2">
          CV có thể đã bị xoá, hoặc được tạo ở một trình duyệt khác. Dữ liệu CV chỉ lưu trên trình duyệt đã tạo ra nó.
        </p>
        <div className="mt-6 flex gap-3">
          <Button href="/cv">Về danh sách CV</Button>
          <Button href="/mau-cv" variant="secondary">
            Tạo CV mới
          </Button>
        </div>
      </div>
    )
  }

  const lang = doc.settings.documentLanguage ?? 'vi'
  const customMap = new Map(doc.data.customSections.map((cs) => [cs.id, cs]))
  const order = normalizeSectionOrder(
    doc.settings.sectionOrder,
    doc.data.customSections.map((cs) => cs.id),
  )
  const hiddenSet = new Set(doc.settings.hiddenSections)

  const toggleHideSection = (key: string, label: string) =>
    updateDoc(
      (d) => {
        if (d.settings.hiddenSections.includes(key)) {
          d.settings.hiddenSections = d.settings.hiddenSections.filter((x) => x !== key)
        } else {
          d.settings.hiddenSections.push(key)
        }
      },
      hiddenSet.has(key) ? `Hiện mục ${label}` : `Ẩn mục ${label}`,
    )

  const addContentPreset = (preset: ContentBlockPreset) => {
    const newSecId = newId('custom')
    const entryId = newId('cse')
    const withBullet = preset.kind === 'projects' || preset.kind === 'activities' || preset.kind === 'custom'
    const title = lang === 'en' ? preset.titleEn : preset.titleVi
    updateDoc((d) => {
      d.data.customSections.push({
        id: newSecId,
        kind: preset.kind,
        title,
        hidden: false,
        entries: [
          {
            id: entryId,
            title: '',
            subtitle: '',
            period: '',
            link: '',
            bullets: withBullet ? [''] : [],
            hidden: false,
          },
        ],
      })
      d.settings.sectionOrder = [
        ...normalizeSectionOrder(
          d.settings.sectionOrder,
          d.data.customSections.map((c) => c.id),
        ),
      ]
    }, `Thêm mục ${title}`)
    jumpToSection(newSecId)
  }

  const openRewriteAi = (
    title: string,
    fetchByMode: (mode: RewriteMode) => Promise<{ options: string[]; note?: string }>,
    apply: (text: string) => void,
  ) => {
    modeFetcherRef.current = fetchByMode
    setApplyAi(() => apply)
    const initialMode: RewriteMode = 'impact'
    setAi({ open: true, loading: true, title, options: [], mode: initialMode })
    void fetchByMode(initialMode).then((res) =>
      setAi({ open: true, loading: false, title, options: res.options, note: res.note, mode: initialMode }),
    )
  }

  const onAiModeChange = (nextMode: RewriteMode) => {
    const fetcher = modeFetcherRef.current
    if (!fetcher) return
    setAi((prev) => ({ ...prev, loading: true, mode: nextMode }))
    void fetcher(nextMode).then((res) =>
      setAi((prev) => ({ ...prev, loading: false, mode: nextMode, options: res.options, note: res.note })),
    )
  }

  const suggestSummaryText = () =>
    openRewriteAi(
      'Gợi ý giới thiệu bản thân',
      (mode) => fetchAiRewrite({ kind: 'summary', text: doc.data.summary, role: doc.data.role, mode, lang }),
      (text) =>
        updateDoc((d) => {
          d.data.summary = text
        }, 'Dùng gợi ý giới thiệu'),
    )

  const suggestBullet = (jobId: string, bulletIndex: number, text: string) => {
    const job = doc.data.jobs.find((j) => j.id === jobId)
    openRewriteAi(
      'Gợi ý viết lại',
      (mode) => fetchAiRewrite({ kind: 'bullet', text, role: job?.title || doc.data.role, mode, lang }),
      (replacement) =>
        updateDoc((d) => {
          const target = d.data.jobs.find((j) => j.id === jobId)
          if (target) target.bullets[bulletIndex] = replacement
        }, 'Dùng gợi ý viết lại'),
    )
  }

  const suggestCustomBullet = (sectionId: string, entryId: string, bulletIndex: number, text: string) => {
    openRewriteAi(
      'Gợi ý viết lại',
      (mode) => fetchAiRewrite({ kind: 'bullet', text, role: doc.data.role, mode, lang }),
      (replacement) =>
        updateDoc((d) => {
          const cs = d.data.customSections.find((c) => c.id === sectionId)
          const entry = cs?.entries.find((e) => e.id === entryId)
          if (entry) entry.bullets[bulletIndex] = replacement
        }, 'Dùng gợi ý viết lại'),
    )
  }

  const suggestSkills = () => {
    modeFetcherRef.current = null
    setApplyAi(() => (skill: string) => {
      updateDoc((d) => {
        if (!d.data.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
          d.data.skills.push(skill)
        }
      }, 'Thêm kỹ năng gợi ý')
    })
    setAi({ open: true, loading: true, title: 'Gợi ý kỹ năng theo vị trí', options: [], multiSelect: true })
    void fetchAiRewrite({ kind: 'skills', text: '', role: doc.data.role, lang }).then((res) =>
      setAi({
        open: true,
        loading: false,
        title: 'Gợi ý kỹ năng theo vị trí',
        options: res.options,
        note: res.note || 'Chỉ chọn những kỹ năng bạn thật sự có. Có thể bấm thêm nhiều kỹ năng liên tiếp.',
        multiSelect: true,
      }),
    )
  }

  const translateCv = async (targetLang: 'vi' | 'en') => {
    const res = await fetch('/api/ai/translate-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeData: doc.data, targetLang }),
    })
    const json = (await res.json()) as { data?: unknown }
    if (!res.ok || !json.data) throw new Error('TRANSLATE_FAILED')
    const now = new Date().toISOString()
    const translated = migrateToV2({
      ...JSON.parse(JSON.stringify(doc)),
      id: newId('cv'),
      title: `${doc.title} (${targetLang.toUpperCase()})`,
      parentCvId: doc.id,
      isMaster: false,
      settings: { ...doc.settings, documentLanguage: targetLang },
      data: json.data,
      createdAt: now,
      updatedAt: now,
    })
    await saveCv(translated)
    router.push(`/cv/${translated.id}`)
  }

  const sectionMeta = (key: string): { title: string; badge?: string; body: ReactNode } | null => {
    if (isCustomSectionKey(key)) {
      const cs = customMap.get(key)
      if (!cs) return null
      return {
        title: cs.title,
        badge: `${cs.entries.length} mục`,
        body: <CustomSectionForm section={cs} onSuggestBullet={suggestCustomBullet} />,
      }
    }
    const customTitle = doc.settings.sectionTitles?.[key]?.trim()
    const fallbackTitle = defaultSectionTitle(key, doc.layout, lang, doc.data.extra.title)
    const displayTitle = customTitle || fallbackTitle

    switch (key) {
      case 'summary':
        return {
          title: displayTitle,
          badge: doc.data.summary.trim() ? 'Đã điền' : 'Trống',
          body: <SummarySectionForm onSuggest={suggestSummaryText} />,
        }
      case 'jobs':
        return {
          title: displayTitle,
          badge: `${doc.data.jobs.length} việc`,
          body: <JobsSectionForm onSuggest={suggestBullet} />,
        }
      case 'education':
        return {
          title: displayTitle,
          badge: `${doc.data.education.length} mục`,
          body: <EducationSectionForm />,
        }
      case 'skills':
        return {
          title: displayTitle,
          badge: `${doc.data.skills.length} kỹ năng`,
          body: <SkillsSectionFields onSuggest={suggestSkills} />,
        }
      case 'languages':
        return {
          title: displayTitle,
          badge: `${doc.data.languages.length} ngôn ngữ`,
          body: <LanguagesSectionFields />,
        }
      case 'extra':
        return {
          title: displayTitle,
          badge: `${doc.data.extra.items.length} dòng`,
          body: <ExtraSectionFields />,
        }
      default:
        return null
    }
  }

  return (
    <div className="print-reset flex h-dvh flex-col bg-desk">
      <header className="no-print border-b border-rule bg-paper">
        <h1 className="sr-only">Soạn CV: {doc.title}</h1>
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
            <Link
              href="/cv"
              aria-label="Về danh sách CV"
              title="Về danh sách CV"
              className="flex shrink-0 items-center gap-1.5 rounded-control px-2 py-2 text-sm font-semibold text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
            >
              <ArrowLeft size={17} weight="bold" aria-hidden="true" />
              <span className="hidden lg:inline">Danh sách</span>
            </Link>
            <label className="sr-only" htmlFor="cv-title">
              Tên CV
            </label>
            <input
              id="cv-title"
              value={doc.title}
              onChange={(e) =>
                updateDoc((d) => {
                  d.title = e.target.value
                }, 'Đổi tên CV')
              }
              className="h-10 min-w-[8rem] max-w-[16rem] flex-1 truncate rounded-control border border-transparent bg-transparent px-2 text-base font-bold hover:border-rule focus-visible:border-pen sm:min-w-[11rem]"
            />
            <SaveStatus onRetry={flush} />
          </div>
          <EditorToolbar
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onOpenAudit={() => openAudit('audit')}
            onOpenReview={() => {
              setPrimaryTab('review')
              setPane('form')
            }}
            onOpenShare={() => setShareOpen(true)}
            onOpenVersions={() => setVersionsOpen(true)}
          />
        </div>
      </header>

      {changedElsewhere && (
        <div
          role="status"
          className="no-print flex flex-wrap items-center gap-3 border-b border-rule bg-pen-wash px-5 py-2.5 text-[0.95rem]"
        >
          CV này vừa được lưu ở một tab khác.
          <button type="button" onClick={() => void load()} className="cursor-pointer font-semibold text-pen underline underline-offset-2">
            Tải bản mới (bỏ thay đổi chưa lưu ở đây)
          </button>
        </div>
      )}

      <div className="print-reset grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,37rem)_minmax(0,1fr)]">
        <section
          aria-label="Soạn nội dung và tuỳ chỉnh CV"
          className={`no-print min-h-0 min-w-0 overflow-y-auto border-rule bg-desk/50 px-3 pb-24 pt-1 sm:px-5 lg:border-r lg:pb-10 ${pane === 'preview' ? 'hidden lg:block' : ''}`}
        >
          <div>
            <div
              role="tablist"
              aria-label="Chế độ biên tập"
              onKeyDown={onTabKeyDown}
              className="-mb-px flex gap-1 overflow-x-auto border-b border-rule"
            >
              <button
                ref={(el) => {
                  tabRefs.current.content = el
                }}
                role="tab"
                type="button"
                id={`${tabBaseId}-tab-content`}
                aria-selected={primaryTab === 'content'}
                aria-controls={`${tabBaseId}-panel`}
                tabIndex={primaryTab === 'content' ? 0 : -1}
                onClick={() => setPrimaryTab('content')}
                className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[0.875rem] font-semibold transition-colors ${
                  primaryTab === 'content' ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <span>Nội dung</span>
              </button>
              <button
                ref={(el) => {
                  tabRefs.current.review = el
                }}
                role="tab"
                type="button"
                id={`${tabBaseId}-tab-review`}
                aria-selected={primaryTab === 'review'}
                aria-controls={`${tabBaseId}-panel`}
                tabIndex={primaryTab === 'review' ? 0 : -1}
                onClick={() => setPrimaryTab('review')}
                className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[0.875rem] font-semibold transition-colors ${
                  primaryTab === 'review' ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <Sparkle size={14} weight="fill" className="text-pen" aria-hidden="true" />
                <span>AI Review</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${scoreBadgeTone(reviewScore)}`}>
                  {reviewScore}/100
                </span>
              </button>
              <button
                ref={(el) => {
                  tabRefs.current.design = el
                }}
                role="tab"
                type="button"
                id={`${tabBaseId}-tab-design`}
                aria-selected={primaryTab === 'design'}
                aria-controls={`${tabBaseId}-panel`}
                tabIndex={primaryTab === 'design' ? 0 : -1}
                onClick={() => setPrimaryTab('design')}
                className={`-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[0.875rem] font-semibold transition-colors ${
                  primaryTab === 'design' ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                <span>Thiết kế</span>
              </button>
            </div>

            <div role="tabpanel" id={`${tabBaseId}-panel`} aria-labelledby={`${tabBaseId}-tab-${primaryTab}`} className="pt-5">
              {primaryTab === 'content' && (
                <div className="space-y-3">
                  <SectionAccordionCard
                    sectionId="personal"
                    title="Thông tin cá nhân"
                    badge={doc.data.name.trim() || 'Chưa điền tên'}
                    expanded={activeSection === 'personal'}
                    Icon={UserCircle}
                    onToggle={() => setActiveSection(activeSection === 'personal' ? '' : 'personal')}
                  >
                    <PersonalSectionForm />
                  </SectionAccordionCard>

                  <SortableList
                    items={order.map((k) => ({ id: k }))}
                    kind="mục CV"
                    onReorder={(from, to) =>
                      updateDoc((d) => {
                        d.settings.sectionOrder = arrayMove(order, from, to)
                      }, 'Đổi thứ tự mục CV')
                    }
                    renderItem={(item, _idx, handle) => {
                      const meta = sectionMeta(item.id)
                      if (!meta) return null
                      const Icon = SECTION_ICON[item.id] ?? FolderStar
                      const isOpen = activeSection === item.id
                      return (
                        <SectionAccordionCard
                          sectionId={item.id}
                          title={meta.title}
                          badge={meta.badge}
                          expanded={isOpen}
                          hiddenOnCv={hiddenSet.has(item.id)}
                          handle={handle}
                          Icon={Icon}
                          onToggle={() => setActiveSection(isOpen ? '' : item.id)}
                          onToggleHide={() => toggleHideSection(item.id, meta.title)}
                        >
                          {meta.body}
                        </SectionAccordionCard>
                      )
                    }}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button onClick={() => setAddContentOpen(true)} className="gap-2">
                      <Plus size={17} weight="bold" aria-hidden="true" />
                      Thêm mục nội dung
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setPrimaryTab('design')} className="gap-1.5">
                      <Sliders size={16} weight="bold" aria-hidden="true" />
                      Tuỳ chỉnh thiết kế &amp; Bố cục
                    </Button>
                  </div>
                </div>
              )}

              {primaryTab === 'review' && <AiReviewPanel onJumpToSection={jumpToSection} />}

              {primaryTab === 'design' && (
                <div className="rounded-sheet border border-rule bg-paper p-4 sm:p-5">
                  <DesignSettingsForm onTranslateCv={translateCv} />
                </div>
              )}
            </div>
          </div>
        </section>

        <MultiPagePreviewSection doc={doc} className={pane === 'form' ? 'hidden lg:flex' : 'flex'} onSelectSection={jumpToSection} />
      </div>

      <nav
        aria-label="Thanh tác vụ nhanh trên di động"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      >
        <div className="grid grid-cols-4">
          <button
            type="button"
            onClick={() => {
              if (primaryTab === 'review') setPrimaryTab('content')
              setPane('form')
            }}
            aria-current={pane === 'form' && primaryTab !== 'review' ? 'page' : undefined}
            className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              pane === 'form' && primaryTab !== 'review' ? 'text-pen' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <PencilSimple size={19} weight={pane === 'form' && primaryTab !== 'review' ? 'fill' : 'regular'} aria-hidden="true" />
            <span>Soạn</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPrimaryTab('review')
              setPane('form')
            }}
            aria-current={pane === 'form' && primaryTab === 'review' ? 'page' : undefined}
            className={`relative flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              pane === 'form' && primaryTab === 'review' ? 'text-pen' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <span className="relative inline-flex items-center">
              <Sparkle size={19} weight={pane === 'form' && primaryTab === 'review' ? 'fill' : 'regular'} aria-hidden="true" />
              <span className={`ml-1 rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${scoreBadgeTone(reviewScore)}`}>
                {reviewScore}
              </span>
            </span>
            <span>AI Review</span>
          </button>
          <button
            type="button"
            onClick={() => setPane('preview')}
            aria-current={pane === 'preview' ? 'page' : undefined}
            className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              pane === 'preview' ? 'text-pen' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Eye size={19} weight={pane === 'preview' ? 'fill' : 'regular'} aria-hidden="true" />
            <span>Xem A4</span>
          </button>
          <button
            type="button"
            onClick={printDocument}
            className="flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-ink-2 transition-colors hover:text-pen"
          >
            <Printer size={19} weight="bold" aria-hidden="true" />
            <span>Tải PDF</span>
          </button>
        </div>
      </nav>

      <AddContentModal open={addContentOpen} lang={lang} onClose={() => setAddContentOpen(false)} onSelectPreset={addContentPreset} />
      <CommandPaletteModal
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenAudit={openAudit}
        onOpenAddContent={() => setAddContentOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        onOpenVersions={() => setVersionsOpen(true)}
      />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <QualityAuditModal open={auditOpen} initialTab={auditTab} onClose={() => setAuditOpen(false)} onJumpToSection={jumpToSection} />
      <ShareCvModal open={shareOpen} onClose={() => setShareOpen(false)} isAuthenticated={Boolean(user)} onRequireAuth={openAuthModal} />
      <VersionHistoryModal open={versionsOpen} onClose={() => setVersionsOpen(false)} isAuthenticated={Boolean(user)} />
      <AiSuggestionModal
        state={ai.multiSelect ? { ...ai, appliedValues: doc.data.skills } : ai}
        onClose={() => setAi(AI_CLOSED)}
        onModeChange={onAiModeChange}
        onApply={(text) => {
          applyAi?.(text)
          if (!ai.multiSelect) setAi(AI_CLOSED)
        }}
      />
    </div>
  )
}
