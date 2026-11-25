import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MERGE_WINDOW_MS, useEditorStore } from '@/store/editor-store'
import { migrateToV2 } from '@/types/schema'

const makeDoc = () => migrateToV2({ id: 'doc_1', title: 'Tiêu đề', data: { name: 'Trần Văn A' } })
const state = () => useEditorStore.getState()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-04T10:00:00Z'))
  state().reset()
  state().loadDoc(makeDoc())
})
afterEach(() => vi.useRealTimers())

describe('editor store', () => {
  it('undoes and redoes an edit', () => {
    state().updateDoc((d) => void (d.data.name = 'Trần Văn B'), 'Đổi tên')
    expect(state().doc?.data.name).toBe('Trần Văn B')
    expect(state().saveStatus).toBe('dirty')

    state().undo()
    expect(state().doc?.data.name).toBe('Trần Văn A')
    expect(state().redoStack).toHaveLength(1)

    state().redo()
    expect(state().doc?.data.name).toBe('Trần Văn B')
  })

  it('merges rapid edits of the same kind into one undo step', () => {
    for (const text of ['T', 'Tr', 'Trầ']) {
      state().updateDoc((d) => void (d.data.name = text), 'Sửa họ tên')
      vi.advanceTimersByTime(100)
    }
    expect(state().undoStack).toHaveLength(1)
    state().undo()
    expect(state().doc?.data.name).toBe('Trần Văn A')
  })

  it('starts a new step after the merge window or for a different action', () => {
    state().updateDoc((d) => void (d.data.name = 'B'), 'Sửa họ tên')
    vi.advanceTimersByTime(MERGE_WINDOW_MS + 1)
    state().updateDoc((d) => void (d.data.name = 'C'), 'Sửa họ tên')
    state().updateDoc((d) => void (d.data.role = 'Dev'), 'Sửa vị trí')
    expect(state().undoStack).toHaveLength(3)
  })

  it('ignores an edit that changes nothing', () => {
    state().updateDoc((d) => void (d.data.name = 'Trần Văn A'), 'Không đổi')
    expect(state().undoStack).toHaveLength(0)
    expect(state().saveStatus).toBe('saved')
  })

  it('clears redo after a new edit', () => {
    state().updateDoc((d) => void (d.data.name = 'B'), 'Một')
    vi.advanceTimersByTime(MERGE_WINDOW_MS + 1)
    state().undo()
    expect(state().redoStack).toHaveLength(1)
    state().updateDoc((d) => void (d.data.role = 'X'), 'Hai')
    expect(state().redoStack).toHaveLength(0)
  })

  it('moves updatedAt forward on undo so a stale copy never wins on reload', () => {
    const original = state().doc!.updatedAt
    vi.advanceTimersByTime(5000)
    state().updateDoc((d) => void (d.data.name = 'B'), 'Một')
    vi.advanceTimersByTime(5000)
    state().undo()
    expect(state().doc!.updatedAt > original).toBe(true)
  })

  it('caps history length', () => {
    for (let i = 0; i < 150; i++) {
      state().updateDoc((d) => void (d.data.name = `N${i}`), `Sửa ${i}`)
    }
    expect(state().undoStack.length).toBeLessThanOrEqual(100)
  })

  it('loading another document starts with an empty history', () => {
    state().updateDoc((d) => void (d.data.name = 'B'), 'Một')
    state().loadDoc(migrateToV2({ id: 'doc_2' }))
    expect(state().undoStack).toHaveLength(0)
    expect(state().doc?.id).toBe('doc_2')
    expect(state().loadState).toBe('ready')
  })

  it('reports a missing document', () => {
    state().loadDoc(null)
    expect(state().loadState).toBe('missing')
  })
})
