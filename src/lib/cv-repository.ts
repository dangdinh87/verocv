import { openDB, type IDBPDatabase } from 'idb'
import type { ResumeData } from '@/components/resume/resume-data'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { DEFAULT_CV_SETTINGS, EMPTY_RESUME_DATA, getPersonaData } from '@/types/resume'
import { ResumeDocumentSchema, migrateToV2, type ResumeDocumentV2 } from '@/types/schema'

/*
  The single source of truth for CV documents.
  - Primary store: IndexedDB. If it is unavailable (some private modes), a localStorage store with the same API is used.
  - Legacy data (the old `hsx_cv_documents` localStorage array) is imported once, then removed, so a deleted CV can never come back.
  - Nothing is seeded: a new visitor starts with an empty list.
*/

export type CvRecord = ResumeDocumentV2

const DB_NAME = 'HoSoXanh_DB'
const DB_VERSION = 1
const STORE = 'resumes'
const FALLBACK_KEY = 'hsx_cv_v2'
const LEGACY_KEY = 'hsx_cv_documents'
const PENDING_PREFIX = 'hsx_cv_pending_'
const CHANNEL = 'hsx_sync_channel'

type Backend = {
  all: () => Promise<unknown[]>
  get: (id: string) => Promise<unknown | undefined>
  put: (doc: CvRecord) => Promise<void>
  remove: (id: string) => Promise<void>
}

let backendPromise: Promise<Backend> | null = null

function createIndexedDbBackend(db: IDBPDatabase): Backend {
  return {
    all: () => db.getAll(STORE),
    get: (id) => db.get(STORE, id),
    put: async (doc) => {
      await db.put(STORE, doc)
    },
    remove: (id) => db.delete(STORE, id),
  }
}

function readFallback(): unknown[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function createLocalStorageBackend(): Backend {
  const write = (list: unknown[]) => localStorage.setItem(FALLBACK_KEY, JSON.stringify(list))
  return {
    all: async () => readFallback(),
    get: async (id) => readFallback().find((d) => (d as { id?: string })?.id === id),
    put: async (doc) => {
      const list = readFallback().filter((d) => (d as { id?: string })?.id !== doc.id)
      write([doc, ...list])
    },
    remove: async (id) => write(readFallback().filter((d) => (d as { id?: string })?.id !== id)),
  }
}

// A stored document must carry its own id: without one the schema would invent a phantom CV out of any stray object.
function parseDoc(raw: unknown): CvRecord | null {
  if (!raw || typeof raw !== 'object' || typeof (raw as { id?: unknown }).id !== 'string') return null
  try {
    return migrateToV2(raw)
  } catch {
    return null
  }
}

async function importLegacy(backend: Backend) {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(LEGACY_KEY)
  } catch {
    return
  }
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const doc = parseDoc(item)
        if (!doc) continue
        const existing = parseDoc(await backend.get(doc.id))
        if (!existing || existing.updatedAt < doc.updatedAt) await backend.put(doc)
      }
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Leave the legacy key alone so nothing is lost if it cannot be read right now.
  }
}

function getBackend(): Promise<Backend> {
  if (typeof window === 'undefined') return Promise.reject(new Error('cv-repository is client-only'))
  if (!backendPromise) {
    backendPromise = (async () => {
      let backend: Backend
      try {
        const db = await openDB(DB_NAME, DB_VERSION, {
          upgrade(upgradeDb) {
            if (!upgradeDb.objectStoreNames.contains(STORE)) upgradeDb.createObjectStore(STORE, { keyPath: 'id' })
          },
        })
        backend = createIndexedDbBackend(db)
      } catch {
        backend = createLocalStorageBackend()
      }
      await importLegacy(backend)
      return backend
    })()
  }
  return backendPromise
}

// ---- crash safety: a synchronous copy written while the tab is closing --------------------------------

export function writePendingCopy(doc: CvRecord) {
  try {
    localStorage.setItem(PENDING_PREFIX + doc.id, JSON.stringify(doc))
  } catch {
    // Quota exceeded: the async save below is the only chance.
  }
}

function takePendingCopy(id: string): CvRecord | null {
  try {
    const raw = localStorage.getItem(PENDING_PREFIX + id)
    if (!raw) return null
    return parseDoc(JSON.parse(raw))
  } catch {
    return null
  }
}

function clearPendingCopy(id: string) {
  try {
    localStorage.removeItem(PENDING_PREFIX + id)
  } catch {}
}

// ---- cross-tab sync ---------------------------------------------------------------------------------

let channel: BroadcastChannel | null = null
function getChannel() {
  if (!channel && typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(CHANNEL)
  return channel
}

export function subscribeToCvChanges(onChange: (id: string) => void): () => void {
  const ch = getChannel()
  if (!ch) return () => {}
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'CV_CHANGED' && typeof event.data.id === 'string') onChange(event.data.id)
  }
  ch.addEventListener('message', handler)
  return () => ch.removeEventListener('message', handler)
}

