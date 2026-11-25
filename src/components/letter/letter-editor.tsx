'use client'

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  Eye,
  FileDoc,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  PencilSimple,
  Plus,
  Printer,
  Sparkle,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AI_CLOSED, AiSuggestionModal, type AiSuggestionState } from '@/components/cv/ai-suggestion-modal'
import { LETTER_ACCENTS, LetterPaper, letterPrintBackdrop, type LetterAccent } from '@/components/resume/letter-paper'
import { PAPER_RATIO } from '@/components/resume/resume-paper'
import { SheetViewport } from '@/components/resume/sheet-viewport'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { LETTER_TEMPLATES } from '@/data/letter-templates'
import { listCvs, type CvRecord } from '@/lib/cv-repository'
import { buildLetterDocx, triggerDocxDownload } from '@/lib/docx-export'
import { fileSafeName, printDocument, usePrintSetup } from '@/lib/print-document'
import { getLetterById, LETTER_KEY, saveLetterDocument, subscribeToStorageKey } from '@/lib/storage'
import type { LetterDocument } from '@/types/resume'

type Tab = 'content' | 'design'
type Status = 'saved' | 'saving' | 'error'

const TABS: TabItem<Tab>[] = [
  { id: 'content', label: 'Nội dung' },
  { id: 'design', label: 'Mẫu và màu' },
]

const ACCENT_LABEL: Record<LetterAccent, string> = { pen: 'Xanh mực', ink: 'Đen', kraft: 'Kraft' }

const ICON_BUTTON =
  'flex size-10 cursor-pointer items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-35'

const MERGE_MS = 800
const MAX_HISTORY = 60

function buildParagraphSuggestions(index: number, role: string, company: string): string[] {
  const r = role.trim() || '[Vị trí ứng tuyển]'
  const c = company.trim() || '[Tên công ty]'
  if (index === 0) {
    return [
      `Tôi viết thư này để ứng tuyển vị trí ${r} tại ${c}. Qua tìm hiểu định hướng sản phẩm và môi trường làm việc tại quý công ty, tôi nhận thấy kinh nghiệm thực tế của mình rất phù hợp với yêu cầu của vị trí.`,
      `Được biết ${c} đang tìm kiếm ${r}, tôi xin gửi hồ sơ ứng tuyển với mong muốn đóng góp [x] năm kinh nghiệm chuyên môn vào mục tiêu phát triển sắp tới của đội ngũ.`,
    ]
  }
  if (index === 1) {
    return [
      `Trong công việc gần nhất, tôi trực tiếp phụ trách [nêu dự án/nghiệp vụ chính], giúp cải thiện hiệu quả đạt [x]% sau [y] tháng. Tôi quen làm việc bám sát số liệu và phối hợp chặt chẽ giữa các bộ phận để đảm bảo tiến độ.`,
      `Điểm mạnh của tôi là khả năng chuẩn hoá quy trình và giải quyết vấn đề thực tế. Tôi từng xây dựng [công cụ/quy trình cụ thể], giúp đội ngũ tiết kiệm [x] giờ mỗi tuần và giảm đáng kể sai sót lặp lại.`,
    ]
  }
  return [
    `Tôi tin sự chủ động và nền tảng chuyên môn của mình sẽ đóng góp thiết thực cho ${c} ngay từ giai đoạn đầu. Rất mong có cơ hội trao đổi sâu hơn cùng Anh/Chị trong buổi phỏng vấn.`,
    `Cảm ơn Anh/Chị đã dành thời gian xem xét hồ sơ. Tôi rất mong nhận được lịch hẹn phỏng vấn để trình bày cụ thể hơn về những giải pháp có thể đóng góp cho vị trí ${r}.`,
  ]
}

