'use client'

import { Check, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { Modal } from '@/components/ui/modal'
import type { RewriteMode } from '@/lib/ai-suggestions'

export type AiSuggestionState = {
  open: boolean
  loading: boolean
  title: string
  note?: string
  options: string[]
  mode?: RewriteMode
  multiSelect?: boolean
  appliedValues?: string[]
}

export const AI_CLOSED: AiSuggestionState = { open: false, loading: false, title: '', options: [] }

export function AiSuggestionModal({
  state,
  onClose,
  onApply,
  onModeChange,
}: {
  state: AiSuggestionState
  onClose: () => void
  onApply: (text: string) => void
  onModeChange?: (mode: RewriteMode) => void
}) {
  const applied = new Set((state.appliedValues ?? []).map((s) => s.toLowerCase()))

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.title || 'VeroCV AI Copilot'}
      description="Phân tích ngữ cảnh hồ sơ qua Cloudflare Workers AI. Chỉ áp dụng khi bạn bấm chọn."
    >
      <div className="space-y-4">
        {state.mode && onModeChange && (
          <ChoiceGroup
            legend="Kiểu diễn đạt"
            value={state.mode}
            onChange={onModeChange}
            options={[
              { value: 'impact', label: 'Rõ kết quả' },
              { value: 'concise', label: 'Rút gọn' },
              { value: 'detailed', label: 'Chi tiết hơn' },
            ]}
          />
        )}

        {state.loading ? (
          <p role="status" className="py-8 text-center text-ink-3">
            Đang tạo gợi ý…
          </p>
        ) : (
          <>
            {state.note && (
              <p className="flex items-start gap-2 text-sm text-ink-3">
                <Sparkle size={16} weight="fill" className="mt-0.5 shrink-0 text-pen" aria-hidden="true" />
                {state.note}
              </p>
            )}
            <ul className="space-y-3 p-0">
              {state.options.map((option) => {
                const isAdded = state.multiSelect && applied.has(option.toLowerCase())
                return (
                  <li key={option} className="flex list-none items-start justify-between gap-4 rounded-control border border-rule p-4">
                    <span className="flex-1 leading-relaxed">{option}</span>
                    {isAdded ? (
                      <span className="inline-flex h-9 shrink-0 items-center gap-1 px-3 text-sm font-semibold text-pen">
                        <Check size={15} weight="bold" aria-hidden="true" />
                        Đã thêm
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => onApply(option)} className="shrink-0">
                        {state.multiSelect ? 'Thêm' : 'Dùng'}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
            {!state.multiSelect && (
              <p className="text-sm text-ink-3">Phần trong ngoặc vuông là chỗ cần số liệu thật của bạn. Gợi ý không tự bịa thành tích.</p>
            )}
            {state.multiSelect && (
              <div className="flex justify-end pt-1">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Xong
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
