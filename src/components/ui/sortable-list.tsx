'use client'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DotsSixVertical } from '@phosphor-icons/react/dist/ssr'
import type { ReactNode } from 'react'

const INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Để sắp xếp lại, nhấn phím cách để nhấc mục lên, dùng phím mũi tên lên xuống để di chuyển, nhấn phím cách lần nữa để thả. Nhấn Esc để huỷ.',
}

const announcements = (label: string): Announcements => ({
  onDragStart: ({ active }) => `Đã nhấc ${label} ${String(active.id)}.`,
  onDragOver: ({ over }) => (over ? `${label} đang ở trên vị trí của mục khác.` : undefined),
  onDragEnd: ({ over }) => (over ? `Đã thả ${label} vào vị trí mới.` : `Đã thả ${label} về chỗ cũ.`),
  onDragCancel: () => `Đã huỷ sắp xếp ${label}.`,
})

type RowProps = { id: string; handleLabel: string; children: (handle: ReactNode) => ReactNode }

function SortableRow({ id, handleLabel, children }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={handleLabel}
      title="Kéo để sắp xếp"
      className="flex size-9 cursor-grab touch-none items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink active:cursor-grabbing"
    >
      <DotsSixVertical size={18} weight="bold" />
    </button>
  )
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`list-none ${isDragging ? 'relative z-10 opacity-70' : ''}`}
    >
      {children(handle)}
    </li>
  )
}

// Reorderable list for the mouse, touch and keyboard. `kind` is the Vietnamese noun used in screen-reader announcements.
export function SortableList<T extends { id: string }>({
  items,
  kind,
  onReorder,
  renderItem,
}: {
  items: T[]
  kind: string
  onReorder: (from: number, to: number) => void
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from >= 0 && to >= 0) onReorder(from, to)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements: announcements(kind), screenReaderInstructions: INSTRUCTIONS }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3 p-0">
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id} handleLabel={`Kéo để đổi vị trí ${kind} ${index + 1}`}>
              {(handle) => renderItem(item, index, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

export { arrayMove }
