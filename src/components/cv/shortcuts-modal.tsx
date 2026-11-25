'use client'

import { Modal } from '@/components/ui/modal'

const SHORTCUTS = [
  ['Mở lệnh nhanh', 'Ctrl K'],
  ['Hoàn tác', 'Ctrl Z'],
  ['Làm lại', 'Ctrl Shift Z'],
  ['Tải PDF', 'Ctrl P'],
  ['Xem phím tắt', '?'],
  ['Đóng hộp thoại', 'Esc'],
] as const

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Phím tắt" description="Trên máy Mac, dùng phím ⌘ thay cho Ctrl." size="sm">
      <dl className="divide-y divide-rule">
        {SHORTCUTS.map(([action, keys]) => (
          <div key={action} className="flex items-center justify-between gap-4 py-3">
            <dt className="text-ink-2">{action}</dt>
            <dd className="flex gap-1">
              {keys.split(' ').map((k) => (
                <kbd
                  key={k}
                  className="min-w-8 rounded-control border border-rule bg-desk px-2 py-1 text-center font-mono text-sm font-semibold"
                >
                  {k}
                </kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
