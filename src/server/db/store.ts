import fs from 'node:fs'
import path from 'node:path'
import { getServerEnv, type CloudflareD1Binding } from '@/server/cf-env'

export type UserPlanId = 'free' | 'pass_14d' | 'pro_monthly' | 'pro_yearly'

export type DbUser = {
  id: string
  email: string
  name: string
  passwordHash: string
  plan: UserPlanId
  planExpiresAt: string | null
  createdAt: string
  updatedAt: string
}

export type DbSession = {
  tokenHash: string
  userId: string
  expiresAt: string
  createdAt: string
}

export type DbResume = {
  id: string
  userId: string
  title: string
  docJson: string
  isMaster: boolean
  parentCvId: string | null
  updatedAt: string
  createdAt: string
}

export type DbResumeVersion = {
  id: string
  resumeId: string
  userId: string
  label: string
  docJson: string
  createdAt: string
}

export type DbCoverLetter = {
  id: string
  userId: string
  title: string
  docJson: string
  updatedAt: string
  createdAt: string
}

export type DbJobApplication = {
  id: string
  userId: string
  company: string
  role: string
  columnId: string
  appJson: string
  updatedAt: string
  createdAt: string
}

export type DbPublicLink = {
  slug: string
  resumeId: string
  userId: string
  docSnapshotJson: string
  hidePhone: boolean
  hideEmail: boolean
  passcodeHash: string | null
  isActive: boolean
  updatedAt: string
  createdAt: string
}

export type DbLinkEvent = {
  id: string
  slug: string
  eventType: 'view' | 'download_pdf' | 'download_docx'
  refTag: string | null
  userAgent: string | null
  createdAt: string
}

export type DbPaymentOrder = {
  orderCode: string
  userId: string
  planId: Exclude<UserPlanId, 'free'>
  amountVnd: number
  status: 'pending' | 'paid' | 'expired'
  providerTxId: string | null
  paidAt: string | null
  createdAt: string
}

export type DbAiUsageLog = {
  id: string
  actorKey: string
  feature: string
  provider: 'workers-ai' | 'local-engine'
  createdAt: string
}

export type LinkAnalyticsSummary = {
  slug: string
  totalViews: number
  pdfDownloads: number
  docxDownloads: number
  lastViewedAt: string | null
  byRef: { refTag: string; views: number; downloads: number; lastSeenAt: string }[]
  recentEvents: { eventType: string; refTag: string | null; createdAt: string }[]
}

export interface SaasRepository {
  createUser(input: Omit<DbUser, 'plan' | 'planExpiresAt' | 'createdAt' | 'updatedAt'> & { plan?: UserPlanId }): Promise<DbUser>
  getUserByEmail(email: string): Promise<DbUser | null>
  getUserById(id: string): Promise<DbUser | null>
  updateUserPlan(userId: string, plan: UserPlanId, planExpiresAt: string | null): Promise<DbUser | null>

  createSession(session: DbSession): Promise<void>
  getSessionWithUser(tokenHash: string): Promise<{ session: DbSession; user: DbUser } | null>
  deleteSession(tokenHash: string): Promise<void>

  listResumes(userId: string): Promise<DbResume[]>
  getResume(userId: string, id: string): Promise<DbResume | null>
  upsertResume(resume: DbResume): Promise<void>
  deleteResume(userId: string, id: string): Promise<void>

  listResumeVersions(userId: string, resumeId: string): Promise<DbResumeVersion[]>
  createResumeVersion(version: DbResumeVersion): Promise<void>
  getResumeVersion(userId: string, versionId: string): Promise<DbResumeVersion | null>

  listCoverLetters(userId: string): Promise<DbCoverLetter[]>
  upsertCoverLetter(letter: DbCoverLetter): Promise<void>
  deleteCoverLetter(userId: string, id: string): Promise<void>

  listApplications(userId: string): Promise<DbJobApplication[]>
  upsertApplication(app: DbJobApplication): Promise<void>
  deleteApplication(userId: string, id: string): Promise<void>

  listPublicLinksByUser(userId: string): Promise<DbPublicLink[]>
  getPublicLink(slug: string): Promise<DbPublicLink | null>
  upsertPublicLink(link: DbPublicLink): Promise<void>
  deletePublicLink(userId: string, slug: string): Promise<boolean>

