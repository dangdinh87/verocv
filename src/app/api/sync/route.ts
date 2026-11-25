import { z } from 'zod'
import { getCurrentUser } from '@/server/auth'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'
import type { JobApplication, LetterDocument } from '@/types/resume'
import { migrateToV2, type ResumeDocumentV2 } from '@/types/schema'

const SyncPayloadSchema = z.object({
  cvs: z.array(z.unknown()).default([]),
  letters: z.array(z.unknown()).default([]),
  applications: z.array(z.unknown()).default([]),
  deletedCvIds: z.array(z.string()).default([]),
  deletedLetterIds: z.array(z.string()).default([]),
  deletedApplicationIds: z.array(z.string()).default([]),
})

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return jsonError('Bạn cần đăng nhập để đồng bộ đám mây.', 401)

  const db = getSaasDb()
  const [resumes, letters, apps] = await Promise.all([
    db.listResumes(user.id),
    db.listCoverLetters(user.id),
    db.listApplications(user.id),
  ])

  return jsonOk({
    cvs: resumes.map((r) => safeParseJson<ResumeDocumentV2>(r.docJson)).filter((d): d is ResumeDocumentV2 => d !== null),
    letters: letters.map((l) => safeParseJson<LetterDocument>(l.docJson)).filter((d): d is LetterDocument => d !== null),
    applications: apps.map((a) => safeParseJson<JobApplication>(a.appJson)).filter((d): d is JobApplication => d !== null),
    syncedAt: new Date().toISOString(),
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return jsonError('Bạn cần đăng nhập để đồng bộ đám mây.', 401)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu đồng bộ không hợp lệ.', 400)
  }

  const parsed = SyncPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError('Cấu trúc dữ liệu đồng bộ không hợp lệ.', 400)
  }

  const db = getSaasDb()
  const body = parsed.data

  for (const id of body.deletedCvIds) await db.deleteResume(user.id, id)
  for (const id of body.deletedLetterIds) await db.deleteCoverLetter(user.id, id)
  for (const id of body.deletedApplicationIds) await db.deleteApplication(user.id, id)

  // Merge CVs: newest updatedAt wins (conflict-free)
  const cloudResumes = new Map((await db.listResumes(user.id)).map((r) => [r.id, r]))
  for (const rawCv of body.cvs) {
    try {
      const cv = migrateToV2(rawCv)
      if (!cv.id) continue
      const existing = cloudResumes.get(cv.id)
      if (!existing || cv.updatedAt >= existing.updatedAt) {
        const meta = rawCv as { isMaster?: boolean; parentCvId?: string | null }
        await db.upsertResume({
          id: cv.id,
          userId: user.id,
          title: cv.title,
          docJson: JSON.stringify(cv),
          isMaster: Boolean(meta?.isMaster ?? (cv as { isMaster?: boolean }).isMaster),
          parentCvId: typeof meta?.parentCvId === 'string' ? meta.parentCvId : null,
          updatedAt: cv.updatedAt,
          createdAt: cv.createdAt,
        })
      }
    } catch {
      // Ignore malformed CV items
    }
  }

  // Merge Cover Letters
  const cloudLetters = new Map((await db.listCoverLetters(user.id)).map((l) => [l.id, l]))
  for (const rawLetter of body.letters) {
    if (!rawLetter || typeof rawLetter !== 'object') continue
    const letter = rawLetter as LetterDocument
    if (typeof letter.id !== 'string' || !letter.id || typeof letter.updatedAt !== 'string') continue
    const existing = cloudLetters.get(letter.id)
    if (!existing || letter.updatedAt >= existing.updatedAt) {
      await db.upsertCoverLetter({
        id: letter.id,
        userId: user.id,
        title: letter.title || 'Thư xin việc',
        docJson: JSON.stringify(letter),
        updatedAt: letter.updatedAt,
        createdAt: letter.createdAt || letter.updatedAt,
      })
    }
  }

  // Merge Job Applications
  const cloudApps = new Map((await db.listApplications(user.id)).map((a) => [a.id, a]))
  for (const rawApp of body.applications) {
    if (!rawApp || typeof rawApp !== 'object') continue
    const app = rawApp as JobApplication
    if (typeof app.id !== 'string' || !app.id || typeof app.company !== 'string' || typeof app.updatedAt !== 'string') continue
    const existing = cloudApps.get(app.id)
    if (!existing || app.updatedAt >= existing.updatedAt) {
      await db.upsertApplication({
        id: app.id,
        userId: user.id,
        company: app.company,
        role: app.role || '',
        columnId: app.columnId || 'wishlist',
        appJson: JSON.stringify(app),
        updatedAt: app.updatedAt,
        createdAt: app.createdAt || app.updatedAt,
      })
    }
  }

  const [finalResumes, finalLetters, finalApps] = await Promise.all([
    db.listResumes(user.id),
    db.listCoverLetters(user.id),
    db.listApplications(user.id),
  ])

  return jsonOk({
    cvs: finalResumes.map((r) => safeParseJson<ResumeDocumentV2>(r.docJson)).filter((d): d is ResumeDocumentV2 => d !== null),
    letters: finalLetters.map((l) => safeParseJson<LetterDocument>(l.docJson)).filter((d): d is LetterDocument => d !== null),
    applications: finalApps.map((a) => safeParseJson<JobApplication>(a.appJson)).filter((d): d is JobApplication => d !== null),
    syncedAt: new Date().toISOString(),
  })
}
