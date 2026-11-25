'use client'

import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { useId, useMemo, useRef, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { exportCvToJson } from '@/lib/cv-repository'
import { buildResumeDocx, triggerDocxDownload } from '@/lib/docx-export'
import { fileSafeName, printDocument } from '@/lib/print-document'
import { useEditorStore, type EditorSection } from '@/store/editor-store'
import type { AuditTab } from './quality-audit-modal'

type Command = { id: string; group: string; label: string; run: () => void }

const SECTIONS: { id: EditorSection; label: string }[] = [
  { id: 'personal', label: 'Thông tin cá nhân & Ảnh chân dung' },
  { id: 'summary', label: 'Giới thiệu' },
  { id: 'jobs', label: 'Kinh nghiệm' },
  { id: 'education', label: 'Học vấn' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'languages', label: 'Ngoại ngữ' },
  { id: 'extra', label: 'Mục phụ (Chứng chỉ & Dự án)' },
]

export function downloadJsonBackup(doc: Parameters<typeof exportCvToJson>[0]) {
  const url = URL.createObjectURL(new Blob([exportCvToJson(doc)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `Sao-luu-${fileSafeName(doc.data.name || doc.title)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function Palette({
  onClose,
  onOpenAudit,
  onOpenAddContent,
  onOpenShare,
  onOpenVersions,
}: {
  onClose: () => void
  onOpenAudit: (tab?: AuditTab) => void
  onOpenAddContent?: () => void
  onOpenShare?: () => void
  onOpenVersions?: () => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const { doc, setActiveSection, setActiveTab, updateDoc, undo, redo } = useEditorStore()

  const commands = useMemo<Command[]>(() => {
    const done = (fn: () => void) => () => {
      onClose()
      fn()
    }
    const currentLang = doc?.settings.documentLanguage ?? 'vi'
    return [
      ...SECTIONS.map<Command>((s) => ({
        id: `go-${s.id}`,
        group: 'Đi tới',
        label: s.label,
        run: done(() => {
          setActiveTab('content')
          setActiveSection(s.id)
        }),
      })),
      ...(doc?.data.customSections ?? []).map<Command>((cs) => ({
        id: `go-${cs.id}`,
        group: 'Đi tới',
        label: cs.title,
        run: done(() => {
          setActiveTab('content')
          setActiveSection(cs.id)
        }),
      })),
      ...(onOpenAddContent
        ? [
            {
              id: 'add-section',
              group: 'Thao tác',
              label: 'Thêm mục nội dung mới (Dự án, Chứng chỉ, Giải thưởng…)',
              run: done(onOpenAddContent),
            },
          ]
        : []),
      { id: 'pdf', group: 'Thao tác', label: 'Tải PDF', run: done(printDocument) },
      ...(doc
        ? [
            {
              id: 'docx',
              group: 'Thao tác',
              label: 'Xuất file Word (.docx)',
              run: done(() => triggerDocxDownload(buildResumeDocx(doc), `CV-${fileSafeName(doc.data.name || doc.title)}.docx`)),
            },
          ]
        : []),
      ...(onOpenShare
        ? [
            {
              id: 'share-cv',
              group: 'Thao tác',
              label: 'Chia sẻ Link CV Online (/p/slug) & Thống kê HR',
              run: done(onOpenShare),
            },
          ]
        : []),
      ...(onOpenVersions
        ? [
            {
              id: 'versions-cv',
              group: 'Thao tác',
              label: 'Xem lịch sử phiên bản CV',
              run: done(onOpenVersions),
            },
          ]
        : []),
      { id: 'audit', group: 'Thao tác', label: 'Soát lỗi & Kiểm tra CV', run: done(() => onOpenAudit('audit')) },
      { id: 'jd-match', group: 'Thao tác', label: 'Đối chiếu CV với tin tuyển dụng (JD)', run: done(() => onOpenAudit('jd')) },
      { id: 'ats-view', group: 'Thao tác', label: 'Xem văn bản chuẩn ATS', run: done(() => onOpenAudit('ats')) },
      {
        id: 'design',
        group: 'Thao tác',
        label: 'Mở tab Mẫu, sắp xếp mục và định dạng',
        run: done(() => setActiveTab('design')),
      },
      {
        id: 'toggle-lang',
        group: 'Thao tác',
        label: currentLang === 'vi' ? 'Chuyển tiêu đề mục sang Tiếng Anh (English)' : 'Chuyển tiêu đề mục sang Tiếng Việt',
        run: done(() =>
          updateDoc((d) => {
            d.settings.documentLanguage = currentLang === 'vi' ? 'en' : 'vi'
          }, 'Đổi ngôn ngữ tiêu đề CV'),
        ),
      },
      { id: 'undo', group: 'Thao tác', label: 'Hoàn tác', run: done(undo) },
      { id: 'redo', group: 'Thao tác', label: 'Làm lại', run: done(redo) },
      ...(doc ? [{ id: 'backup', group: 'Thao tác', label: 'Tải file sao lưu CV (.json)', run: done(() => downloadJsonBackup(doc)) }] : []),
      ...CV_TEMPLATES.map<Command>((t) => ({
        id: `tpl-${t.slug}`,
        group: 'Đổi mẫu',
        label: `${t.name} (${t.columns.toLowerCase()})`,
        run: done(() =>
          updateDoc((d) => {
            d.layout = t.layout
          }, `Đổi mẫu sang ${t.name}`),
        ),
      })),
    ]
  }, [doc, onClose, onOpenAddContent, onOpenAudit, onOpenShare, onOpenVersions, setActiveSection, setActiveTab, undo, redo, updateDoc])

  const results = commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
  const index = Math.min(active, Math.max(0, results.length - 1))

  const move = (next: number) => {
    const clamped = (next + results.length) % Math.max(1, results.length)
    setActive(clamped)
    listRef.current?.children[clamped]?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-control border border-rule px-3 focus-within:border-pen">
        <MagnifyingGlass size={18} className="text-ink-3" aria-hidden="true" />
        <input
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[index] ? `${listId}-${results[index].id}` : undefined}
          aria-label="Tìm lệnh"
          data-autofocus
          autoComplete="off"
          value={query}
          placeholder="Tìm lệnh, mục cần sửa, đối chiếu JD hoặc mẫu CV"
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              move(index + 1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              move(index - 1)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              results[index]?.run()
            }
          }}
          className="h-11 flex-1 bg-transparent text-base outline-none"
        />
      </div>

      {results.length === 0 ? (
        <p className="py-8 text-center text-ink-3">Không có lệnh nào khớp với “{query}”.</p>
      ) : (
        <ul ref={listRef} id={listId} role="listbox" aria-label="Lệnh" className="mt-3 max-h-80 overflow-y-auto p-0">
          {results.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${c.id}`}
              role="option"
              aria-selected={i === index}
              onMouseMove={() => setActive(i)}
              onClick={c.run}
              className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-control px-3 py-2.5 ${i === index ? 'bg-pen-wash' : ''}`}
            >
              <span className="font-medium">{c.label}</span>
              <span className="text-sm text-ink-3">{c.group}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CommandPaletteModal({
  open,
  onClose,
  onOpenAudit,
  onOpenAddContent,
  onOpenShare,
  onOpenVersions,
}: {
  open: boolean
  onClose: () => void
  onOpenAudit: (tab?: AuditTab) => void
  onOpenAddContent?: () => void
  onOpenShare?: () => void
  onOpenVersions?: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Lệnh nhanh" description="Gõ để tìm, dùng mũi tên và Enter để chọn.">
      <Palette
        onClose={onClose}
        onOpenAudit={onOpenAudit}
        onOpenAddContent={onOpenAddContent}
        onOpenShare={onOpenShare}
        onOpenVersions={onOpenVersions}
      />
    </Modal>
  )
}