export function LetterEditor({ id }: { id: string }) {
  const [doc, setDoc] = useState<LetterDocument | null | undefined>(undefined)
  const [undoStack, setUndoStack] = useState<{ snapshot: LetterDocument; ts: number; kind: string }[]>([])
  const [redoStack, setRedoStack] = useState<LetterDocument[]>([])
  const [cvs, setCvs] = useState<CvRecord[]>([])
  const [tab, setTab] = useState<Tab>('content')
  const [pane, setPane] = useState<'form' | 'preview'>('form')
  const [status, setStatus] = useState<Status>('saved')
  const [zoom, setZoom] = useState(100)
  const [pageCount, setPageCount] = useState(1)
  const [ai, setAi] = useState<AiSuggestionState>(AI_CLOSED)
  const [applyParagraph, setApplyParagraph] = useState<((text: string) => void) | null>(null)
  const [aiDraftOpen, setAiDraftOpen] = useState(false)
  const [aiTone, setAiTone] = useState<'formal' | 'modern' | 'concise'>('modern')
  const [aiLang, setAiLang] = useState<'vi' | 'en'>('vi')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiDraftError, setAiDraftError] = useState<string | null>(null)

  const saved = useRef<LetterDocument | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  usePrintSetup(
    `Thu-xin-viec-${fileSafeName(doc?.senderName ?? '')}`,
    doc?.paperSize ?? 'a4',
    doc ? letterPrintBackdrop(doc.layout, doc.accent, doc.customAccentColor) : undefined,
  )

  useEffect(() => {
    const found = getLetterById(id)
    saved.current = found
    setDoc(found)
    setUndoStack([])
    setRedoStack([])
    void listCvs().then(setCvs)
    return subscribeToStorageKey(LETTER_KEY, () => {
      if (saved.current && latest.current === saved.current) {
        const fresh = getLetterById(id)
        if (fresh) {
          saved.current = fresh
          setDoc(fresh)
        }
      }
    })
  }, [id])

  const persist = useCallback((target: LetterDocument) => {
    setStatus('saving')
    if (saveLetterDocument(target)) {
      saved.current = target
      setStatus('saved')
    } else setStatus('error')
  }, [])

  // Debounced autosave, plus an immediate save when the tab is hidden or the editor closes.
  const latest = useRef<LetterDocument | null>(null)
  latest.current = doc ?? null
  useEffect(() => {
    if (!doc || doc === saved.current) return
    setStatus('saving')
    const timer = setTimeout(() => persist(doc), 500)
    return () => clearTimeout(timer)
  }, [doc, persist])

  useEffect(() => {
    const flush = () => {
      const current = latest.current
      if (current && current !== saved.current) persist(current)
    }
    const onHide = () => document.visibilityState === 'hidden' && flush()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [persist])

  const ratio = PAPER_RATIO[doc?.paperSize === 'letter' ? 'letter' : 'a4']
  useEffect(() => {
    const sheet = sheetRef.current?.querySelector<HTMLElement>('.cv')
    if (!sheet) return
    const measure = () => {
      const pageHeight = sheet.offsetWidth * ratio
      if (pageHeight > 0) setPageCount(Math.max(1, Math.ceil(sheet.offsetHeight / pageHeight - 0.01)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [ratio, doc?.id])

  const undo = useCallback(() => {
    setUndoStack((prevUndo) => {
      const last = prevUndo[prevUndo.length - 1]
      const current = latest.current
      if (!last || !current) return prevUndo
      setRedoStack((prevRedo) => [current, ...prevRedo])
      setDoc({ ...last.snapshot, updatedAt: new Date().toISOString() })
      return prevUndo.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack((prevRedo) => {
      const [nextDoc, ...rest] = prevRedo
      const current = latest.current
      if (!nextDoc || !current) return prevRedo
      setUndoStack((prevUndo) => [...prevUndo, { snapshot: current, ts: Date.now(), kind: 'redo' }])
      setDoc({ ...nextDoc, updatedAt: new Date().toISOString() })
      return rest
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return
      if (e.key === 'Escape') {
        setAiDraftOpen(false)
        return
      }
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) {
        return
      }
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  if (doc === undefined) {
    return (
      <div className="wrap py-16" role="status">
        <p className="text-ink-3">Đang mở thư…</p>
      </div>
    )
  }

  if (doc === null) {
    return (
      <div className="wrap max-w-xl py-20">
        <h1 className="display text-[2rem]">Không tìm thấy thư này</h1>
        <p className="mt-3 text-ink-2">Thư có thể đã bị xoá, hoặc được tạo ở một trình duyệt khác.</p>
        <div className="mt-6 flex gap-3">
          <Button href="/thu-xin-viec">Về danh sách thư</Button>
          <Button href="/mau-thu-xin-viec" variant="secondary">
            Chọn mẫu thư
          </Button>
        </div>
      </div>
    )
  }

  const patch = (changes: Partial<LetterDocument>, kind = 'edit') => {
    const now = Date.now()
    setUndoStack((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.kind === kind && now - last.ts < MERGE_MS) {
        return [...prev.slice(0, -1), { ...last, ts: now }]
      }
      const next = [...prev, { snapshot: doc, ts: now, kind }]
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    })
    setRedoStack([])
    setDoc({ ...doc, ...changes, updatedAt: new Date().toISOString() })
  }

  const syncFromCv = (cvId: string) => {
    const cv = cvs.find((c) => c.id === cvId)
    if (!cv) return patch({ linkedCvId: undefined }, 'unlink-cv')
    patch(
      {
        linkedCvId: cvId,
        senderName: cv.data.name || doc.senderName,
        senderRole: cv.data.role || doc.senderRole,
        senderLocation: cv.data.location || doc.senderLocation,
        senderEmail: cv.data.email || doc.senderEmail,
        senderPhone: cv.data.phone || doc.senderPhone,
        paperSize: cv.settings.paperSize,
        fontFamily: cv.settings.fontFamily,
        customAccentColor: cv.settings.accentColor,
      },
      'sync-cv',
    )
  }

  const openParagraphSuggest = (pIdx: number) => {
    const options = buildParagraphSuggestions(pIdx, doc.senderRole, doc.recipientCompany)
    setApplyParagraph(() => (replacement: string) => {
      patch(
        {
          paragraphs: doc.paragraphs.map((p, idx) => (idx === pIdx ? replacement : p)),
        },
        `suggest-p-${pIdx}`,
      )
    })
    setAi({
      open: true,
      loading: false,
      title: `Gợi ý cho đoạn ${pIdx + 1}`,
      options,
      note: 'Thay các phần trong ngoặc vuông [ ] bằng dự án và con số thật của bạn.',
    })
  }

  const generateAiCoverLetter = async () => {
    setAiBusy(true)
    setAiDraftError(null)
    try {
      const linkedCv = cvs.find((c) => c.id === doc.linkedCvId) ?? cvs[0]
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: linkedCv?.data,
          company: doc.recipientCompany,
          role: doc.senderRole,
          jdText: doc.jdText ?? '',
          tone: aiTone,
          lang: aiLang,
        }),
      })
      const json = (await res.json()) as {
        data?: { subject: string; salutation: string; paragraphs: string[]; signOff: string }
        error?: string
      }
      if (!res.ok || !json.data) {
        setAiDraftError(json.error || 'Không tạo được thư xin việc bằng AI lúc này.')
        return
      }
      patch(
        {
          subject: json.data.subject,
          salutation: json.data.salutation,
          paragraphs: json.data.paragraphs,
          signOff: json.data.signOff,
        },
        'ai-cover-letter',
      )
      setAiDraftOpen(false)
    } catch {
      setAiDraftError('Lỗi kết nối tới máy chủ AI.')
    } finally {
      setAiBusy(false)
    }
  }

  const leftovers = [
    doc.senderName,
    doc.senderRole,
    doc.senderLocation,
    doc.senderEmail,
    doc.senderPhone,
    doc.recipientCompany,
    doc.subject,
    doc.salutation ?? '',
    ...doc.paragraphs,
  ].filter((t) => /\[[^\]]*\]/.test(t)).length

  return (
    <div className="print-reset flex h-dvh flex-col bg-desk">
      <header className="no-print border-b border-rule bg-paper">
        <h1 className="sr-only">Soạn thư xin việc: {doc.title}</h1>
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
            <Link
              href="/thu-xin-viec"
              aria-label="Về danh sách thư"
              title="Về danh sách thư"
              className="flex shrink-0 items-center gap-1.5 rounded-control px-2 py-2 text-sm font-semibold text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
            >
              <ArrowLeft size={17} weight="bold" aria-hidden="true" />
              <span className="hidden lg:inline">Danh sách</span>
            </Link>
            <label className="sr-only" htmlFor="letter-title">
              Tên thư
            </label>
            <input
              id="letter-title"
              value={doc.title}
              onChange={(e) => patch({ title: e.target.value }, 'title')}
              className="h-10 min-w-[8rem] max-w-[16rem] flex-1 truncate rounded-control border border-transparent bg-transparent px-2 text-base font-bold hover:border-rule focus-visible:border-pen sm:min-w-[11rem]"
            />
            <span role="status" className="flex shrink-0 items-center gap-1.5 text-sm text-ink-3">
              {status === 'saved' && (
                <>
                  <CheckCircle size={16} weight="fill" className="text-pen" aria-hidden="true" />
                  <span className="hidden sm:inline">Đã lưu</span>
                </>
              )}
              {status === 'saving' && (
                <>
                  <CircleNotch size={16} className="animate-spin" aria-hidden="true" />
                  <span className="hidden sm:inline">Đang lưu…</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <WarningCircle size={16} weight="fill" className="text-seal" aria-hidden="true" />
                  <span className="hidden text-seal sm:inline">Chưa lưu được</span>
                  <button
                    type="button"
                    onClick={() => persist(doc)}
                    className="cursor-pointer font-semibold text-pen underline underline-offset-2"
                  >
                    Thử lại
                  </button>
                </>
              )}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={undoStack.length === 0}
              aria-label="Hoàn tác"
              title="Hoàn tác (Ctrl+Z)"
              className={ICON_BUTTON}
            >
              <ArrowCounterClockwise size={18} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={redoStack.length === 0}
              aria-label="Làm lại"
              title="Làm lại (Ctrl+Shift+Z)"
              className={ICON_BUTTON}
            >
              <ArrowClockwise size={18} />
            </button>

            <div className="mx-1 hidden shrink-0 items-center xl:flex" role="group" aria-label="Thu phóng bản xem trước">
              <button type="button" onClick={() => setZoom((z) => Math.max(60, z - 10))} aria-label="Thu nhỏ" className={ICON_BUTTON}>
                <MagnifyingGlassMinus size={18} />
              </button>
              <span className="w-11 whitespace-nowrap text-center text-sm font-semibold tabular-nums text-ink-2" aria-live="polite">
                {zoom}%
              </span>
              <button type="button" onClick={() => setZoom((z) => Math.min(150, z + 10))} aria-label="Phóng to" className={ICON_BUTTON}>
                <MagnifyingGlassPlus size={18} />
              </button>
            </div>

            <div className="hidden shrink-0 lg:inline-flex">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => triggerDocxDownload(buildLetterDocx(doc), `Thu-xin-viec-${fileSafeName(doc.senderName)}.docx`)}
                className="shrink-0 gap-1.5 whitespace-nowrap"
                aria-label="Xuất file Word (.docx)"
                title="Xuất file Word (.docx)"
              >
                <FileDoc size={16} weight="bold" aria-hidden="true" />
                <span className="hidden xl:inline">Word</span>
              </Button>
            </div>

            <div className="hidden shrink-0 md:inline-flex">
              <ThemeToggle className="size-9 shrink-0" />
            </div>

            <div className="hidden shrink-0 lg:inline-flex">
              <Button onClick={printDocument} size="sm" className="ml-0.5 shrink-0 gap-1.5 whitespace-nowrap" aria-label={`Tải PDF, ${pageCount} trang`}>
                <Printer size={17} weight="bold" aria-hidden="true" />
                <span>Tải PDF</span>
                <span className="hidden xl:inline" aria-hidden="true">
                  ({pageCount} trang)
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="print-reset grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <section
          aria-label="Soạn thư"
          className={`no-print min-h-0 min-w-0 overflow-y-auto border-rule bg-paper px-4 pb-24 pt-1 sm:px-6 lg:border-r lg:pb-12 ${pane === 'preview' ? 'hidden lg:block' : ''}`}
        >
          <Tabs label="Các phần của thư" tabs={TABS} value={tab} onChange={setTab}>
            {tab === 'content' ? (
              <div className="space-y-6">
                {leftovers > 0 && (
                  <p role="status" className="rounded-control border border-rule bg-desk px-4 py-3 text-ink-2">
                    Còn {leftovers} chỗ trong ngoặc vuông [ ] chưa điền. Hãy thay bằng thông tin thật trước khi gửi.
                  </p>
                )}

                {cvs.length > 0 && (
                  <div className="space-y-2.5 rounded-sheet border border-pen/25 bg-pen-wash/40 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink">Đồng bộ thương hiệu từ CV</p>
                        <p className="text-xs text-ink-3">Khớp liên hệ, phông chữ, khổ giấy và màu nhấn từ CV của bạn.</p>
                      </div>
                      {doc.customAccentColor && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink-2">
                          <span className="size-2.5 rounded-full border border-rule" style={{ backgroundColor: doc.customAccentColor }} aria-hidden="true" />
                          Đã đồng bộ màu
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <SelectField
                        label="Chọn CV để đồng bộ"
                        className="flex-1"
                        value={doc.linkedCvId ?? ''}
                        onChange={(e) => syncFromCv(e.target.value)}
                      >
                        <option value="">Không liên kết CV</option>
                        {cvs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </SelectField>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => syncFromCv(doc.linkedCvId || cvs[0].id)}
                        className="h-11 shrink-0 gap-1.5"
                      >
                        <ArrowsClockwise size={15} weight="bold" aria-hidden="true" />
                        Đồng bộ ngay
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-sheet border border-rule bg-desk p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-ink">AI Soạn trọn bộ thư theo CV &amp; JD</p>
                      <p className="text-xs text-ink-3">Kết hợp dữ liệu CV đã chọn với mô tả công việc (hoàn tác được bằng Ctrl+Z).</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setAiDraftOpen((v) => !v)} className="gap-1.5">
                      <Sparkle size={15} weight="fill" className="text-pen" aria-hidden="true" />
                      {aiDraftOpen ? 'Ẩn khung AI' : 'Mở AI Soạn thư'}
                    </Button>
                  </div>
                  {aiDraftOpen && (
                    <div className="mt-4 space-y-3 border-t border-rule pt-3">
                      <TextAreaField
                        label="Mô tả công việc (JD)"
                        optional
                        rows={4}
                        value={doc.jdText ?? ''}
                        placeholder="Dán tin tuyển dụng để AI viết thư sát yêu cầu nhà tuyển dụng…"
                        onChange={(e) => patch({ jdText: e.target.value }, 'jdText')}
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ChoiceGroup
                          legend="Giọng văn"
                          value={aiTone}
                          onChange={setAiTone}
                          options={[
                            { value: 'modern', label: 'Hiện đại' },
                            { value: 'formal', label: 'Trang trọng' },
                            { value: 'concise', label: 'Súc tích' },
                          ]}
                        />
                        <ChoiceGroup
                          legend="Ngôn ngữ"
                          value={aiLang}
                          onChange={setAiLang}
                          options={[
                            { value: 'vi', label: 'Tiếng Việt' },
                            { value: 'en', label: 'English' },
                          ]}
                        />
                      </div>
                      {aiDraftError && <p role="alert" className="text-sm text-seal">{aiDraftError}</p>}
                      <Button onClick={() => void generateAiCoverLetter()} disabled={aiBusy} className="gap-1.5">
                        <Sparkle size={15} weight="fill" aria-hidden="true" />
                        {aiBusy ? 'Đang soạn thư…' : 'Viết thư ngay'}
                      </Button>
                    </div>
                  )}
                </div>

                <fieldset className="space-y-3 border-t border-rule pt-5">
                  <legend className="text-base font-bold">Người gửi</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Họ và tên"
                      autoComplete="name"
                      value={doc.senderName}
                      onChange={(e) => patch({ senderName: e.target.value }, 'senderName')}
                    />
                    <TextField
                      label="Chức danh"
                      value={doc.senderRole}
                      onChange={(e) => patch({ senderRole: e.target.value }, 'senderRole')}
                    />
                    <TextField
                      label="Địa chỉ"
                      autoComplete="address-level2"
                      value={doc.senderLocation}
                      onChange={(e) => patch({ senderLocation: e.target.value }, 'senderLocation')}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      autoComplete="email"
                      value={doc.senderEmail}
                      onChange={(e) => patch({ senderEmail: e.target.value }, 'senderEmail')}
                    />
                    <TextField
                      label="Số điện thoại"
                      type="tel"
                      autoComplete="tel"
                      value={doc.senderPhone}
                      onChange={(e) => patch({ senderPhone: e.target.value }, 'senderPhone')}
                    />
                  </div>
                </fieldset>

                <fieldset className="space-y-3 border-t border-rule pt-5">
                  <legend className="text-base font-bold">Người nhận</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Bộ phận nhận"
                      value={doc.recipientTitle}
                      onChange={(e) => patch({ recipientTitle: e.target.value }, 'recipientTitle')}
                    />
                    <TextField
                      label="Tên công ty"
                      value={doc.recipientCompany}
                      onChange={(e) => patch({ recipientCompany: e.target.value }, 'recipientCompany')}
                    />
                    <TextField
                      label="Địa điểm và ngày viết"
                      value={doc.dateStr}
                      onChange={(e) => patch({ dateStr: e.target.value }, 'dateStr')}
                    />
                    <TextField label="Tiêu đề thư" value={doc.subject} onChange={(e) => patch({ subject: e.target.value }, 'subject')} />
                  </div>
                </fieldset>

                <fieldset className="space-y-4 border-t border-rule pt-5">
                  <legend className="text-base font-bold">Nội dung thư</legend>
                  <TextField
                    label="Lời chào mở đầu"
                    value={doc.salutation === undefined ? 'Kính gửi quý công ty,' : doc.salutation}
                    placeholder="Kính gửi Anh/Chị Bộ phận Tuyển dụng,"
                    onChange={(e) => patch({ salutation: e.target.value }, 'salutation')}
                  />
                  {doc.paragraphs.map((paragraph, i) => (
                    <div key={i}>
                      <TextAreaField
                        label={`Đoạn ${i + 1}`}
                        rows={4}
                        value={paragraph}
                        onChange={(e) =>
                          patch({ paragraphs: doc.paragraphs.map((p, idx) => (idx === i ? e.target.value : p)) }, `para-${i}`)
                        }
                      />
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openParagraphSuggest(i)} className="gap-1.5 text-pen">
                          <Sparkle size={14} weight="fill" aria-hidden="true" />
                          Gợi ý cách viết
                        </Button>
                        {doc.paragraphs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => patch({ paragraphs: doc.paragraphs.filter((_, idx) => idx !== i) }, 'del-para')}
                            className="gap-1.5 text-seal"
                            aria-label={`Xoá đoạn ${i + 1}`}
                          >
                            <Trash size={14} aria-hidden="true" />
                            Xoá đoạn
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => patch({ paragraphs: [...doc.paragraphs, ''] }, 'add-para')}
                    className="gap-1.5"
                  >
                    <Plus size={14} weight="bold" aria-hidden="true" />
                    Thêm đoạn
                  </Button>
                  <TextField label="Lời kết" value={doc.signOff} onChange={(e) => patch({ signOff: e.target.value }, 'signOff')} />
                  <TextField
                    label="Chữ ký hiển thị"
                    optional
                    placeholder={doc.senderName || 'Họ tên của bạn'}
                    value={doc.signatureText ?? ''}
                    onChange={(e) => patch({ signatureText: e.target.value }, 'signatureText')}
                  />
                </fieldset>
              </div>
            ) : (
              <div className="space-y-7">
                <fieldset>
                  <legend className="text-base font-bold">Mẫu thư</legend>
                  <div role="radiogroup" aria-label="Mẫu thư" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {LETTER_TEMPLATES.map((t) => {
                      const active = doc.layout === t.layout && doc.accent === t.accent
                      return (
                        <button
                          key={t.slug}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => patch({ layout: t.layout, accent: t.accent }, 'tpl')}
                          className={`cursor-pointer rounded-control border p-2 text-left ${active ? 'border-pen outline-2 outline-pen' : 'border-rule hover:border-ink/40'}`}
                        >
                          <span className="pointer-events-none block overflow-hidden rounded-[3px] border border-rule">
                            <LetterPaper layout={t.layout} accent={t.accent} label={t.name} />
                          </span>
                          <span className="mt-2 block text-sm font-semibold">{t.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
                <div className="space-y-5 border-t border-rule pt-6">
                  <ChoiceGroup
                    legend="Màu nhấn"
                    value={doc.accent}
                    onChange={(accent) => patch({ accent, customAccentColor: undefined }, 'accent')}
                    options={(Object.keys(LETTER_ACCENTS) as LetterAccent[]).map((a) => ({ value: a, label: ACCENT_LABEL[a] }))}
                  />
                  <ChoiceGroup
                    legend="Phông chữ"
                    value={doc.fontFamily ?? 'sans'}
                    onChange={(fontFamily) => patch({ fontFamily }, 'fontFamily')}
                    options={[
                      { value: 'sans', label: 'Be Vietnam Pro' },
                      { value: 'jakarta', label: 'Jakarta Sans' },
                      { value: 'serif', label: 'Source Serif 4' },
                      { value: 'lora', label: 'Lora' },
                    ]}
                  />
                  <ChoiceGroup
                    legend="Khổ giấy"
                    value={doc.paperSize}
                    onChange={(paperSize) => patch({ paperSize }, 'paper')}
                    options={[
                      { value: 'a4', label: 'A4' },
                      { value: 'letter', label: 'Letter' },
                    ]}
                  />
                </div>
              </div>
            )}
          </Tabs>
        </section>

        <section
          aria-label="Xem trước thư"
          className={`print-reset min-h-0 min-w-0 flex-col gap-2 p-3 pb-24 sm:p-5 lg:pb-5 ${pane === 'form' ? 'hidden lg:flex' : 'flex'}`}
        >
          {pageCount > 1 && (
            <p className="no-print text-sm text-ink-3">
              Thư dài {pageCount} trang. Đường kẻ xanh đánh dấu ranh giới trang gần đúng khi xuất PDF.
            </p>
          )}
          <div className="print-reset min-h-0 min-w-0 flex-1">
            <SheetViewport zoom={zoom} sheetRef={sheetRef}>
              <LetterPaper
                flow
                layout={doc.layout}
                accent={doc.accent}
                customAccentColor={doc.customAccentColor}
                fontFamily={doc.fontFamily}
                paperSize={doc.paperSize}
                data={doc}
                label="Bản xem trước thư xin việc"
              />
            </SheetViewport>
          </div>
        </section>
      </div>

      <nav
        aria-label="Thanh tác vụ nhanh trên di động"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      >
        <div className="grid grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setPane('form')
              setTab('content')
            }}
            aria-current={pane === 'form' && !aiDraftOpen ? 'page' : undefined}
            className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              pane === 'form' && !aiDraftOpen ? 'text-pen' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <PencilSimple size={19} weight={pane === 'form' && !aiDraftOpen ? 'fill' : 'regular'} aria-hidden="true" />
            <span>Soạn thư</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPane('form')
              setTab('content')
              setAiDraftOpen(true)
            }}
            aria-current={pane === 'form' && aiDraftOpen ? 'page' : undefined}
            className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
              pane === 'form' && aiDraftOpen ? 'text-pen' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Sparkle size={19} weight={pane === 'form' && aiDraftOpen ? 'fill' : 'regular'} aria-hidden="true" />
            <span>AI Soạn thư</span>
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

      <AiSuggestionModal
        state={ai}
        onClose={() => setAi(AI_CLOSED)}
        onApply={(text) => {
          applyParagraph?.(text)
          setAi(AI_CLOSED)
        }}
      />
    </div>
  )
}
