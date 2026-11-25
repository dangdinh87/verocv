'use client'

import { useEffect, useRef } from 'react'
import { PAPER_RATIO, ResumePaper } from '@/components/resume/resume-paper'
import { SheetViewport } from '@/components/resume/sheet-viewport'
import { useEditorStore } from '@/store/editor-store'
import type { ResumeDocumentV2 } from '@/types/schema'

// Live sheet. Clicking any section on the preview jumps directly to that section in the editor (FlowCV style).
export function CvPreview({ doc, onSelectSection }: { doc: ResumeDocumentV2; onSelectSection?: (sectionKey: string) => void }) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const activeSection = useEditorStore((s) => s.activeSection)
  const setPageCount = useEditorStore((s) => s.setPageCount)
  const ratio = PAPER_RATIO[doc.settings.paperSize === 'letter' ? 'letter' : 'a4']

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
  }, [ratio, setPageCount])

  return (
    <SheetViewport zoom={zoomLevel} sheetRef={sheetRef}>
      <ResumePaper
        flow
        layout={doc.layout}
        data={doc.data}
        settings={doc.settings}
        label="Bản xem trước CV"
        activeSection={activeSection}
        onSelectSection={onSelectSection}
      />
    </SheetViewport>
  )
}
