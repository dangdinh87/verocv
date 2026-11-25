'use client'

import { CaretDown, CaretRight, Eye, EyeSlash, Plus, Sparkle, Trash } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import type { CustomSectionKind } from '@/components/resume/resume-data'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { PeriodPickerField } from '@/components/ui/period-picker'
import { RichTextAreaField } from '@/components/ui/rich-textarea'
import { arrayMove, SortableList } from '@/components/ui/sortable-list'
import { newId } from '@/lib/cv-repository'
import { useEditorStore } from '@/store/editor-store'
import type { CustomSectionEntryV2, CustomSectionV2 } from '@/types/schema'

function fieldLabels(kind: CustomSectionKind) {
  switch (kind) {
    case 'projects':
      return { title: 'Tên dự án', sub: 'Vai trò hoặc công nghệ chính', period: 'Thời gian', showLink: true, showBullets: true }
    case 'certificates':
      return { title: 'Tên chứng chỉ', sub: 'Đơn vị cấp', period: 'Năm cấp', showLink: true, showBullets: false }
    case 'awards':
      return { title: 'Giải thưởng / Danh hiệu', sub: 'Đơn vị trao tặng', period: 'Năm', showLink: false, showBullets: true }
    case 'activities':
      return { title: 'Vai trò hoạt động', sub: 'Tổ chức / Câu lạc bộ', period: 'Thời gian', showLink: false, showBullets: true }
    case 'publications':
      return { title: 'Tên bài viết / Công trình', sub: 'Nơi xuất bản / Tạp chí', period: 'Năm', showLink: true, showBullets: true }
    case 'references':
      return { title: 'Họ tên người tham chiếu', sub: 'Chức vụ, công ty & email/SĐT', period: '', showLink: false, showBullets: false }
    case 'interests':
      return { title: 'Sở thích', sub: '', period: '', showLink: false, showBullets: false }
    default:
      return { title: 'Tiêu đề mục con', sub: 'Phụ đề / Tổ chức', period: 'Thời gian', showLink: true, showBullets: true }
  }
}

