'use client'

import { ArrowLeft, ArrowRight, Eye, EyeSlash, Plus, Sparkle, Trash, X } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { newId } from '@/lib/cv-repository'
import { useEditorStore } from '@/store/editor-store'

export function SkillsSectionFields({ onSuggest }: { onSuggest: () => void }) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const [draft, setDraft] = useState('')
  const [groupMode, setGroupMode] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupItems, setGroupItems] = useState('')
  if (!doc) return null
  const skills = doc.data.skills

  const add = () => {
    const candidates = draft
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (candidates.length === 0) {
      setDraft('')
      return
    }
    updateDoc((d) => {
      for (const value of candidates) {
        if (!d.data.skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
          d.data.skills.push(value)
        }
      }
    }, 'Thêm kỹ năng')
    setDraft('')
  }

  const addGroupedSkill = () => {
    const cat = groupName.trim().replace(/:+$/, '')
    const items = groupItems
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!cat || items.length === 0) return
    const combined = `${cat}: ${items.join(', ')}`
    updateDoc((d) => {
      if (!d.data.skills.some((s) => s.toLowerCase() === combined.toLowerCase())) {
        d.data.skills.push(combined)
      }
    }, 'Thêm nhóm kỹ năng')
    setGroupName('')
    setGroupItems('')
  }

  const moveSkill = (index: number, delta: -1 | 1) => {
    const next = index + delta
    if (next < 0 || next >= skills.length) return
    updateDoc((d) => {
      const list = [...d.data.skills]
      const [item] = list.splice(index, 1)
      list.splice(next, 0, item)
      d.data.skills = list
    }, 'Sắp xếp thứ tự kỹ năng')
  }

  return (
    <div className="space-y-3">
      {skills.length > 0 && (
        <ul className="flex flex-wrap gap-2 p-0">
          {skills.map((skill, i) => (
            <li
              key={`${skill}-${i}`}
              className="flex list-none items-center gap-0.5 rounded-full border border-rule bg-desk py-1 pl-2.5 pr-1 text-[0.9rem]"
            >
              <button
                type="button"
                onClick={() => moveSkill(i, -1)}
                disabled={i === 0}
                aria-label={`Di chuyển kỹ năng ${skill} sang trái`}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:bg-ink/[0.08] hover:text-ink disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowLeft size={12} weight="bold" />
              </button>
              <span className="px-1">{skill}</span>
              <button
                type="button"
                onClick={() => moveSkill(i, 1)}
                disabled={i === skills.length - 1}
                aria-label={`Di chuyển kỹ năng ${skill} sang phải`}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:bg-ink/[0.08] hover:text-ink disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowRight size={12} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() =>
                  updateDoc((d) => {
                    d.data.skills = d.data.skills.filter((_, idx) => idx !== i)
                  }, 'Xoá kỹ năng')
                }
                aria-label={`Xoá kỹ năng ${skill}`}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:bg-ink/[0.08] hover:text-seal"
              >
                <X size={13} weight="bold" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
        className="flex items-end gap-2"
      >
        <TextField
          className="flex-1"
          label="Thêm kỹ năng"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ví dụ: Quản lý dự án, Excel, SQL"
          hint="Có thể nhập nhiều kỹ năng cùng lúc, ngăn cách bằng dấu phẩy."
        />
        <Button type="submit" variant="secondary" className="mb-[1.625rem] shrink-0">
          Thêm
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSuggest} className="gap-1.5 text-pen">
          <Sparkle size={14} weight="fill" aria-hidden="true" />
          Gợi ý theo vị trí ứng tuyển
        </Button>
        <button
          type="button"
          onClick={() => setGroupMode((v) => !v)}
          aria-expanded={groupMode}
          className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control border px-3 text-xs font-semibold transition-colors ${
            groupMode ? 'border-pen bg-pen-wash text-pen' : 'border-rule bg-desk text-ink-2 hover:border-pen hover:text-ink'
          }`}
        >
          <Plus size={13} weight="bold" aria-hidden="true" />
          Thêm theo nhóm (VD: Backend: Go, SQL)
        </button>
      </div>

      {groupMode && (
        <div className="space-y-3 rounded-control border border-rule bg-desk p-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <TextField
              label="Tên nhóm kỹ năng"
              placeholder="VD: Backend"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <TextField
              label="Kỹ năng trong nhóm (cách nhau dấu phẩy)"
              placeholder="VD: Go, PostgreSQL, Redis"
              value={groupItems}
              onChange={(e) => setGroupItems(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-ink-3">
              Hiển thị: <strong className="text-ink">{groupName.trim() ? `${groupName.trim()}: ${groupItems.trim() || '…'}` : 'Tên nhóm: Kỹ năng 1, Kỹ năng 2'}</strong>
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={!groupName.trim() || !groupItems.trim()}
              onClick={addGroupedSkill}
              className="gap-1"
            >
              <Plus size={13} weight="bold" aria-hidden="true" />
              Thêm nhóm
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function LanguagesSectionFields() {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  if (!doc) return null

  const setProficiency = (langId: string, level: number) =>
    updateDoc((d) => {
      const t = d.data.languages.find((l) => l.id === langId)
      if (t) t.proficiency = level
    }, 'Sửa mức thành thạo ngoại ngữ')

  return (
    <div className="space-y-3">
      {doc.data.languages.map((lang, i) => {
        const score = lang.proficiency ?? 0
        return (
          <div key={lang.id} className={`space-y-2.5 rounded-control border border-rule bg-paper p-3 ${lang.hidden ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-end gap-2">
              <TextField
                className="min-w-[8rem] flex-1"
                label={`Ngôn ngữ ${i + 1}`}
                placeholder="Tiếng Anh"
                value={lang.name}
                onChange={(e) =>
                  updateDoc((d) => {
                    const t = d.data.languages.find((l) => l.id === lang.id)
                    if (t) t.name = e.target.value
                  }, 'Sửa ngoại ngữ')
                }
              />
              <TextField
                className="min-w-[8rem] flex-1"
                label="Trình độ"
                placeholder="IELTS 7.0"
                value={lang.level}
                onChange={(e) =>
                  updateDoc((d) => {
                    const t = d.data.languages.find((l) => l.id === lang.id)
                    if (t) t.level = e.target.value
                  }, 'Sửa trình độ')
                }
              />
              <div className="flex shrink-0 items-center gap-1 pb-0.5">
                <button
                  type="button"
                  onClick={() =>
                    updateDoc(
                      (d) => {
                        const t = d.data.languages.find((l) => l.id === lang.id)
                        if (t) t.hidden = !t.hidden
                      },
                      lang.hidden ? 'Hiện ngoại ngữ' : 'Ẩn ngoại ngữ',
                    )
                  }
                  aria-label={lang.hidden ? `Hiện ngôn ngữ ${i + 1}` : `Ẩn ngôn ngữ ${i + 1}`}
                  title={lang.hidden ? 'Hiện lại trên CV' : 'Ẩn tạm trên CV'}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                >
                  {lang.hidden ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateDoc((d) => {
                      d.data.languages = d.data.languages.filter((l) => l.id !== lang.id)
                    }, 'Xoá ngoại ngữ')
                  }
                  aria-label={`Xoá ngôn ngữ ${i + 1}`}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-control text-seal hover:bg-seal/10"
                >
                  <Trash size={17} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-2">
              <span className="text-xs font-semibold text-ink-3">Thang chấm trên CV:</span>
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Mức độ thành thạo ${lang.name || `ngôn ngữ ${i + 1}`}`}>
                <div className="inline-flex items-center gap-1 rounded-full border border-rule bg-desk px-2 py-1">
                  {[1, 2, 3, 4, 5].map((dot) => {
                    const filled = dot <= score
                    return (
                      <button
                        key={dot}
                        type="button"
                        onClick={() => setProficiency(lang.id, dot)}
                        aria-label={`${dot}/5`}
                        aria-pressed={score === dot}
                        title={`Mức ${dot}/5`}
                        className="flex size-5 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110"
                      >
                        <span
                          className={`size-3 rounded-full border transition-colors ${
                            filled ? 'border-pen bg-pen' : 'border-ink/30 bg-paper'
                          }`}
                        />
                      </button>
                    )
                  })}
                  <span className="ml-1 text-xs font-bold tabular-nums text-ink-2">{score > 0 ? `${score}/5` : 'Tắt'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProficiency(lang.id, 0)}
                  aria-pressed={score === 0}
                  className={`h-7 cursor-pointer rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                    score === 0 ? 'border-ink bg-ink text-white' : 'border-rule bg-paper text-ink-3 hover:text-ink'
                  }`}
                >
                  Ẩn vạch
                </button>
              </div>
            </div>
          </div>
        )
      })}
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          updateDoc((d) => {
            d.data.languages.push({ id: newId('lang'), name: '', level: '', proficiency: 0, hidden: false })
          }, 'Thêm ngoại ngữ')
        }
        className="gap-1.5"
      >
        <Plus size={14} weight="bold" aria-hidden="true" />
        Thêm ngoại ngữ
      </Button>
    </div>
  )
}

export function ExtraSectionFields() {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  if (!doc) return null

  return (
    <div className="space-y-3">
      <TextField
        label="Tên mục hiển thị"
        hint="Ví dụ: Chứng chỉ, Dự án, Hoạt động."
        value={doc.data.extra.title}
        onChange={(e) =>
          updateDoc((d) => {
            d.data.extra.title = e.target.value
          }, 'Sửa tên mục phụ')
        }
      />
      {doc.data.extra.items.map((item, i) => (
        <div key={i} className="flex items-end gap-2">
          <TextField
            className="flex-1"
            label={`Dòng ${i + 1}`}
            value={item}
            onChange={(e) =>
              updateDoc((d) => {
                d.data.extra.items[i] = e.target.value
              }, 'Sửa mục phụ')
            }
          />
          <button
            type="button"
            onClick={() =>
              updateDoc((d) => {
                d.data.extra.items = d.data.extra.items.filter((_, idx) => idx !== i)
              }, 'Xoá dòng mục phụ')
            }
            aria-label={`Xoá dòng ${i + 1}`}
            className="mb-0.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-seal hover:bg-seal/10"
          >
            <Trash size={17} />
          </button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          updateDoc((d) => {
            d.data.extra.items.push('')
          }, 'Thêm dòng mục phụ')
        }
        className="gap-1.5"
      >
        <Plus size={14} weight="bold" aria-hidden="true" />
        Thêm dòng
      </Button>
    </div>
  )
}

export function SkillsLanguagesForm({ onSuggestSkills }: { onSuggestSkills: () => void }) {
  return (
    <div className="space-y-6">
      <SkillsSectionFields onSuggest={onSuggestSkills} />
      <div className="border-t border-rule pt-6">
        <h3 className="mb-3 text-base font-bold">Ngoại ngữ</h3>
        <LanguagesSectionFields />
      </div>
      <div className="border-t border-rule pt-6">
        <h3 className="mb-3 text-base font-bold">Mục phụ</h3>
        <ExtraSectionFields />
      </div>
    </div>
  )
}
