'use client'

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ClipboardText,
  ClockCounterClockwise,
  Command,
  FileDoc,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Printer,
  Question,
  ShareNetwork,
} from '@phosphor-icons/react/dist/ssr'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { auditCvQuality } from '@/lib/cv-auditor'
import { buildResumeDocx, triggerDocxDownload } from '@/lib/docx-export'
import { fileSafeName, printDocument } from '@/lib/print-document'
import { useEditorStore } from '@/store/editor-store'

const ICON_BUTTON =
  'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-35'

export function EditorToolbar({
  onOpenPalette,
  onOpenShortcuts,
  onOpenAudit,
  onOpenShare,
  onOpenVersions,
}: {
  onOpenPalette: () => void
  onOpenShortcuts: () => void
  onOpenAudit: () => void
  onOpenShare?: () => void
  onOpenVersions?: () => void
}) {
  const doc = useEditorStore((s) => s.doc)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.undoStack.length > 0)
  const canRedo = useEditorStore((s) => s.redoStack.length > 0)
  const zoom = useEditorStore((s) => s.zoomLevel)
  const setZoom = useEditorStore((s) => s.setZoomLevel)
  const pageCount = useEditorStore((s) => s.pageCount)
  const issueCount = doc ? auditCvQuality(doc.data, doc.settings.documentLanguage ?? 'vi', doc.settings.hiddenSections).length : 0

  const downloadDocx = () => {
    if (!doc) return
    const bytes = buildResumeDocx(doc)
    triggerDocxDownload(bytes, `CV-${fileSafeName(doc.data.name || doc.title)}.docx`)
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* Điểm AI đã hiện ở badge của tab "AI Review" bên dưới — không lặp lại ở đây. */}
      <button type="button" onClick={undo} disabled={!canUndo} aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)" className={ICON_BUTTON}>
        <ArrowCounterClockwise size={18} />
      </button>
      <button type="button" onClick={redo} disabled={!canRedo} aria-label="Làm lại" title="Làm lại (Ctrl+Shift+Z)" className={ICON_BUTTON}>
        <ArrowClockwise size={18} />
      </button>

      <div className="mx-0.5 hidden shrink-0 items-center 2xl:flex" role="group" aria-label="Thu phóng bản xem trước">
        <button type="button" onClick={() => setZoom(zoom - 10)} aria-label="Thu nhỏ" className={ICON_BUTTON}>
          <MagnifyingGlassMinus size={18} />
        </button>
        <span className="w-11 whitespace-nowrap text-center text-sm font-semibold tabular-nums text-ink-2" aria-live="polite">
          {zoom}%
        </span>
        <button type="button" onClick={() => setZoom(zoom + 10)} aria-label="Phóng to" className={ICON_BUTTON}>
          <MagnifyingGlassPlus size={18} />
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Mở lệnh nhanh"
        title="Lệnh nhanh: Chia sẻ, Word .docx, AI JD Tailor, Lịch sử (Ctrl+K)"
        className={ICON_BUTTON}
      >
        <Command size={18} />
      </button>
      <button
        type="button"
        onClick={onOpenShortcuts}
        aria-label="Xem phím tắt"
        title="Phím tắt (?)"
        className={`${ICON_BUTTON} hidden 2xl:flex`}
      >
        <Question size={18} />
      </button>
      {onOpenVersions && (
        <button
          type="button"
          onClick={onOpenVersions}
          aria-label="Lịch sử phiên bản"
          title="Lịch sử phiên bản CV"
          className={`${ICON_BUTTON} hidden lg:flex`}
        >
          <ClockCounterClockwise size={18} />
        </button>
      )}
      <button
        type="button"
        onClick={onOpenAudit}
        aria-label="Kiểm tra & Đối chiếu JD"
        title="Kiểm tra & Đối chiếu JD"
        className="hidden h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 text-sm font-semibold text-ink-2 hover:bg-ink/[0.06] hover:text-ink md:inline-flex"
      >
        <ClipboardText size={16} className="shrink-0" aria-hidden="true" />
        <span className="hidden xl:inline">Kiểm tra &amp; JD</span>
        {issueCount > 0 && (
          <span
            aria-hidden="true"
            className="rounded-full border border-rule bg-desk px-1.5 py-0.5 text-xs font-bold leading-none tabular-nums text-ink-2"
          >
            {issueCount}
          </span>
        )}
      </button>

      <span className="mx-1 hidden h-5 w-px shrink-0 bg-rule md:block" aria-hidden="true" />

      {onOpenShare && (
        <div className="flex shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenShare}
            className="shrink-0 gap-1.5 whitespace-nowrap px-2.5 xl:px-3.5"
            aria-label="Chia sẻ Link CV Online"
            title="Chia sẻ Link CV Online"
          >
            <ShareNetwork size={16} weight="bold" aria-hidden="true" />
            <span className="hidden xl:inline">Chia sẻ</span>
          </Button>
        </div>
      )}

      <div className="hidden shrink-0 lg:inline-flex">
        <Button
          variant="secondary"
          size="sm"
          onClick={downloadDocx}
          className="shrink-0 gap-1.5 whitespace-nowrap"
          aria-label="Xuất file Word (.docx)"
          title="Xuất file Word (.docx)"
        >
          <FileDoc size={16} weight="bold" aria-hidden="true" />
          <span className="hidden 2xl:inline">Word</span>
        </Button>
      </div>

      <div className="hidden shrink-0 md:inline-flex">
        <ThemeToggle className="size-9 shrink-0" />
      </div>

      <div className="hidden shrink-0 lg:inline-flex">
        <Button onClick={printDocument} size="sm" className="shrink-0 gap-1.5 whitespace-nowrap" aria-label={`Tải PDF, ${pageCount} trang`}>
          <Printer size={17} weight="bold" aria-hidden="true" />
          <span>Tải PDF</span>
          <span className="hidden 2xl:inline" aria-hidden="true">
            ({pageCount} trang)
          </span>
        </Button>
      </div>
    </div>
  )
}