function CustomEntryCard({
  section,
  entry,
  index,
  expanded,
  onToggleExpand,
  handle,
  onSuggestBullet,
}: {
  section: CustomSectionV2
  entry: CustomSectionEntryV2
  index: number
  expanded: boolean
  onToggleExpand: () => void
  handle: React.ReactNode
  onSuggestBullet?: (bulletIndex: number, text: string) => void
}) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const isEn = doc?.settings.documentLanguage === 'en'
  const labels = fieldLabels(section.kind)

  const edit = (apply: (target: CustomSectionEntryV2) => void, description: string) =>
    updateDoc((d) => {
      const cs = d.data.customSections.find((c) => c.id === section.id)
      const target = cs?.entries.find((e) => e.id === entry.id)
      if (target) apply(target)
    }, description)

  const summaryTitle = entry.title.trim() || `Mục ${index + 1} (chưa điền)`
  const summarySub = [entry.subtitle?.trim(), entry.period?.trim()].filter(Boolean).join(' · ')

  return (
    <div className={`rounded-control border border-rule bg-paper ${entry.hidden ? 'opacity-65' : ''}`}>
      <div className="flex items-center gap-1 p-2.5">
        {handle}
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-control px-1.5 py-1 text-left hover:bg-ink/[0.04]"
        >
          {expanded ? (
            <CaretDown size={15} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
          ) : (
            <CaretRight size={15} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{summaryTitle}</span>
            {summarySub && <span className="block truncate text-xs text-ink-3">{summarySub}</span>}
          </span>
          {entry.hidden && <span className="shrink-0 rounded-full border border-rule bg-desk px-2 py-0.5 text-xs text-ink-3">Đang ẩn</span>}
        </button>
        <button
          type="button"
          onClick={() => edit((t) => (t.hidden = !t.hidden), entry.hidden ? 'Hiện mục' : 'Ẩn mục')}
          aria-label={entry.hidden ? `Hiện ${summaryTitle} trên CV` : `Ẩn ${summaryTitle} khỏi CV`}
          title={entry.hidden ? 'Hiện lại trên CV' : 'Ẩn tạm trên CV (không xoá)'}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
        >
          {entry.hidden ? <EyeSlash size={17} /> : <Eye size={17} />}
        </button>
        <button
          type="button"
          onClick={() =>
            updateDoc((d) => {
              const cs = d.data.customSections.find((c) => c.id === section.id)
              if (cs) cs.entries = cs.entries.filter((e) => e.id !== entry.id)
            }, 'Xoá mục con')
          }
          aria-label={`Xoá ${summaryTitle}`}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-seal hover:bg-seal/10"
        >
          <Trash size={17} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-rule px-4 pb-4 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              className={!labels.sub && !labels.period ? 'sm:col-span-2' : ''}
              label={labels.title}
              value={entry.title}
              onChange={(e) => edit((t) => (t.title = e.target.value), 'Sửa tiêu đề mục')}
            />
            {labels.sub && (
              <TextField
                label={labels.sub}
                optional
                value={entry.subtitle}
                onChange={(e) => edit((t) => (t.subtitle = e.target.value), 'Sửa phụ đề')}
              />
            )}
            {labels.period && (
              <PeriodPickerField
                label={labels.period}
                optional
                placeholder="2024"
                language={isEn ? 'en' : 'vi'}
                value={entry.period}
                onChange={(next) => edit((t) => (t.period = next), 'Sửa thời gian')}
              />
            )}
            {labels.showLink && (
              <TextField
                label="Liên kết"
                optional
                placeholder="github.com/du-an"
                value={entry.link}
                onChange={(e) => edit((t) => (t.link = e.target.value), 'Sửa liên kết')}
              />
            )}
          </div>

          {labels.showBullets && (
            <fieldset className="pt-1">
              <legend className="text-sm font-semibold text-ink-2">Chi tiết & Kết quả</legend>
              <div className="mt-1.5 space-y-2.5">
                {entry.bullets.map((bullet, bIdx) => (
                  <div key={bIdx}>
                    <RichTextAreaField
                      label={`Ý ${bIdx + 1}`}
                      rows={2}
                      value={bullet}
                      placeholder="Nêu đóng góp chính và dùng **in đậm** cho kết quả."
                      onValueChange={(next) => edit((t) => (t.bullets[bIdx] = next), 'Sửa chi tiết')}
                    />
                    <div className="mt-1 flex gap-1">
                      {onSuggestBullet && (
                        <Button variant="ghost" size="sm" onClick={() => onSuggestBullet(bIdx, bullet)} className="gap-1.5 text-pen">
                          <Sparkle size={14} weight="fill" aria-hidden="true" />
                          Gợi ý viết lại
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => edit((t) => (t.bullets = t.bullets.filter((_, idx) => idx !== bIdx)), 'Xoá ý')}
                        className="gap-1.5 text-seal"
                      >
                        <Trash size={14} aria-hidden="true" />
                        Xoá
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={() => edit((t) => t.bullets.push(''), 'Thêm ý')} className="mt-2.5 gap-1.5">
                <Plus size={14} weight="bold" aria-hidden="true" />
                Thêm ý mô tả
              </Button>
            </fieldset>
          )}
        </div>
      )}
    </div>
  )
}

export function CustomSectionForm({
  section,
  onSuggestBullet,
}: {
  section: CustomSectionV2
  onSuggestBullet?: (sectionId: string, entryId: string, bulletIndex: number, text: string) => void
}) {
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => (section.entries[0] ? { [section.entries[0].id]: true } : {}))

  const addEntry = () => {
    const id = newId('cse')
    const withBullet = section.kind === 'projects' || section.kind === 'activities' || section.kind === 'custom'
    updateDoc((d) => {
      const cs = d.data.customSections.find((c) => c.id === section.id)
      if (cs) {
        cs.entries.push({
          id,
          title: '',
          subtitle: '',
          period: '',
          link: '',
          bullets: withBullet ? [''] : [],
          hidden: false,
        })
      }
    }, `Thêm mục vào ${section.title}`)
    setOpenIds((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <TextField
          className="flex-1"
          label="Tiêu đề mục hiển thị trên CV"
          value={section.title}
          onChange={(e) =>
            updateDoc((d) => {
              const cs = d.data.customSections.find((c) => c.id === section.id)
              if (cs) cs.title = e.target.value
            }, 'Đổi tên mục tuỳ chỉnh')
          }
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            updateDoc((d) => {
              d.data.customSections = d.data.customSections.filter((c) => c.id !== section.id)
              d.settings.sectionOrder = d.settings.sectionOrder.filter((k) => k !== section.id)
              d.settings.hiddenSections = d.settings.hiddenSections.filter((k) => k !== section.id)
            }, `Xoá mục ${section.title}`)
          }
          className="mb-1 gap-1.5 text-seal"
        >
          <Trash size={15} aria-hidden="true" />
          Xoá mục này
        </Button>
      </div>

      {section.entries.length > 0 && (
        <SortableList
          items={section.entries}
          kind={section.title.toLowerCase()}
          onReorder={(from, to) =>
            updateDoc((d) => {
              const cs = d.data.customSections.find((c) => c.id === section.id)
              if (cs) cs.entries = arrayMove(cs.entries, from, to)
            }, 'Đổi thứ tự mục con')
          }
          renderItem={(entry, index, handle) => (
            <CustomEntryCard
              section={section}
              entry={entry}
              index={index}
              expanded={Boolean(openIds[entry.id])}
              onToggleExpand={() => setOpenIds((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
              handle={handle}
              onSuggestBullet={onSuggestBullet ? (bi, text) => onSuggestBullet(section.id, entry.id, bi, text) : undefined}
            />
          )}
        />
      )}

      <Button variant="secondary" size="sm" onClick={addEntry} className="gap-1.5">
        <Plus size={15} weight="bold" aria-hidden="true" />
        Thêm dòng mới
      </Button>
    </div>
  )
}
