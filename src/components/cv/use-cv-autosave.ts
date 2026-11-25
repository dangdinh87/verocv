'use client'

import { useCallback, useEffect, useRef } from 'react'
import { pushSingleCvToCloud } from '@/lib/cloud-sync'
import { saveCv, writePendingCopy } from '@/lib/cv-repository'
import { useEditorStore } from '@/store/editor-store'
import type { ResumeDocumentV2 } from '@/types/schema'

const DEBOUNCE_MS = 600

/*
  Saves the open CV shortly after the last edit. Three details matter for not losing work:
  - "saved" is only shown when the document that finished saving is still the current one (an edit made mid-save keeps it dirty).
  - Leaving the page, hiding the tab or unmounting flushes immediately, with a synchronous copy first in case the async write is cut off.
  - A failed save shows an error state and can be retried; it never pretends to have saved.
*/
export function useCvAutosave() {
  const doc = useEditorStore((s) => s.doc)
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus)
  const persisted = useRef<ResumeDocumentV2 | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)

  const persist = useCallback(
    async (target: ResumeDocumentV2) => {
      setSaveStatus('saving')
      try {
        await saveCv(target)
        persisted.current = target
        if (useEditorStore.getState().doc === target) setSaveStatus('saved')
        void pushSingleCvToCloud(target)
      } catch {
        setSaveStatus('error')
      }
    },
    [setSaveStatus],
  )

  const flush = useCallback(() => {
    const latest = useEditorStore.getState().doc
    if (!latest || latest === persisted.current) return
    writePendingCopy(latest)
    inFlight.current = persist(latest)
  }, [persist])

  // Tell the hook which document is already stored (just loaded, or reloaded after a change in another tab).
  const markPersisted = useCallback((loaded: ResumeDocumentV2 | null) => {
    persisted.current = loaded
  }, [])

  useEffect(() => {
    if (!doc || doc === persisted.current) return
    const timer = setTimeout(() => {
      inFlight.current = persist(doc)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [doc, persist])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [flush])

  return { flush, markPersisted }
}
