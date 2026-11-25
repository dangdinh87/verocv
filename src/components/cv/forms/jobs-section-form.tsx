'use client'

import { CaretDown, CaretRight, Copy, Eye, EyeSlash, Plus, Sparkle, Trash } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { PeriodPickerField } from '@/components/ui/period-picker'
import { RichTextAreaField } from '@/components/ui/rich-textarea'
import { arrayMove, SortableList } from '@/components/ui/sortable-list'
import { newId } from '@/lib/cv-repository'
import { useEditorStore } from '@/store/editor-store'
import type { JobItemV2 } from '@/types/schema'

function JobCard({
  job,
  index,
  expanded,
  onToggleExpand,
  onDuplicate,
  handle,
  onSuggest,
}: {
  job: JobItemV2
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onDuplicate: () => void
  handle: React.ReactNode
  onSuggest: (bulletIndex: number, text: string) => void
}) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const isEn = doc?.settings.documentLanguage === 'en'

  const edit = (apply: (target: JobItemV2) => void, description: string) =>
    updateDoc((d) => {
      const target = d.data.jobs.find((j) => j.id === job.id)
      if (target) apply(target)
    }, description)

  const summaryTitle = job.title.trim() || `Công việc ${index + 1}`
  const summarySub = [job.org.trim(), job.period.trim()].filter(Boolean).join(' · ')
  const isCurrent = /\b(nay|hiện tại|present|current)\b/i.test(job.period)

  const toggleCurrentRole = () => {
    const suffix = isEn ? 'Present' : 'nay'
    edit((t) => {
      if (isCurrent) {
        t.period = t.period.replace(/\s*[-–—]\s*(?:nay|hiện tại|present|current)\b/i, '').trim()
      } else if (t.period.trim()) {
        const start = t.period.split(/\s*[-–—]\s*/)[0]?.trim() || t.period.trim()
        t.period = `${start} – ${suffix}`
      } else {
        t.period = `${new Date().getFullYear()} – ${suffix}`
      }
    }, 'Cập nhật trạng thái công việc hiện tại')
  }

  return (
    <div className={`rounded-control border border-rule bg-paper ${job.hidden ? 'opacity-65' : ''}`}>
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
          {job.hidden && <span className="shrink-0 rounded-full border border-rule bg-desk px-2 py-0.5 text-xs text-ink-3">Đang ẩn</span>}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label={`Nhân bản công việc ${index + 1}`}
          title="Nhân bản công việc này"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          onClick={() => edit((t) => (t.hidden = !t.hidden), job.hidden ? 'Hiện công việc' : 'Ẩn công việc')}
          aria-label={job.hidden ? `Hiện công việc ${index + 1}` : `Ẩn công việc ${index + 1}`}
          title={job.hidden ? 'Hiện lại trên CV' : 'Ẩn tạm trên CV (không xoá)'}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
        >
          {job.hidden ? <EyeSlash size={17} /> : <Eye size={17} />}
        </button>
        <button
          type="button"
          onClick={() =>
            updateDoc((d) => {
              d.data.jobs = d.data.jobs.filter((j) => j.id !== job.id)
            }, 'Xoá công việc')
          }
          aria-label={`Xoá công việc ${index + 1}`}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-seal hover:bg-seal/10"
        >
          <Trash size={17} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-rule px-4 pb-4 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Chức danh" value={job.title} onChange={(e) => edit((t) => (t.title = e.target.value), 'Sửa chức danh')} />
            <TextField
              label="Công ty hoặc tổ chức"
              value={job.org}
              onChange={(e) => edit((t) => (t.org = e.target.value), 'Sửa tên công ty')}
            />
            <div>
              <PeriodPickerField
                label="Thời gian"
                placeholder={isEn ? 'Jan 2022 – Present' : '03/2022 – nay'}
                language={isEn ? 'en' : 'vi'}
                value={job.period}
                onChange={(next) => edit((t) => (t.period = next), 'Sửa thời gian')}
              />
              <button
                type="button"
                onClick={toggleCurrentRole}
                aria-pressed={isCurrent}
                className={`mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  isCurrent ? 'bg-pen-wash text-pen' : 'border border-rule bg-desk text-ink-2 hover:text-ink'
                }`}
              >
                {isCurrent ? '✓ Đang làm việc tại đây' : '+ Đánh dấu đang làm tại đây'}
              </button>
            </div>
            <TextField
              label="Địa điểm"
              optional
              placeholder="Hà Nội / Remote"
              value={job.location}
              onChange={(e) => edit((t) => (t.location = e.target.value), 'Sửa địa điểm công việc')}
            />
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-ink-2">Kết quả và việc đã làm</legend>
            <div className="mt-1.5 space-y-3">
              {job.bullets.map((bullet, i) => (
                <div key={i}>
                  <RichTextAreaField
                    label={`Ý ${i + 1}`}
                    rows={2}
                    value={bullet}
                    placeholder="Bắt đầu bằng động từ mạnh, dùng **in đậm** cho số liệu kết quả."
                    onValueChange={(next) => edit((t) => (t.bullets[i] = next), 'Sửa mô tả công việc')}
                  />
                  <div className="mt-1 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onSuggest(i, bullet)} className="gap-1.5 text-pen">
                      <Sparkle size={14} weight="fill" aria-hidden="true" />
                      Gợi ý viết lại
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => edit((t) => (t.bullets = t.bullets.filter((_, idx) => idx !== i)), 'Xoá ý')}
                      className="gap-1.5 text-seal"
                      aria-label={`Xoá ý ${i + 1}`}
                    >
                      <Trash size={14} aria-hidden="true" />
                      Xoá
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={() => edit((t) => t.bullets.push(''), 'Thêm ý')} className="mt-3 gap-1.5">
              <Plus size={14} weight="bold" aria-hidden="true" />
              Thêm ý
            </Button>
          </fieldset>
        </div>
      )}
    </div>
  )
}

