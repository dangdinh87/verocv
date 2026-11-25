import { describe, expect, it } from 'vitest'
import { applicationsIn, formatDateValue, moveApplication } from '@/lib/kanban'
import type { JobApplication, KanbanColumnId } from '@/types/resume'

const card = (id: string, columnId: KanbanColumnId): JobApplication => ({
  id,
  company: id,
  role: 'Role',
  columnId,
  todos: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const order = (apps: JobApplication[], column: KanbanColumnId) => applicationsIn(apps, column).map((a) => a.id)

describe('moveApplication', () => {
  const apps = [card('a', 'wishlist'), card('b', 'wishlist'), card('c', 'applied'), card('d', 'applied')]

  it('moves a card into an empty column', () => {
    const next = moveApplication(apps, 'a', 'offer')
    expect(order(next, 'offer')).toEqual(['a'])
    expect(order(next, 'wishlist')).toEqual(['b'])
  })

  it('drops before the card it is released over', () => {
    expect(order(moveApplication(apps, 'a', 'applied', 'd'), 'applied')).toEqual(['c', 'a', 'd'])
    expect(order(moveApplication(apps, 'a', 'applied', 'c'), 'applied')).toEqual(['a', 'c', 'd'])
  })

  it('appends to the end of a column when released on empty space', () => {
    expect(order(moveApplication(apps, 'a', 'applied'), 'applied')).toEqual(['c', 'd', 'a'])
  })

  it('reorders inside the same column', () => {
    expect(order(moveApplication(apps, 'b', 'wishlist', 'a'), 'wishlist')).toEqual(['b', 'a'])
  })

  it('keeps every card exactly once and does not mutate the input', () => {
    const before = JSON.stringify(apps)
    const next = moveApplication(apps, 'b', 'interview', 'zzz')
    expect(next.map((a) => a.id).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(JSON.stringify(apps)).toBe(before)
  })

  it('returns the list unchanged for an unknown card', () => {
    expect(moveApplication(apps, 'nope', 'offer')).toBe(apps)
  })
})

describe('formatDateValue', () => {
  it('formats form values and leaves old free text alone', () => {
    expect(formatDateValue('2026-03-14')).toBe('14/03/2026')
    expect(formatDateValue('2026-03-14T09:30')).toBe('14/03/2026 09:30')
    expect(formatDateValue('Thứ Năm, 14:00')).toBe('Thứ Năm, 14:00')
    expect(formatDateValue(undefined)).toBe('')
  })
})
