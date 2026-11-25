import type { ReactNode } from 'react'

// Scroll area around a live sheet. `zoom` is a percentage of the available width; the sheet's em-based text scales with it.
// Marked .print-reset so printing drops the frame and lets the sheet flow across pages.
export function SheetViewport({
  zoom = 100,
  children,
  sheetRef,
}: {
  zoom?: number
  children: ReactNode
  sheetRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div className="print-reset h-full w-full min-w-0 overflow-auto rounded-sheet border border-rule bg-ink/[0.06] p-2.5 sm:p-5">
      <div ref={sheetRef} className="print-reset mx-auto" style={{ width: `${zoom}%` }}>
        <div className="print-reset overflow-hidden rounded-[4px] border border-rule bg-white">{children}</div>
      </div>
    </div>
  )
}
