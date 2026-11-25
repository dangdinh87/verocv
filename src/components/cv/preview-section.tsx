'use client'

import { ArrowsInLineVertical, MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react/dist/ssr'
import { CvPreview } from '@/components/resume/multi-page-preview'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/editor-store'
import type { ResumeDocumentV2 } from '@/types/schema'

export function MultiPagePreviewSection({
  doc,
  className = '',
  onSelectSection,
}: {
  doc: ResumeDocumentV2
  className?: string
  onSelectSection?: (sectionKey: string) => void
}) {
  const pageCount = useEditorStore((s) => s.pageCount)
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const paperLabel = doc.settings.paperSize === 'letter' ? 'Letter' : 'A4'

  const fitOnePage = () => {
    updateDoc((d) => {
      d.settings.pageMargin = 'compact'
      d.settings.sectionSpacing = 'compact'
      d.settings.spacing = 'compact'
      d.settings.fontSize = 'compact'
    }, 'Thu gọn CV vừa 1 trang')
  }

  return (
    <section aria-label="Xem trước CV" className={`print-reset min-h-0 min-w-0 flex-col gap-2 p-2.5 pb-24 sm:p-5 lg:pb-5 ${className}`}>
      <div className="no-print flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
        <span className="hidden sm:inline">Bấm vào bất kỳ mục nào trên tờ CV để nhảy thẳng tới phần chỉnh sửa.</span>
        <span className="sm:hidden">Chạm mục trên CV để sửa nhanh</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-rule bg-paper px-2.5 py-0.5 font-semibold tabular-nums text-ink-2">
            {pageCount} trang {paperLabel}
          </span>
          <div className="inline-flex items-center rounded-control border border-rule bg-paper p-0.5" role="group" aria-label="Thu phóng bản xem trước">
            <button
              type="button"
              onClick={() => setZoomLevel(zoomLevel - 10)}
              aria-label="Thu nhỏ bản xem trước"
              className="flex size-6 cursor-pointer items-center justify-center rounded-[5px] text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
            >
              <MagnifyingGlassMinus size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              title="Đặt lại thu phóng 100%"
              aria-label={`Thu phóng ${zoomLevel}%, bấm để đặt lại 100%`}
              className={`cursor-pointer rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
                zoomLevel !== 100 ? 'bg-pen-wash text-pen' : 'text-ink-2 hover:bg-ink/[0.06]'
              }`}
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(zoomLevel + 10)}
              aria-label="Phóng to bản xem trước"
              className="flex size-6 cursor-pointer items-center justify-center rounded-[5px] text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
            >
              <MagnifyingGlassPlus size={13} aria-hidden="true" />
            </button>
          </div>
          {pageCount > 1 && (
            <Button variant="secondary" size="sm" onClick={fitOnePage} className="h-7 gap-1 px-2.5 text-xs">
              <ArrowsInLineVertical size={13} weight="bold" aria-hidden="true" />
              Thu gọn 1 trang
            </Button>
          )}
        </div>
      </div>
      <div className="print-reset min-h-0 min-w-0 flex-1">
        <CvPreview doc={doc} onSelectSection={onSelectSection} />
      </div>
    </section>
  )
}