  recordLinkEvent(event: DbLinkEvent): Promise<void>
  getLinkAnalytics(slug: string): Promise<LinkAnalyticsSummary>

  createPaymentOrder(order: DbPaymentOrder): Promise<void>
  getPaymentOrder(orderCode: string): Promise<DbPaymentOrder | null>
  listPaymentOrdersByUser(userId: string): Promise<DbPaymentOrder[]>
  markOrderPaidAndUpgrade(
    orderCode: string,
    providerTxId: string,
    planExpiresAt: string,
  ): Promise<{ order: DbPaymentOrder; user: DbUser; alreadyPaid: boolean } | null>

  countAiUsageSince(actorKey: string, sinceIso: string): Promise<number>
  recordAiUsage(log: DbAiUsageLog): Promise<void>
}

// ---- Local JSON / In-Memory Store (dev & vitest fallback when D1 binding/REST is absent) ----

type StoreSnapshot = {
  users: Record<string, DbUser>
  sessions: Record<string, DbSession>
  resumes: Record<string, DbResume>
  resumeVersions: Record<string, DbResumeVersion>
  coverLetters: Record<string, DbCoverLetter>
  jobApplications: Record<string, DbJobApplication>
  publicLinks: Record<string, DbPublicLink>
  linkEvents: DbLinkEvent[]
  paymentOrders: Record<string, DbPaymentOrder>
  aiUsageLogs: DbAiUsageLog[]
}

const emptySnapshot = (): StoreSnapshot => ({
  users: {},
  sessions: {},
  resumes: {},
  resumeVersions: {},
  coverLetters: {},
  jobApplications: {},
  publicLinks: {},
  linkEvents: [],
  paymentOrders: {},
  aiUsageLogs: [],
})

const MEMORY_KEY = Symbol.for('hsx_local_d1_memory')

function getMemoryStore(): StoreSnapshot {
  const g = globalThis as Record<PropertyKey, unknown>
  if (!g[MEMORY_KEY]) g[MEMORY_KEY] = emptySnapshot()
  return g[MEMORY_KEY] as StoreSnapshot
}

export function resetTestDatabase(): void {
  const g = globalThis as Record<PropertyKey, unknown>
  g[MEMORY_KEY] = emptySnapshot()
}

function isTestRuntime(): boolean {
  return typeof process !== 'undefined' && (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test')
}

function storeFilePath(): string {
  return path.join(process.cwd(), '.data', 'local-d1-store.json')
}

function readSnapshot(): StoreSnapshot {
  if (isTestRuntime()) return getMemoryStore()
  const file = storeFilePath()
  try {
    if (!fs.existsSync(file)) return emptySnapshot()
    const raw = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw) as Partial<StoreSnapshot>
    return { ...emptySnapshot(), ...parsed }
  } catch {
    return emptySnapshot()
  }
}

function writeSnapshot(snap: StoreSnapshot): void {
  if (isTestRuntime()) {
    const g = globalThis as Record<PropertyKey, unknown>
    g[MEMORY_KEY] = snap
    return
  }
  const file = storeFilePath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(snap, null, 2), 'utf8')
  fs.renameSync(tmp, file)
}

function buildAnalytics(slug: string, events: DbLinkEvent[]): LinkAnalyticsSummary {
  const relevant = events.filter((e) => e.slug === slug).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  let totalViews = 0
  let pdfDownloads = 0
  let docxDownloads = 0
  const refMap = new Map<string, { views: number; downloads: number; lastSeenAt: string }>()

  for (const ev of relevant) {
    if (ev.eventType === 'view') totalViews++
    else if (ev.eventType === 'download_pdf') pdfDownloads++
    else if (ev.eventType === 'download_docx') docxDownloads++

    const tag = ev.refTag?.trim() || 'Truy cập trực tiếp'
    const prev = refMap.get(tag) ?? { views: 0, downloads: 0, lastSeenAt: ev.createdAt }
    if (ev.eventType === 'view') prev.views++
    else prev.downloads++
    if (ev.createdAt > prev.lastSeenAt) prev.lastSeenAt = ev.createdAt
    refMap.set(tag, prev)
  }

  return {
    slug,
    totalViews,
    pdfDownloads,
    docxDownloads,
    lastViewedAt: relevant.find((e) => e.eventType === 'view')?.createdAt ?? null,
    byRef: Array.from(refMap.entries())
      .map(([refTag, stats]) => ({ refTag, ...stats }))
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)),
    recentEvents: relevant.slice(0, 20).map((e) => ({
      eventType: e.eventType,
      refTag: e.refTag,
      createdAt: e.createdAt,
    })),
  }
}

