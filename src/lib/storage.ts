import { LETTER_TEMPLATES } from '@/data/letter-templates'
import { newId, type CvRecord } from '@/lib/cv-repository'
import type { JobApplication, LetterDocument } from '@/types/resume'

/*
  Cover letters and the job tracker are small, so they live in localStorage (CVs live in cv-repository).
  Reads validate their input and never throw; writes report failure instead of silently dropping data.
*/

export const LETTER_KEY = 'hsx_letter_documents'
export const APPLICATION_KEY = 'hsx_kanban_applications'

export function subscribeToStorageKey(key: string, onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (event: StorageEvent) => {
    if (event.key === null || event.key === key) onChange()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

function readList<T extends { id: string }>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is T => !!item && typeof item === 'object' && typeof item.id === 'string')
  } catch {
    return []
  }
}

function writeList<T>(key: string, list: T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

function upsert<T extends { id: string; updatedAt: string }>(key: string, doc: T): boolean {
  const list = readList<T>(key)
  const next = { ...doc, updatedAt: new Date().toISOString() }
  const index = list.findIndex((item) => item.id === doc.id)
  if (index >= 0) list[index] = next
  else list.unshift(next)
  return writeList(key, list)
}

// ---- cover letters ------------------------------------------------------------------------------------

export const getLetterList = () => readList<LetterDocument>(LETTER_KEY).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
export const getLetterById = (id: string) => readList<LetterDocument>(LETTER_KEY).find((l) => l.id === id) ?? null
export const saveLetterDocument = (doc: LetterDocument) => upsert(LETTER_KEY, doc)
export const deleteLetter = (id: string) =>
  writeList(
    LETTER_KEY,
    readList<LetterDocument>(LETTER_KEY).filter((l) => l.id !== id),
  )

export function duplicateLetter(id: string): LetterDocument | null {
  const original = getLetterById(id)
  if (!original) return null
  const now = new Date().toISOString()
  const copy: LetterDocument = {
    ...JSON.parse(JSON.stringify(original)),
    id: newId('let'),
    title: `${original.title} (bản sao)`,
    createdAt: now,
    updatedAt: now,
  }
  saveLetterDocument(copy)
  return copy
}

const formatLetterDate = (location: string) => {
  const now = new Date()
  const city = location.split(',').pop()?.trim() || '[Thành phố]'
  return `${city}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`
}

// Sender details come from the chosen CV. Without one, bracketed placeholders make the gaps obvious and the
// quality check flags any that are left, so a letter never goes out carrying someone else's name.
export function createLetterFromTemplate(templateSlug: string, title?: string, sourceCv?: CvRecord): LetterDocument {
  const template = LETTER_TEMPLATES.find((t) => t.slug === templateSlug) ?? LETTER_TEMPLATES[0]
  const now = new Date().toISOString()
  const d = sourceCv?.data
  const role = d?.role || '[Vị trí ứng tuyển]'

  return {
    id: newId('let'),
    title: title ?? `Thư xin việc ${template.name}`,
    layout: template.layout,
    accent: template.accent,
    paperSize: sourceCv?.settings.paperSize ?? 'a4',
    senderName: d?.name || '[Họ và tên]',
    senderRole: d?.role || '[Chức danh]',
    senderLocation: d?.location || '[Địa chỉ]',
    senderEmail: d?.email || '[Email]',
    senderPhone: d?.phone || '[Số điện thoại]',
    recipientTitle: 'Bộ phận Tuyển dụng',
    recipientCompany: '[Tên công ty]',
    dateStr: formatLetterDate(d?.location ?? ''),
    subject: `V/v: Ứng tuyển vị trí ${role}`,
    salutation: 'Kính gửi quý công ty,',
    paragraphs: [
      `Tôi viết thư này để ứng tuyển vị trí ${role} tại [Tên công ty]. [Một câu nói vì sao bạn quan tâm đến vị trí và công ty này.]`,
      '[Một đến hai thành tích gần nhất liên quan trực tiếp đến yêu cầu của tin tuyển dụng, kèm con số nếu có.]',
      'Tôi tin kinh nghiệm của mình sẽ đóng góp cho đội ngũ ngay từ những tuần đầu. Rất mong có cơ hội trao đổi thêm trong buổi phỏng vấn.',
    ],
    signOff: 'Trân trọng,',
    linkedCvId: sourceCv?.id,
    createdAt: now,
    updatedAt: now,
  }
}

// ---- job applications -----------------------------------------------------------------------------------

export const getApplications = () => readList<JobApplication>(APPLICATION_KEY)
export const saveAllApplications = (apps: JobApplication[]) => writeList(APPLICATION_KEY, apps)
export const deleteApplication = (id: string) =>
  writeList(
    APPLICATION_KEY,
    readList<JobApplication>(APPLICATION_KEY).filter((a) => a.id !== id),
  )

// Offered by an explicit "Thêm dữ liệu mẫu" button on an empty board, never added automatically.
export function sampleApplications(): JobApplication[] {
  const now = new Date().toISOString()
  const base = { createdAt: now, updatedAt: now, todos: [] as JobApplication['todos'] }
  return [
    {
      ...base,
      id: newId('app'),
      company: 'Công ty Cổ phần Ánh Dương',
      role: 'Chuyên viên Marketing',
      columnId: 'wishlist',
      location: 'Hà Nội',
      notes: 'Tin đăng trên LinkedIn, cần chuẩn bị thêm portfolio.',
    },
    {
      ...base,
      id: newId('app'),
      company: 'Công ty Cổ phần Thiên Phú',
      role: 'Trưởng nhóm Marketing',
      columnId: 'applied',
      location: 'Hà Nội',
      notes: 'Đã gửi kèm CV và thư xin việc qua email.',
      todos: [{ id: newId('todo'), text: 'Chờ phản hồi trong 5 ngày làm việc', done: false }],
    },
    {
      ...base,
      id: newId('app'),
      company: 'Hải Âu Retail',
      role: 'Chuyên viên Digital',
      columnId: 'interview',
      location: 'Hà Nội',
      interviewDate: 'Thứ Năm, 14:00',
      todos: [{ id: newId('todo'), text: 'In 2 bản CV mang theo', done: false }],
    },
  ]
}
