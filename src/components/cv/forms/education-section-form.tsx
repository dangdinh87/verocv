'use client'

import { CaretDown, CaretRight, Eye, EyeSlash, Plus, Trash } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { PeriodPickerField } from '@/components/ui/period-picker'
import { arrayMove, SortableList } from '@/components/ui/sortable-list'
import { newId } from '@/lib/cv-repository'
import { useEditorStore } from '@/store/editor-store'
import type { EducationItemV2 } from '@/types/schema'

function EducationCard({
  edu,
  index,
  expanded,
  onToggleExpand,
  handle,
}: {
  edu: EducationItemV2
  index: number
  expanded: boolean
  onToggleExpand: () => void
  handle: React.ReactNode
}) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const isEn = doc?.settings.documentLanguage === 'en'
  const edit = (apply: (target: EducationItemV2) => void, description: string) =>
    updateDoc((d) => {
      const target = d.data.education.find((e) => e.id === edu.id)
      if (target) apply(target)
    }, description)

  const summaryTitle = edu.degree.trim() || `Học vấn ${index + 1}`
  const summarySub = [edu.school.trim(), edu.period.trim()].filter(Boolean).join(' · ')

  return (
    <div className={`rounded-control border border-rule bg-paper ${edu.hidden ? 'opacity-65' : ''}`}>
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
          {edu.hidden && <span className="shrink-0 rounded-full border border-rule bg-desk px-2 py-0.5 text-xs text-ink-3">Đang ẩn</span>}
        </button>
        <button
          type="button"
          onClick={() => edit((t) => (t.hidden = !t.hidden), edu.hidden ? 'Hiện học vấn' : 'Ẩn học vấn')}
          aria-label={edu.hidden ? `Hiện học vấn ${index + 1}` : `Ẩn học vấn ${index + 1}`}
          title={edu.hidden ? 'Hiện lại trên CV' : 'Ẩn tạm trên CV (không xoá)'}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
        >
          {edu.hidden ? <EyeSlash size={17} /> : <Eye size={17} />}
        </button>
        <button
          type="button"
          onClick={() =>
            updateDoc((d) => {
              d.data.education = d.data.education.filter((e) => e.id !== edu.id)
            }, 'Xoá học vấn')
          }
          aria-label={`Xoá học vấn ${index + 1}`}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-seal hover:bg-seal/10"
        >
          <Trash size={17} />
        </button>
      </div>

      {expanded && (
        <div className="grid gap-3 border-t border-rule px-4 pb-4 pt-3 sm:grid-cols-2">
          <TextField
            label="Bằng cấp hoặc ngành học"
            value={edu.degree}
            onChange={(e) => edit((t) => (t.degree = e.target.value), 'Sửa ngành học')}
          />
          <PeriodPickerField
            label="Thời gian"
            placeholder={isEn ? 'Sep 2017 – Jun 2021' : '09/2017 – 06/2021'}
            language={isEn ? 'en' : 'vi'}
            value={edu.period}
            onChange={(next) => edit((t) => (t.period = next), 'Sửa thời gian học')}
          />
          <TextField
            className="sm:col-span-2"
            label="Trường đào tạo"
            value={edu.school}
            onChange={(e) => edit((t) => (t.school = e.target.value), 'Sửa tên trường')}
          />
          <TextField
            label="Địa điểm"
            optional
            placeholder="TP. Hồ Chí Minh"
            value={edu.location}
            onChange={(e) => edit((t) => (t.location = e.target.value), 'Sửa địa điểm trường')}
          />
          <TextField
            label="GPA / Xếp loại"
            optional
            placeholder="3.6/4.0 · Giỏi"
            value={edu.gpa}
            onChange={(e) => edit((t) => (t.gpa = e.target.value), 'Sửa GPA')}
          />
        </div>
      )}
    </div>
  )
}

export function EducationSectionForm() {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() =>
    doc?.data.education[0] ? { [doc.data.education[0].id]: true } : {},
  )

  if (!doc) return null

  const addEdu = () => {
    const id = newId('edu')
    updateDoc((d) => {
      d.data.education.push({ id, school: '', degree: '', location: '', gpa: '', period: '', hidden: false })
    }, 'Thêm học vấn')
    setOpenIds((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className="space-y-3">
      {doc.data.education.length === 0 ? (
        <p className="rounded-control border border-dashed border-rule p-5 text-center text-ink-3">Chưa có học vấn nào.</p>
      ) : (
        <SortableList
          items={doc.data.education}
          kind="học vấn"
          onReorder={(from, to) =>
            updateDoc((d) => {
              d.data.education = arrayMove(d.data.education, from, to)
            }, 'Đổi thứ tự học vấn')
          }
          renderItem={(edu, index, handle) => (
            <EducationCard
              edu={edu}
              index={index}
              expanded={Boolean(openIds[edu.id])}
              onToggleExpand={() => setOpenIds((prev) => ({ ...prev, [edu.id]: !prev[edu.id] }))}
              handle={handle}
            />
          )}
        />
      )}
      <Button variant="secondary" size="sm" onClick={addEdu} className="gap-1.5">
        <Plus size={15} weight="bold" aria-hidden="true" />
        Thêm học vấn
      </Button>
    </div>
  )
}
