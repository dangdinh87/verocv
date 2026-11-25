'use client'

import { ArrowRight, CheckSquare, CopySimple, DownloadSimple, Plus, Sparkle, Square, Trash } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { CvRecord } from '@/lib/cv-repository'
import { newId, saveCv } from '@/lib/cv-repository'
import { KANBAN_COLUMNS } from '@/lib/kanban'
import type { JdTailorOutput } from '@/server/ai/local-fallback'
import { DEFAULT_CV_SETTINGS, getPersonaData, type InterviewPrepQuestion, type JobApplication, type JobTodo, type KanbanColumnId, type LetterDocument } from '@/types/resume'
import { migrateToV2 } from '@/types/schema'

type Props = {
  open: boolean
  application: JobApplication | null
  initialDraft?: Partial<JobApplication> | null
  defaultColumn: KanbanColumnId
  cvs: CvRecord[]
  letters: LetterDocument[]
  onClose: () => void
  onSave: (app: JobApplication) => void
  onDelete: (id: string) => void
}

type DialogTab = 'info' | 'interview'

const asDateInput = (value: string | undefined, withTime: boolean) => {
  const pattern = withTime ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/
  return value && pattern.test(value) ? value : ''
}

function ApplicationForm({ application, initialDraft, defaultColumn, cvs, letters, onClose, onSave, onDelete }: Omit<Props, 'open'>) {
  const seed = application ?? initialDraft ?? null
  const router = useRouter()
  const [tab, setTab] = useState<DialogTab>('info')
  const [company, setCompany] = useState(seed?.company ?? '')
  const [role, setRole] = useState(seed?.role ?? '')
  const [column, setColumn] = useState<KanbanColumnId>(seed?.columnId ?? defaultColumn)
  const [salary, setSalary] = useState(seed?.salary ?? '')
  const [location, setLocation] = useState(seed?.location ?? '')
  const [url, setUrl] = useState(seed?.url ?? '')
  const [jdText, setJdText] = useState(seed?.jdText ?? '')
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepQuestion[]>(seed?.interviewPrep ?? [])
  const [appliedDate, setAppliedDate] = useState(asDateInput(seed?.appliedDate, false))
  const [interviewDate, setInterviewDate] = useState(asDateInput(seed?.interviewDate, true))
  const [notes, setNotes] = useState(seed?.notes ?? '')
  const [cvId, setCvId] = useState(seed?.linkedCvId ?? '')
  const [letterId, setLetterId] = useState(seed?.linkedLetterId ?? '')
  const [todos, setTodos] = useState<JobTodo[]>(seed?.todos ?? [])
  const [todoText, setTodoText] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [clipping, setClipping] = useState(false)
  const [prepLoading, setPrepLoading] = useState(false)
  const [tailorBusy, setTailorBusy] = useState(false)
  const [clipMsg, setClipMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addTodo = () => {
    const text = todoText.trim()
    if (!text) return
    setTodos([...todos, { id: newId('todo'), text, done: false }])
    setTodoText('')
  }

  const clipFromUrl = async () => {
    if (!url.trim()) {
      setClipMsg('Hãy dán đường dẫn tin tuyển dụng vào ô trên trước.')
      return
    }
    setClipping(true)
    setClipMsg(null)
    try {
      const res = await fetch('/api/jobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const json = (await res.json()) as {
        job?: { company?: string; role?: string; salary?: string; location?: string; jdText?: string }
        error?: string
      }
      if (!res.ok || !json.job) {
        setClipMsg(json.error || 'Không hút được thông tin từ đường dẫn này.')
        return
      }
      if (json.job.company && !company.trim()) setCompany(json.job.company)
      if (json.job.role && !role.trim()) setRole(json.job.role)
      if (json.job.salary && !salary.trim()) setSalary(json.job.salary)
      if (json.job.location && !location.trim()) setLocation(json.job.location)
      if (json.job.jdText) setJdText(json.job.jdText)
      setClipMsg('Đã trích xuất thông tin & lưu bản chụp JD!')
    } catch {
      setClipMsg('Lỗi kết nối khi trích xuất tin tuyển dụng.')
    } finally {
      setClipping(false)
    }
  }

  const generateInterviewPrep = async () => {
    setPrepLoading(true)
    setError(null)
    try {
      const linkedCv = cvs.find((c) => c.id === cvId) ?? cvs[0]
      const res = await fetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: linkedCv?.data,
          jdText,
          company,
          role,
          lang: linkedCv?.settings.documentLanguage ?? 'vi',
        }),
      })
      const json = (await res.json()) as { data?: { questions?: InterviewPrepQuestion[] }; error?: string }
      if (!res.ok || !json.data?.questions) {
        setError(json.error || 'Không tạo được bộ câu hỏi phỏng vấn lúc này.')
        return
      }
      setInterviewPrep(json.data.questions)
    } catch {
      setError('Lỗi kết nối tới máy chủ AI.')
    } finally {
      setPrepLoading(false)
    }
  }

  const createTailoredCvVariant = async () => {
    if (jdText.trim().length < 20) {
      setError('Vui lòng dán nội dung JD (tối thiểu 20 ký tự) trước khi tạo biến thể CV.')
      return
    }
    setTailorBusy(true)
    setError(null)
    try {
      const now = new Date().toISOString()
      const masterOrFirst = cvs.find((c) => c.id === cvId) ?? cvs.find((c) => c.isMaster) ?? cvs[0]
      const baseCv: CvRecord =
        masterOrFirst ??
        migrateToV2({
          id: newId('cv'),
          title: 'CV chính',
          layout: 'ke-ngang',
          settings: { ...DEFAULT_CV_SETTINGS },
          data: getPersonaData('minh-anh'),
          createdAt: now,
          updatedAt: now,
        })

      const lang = baseCv.settings.documentLanguage ?? 'vi'
      const res = await fetch('/api/ai/tailor-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: baseCv.data, jdText, lang }),
      })
      const json = (await res.json()) as { data?: JdTailorOutput; error?: string }
      if (!res.ok || !json.data) {
        setError(json.error || 'Không thể tối ưu CV theo JD này lúc này.')
        return
      }

      const suffix = [company.trim(), role.trim()].filter(Boolean).join(' — ') || 'Tailored JD'
      const cloned = migrateToV2({
        ...JSON.parse(JSON.stringify(baseCv)),
        id: newId('cv'),
        title: `${baseCv.title} (${suffix})`,
        isMaster: false,
        parentCvId: masterOrFirst ? baseCv.id : null,
        createdAt: now,
        updatedAt: now,
      })

      if (json.data.suggestedSummary?.trim()) {
        cloned.data.summary = json.data.suggestedSummary.trim()
      }
      for (const b of json.data.bulletRewrites) {
        const job = cloned.data.jobs[b.jobIndex]
        if (job && typeof job.bullets[b.bulletIndex] === 'string' && b.improved.trim()) {
          job.bullets[b.bulletIndex] = b.improved.trim()
        }
      }

      await saveCv(cloned)
      setCvId(cloned.id)

      if (company.trim() && role.trim()) {
        onSave({
          id: application?.id ?? newId('app'),
          company: company.trim(),
          role: role.trim(),
          columnId: column,
          salary: salary.trim() || undefined,
          location: location.trim() || undefined,
          url: url.trim() || undefined,
          jdText: jdText.trim() || undefined,
          interviewPrep: interviewPrep.length > 0 ? interviewPrep : undefined,
          appliedDate: appliedDate || undefined,
          interviewDate: interviewDate || undefined,
          notes: notes.trim() || undefined,
          linkedCvId: cloned.id,
          linkedLetterId: letterId || undefined,
          todos,
          createdAt: application?.createdAt ?? now,
          updatedAt: now,
        })
      } else {
        onClose()
      }

      router.push(`/cv/${cloned.id}`)
    } catch {
      setError('Không thể kết nối máy chủ AI để tạo biến thể CV.')
    } finally {
      setTailorBusy(false)
    }
  }

  const interviewRoomHref = application?.id
    ? `/luyen-phong-van?appId=${encodeURIComponent(application.id)}`
    : `/luyen-phong-van?company=${encodeURIComponent(company.trim())}&role=${encodeURIComponent(role.trim())}`

  const submit = () => {
    if (!company.trim() || !role.trim()) {
      setTab('info')
      setError('Hãy điền tên công ty và vị trí ứng tuyển.')
      return
    }
    const now = new Date().toISOString()
    onSave({
      id: application?.id ?? newId('app'),
      company: company.trim(),
      role: role.trim(),
      columnId: column,
      salary: salary.trim() || undefined,
      location: location.trim() || undefined,
      url: url.trim() || undefined,
      jdText: jdText.trim() || undefined,
      interviewPrep: interviewPrep.length > 0 ? interviewPrep : undefined,
      appliedDate: appliedDate || undefined,
      interviewDate: interviewDate || undefined,
      notes: notes.trim() || undefined,
      linkedCvId: cvId || undefined,
      linkedLetterId: letterId || undefined,
      todos,
      createdAt: application?.createdAt ?? now,
      updatedAt: now,
    })
  }

  const tabs: TabItem<DialogTab>[] = [
    { id: 'info', label: 'Thông tin & Checklist' },
    { id: 'interview', label: `Luyện phỏng vấn AI (${interviewPrep.length})` },
  ]

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-5"
    >
      <Tabs label="Chi tiết vị trí ứng tuyển" tabs={tabs} value={tab} onChange={setTab}>
        {tab === 'info' ? (
          <div className="space-y-5">
            <div className="rounded-control border border-rule bg-desk p-3.5">
              <div className="flex flex-wrap items-end gap-2">
                <TextField
                  className="flex-1"
                  label="Đường dẫn tin tuyển dụng (Job URL Clipper)"
                  type="url"
                  inputMode="url"
                  optional
                  placeholder="https://itviec.com/... hoặc link tuyển dụng"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button type="button" variant="secondary" disabled={clipping} onClick={() => void clipFromUrl()} className="mb-0.5 shrink-0 gap-1.5">
                  <DownloadSimple size={15} weight="bold" aria-hidden="true" />
                  {clipping ? 'Đang hút JD…' : 'Hút thông tin'}
                </Button>
              </div>
              {clipMsg && <p className="mt-2 text-xs font-semibold text-pen">{clipMsg}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Công ty" value={company} onChange={(e) => setCompany(e.target.value)} data-autofocus required />
              <TextField label="Vị trí ứng tuyển" value={role} onChange={(e) => setRole(e.target.value)} required />
              <SelectField label="Trạng thái" value={column} onChange={(e) => setColumn(e.target.value as KanbanColumnId)}>
                {KANBAN_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <TextField label="Mức lương" placeholder="18 - 25 triệu" optional value={salary} onChange={(e) => setSalary(e.target.value)} />
              <TextField label="Địa điểm" optional value={location} onChange={(e) => setLocation(e.target.value)} />
              <TextField label="Ngày nộp" type="date" optional value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
              <TextField
                label="Lịch phỏng vấn"
                type="datetime-local"
                optional
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>

            {(cvs.length > 0 || letters.length > 0) && (
              <div className="grid gap-4 border-t border-rule pt-5 sm:grid-cols-2">
                <SelectField label="CV đã dùng" value={cvId} onChange={(e) => setCvId(e.target.value)}>
                  <option value="">Không chọn</option>
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Thư xin việc đã dùng" value={letterId} onChange={(e) => setLetterId(e.target.value)}>
                  <option value="">Không chọn</option>
                  {letters.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </SelectField>
              </div>
            )}

            <div className="space-y-3">
              <TextAreaField
                label="Bản chụp Mô tả công việc (JD)"
                rows={3}
                optional
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Lưu lại nội dung JD phòng khi tin tuyển dụng hết hạn trước ngày phỏng vấn…"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-pen/30 bg-pen-wash/40 px-3.5 py-2.5">
                <p className="text-xs text-ink-2">
                  Tạo bản sao CV được AI viết lại Summary &amp; thành tích khớp trực tiếp với JD này.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={tailorBusy || jdText.trim().length < 20}
                    onClick={() => void createTailoredCvVariant()}
                    className="gap-1.5"
                  >
                    <CopySimple size={14} weight="bold" aria-hidden="true" />
                    {tailorBusy ? 'Đang tạo biến thể CV…' : 'Tạo biến thể CV khớp JD này'}
                  </Button>
                  <Button href={interviewRoomHref} variant="secondary" size="sm" className="gap-1">
                    Mở phòng Luyện phỏng vấn AI
                    <ArrowRight size={13} weight="bold" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>

            <fieldset className="border-t border-rule pt-5">
              <legend className="text-base font-bold">Việc cần làm</legend>
              <ul className="mt-3 space-y-2 p-0">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex list-none items-center gap-2">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={todo.done}
                      aria-label={`Đã xong: ${todo.text}`}
                      onClick={() => setTodos(todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))}
                      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control hover:bg-ink/[0.06]"
                    >
                      {todo.done ? <CheckSquare size={20} weight="fill" className="text-pen" /> : <Square size={20} className="text-ink-3" />}
                    </button>
                    <input
                      aria-label="Nội dung việc cần làm"
                      value={todo.text}
                      onChange={(e) => setTodos(todos.map((t) => (t.id === todo.id ? { ...t, text: e.target.value } : t)))}
                      className={`h-10 min-w-0 flex-1 rounded-control border border-rule px-3 text-base ${todo.done ? 'text-ink-3 line-through' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setTodos(todos.filter((t) => t.id !== todo.id))}
                      aria-label={`Xoá việc ${todo.text}`}
                      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-seal hover:bg-seal/10"
                    >
                      <Trash size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <input
                  aria-label="Thêm việc cần làm"
                  value={todoText}
                  placeholder="Gửi thư cảm ơn, chuẩn bị câu hỏi phỏng vấn…"
                  onChange={(e) => setTodoText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTodo()
                    }
                  }}
                  className="h-11 min-w-0 flex-1 rounded-control border border-rule px-3 text-base"
                />
                <Button type="button" variant="secondary" onClick={addTodo} className="shrink-0 gap-1.5">
                  <Plus size={15} weight="bold" aria-hidden="true" />
                  Thêm
                </Button>
              </div>
            </fieldset>

            <TextAreaField
              label="Ghi chú"
              rows={2}
              optional
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Người phỏng vấn, mức lương đã trao đổi, điều cần hỏi thêm…"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-rule bg-desk p-4">
              <div>
                <p className="font-bold text-ink">Bộ câu hỏi phỏng vấn thực chiến (STAR)</p>
                <p className="text-xs text-ink-3">AI đối chiếu CV bạn đã gắn với JD của {company || 'công ty này'} để dự đoán câu hỏi.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button href={interviewRoomHref} variant="secondary" size="sm" className="gap-1">
                  Mở phòng Luyện phỏng vấn AI
                  <ArrowRight size={13} weight="bold" aria-hidden="true" />
                </Button>
                <Button type="button" size="sm" disabled={prepLoading} onClick={() => void generateInterviewPrep()} className="gap-1.5">
                  <Sparkle size={15} weight="fill" aria-hidden="true" />
                  {prepLoading ? 'Đang tạo câu hỏi…' : interviewPrep.length > 0 ? 'Tạo lại bộ câu hỏi' : 'Sinh 8 câu hỏi AI'}
                </Button>
              </div>
            </div>

            {interviewPrep.length === 0 ? (
              <p className="rounded-control border border-dashed border-rule p-6 text-center text-sm text-ink-3">
                Bấm “Sinh 8 câu hỏi AI” để nhận câu hỏi phỏng vấn sát vị trí và gợi ý trả lời theo mô hình Situation–Task–Action–Result.
              </p>
            ) : (
              <ol className="space-y-3 p-0">
                {interviewPrep.map((item, idx) => (
                  <li key={idx} className="list-none rounded-control border border-rule bg-paper p-4">
                    <p className="font-semibold text-ink">
                      {idx + 1}. {item.question}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                      <strong className="text-pen">Gợi ý STAR:</strong> {item.hint}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Tabs>

      {error && (
        <p role="alert" className="text-seal">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
        {application ? (
          confirmDelete ? (
            <span className="flex items-center gap-2">
              <span className="text-ink-2">Xoá hẳn vị trí này?</span>
              <button
                type="button"
                onClick={() => onDelete(application.id)}
                className="h-10 cursor-pointer rounded-control bg-seal px-4 font-semibold text-white hover:opacity-90"
              >
                Xoá
              </button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Giữ lại
              </Button>
            </span>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} className="gap-1.5 text-seal">
              <Trash size={16} aria-hidden="true" />
              Xoá vị trí
            </Button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit">Lưu</Button>
        </div>
      </div>
    </form>
  )
}

export function ApplicationDialog(props: Props) {
  const formKey =
    props.application?.id ??
    (props.initialDraft
      ? `draft-${props.initialDraft.url ?? ''}-${props.initialDraft.company ?? ''}-${props.initialDraft.role ?? ''}`
      : `new-${props.defaultColumn}`)
  return (
    <Modal open={props.open} onClose={props.onClose} title={props.application ? 'Sửa vị trí ứng tuyển' : 'Thêm vị trí ứng tuyển'} size="lg">
      <ApplicationForm key={formKey} {...props} />
    </Modal>
  )
}
