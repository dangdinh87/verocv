import type { JobApplication, KanbanColumnId } from '@/types/resume'

export const KANBAN_COLUMNS: { id: KanbanColumnId; name: string }[] = [
  { id: 'wishlist', name: 'Quan tâm' },
  { id: 'applied', name: 'Đã nộp' },
  { id: 'interview', name: 'Phỏng vấn' },
  { id: 'offer', name: 'Có offer' },
  { id: 'rejected', name: 'Không phù hợp' },
]

export const columnName = (id: KanbanColumnId) => KANBAN_COLUMNS.find((c) => c.id === id)?.name ?? id

export const applicationsIn = (apps: JobApplication[], column: KanbanColumnId) => apps.filter((a) => a.columnId === column)

/*
  The array order IS the card order (a column shows its cards in the order they appear in the list).
  Moving a card therefore rewrites the list: take the card out, then put it right before `beforeId`,
  or after the last card of the target column when dropped on the empty part of a column.
*/
export function moveApplication(apps: JobApplication[], id: string, toColumn: KanbanColumnId, beforeId?: string): JobApplication[] {
  const card = apps.find((a) => a.id === id)
  if (!card) return apps
  const moved: JobApplication = { ...card, columnId: toColumn, updatedAt: new Date().toISOString() }
  const rest = apps.filter((a) => a.id !== id)

  const beforeIndex = beforeId ? rest.findIndex((a) => a.id === beforeId && a.columnId === toColumn) : -1
  if (beforeIndex >= 0) return [...rest.slice(0, beforeIndex), moved, ...rest.slice(beforeIndex)]

  let lastInColumn = -1
  rest.forEach((a, i) => {
    if (a.columnId === toColumn) lastInColumn = i
  })
  if (lastInColumn >= 0) return [...rest.slice(0, lastInColumn + 1), moved, ...rest.slice(lastInColumn + 1)]
  return [...rest, moved]
}

// Stored dates are `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` from the form. Older free-text values (e.g. "Thứ Năm, 14:00") are shown as typed.
export function formatDateValue(value?: string): string {
  if (!value) return ''
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/)
  if (!match) return value
  const [, y, m, d, hh, mm] = match
  return `${d}/${m}/${y}${hh ? ` ${hh}:${mm}` : ''}`
}

export function todoProgress(app: JobApplication): { done: number; total: number } {
  return { done: app.todos.filter((t) => t.done).length, total: app.todos.length }
}
