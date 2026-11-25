import { applyPatches, enablePatches, produce, type Patch } from 'immer'
import { create } from 'zustand'
import type { ResumeDocumentV2 } from '@/types/schema'

enablePatches()

export type HistoryStep = {
  patches: Patch[]
  inversePatches: Patch[]
  timestamp: number
  description: string
}

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'
export type EditorTab = 'content' | 'design' | 'audit'
export type EditorSection = string

type EditorStoreState = {
  doc: ResumeDocumentV2 | null
  loadState: 'loading' | 'ready' | 'missing'
  undoStack: HistoryStep[]
  redoStack: HistoryStep[]
  activeSection: EditorSection
  activeTab: EditorTab
  saveStatus: SaveStatus
  pageCount: number
  zoomLevel: number

  reset: () => void
  loadDoc: (doc: ResumeDocumentV2 | null) => void
  setActiveSection: (section: EditorSection) => void
  setActiveTab: (tab: EditorTab) => void
  setSaveStatus: (status: SaveStatus) => void
  setPageCount: (count: number) => void
  setZoomLevel: (zoom: number) => void
  updateDoc: (updater: (draft: ResumeDocumentV2) => void, description?: string) => void
  undo: () => void
  redo: () => void
}

export const MAX_HISTORY = 100
// Edits with the same description inside this window collapse into one undo step, so typing a word is one step, not one per letter.
export const MERGE_WINDOW_MS = 800

// Undo/redo restores older field values, but the document itself just changed: its timestamp must move forward or a newer saved copy could win on reload.
const touched = (doc: ResumeDocumentV2): ResumeDocumentV2 => ({ ...doc, updatedAt: new Date().toISOString() })

const initial = {
  doc: null,
  loadState: 'loading' as const,
  undoStack: [] as HistoryStep[],
  redoStack: [] as HistoryStep[],
  activeSection: 'personal' as EditorSection,
  activeTab: 'content' as EditorTab,
  saveStatus: 'saved' as SaveStatus,
  pageCount: 1,
  zoomLevel: 100,
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  ...initial,

  reset: () => set({ ...initial }),
  // Loading a document (first open, or a change from another tab) starts a fresh history: old patches would no longer line up.
  loadDoc: (doc) => set({ doc, loadState: doc ? 'ready' : 'missing', undoStack: [], redoStack: [], saveStatus: 'saved' }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setPageCount: (pageCount) => set((s) => (s.pageCount === pageCount ? s : { pageCount })),
  setZoomLevel: (zoomLevel) => set({ zoomLevel: Math.min(150, Math.max(60, zoomLevel)) }),

  updateDoc: (updater, description = 'Chỉnh sửa nội dung') => {
    const current = get().doc
    if (!current) return

    let patches: Patch[] = []
    let inversePatches: Patch[] = []
    const next = produce(
      current,
      (draft) => {
        updater(draft)
        draft.updatedAt = new Date().toISOString()
      },
      (p, inv) => {
        patches = p
        inversePatches = inv
      },
    )
    // `updatedAt` always differs, so compare against everything except it to detect a no-op edit.
    if (patches.every((p) => p.path[0] === 'updatedAt')) return

    const now = Date.now()
    const undoStack = [...get().undoStack]
    const last = undoStack[undoStack.length - 1]

    if (last && last.description === description && now - last.timestamp < MERGE_WINDOW_MS) {
      undoStack[undoStack.length - 1] = {
        patches: [...last.patches, ...patches],
        inversePatches: [...inversePatches, ...last.inversePatches],
        timestamp: now,
        description,
      }
    } else {
      undoStack.push({ patches, inversePatches, timestamp: now, description })
      if (undoStack.length > MAX_HISTORY) undoStack.shift()
    }

    set({ doc: next, undoStack, redoStack: [], saveStatus: 'dirty' })
  },

  undo: () => {
    const { doc, undoStack, redoStack } = get()
    const step = undoStack[undoStack.length - 1]
    if (!doc || !step) return
    set({
      doc: touched(applyPatches(doc, step.inversePatches)),
      undoStack: undoStack.slice(0, -1),
      redoStack: [step, ...redoStack],
      saveStatus: 'dirty',
    })
  },

  redo: () => {
    const { doc, undoStack, redoStack } = get()
    const [step, ...rest] = redoStack
    if (!doc || !step) return
    set({
      doc: touched(applyPatches(doc, step.patches)),
      undoStack: [...undoStack, step],
      redoStack: rest,
      saveStatus: 'dirty',
    })
  },
}))
