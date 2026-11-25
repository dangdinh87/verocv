'use client'

import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'
import { RichTextAreaField } from '@/components/ui/rich-textarea'
import { useEditorStore } from '@/store/editor-store'

const MAX_COMFORTABLE = 350

export function SummarySectionForm({ onSuggest }: { onSuggest: () => void }) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  if (!doc) return null
  const length = doc.data.summary.length

  return (
    <div className="space-y-3">
      <RichTextAreaField
        label="Giới thiệu bản thân"
        rows={6}
        value={doc.data.summary}
        placeholder="2 đến 3 câu về điểm mạnh, số năm kinh nghiệm và giá trị bạn mang lại."
        hint={`Nêu rõ vị trí ứng tuyển và **1–2 thành tích nổi bật** nhất. ${length}/${MAX_COMFORTABLE} ký tự gợi ý.`}
        onValueChange={(next) =>
          updateDoc((draft) => {
            draft.data.summary = next
          }, 'Sửa giới thiệu')
        }
      />
      <Button variant="secondary" size="sm" onClick={onSuggest} className="gap-1.5">
        <Sparkle size={15} weight="fill" aria-hidden="true" />
        Gợi ý bằng AI
      </Button>
    </div>
  )
}
