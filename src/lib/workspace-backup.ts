import { listCvs, newId, saveCv, type CvRecord } from '@/lib/cv-repository'
import { getApplications, getLetterList, saveAllApplications, saveLetterDocument } from '@/lib/storage'
import type { JobApplication, KanbanColumnId, LetterDocument } from '@/types/resume'
import { migrateToV2 } from '@/types/schema'

export type WorkspaceBackupPayload = {
  format: 'verocv-workspace'
  version: 1
  exportedAt: string
  cvs: CvRecord[]
  letters: LetterDocument[]
  applications: JobApplication[]
}

export type WorkspaceRestoreSummary = {
  cvs: number
  letters: number
  applications: number
}

const VALID_COLUMNS = new Set<KanbanColumnId>(['wishlist', 'applied', 'interview', 'offer', 'rejected'])
const VALID_LETTER_LAYOUTS = new Set(['thang', 'dai-mau', 'giua', 'le-trai'])
const VALID_LETTER_ACCENTS = new Set(['ink', 'pen', 'kraft'])

export async function exportWorkspaceToJson(): Promise<string> {
  const [cvs, letters, applications] = await Promise.all([listCvs(), Promise.resolve(getLetterList()), Promise.resolve(getApplications())])
  const payload: WorkspaceBackupPayload = {
    format: 'verocv-workspace',
    version: 1,
    exportedAt: new Date().toISOString(),
    cvs,
    letters,
    applications,
  }
  return JSON.stringify(payload, null, 2)
}