export function JobsSectionForm({ onSuggest }: { onSuggest: (jobId: string, bulletIndex: number, text: string) => void }) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => (doc?.data.jobs[0] ? { [doc.data.jobs[0].id]: true } : {}))

  if (!doc) return null

  const addJob = () => {
    const id = newId('job')
    updateDoc((d) => {
      d.data.jobs.push({ id, title: '', org: '', location: '', period: '', bullets: [''], hidden: false })
    }, 'Thêm công việc')
    setOpenIds((prev) => ({ ...prev, [id]: true }))
  }

  const duplicateJob = (job: JobItemV2, index: number) => {
    const id = newId('job')
    updateDoc((d) => {
      const cloned: JobItemV2 = {
        ...JSON.parse(JSON.stringify(job)),
        id,
        title: job.title ? `${job.title} (bản sao)` : '',
      }
      d.data.jobs.splice(index + 1, 0, cloned)
    }, 'Nhân bản công việc')
    setOpenIds((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className="space-y-3">
      {doc.data.jobs.length === 0 ? (
        <p className="rounded-control border border-dashed border-rule p-5 text-center text-ink-3">
          Chưa có công việc nào. Thêm công việc gần nhất của bạn trước.
        </p>
      ) : (
        <SortableList
          items={doc.data.jobs}
          kind="công việc"
          onReorder={(from, to) =>
            updateDoc((d) => {
              d.data.jobs = arrayMove(d.data.jobs, from, to)
            }, 'Đổi thứ tự công việc')
          }
          renderItem={(job, index, handle) => (
            <JobCard
              job={job}
              index={index}
              expanded={Boolean(openIds[job.id])}
              onToggleExpand={() => setOpenIds((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
              onDuplicate={() => duplicateJob(job, index)}
              handle={handle}
              onSuggest={(bi, text) => onSuggest(job.id, bi, text)}
            />
          )}
        />
      )}
      <Button variant="secondary" size="sm" onClick={addJob} className="gap-1.5">
        <Plus size={15} weight="bold" aria-hidden="true" />
        Thêm kinh nghiệm
      </Button>
    </div>
  )
}