class LocalJsonRepository implements SaasRepository {
  async createUser(input: Omit<DbUser, 'plan' | 'planExpiresAt' | 'createdAt' | 'updatedAt'> & { plan?: UserPlanId }): Promise<DbUser> {
    const snap = readSnapshot()
    const normalizedEmail = input.email.trim().toLowerCase()
    const exists = Object.values(snap.users).some((u) => u.email === normalizedEmail)
    if (exists) throw new Error('EMAIL_ALREADY_EXISTS')
    const now = new Date().toISOString()
    const user: DbUser = {
      id: input.id,
      email: normalizedEmail,
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      plan: input.plan ?? 'free',
      planExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    }
    snap.users[user.id] = user
    writeSnapshot(snap)
    return user
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const snap = readSnapshot()
    const target = email.trim().toLowerCase()
    return Object.values(snap.users).find((u) => u.email === target) ?? null
  }

  async getUserById(id: string): Promise<DbUser | null> {
    return readSnapshot().users[id] ?? null
  }

  async updateUserPlan(userId: string, plan: UserPlanId, planExpiresAt: string | null): Promise<DbUser | null> {
    const snap = readSnapshot()
    const existing = snap.users[userId]
    if (!existing) return null
    const updated: DbUser = { ...existing, plan, planExpiresAt, updatedAt: new Date().toISOString() }
    snap.users[userId] = updated
    writeSnapshot(snap)
    return updated
  }

  async createSession(session: DbSession): Promise<void> {
    const snap = readSnapshot()
    const now = new Date().toISOString()
    for (const [k, s] of Object.entries(snap.sessions)) {
      if (s.expiresAt <= now) delete snap.sessions[k]
    }
    snap.sessions[session.tokenHash] = session
    writeSnapshot(snap)
  }

  async getSessionWithUser(tokenHash: string): Promise<{ session: DbSession; user: DbUser } | null> {
    const snap = readSnapshot()
    const session = snap.sessions[tokenHash]
    if (!session) return null
    if (session.expiresAt <= new Date().toISOString()) {
      delete snap.sessions[tokenHash]
      writeSnapshot(snap)
      return null
    }
    const user = snap.users[session.userId]
    if (!user) return null
    return { session, user }
  }

  async deleteSession(tokenHash: string): Promise<void> {
    const snap = readSnapshot()
    if (snap.sessions[tokenHash]) {
      delete snap.sessions[tokenHash]
      writeSnapshot(snap)
    }
  }