export async function downloadWorkspaceBackup(): Promise<void> {
  const json = await exportWorkspaceToJson()
  const date = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `VeroCV-Sao-luu-${date}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function sanitizeLetter(raw: unknown, cvIdMap: Map<string, string>, existingIds: Set<string>): LetterDocument | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const now = new Date().toISOString()
  const origId = typeof r.id === 'string' && r.id ? r.id : newId('let')
  const id = existingIds.has(origId) ? newId('let') : origId
  const linkedCvId = typeof r.linkedCvId === 'string' ? (cvIdMap.get(r.linkedCvId) ?? r.linkedCvId) : undefined

  return {
    id,
    title: typeof r.title === 'string' && r.title.trim() ? r.title : 'Thư xin việc (khôi phục)',
    layout: VALID_LETTER_LAYOUTS.has(String(r.layout)) ? (r.layout as LetterDocument['layout']) : 'thang',
    accent: VALID_LETTER_ACCENTS.has(String(r.accent)) ? (r.accent as LetterDocument['accent']) : 'pen',
    paperSize: r.paperSize === 'letter' ? 'letter' : 'a4',
    senderName: typeof r.senderName === 'string' ? r.senderName : '',
    senderRole: typeof r.senderRole === 'string' ? r.senderRole : '',
    senderLocation: typeof r.senderLocation === 'string' ? r.senderLocation : '',
    senderEmail: typeof r.senderEmail === 'string' ? r.senderEmail : '',
    senderPhone: typeof r.senderPhone === 'string' ? r.senderPhone : '',
    recipientTitle: typeof r.recipientTitle === 'string' ? r.recipientTitle : 'Bộ phận Tuyển dụng',
    recipientCompany: typeof r.recipientCompany === 'string' ? r.recipientCompany : '',
    dateStr: typeof r.dateStr === 'string' ? r.dateStr : '',
    subject: typeof r.subject === 'string' ? r.subject : '',
    salutation: typeof r.salutation === 'string' ? r.salutation : undefined,
    paragraphs: Array.isArray(r.paragraphs) ? r.paragraphs.filter((p): p is string => typeof p === 'string') : [''],
    signOff: typeof r.signOff === 'string' ? r.signOff : 'Trân trọng,',
    linkedCvId,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
    updatedAt: now,
  }
}

function sanitizeApplication(
  raw: unknown,
  cvIdMap: Map<string, string>,
  letterIdMap: Map<string, string>,
  existingIds: Set<string>,
): JobApplication | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.company !== 'string' || !r.company.trim() || typeof r.role !== 'string' || !r.role.trim()) return null

  const now = new Date().toISOString()
  const origId = typeof r.id === 'string' && r.id ? r.id : newId('app')
  const id = existingIds.has(origId) ? newId('app') : origId
  const col = VALID_COLUMNS.has(r.columnId as KanbanColumnId) ? (r.columnId as KanbanColumnId) : 'wishlist'

  const todos = Array.isArray(r.todos)
    ? r.todos
        .filter((t): t is { id?: unknown; text: string; done?: unknown } => !!t && typeof (t as { text?: unknown }).text === 'string')
        .map((t) => ({
          id: typeof t.id === 'string' && t.id ? t.id : newId('todo'),
          text: t.text,
          done: Boolean(t.done),
        }))
    : []

  return {
    id,
    company: r.company.trim(),
    role: r.role.trim(),
    columnId: col,
    salary: typeof r.salary === 'string' && r.salary.trim() ? r.salary.trim() : undefined,
    location: typeof r.location === 'string' && r.location.trim() ? r.location.trim() : undefined,
    url: typeof r.url === 'string' && r.url.trim() ? r.url.trim() : undefined,
    notes: typeof r.notes === 'string' && r.notes.trim() ? r.notes.trim() : undefined,
    appliedDate: typeof r.appliedDate === 'string' && r.appliedDate.trim() ? r.appliedDate.trim() : undefined,
    interviewDate: typeof r.interviewDate === 'string' && r.interviewDate.trim() ? r.interviewDate.trim() : undefined,
    linkedCvId: typeof r.linkedCvId === 'string' ? (cvIdMap.get(r.linkedCvId) ?? r.linkedCvId) : undefined,
    linkedLetterId: typeof r.linkedLetterId === 'string' ? (letterIdMap.get(r.linkedLetterId) ?? r.linkedLetterId) : undefined,
    todos,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
    updatedAt: now,
  }
}

/*
  Restores a full workspace archive (or a single CV .json backup) non-destructively:
  never overwrites existing documents, and preserves links between imported CVs, Cover Letters, and Kanban cards.
*/
export async function importWorkspaceFromJson(jsonText: string): Promise<WorkspaceRestoreSummary> {
  const parsed: unknown = JSON.parse(jsonText)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('File sao lưu không hợp lệ.')
  }

  const obj = parsed as Record<string, unknown>

  // Support both VeroCV and legacy Hồ Sơ Xanh workspace backups, as well as single-CV backups.
  if (obj.format !== 'verocv-workspace' && obj.format !== 'ho-so-xanh-workspace') {
    const singleCv = migrateToV2(obj)
    const now = new Date().toISOString()
    await saveCv({
      ...singleCv,
      id: newId('cv'),
      title: `${singleCv.title} (khôi phục)`,
      createdAt: now,
      updatedAt: now,
    })
    return { cvs: 1, letters: 0, applications: 0 }
  }

  const existingCvIds = new Set((await listCvs()).map((c) => c.id))
  const existingLetterIds = new Set(getLetterList().map((l) => l.id))
  const existingApps = getApplications()
  const existingAppIds = new Set(existingApps.map((a) => a.id))

  const cvIdMap = new Map<string, string>()
  const letterIdMap = new Map<string, string>()

  let cvCount = 0
  if (Array.isArray(obj.cvs)) {
    for (const rawCv of obj.cvs) {
      try {
        const doc = migrateToV2(rawCv)
        const nextId = existingCvIds.has(doc.id) ? newId('cv') : doc.id
        cvIdMap.set(doc.id, nextId)
        existingCvIds.add(nextId)
        await saveCv({
          ...doc,
          id: nextId,
          updatedAt: new Date().toISOString(),
        })
        cvCount++
      } catch {
        // Skip malformed entry while restoring valid ones.
      }
    }
  }

  let letterCount = 0
  if (Array.isArray(obj.letters)) {
    for (const rawLetter of obj.letters) {
      const origId = typeof (rawLetter as { id?: unknown })?.id === 'string' ? (rawLetter as { id: string }).id : ''
      const clean = sanitizeLetter(rawLetter, cvIdMap, existingLetterIds)
      if (!clean) continue
      if (origId) letterIdMap.set(origId, clean.id)
      existingLetterIds.add(clean.id)
      saveLetterDocument(clean)
      letterCount++
    }
  }

  const importedApps: JobApplication[] = []
  if (Array.isArray(obj.applications)) {
    for (const rawApp of obj.applications) {
      const clean = sanitizeApplication(rawApp, cvIdMap, letterIdMap, existingAppIds)
      if (!clean) continue
      existingAppIds.add(clean.id)
      importedApps.push(clean)
    }
  }
  if (importedApps.length > 0) {
    saveAllApplications([...importedApps, ...existingApps])
  }

  if (cvCount === 0 && letterCount === 0 && importedApps.length === 0) {
    throw new Error('File sao lưu trống hoặc không có dữ liệu hợp lệ.')
  }

  return { cvs: cvCount, letters: letterCount, applications: importedApps.length }
}