const announce = (id: string) => getChannel()?.postMessage({ type: 'CV_CHANGED', id })

// ---- public API ---------------------------------------------------------------------------------------

export async function listCvs(): Promise<CvRecord[]> {
  const backend = await getBackend()
  const docs = (await backend.all()).map(parseDoc).filter((d): d is CvRecord => d !== null)
  return docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getCv(id: string): Promise<CvRecord | null> {
  const backend = await getBackend()
  const stored = parseDoc(await backend.get(id))
  const pending = takePendingCopy(id)
  if (pending && (!stored || pending.updatedAt > stored.updatedAt)) {
    await backend.put(pending)
    clearPendingCopy(id)
    return pending
  }
  if (pending) clearPendingCopy(id)
  return stored
}

export async function saveCv(doc: CvRecord): Promise<void> {
  const backend = await getBackend()
  await backend.put(ResumeDocumentSchema.parse(doc))
  clearPendingCopy(doc.id)
  announce(doc.id)
}

export async function deleteCv(id: string): Promise<void> {
  const backend = await getBackend()
  await backend.remove(id)
  clearPendingCopy(id)
  announce(id)
}

export async function duplicateCv(id: string): Promise<CvRecord | null> {
  const original = await getCv(id)
  if (!original) return null
  const now = new Date().toISOString()
  const copy = migrateToV2({
    ...JSON.parse(JSON.stringify(original)),
    id: newId(),
    title: `${original.title} (bản sao)`,
    createdAt: now,
    updatedAt: now,
  })
  // Item ids must be unique per document, not shared with the original.
  copy.data.jobs.forEach((j) => (j.id = newId('job')))
  copy.data.education.forEach((e) => (e.id = newId('edu')))
  copy.data.languages.forEach((l) => (l.id = newId('lang')))
  copy.data.links.forEach((lnk) => (lnk.id = newId('lnk')))
  const csIdMap = new Map<string, string>()
  copy.data.customSections.forEach((cs) => {
    const nextId = newId('custom')
    csIdMap.set(cs.id, nextId)
    cs.id = nextId
    cs.entries.forEach((entry) => (entry.id = newId('cse')))
  })
  copy.settings.sectionOrder = copy.settings.sectionOrder.map((k) => csIdMap.get(k) ?? k)
  copy.settings.hiddenSections = copy.settings.hiddenSections.map((k) => csIdMap.get(k) ?? k)
  await saveCv(copy)
  return copy
}

export function newId(prefix = 'cv'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

type NewCvOptions = { templateSlug?: string; title?: string; blank?: boolean; personaKey?: string }

// A new CV starts from the chosen template's sample content (so the layout is visible) unless `blank` is set.
export function createCv({ templateSlug, title, blank, personaKey }: NewCvOptions = {}): CvRecord {
  const template = CV_TEMPLATES.find((t) => t.slug === templateSlug) ?? CV_TEMPLATES[0]
  const now = new Date().toISOString()
  const data = blank ? JSON.parse(JSON.stringify(EMPTY_RESUME_DATA)) : getPersonaData(personaKey ?? personaForTemplate(template.slug))
  const doc = migrateToV2({
    id: newId(),
    title: title ?? (blank ? 'CV chưa đặt tên' : `CV ${template.name}`),
    layout: template.layout,
    settings: { ...DEFAULT_CV_SETTINGS, fontFamily: template.layout === 'ke-ngang' ? 'serif' : 'sans' },
    data,
    createdAt: now,
    updatedAt: now,
  })
  return doc
}

// For content that did not come from a template (an imported CV): ids and defaults are filled in by the schema.
export function createCvWithData(data: ResumeData, title: string): CvRecord {
  const now = new Date().toISOString()
  return migrateToV2({ id: newId(), title, layout: 'ke-ngang', settings: { ...DEFAULT_CV_SETTINGS }, data, createdAt: now, updatedAt: now })
}

function personaForTemplate(slug: string): string {
  return (
    {
      'cot-xanh': 'quoc-huy',
      'thu-gon': 'quoc-huy',
      'ke-ngang': 'thu-ha',
      'moc-thoi-gian': 'thu-ha',
      'toi-gian': 'gia-bao',
      'con-dau': 'gia-bao',
    }[slug] ?? 'minh-anh'
  )
}

export const exportCvToJson = (doc: CvRecord) => JSON.stringify(doc, null, 2)

export function importCvFromJson(text: string): CvRecord {
  const doc = migrateToV2(JSON.parse(text))
  const now = new Date().toISOString()
  // Always import as a new document so a backup can never overwrite an existing CV by id.
  return { ...doc, id: newId(), title: `${doc.title} (khôi phục)`, createdAt: now, updatedAt: now }
}