  async listResumes(userId: string): Promise<DbResume[]> {
    return Object.values(readSnapshot().resumes)
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async getResume(userId: string, id: string): Promise<DbResume | null> {
    const r = readSnapshot().resumes[id]
    return r && r.userId === userId ? r : null
  }

  async upsertResume(resume: DbResume): Promise<void> {
    const snap = readSnapshot()
    const existing = snap.resumes[resume.id]
    if (existing && existing.userId !== resume.userId) return
    snap.resumes[resume.id] = resume
    writeSnapshot(snap)
  }

  async deleteResume(userId: string, id: string): Promise<void> {
    const snap = readSnapshot()
    const existing = snap.resumes[id]
    if (existing && existing.userId === userId) {
      delete snap.resumes[id]
      writeSnapshot(snap)
    }
  }

  async listResumeVersions(userId: string, resumeId: string): Promise<DbResumeVersion[]> {
    return Object.values(readSnapshot().resumeVersions)
      .filter((v) => v.userId === userId && v.resumeId === resumeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async createResumeVersion(version: DbResumeVersion): Promise<void> {
    const snap = readSnapshot()
    snap.resumeVersions[version.id] = version
    writeSnapshot(snap)
  }

  async getResumeVersion(userId: string, versionId: string): Promise<DbResumeVersion | null> {
    const v = readSnapshot().resumeVersions[versionId]
    return v && v.userId === userId ? v : null
  }

  async listCoverLetters(userId: string): Promise<DbCoverLetter[]> {
    return Object.values(readSnapshot().coverLetters)
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async upsertCoverLetter(letter: DbCoverLetter): Promise<void> {
    const snap = readSnapshot()
    const existing = snap.coverLetters[letter.id]
    if (existing && existing.userId !== letter.userId) return
    snap.coverLetters[letter.id] = letter
    writeSnapshot(snap)
  }

  async deleteCoverLetter(userId: string, id: string): Promise<void> {
    const snap = readSnapshot()
    const existing = snap.coverLetters[id]
    if (existing && existing.userId === userId) {
      delete snap.coverLetters[id]
      writeSnapshot(snap)
    }
  }

  async listApplications(userId: string): Promise<DbJobApplication[]> {
    return Object.values(readSnapshot().jobApplications)
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async upsertApplication(app: DbJobApplication): Promise<void> {
    const snap = readSnapshot()
    const existing = snap.jobApplications[app.id]
    if (existing && existing.userId !== app.userId) return
    snap.jobApplications[app.id] = app
    writeSnapshot(snap)
  }

  async deleteApplication(userId: string, id: string): Promise<void> {
    const snap = readSnapshot()
    const existing = snap.jobApplications[id]
    if (existing && existing.userId === userId) {
      delete snap.jobApplications[id]
      writeSnapshot(snap)
    }
  }

  async listPublicLinksByUser(userId: string): Promise<DbPublicLink[]> {
    return Object.values(readSnapshot().publicLinks)
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async getPublicLink(slug: string): Promise<DbPublicLink | null> {
    return readSnapshot().publicLinks[slug] ?? null
  }

  async upsertPublicLink(link: DbPublicLink): Promise<void> {
    const snap = readSnapshot()
    const existing = snap.publicLinks[link.slug]
    if (existing && existing.userId !== link.userId) {
      throw new Error('SLUG_TAKEN')
    }
    snap.publicLinks[link.slug] = link
    writeSnapshot(snap)
  }

  async deletePublicLink(userId: string, slug: string): Promise<boolean> {
    const snap = readSnapshot()
    const existing = snap.publicLinks[slug]
    if (!existing || existing.userId !== userId) return false
    delete snap.publicLinks[slug]
    snap.linkEvents = snap.linkEvents.filter((e) => e.slug !== slug)
    writeSnapshot(snap)
    return true
  }

  async recordLinkEvent(event: DbLinkEvent): Promise<void> {
    const snap = readSnapshot()
    if (!snap.publicLinks[event.slug]) return
    snap.linkEvents.push(event)
    writeSnapshot(snap)
  }

  async getLinkAnalytics(slug: string): Promise<LinkAnalyticsSummary> {
    return buildAnalytics(slug, readSnapshot().linkEvents)
  }

  async createPaymentOrder(order: DbPaymentOrder): Promise<void> {
    const snap = readSnapshot()
    snap.paymentOrders[order.orderCode] = order
    writeSnapshot(snap)
  }

  async getPaymentOrder(orderCode: string): Promise<DbPaymentOrder | null> {
    return readSnapshot().paymentOrders[orderCode] ?? null
  }

  async listPaymentOrdersByUser(userId: string): Promise<DbPaymentOrder[]> {
    return Object.values(readSnapshot().paymentOrders)
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async markOrderPaidAndUpgrade(
    orderCode: string,
    providerTxId: string,
    planExpiresAt: string,
  ): Promise<{ order: DbPaymentOrder; user: DbUser; alreadyPaid: boolean } | null> {
    const snap = readSnapshot()
    const order = snap.paymentOrders[orderCode]
    if (!order) return null
    const user = snap.users[order.userId]
    if (!user) return null
    if (order.status === 'paid') {
      return { order, user, alreadyPaid: true }
    }
    const now = new Date().toISOString()
    const nextOrder: DbPaymentOrder = {
      ...order,
      status: 'paid',
      providerTxId,
      paidAt: now,
    }
    const nextUser: DbUser = {
      ...user,
      plan: order.planId,
      planExpiresAt,
      updatedAt: now,
    }
    snap.paymentOrders[orderCode] = nextOrder
    snap.users[user.id] = nextUser
    writeSnapshot(snap)
    return { order: nextOrder, user: nextUser, alreadyPaid: false }
  }

  async countAiUsageSince(actorKey: string, sinceIso: string): Promise<number> {
    return readSnapshot().aiUsageLogs.filter((l) => l.actorKey === actorKey && l.createdAt >= sinceIso).length
  }

  async recordAiUsage(log: DbAiUsageLog): Promise<void> {
    const snap = readSnapshot()
    snap.aiUsageLogs.push(log)
    writeSnapshot(snap)
  }
}

// ---- Cloudflare D1 Repository (Native Worker Binding + D1 HTTP REST API) ----

type SqlRunner = {
  all: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>
  first: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T | null>
  run: (sql: string, params?: unknown[]) => Promise<void>
}

function createBindingRunner(db: CloudflareD1Binding): SqlRunner {
  return {
    all: async <T>(sql: string, params: unknown[] = []) => {
      const res = await db
        .prepare(sql)
        .bind(...params)
        .all<T>()
      return res.results ?? []
    },
    first: async <T>(sql: string, params: unknown[] = []) => {
      return db
        .prepare(sql)
        .bind(...params)
        .first<T>()
    },
    run: async (sql: string, params: unknown[] = []) => {
      await db
        .prepare(sql)
        .bind(...params)
        .run()
    },
  }
}

function createRestRunner(accountId: string, databaseId: string, apiToken: string): SqlRunner {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`
  const exec = async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    })
    if (!res.ok) {
      throw new Error(`D1 REST query failed (${res.status})`)
    }
    const json = (await res.json()) as { success?: boolean; result?: { results?: T[] }[] }
    if (!json.success) {
      throw new Error('D1 REST query rejected')
    }
    return json.result?.[0]?.results ?? []
  }

  return {
    all: <T>(sql: string, params?: unknown[]) => exec<T>(sql, params),
    first: async <T>(sql: string, params?: unknown[]) => (await exec<T>(sql, params))[0] ?? null,
    run: async (sql: string, params?: unknown[]) => {
      await exec(sql, params)
    },
  }
}

function mapUserRow(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    passwordHash: String(row.password_hash),
    plan: (String(row.plan) as UserPlanId) || 'free',
    planExpiresAt: row.plan_expires_at ? String(row.plan_expires_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

class D1SqlRepository implements SaasRepository {
  constructor(private readonly sql: SqlRunner) {}

  async createUser(input: Omit<DbUser, 'plan' | 'planExpiresAt' | 'createdAt' | 'updatedAt'> & { plan?: UserPlanId }): Promise<DbUser> {
    const now = new Date().toISOString()
    const email = input.email.trim().toLowerCase()
    const existing = await this.getUserByEmail(email)
    if (existing) throw new Error('EMAIL_ALREADY_EXISTS')
    const user: DbUser = {
      id: input.id,
      email,
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      plan: input.plan ?? 'free',
      planExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    }
    await this.sql.run(
      'INSERT INTO users (id, email, name, password_hash, plan, plan_expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.email, user.name, user.passwordHash, user.plan, user.planExpiresAt, user.createdAt, user.updatedAt],
    )
    return user
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const row = await this.sql.first('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()])
    return row ? mapUserRow(row) : null
  }

  async getUserById(id: string): Promise<DbUser | null> {
    const row = await this.sql.first('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
    return row ? mapUserRow(row) : null
  }

  async updateUserPlan(userId: string, plan: UserPlanId, planExpiresAt: string | null): Promise<DbUser | null> {
    const now = new Date().toISOString()
    await this.sql.run('UPDATE users SET plan = ?, plan_expires_at = ?, updated_at = ? WHERE id = ?', [plan, planExpiresAt, now, userId])
    return this.getUserById(userId)
  }

  async createSession(session: DbSession): Promise<void> {
    await this.sql.run('DELETE FROM sessions WHERE expires_at <= ?', [new Date().toISOString()])
    await this.sql.run('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)', [
      session.tokenHash,
      session.userId,
      session.expiresAt,
      session.createdAt,
    ])
  }

  async getSessionWithUser(tokenHash: string): Promise<{ session: DbSession; user: DbUser } | null> {
    const sRow = await this.sql.first('SELECT * FROM sessions WHERE token_hash = ? LIMIT 1', [tokenHash])
    if (!sRow) return null
    const session: DbSession = {
      tokenHash: String(sRow.token_hash),
      userId: String(sRow.user_id),
      expiresAt: String(sRow.expires_at),
      createdAt: String(sRow.created_at),
    }
    if (session.expiresAt <= new Date().toISOString()) {
      await this.deleteSession(tokenHash)
      return null
    }
    const user = await this.getUserById(session.userId)
    if (!user) return null
    return { session, user }
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.sql.run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash])
  }

  async listResumes(userId: string): Promise<DbResume[]> {
    const rows = await this.sql.all('SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC', [userId])
    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      title: String(r.title),
      docJson: String(r.doc_json),
      isMaster: Boolean(r.is_master),
      parentCvId: r.parent_cv_id ? String(r.parent_cv_id) : null,
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
    }))
  }

  async getResume(userId: string, id: string): Promise<DbResume | null> {
    const r = await this.sql.first('SELECT * FROM resumes WHERE id = ? AND user_id = ? LIMIT 1', [id, userId])
    if (!r) return null
    return {
      id: String(r.id),
      userId: String(r.user_id),
      title: String(r.title),
      docJson: String(r.doc_json),
      isMaster: Boolean(r.is_master),
      parentCvId: r.parent_cv_id ? String(r.parent_cv_id) : null,
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
    }
  }

  async upsertResume(resume: DbResume): Promise<void> {
    await this.sql.run(
      `INSERT INTO resumes (id, user_id, title, doc_json, is_master, parent_cv_id, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         doc_json = excluded.doc_json,
         is_master = excluded.is_master,
         parent_cv_id = excluded.parent_cv_id,
         updated_at = excluded.updated_at
       WHERE resumes.user_id = excluded.user_id`,
      [
        resume.id,
        resume.userId,
        resume.title,
        resume.docJson,
        resume.isMaster ? 1 : 0,
        resume.parentCvId,
        resume.updatedAt,
        resume.createdAt,
      ],
    )
  }

  async deleteResume(userId: string, id: string): Promise<void> {
    await this.sql.run('DELETE FROM resumes WHERE id = ? AND user_id = ?', [id, userId])
  }

  async listResumeVersions(userId: string, resumeId: string): Promise<DbResumeVersion[]> {
    const rows = await this.sql.all('SELECT * FROM resume_versions WHERE user_id = ? AND resume_id = ? ORDER BY created_at DESC', [
      userId,
      resumeId,
    ])
    return rows.map((r) => ({
      id: String(r.id),
      resumeId: String(r.resume_id),
      userId: String(r.user_id),
      label: String(r.label),
      docJson: String(r.doc_json),
      createdAt: String(r.created_at),
    }))
  }

  async createResumeVersion(version: DbResumeVersion): Promise<void> {
    await this.sql.run('INSERT INTO resume_versions (id, resume_id, user_id, label, doc_json, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
      version.id,
      version.resumeId,
      version.userId,
      version.label,
      version.docJson,
      version.createdAt,
    ])
  }

  async getResumeVersion(userId: string, versionId: string): Promise<DbResumeVersion | null> {
    const r = await this.sql.first('SELECT * FROM resume_versions WHERE id = ? AND user_id = ? LIMIT 1', [versionId, userId])
    if (!r) return null
    return {
      id: String(r.id),
      resumeId: String(r.resume_id),
      userId: String(r.user_id),
      label: String(r.label),
      docJson: String(r.doc_json),
      createdAt: String(r.created_at),
    }
  }

  async listCoverLetters(userId: string): Promise<DbCoverLetter[]> {
    const rows = await this.sql.all('SELECT * FROM cover_letters WHERE user_id = ? ORDER BY updated_at DESC', [userId])
    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      title: String(r.title),
      docJson: String(r.doc_json),
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
    }))
  }

  async upsertCoverLetter(letter: DbCoverLetter): Promise<void> {
    await this.sql.run(
      `INSERT INTO cover_letters (id, user_id, title, doc_json, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         doc_json = excluded.doc_json,
         updated_at = excluded.updated_at
       WHERE cover_letters.user_id = excluded.user_id`,
      [letter.id, letter.userId, letter.title, letter.docJson, letter.updatedAt, letter.createdAt],
    )
  }

  async deleteCoverLetter(userId: string, id: string): Promise<void> {
    await this.sql.run('DELETE FROM cover_letters WHERE id = ? AND user_id = ?', [id, userId])
  }

  async listApplications(userId: string): Promise<DbJobApplication[]> {
    const rows = await this.sql.all('SELECT * FROM job_applications WHERE user_id = ? ORDER BY updated_at DESC', [userId])
    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      company: String(r.company),
      role: String(r.role),
      columnId: String(r.column_id),
      appJson: String(r.app_json),
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
    }))
  }

  async upsertApplication(app: DbJobApplication): Promise<void> {
    await this.sql.run(
      `INSERT INTO job_applications (id, user_id, company, role, column_id, app_json, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         company = excluded.company,
         role = excluded.role,
         column_id = excluded.column_id,
         app_json = excluded.app_json,
         updated_at = excluded.updated_at
       WHERE job_applications.user_id = excluded.user_id`,
      [app.id, app.userId, app.company, app.role, app.columnId, app.appJson, app.updatedAt, app.createdAt],
    )
  }

  async deleteApplication(userId: string, id: string): Promise<void> {
    await this.sql.run('DELETE FROM job_applications WHERE id = ? AND user_id = ?', [id, userId])
  }

  async listPublicLinksByUser(userId: string): Promise<DbPublicLink[]> {
    const rows = await this.sql.all('SELECT * FROM public_links WHERE user_id = ? ORDER BY updated_at DESC', [userId])
    return rows.map((r) => ({
      slug: String(r.slug),
      resumeId: String(r.resume_id),
      userId: String(r.user_id),
      docSnapshotJson: String(r.doc_snapshot_json),
      hidePhone: Boolean(r.hide_phone),
      hideEmail: Boolean(r.hide_email),
      passcodeHash: r.passcode_hash ? String(r.passcode_hash) : null,
      isActive: Boolean(r.is_active),
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
    }))
  }

  async getPublicLink(slug: string): Promise<DbPublicLink | null> {
    const r = await this.sql.first('SELECT * FROM public_links WHERE slug = ? LIMIT 1', [slug])
    if (!r) return null
    return {
      slug: String(r.slug),
      resumeId: String(r.resume_id),
      userId: String(r.user_id),
      docSnapshotJson: String(r.doc_snapshot_json),
      hidePhone: Boolean(r.hide_phone),
      hideEmail: Boolean(r.hide_email),
      passcodeHash: r.passcode_hash ? String(r.passcode_hash) : null,
      isActive: Boolean(r.is_active),
      updatedAt: String(r.updated_at),
      createdAt: String(r.created_at),
    }
  }

  async upsertPublicLink(link: DbPublicLink): Promise<void> {
    const existing = await this.getPublicLink(link.slug)
    if (existing && existing.userId !== link.userId) {
      throw new Error('SLUG_TAKEN')
    }
    await this.sql.run(
      `INSERT INTO public_links (slug, resume_id, user_id, doc_snapshot_json, hide_phone, hide_email, passcode_hash, is_active, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         resume_id = excluded.resume_id,
         doc_snapshot_json = excluded.doc_snapshot_json,
         hide_phone = excluded.hide_phone,
         hide_email = excluded.hide_email,
         passcode_hash = excluded.passcode_hash,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at
       WHERE public_links.user_id = excluded.user_id`,
      [
        link.slug,
        link.resumeId,
        link.userId,
        link.docSnapshotJson,
        link.hidePhone ? 1 : 0,
        link.hideEmail ? 1 : 0,
        link.passcodeHash,
        link.isActive ? 1 : 0,
        link.updatedAt,
        link.createdAt,
      ],
    )
  }

  async deletePublicLink(userId: string, slug: string): Promise<boolean> {
    const existing = await this.getPublicLink(slug)
    if (!existing || existing.userId !== userId) return false
    await this.sql.run('DELETE FROM public_links WHERE slug = ? AND user_id = ?', [slug, userId])
    return true
  }

  async recordLinkEvent(event: DbLinkEvent): Promise<void> {
    await this.sql.run('INSERT INTO link_events (id, slug, event_type, ref_tag, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
      event.id,
      event.slug,
      event.eventType,
      event.refTag,
      event.userAgent,
      event.createdAt,
    ])
  }

  async getLinkAnalytics(slug: string): Promise<LinkAnalyticsSummary> {
    const rows = await this.sql.all('SELECT * FROM link_events WHERE slug = ? ORDER BY created_at DESC LIMIT 500', [slug])
    const events: DbLinkEvent[] = rows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      eventType: String(r.event_type) as DbLinkEvent['eventType'],
      refTag: r.ref_tag ? String(r.ref_tag) : null,
      userAgent: r.user_agent ? String(r.user_agent) : null,
      createdAt: String(r.created_at),
    }))
    return buildAnalytics(slug, events)
  }

  async createPaymentOrder(order: DbPaymentOrder): Promise<void> {
    await this.sql.run(
      'INSERT INTO payment_orders (order_code, user_id, plan_id, amount_vnd, status, provider_tx_id, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [order.orderCode, order.userId, order.planId, order.amountVnd, order.status, order.providerTxId, order.paidAt, order.createdAt],
    )
  }

  async getPaymentOrder(orderCode: string): Promise<DbPaymentOrder | null> {
    const r = await this.sql.first('SELECT * FROM payment_orders WHERE order_code = ? LIMIT 1', [orderCode])
    if (!r) return null
    return {
      orderCode: String(r.order_code),
      userId: String(r.user_id),
      planId: String(r.plan_id) as Exclude<UserPlanId, 'free'>,
      amountVnd: Number(r.amount_vnd),
      status: String(r.status) as DbPaymentOrder['status'],
      providerTxId: r.provider_tx_id ? String(r.provider_tx_id) : null,
      paidAt: r.paid_at ? String(r.paid_at) : null,
      createdAt: String(r.created_at),
    }
  }

  async listPaymentOrdersByUser(userId: string): Promise<DbPaymentOrder[]> {
    const rows = await this.sql.all('SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC', [userId])
    return rows.map((r) => ({
      orderCode: String(r.order_code),
      userId: String(r.user_id),
      planId: String(r.plan_id) as Exclude<UserPlanId, 'free'>,
      amountVnd: Number(r.amount_vnd),
      status: String(r.status) as DbPaymentOrder['status'],
      providerTxId: r.provider_tx_id ? String(r.provider_tx_id) : null,
      paidAt: r.paid_at ? String(r.paid_at) : null,
      createdAt: String(r.created_at),
    }))
  }

  async markOrderPaidAndUpgrade(
    orderCode: string,
    providerTxId: string,
    planExpiresAt: string,
  ): Promise<{ order: DbPaymentOrder; user: DbUser; alreadyPaid: boolean } | null> {
    const order = await this.getPaymentOrder(orderCode)
    if (!order) return null
    const user = await this.getUserById(order.userId)
    if (!user) return null
    if (order.status === 'paid') {
      return { order, user, alreadyPaid: true }
    }
    const now = new Date().toISOString()
    await this.sql.run("UPDATE payment_orders SET status = 'paid', provider_tx_id = ?, paid_at = ? WHERE order_code = ? AND status = 'pending'", [
      providerTxId,
      now,
      orderCode,
    ])
    const updatedUser = await this.updateUserPlan(user.id, order.planId, planExpiresAt)
    const updatedOrder = await this.getPaymentOrder(orderCode)
    if (!updatedUser || !updatedOrder) return null
    return { order: updatedOrder, user: updatedUser, alreadyPaid: false }
  }

  async countAiUsageSince(actorKey: string, sinceIso: string): Promise<number> {
    const row = await this.sql.first<{ cnt: number }>('SELECT COUNT(*) as cnt FROM ai_usage_logs WHERE actor_key = ? AND created_at >= ?', [
      actorKey,
      sinceIso,
    ])
    return Number(row?.cnt ?? 0)
  }

  async recordAiUsage(log: DbAiUsageLog): Promise<void> {
    await this.sql.run('INSERT INTO ai_usage_logs (id, actor_key, feature, provider, created_at) VALUES (?, ?, ?, ?, ?)', [
      log.id,
      log.actorKey,
      log.feature,
      log.provider,
      log.createdAt,
    ])
  }
}

export function getSaasDb(): SaasRepository {
  const env = getServerEnv()
  if (env.DB) {
    return new D1SqlRepository(createBindingRunner(env.DB))
  }
  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_D1_DATABASE_ID && env.CLOUDFLARE_API_TOKEN) {
    return new D1SqlRepository(createRestRunner(env.CLOUDFLARE_ACCOUNT_ID, env.CLOUDFLARE_D1_DATABASE_ID, env.CLOUDFLARE_API_TOKEN))
  }
  return new LocalJsonRepository()
}
