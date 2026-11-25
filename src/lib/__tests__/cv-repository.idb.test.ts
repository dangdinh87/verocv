import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateToV2 } from '@/types/schema'

/* Runs against a real (fake) IndexedDB. A fresh module per test resets the cached connection. */

async function load() {
  vi.resetModules()
  return import('@/lib/cv-repository')
}

beforeEach(() => {
  localStorage.clear()
  // A brand-new database factory per test: nothing carries over, and no old connection can block it.
  globalThis.indexedDB = new IDBFactory()
})

describe('cv-repository (IndexedDB)', () => {
  it('starts empty: nothing is seeded', async () => {
    const repo = await load()
    expect(await repo.listCvs()).toEqual([])
  })

  it('saves, reads back and lists newest first', async () => {
    const repo = await load()
    const a = repo.createCv({ templateSlug: 'ke-ngang' })
    const b = { ...repo.createCv({ templateSlug: 'cot-xanh' }), updatedAt: '2099-01-01T00:00:00.000Z' }
    await repo.saveCv(a)
    await repo.saveCv(b)
    expect((await repo.getCv(a.id))?.layout).toBe('ke-ngang')
    expect((await repo.listCvs()).map((d) => d.id)).toEqual([b.id, a.id])
  })

  it('a deleted CV stays deleted, including after a reload', async () => {
    const repo = await load()
    const doc = repo.createCv()
    await repo.saveCv(doc)
    await repo.deleteCv(doc.id)
    expect(await repo.getCv(doc.id)).toBeNull()

    const reloaded = await load()
    expect(await reloaded.listCvs()).toEqual([])
  })

  it('imports the legacy localStorage array once and then drops it', async () => {
    const legacy = migrateToV2({ id: 'cv_old', title: 'CV cũ', data: { name: 'An' } })
    localStorage.setItem('hsx_cv_documents', JSON.stringify([legacy, { broken: true }]))
    const repo = await load()
    const list = await repo.listCvs()
    expect(list.map((d) => d.id)).toEqual(['cv_old'])
    expect(localStorage.getItem('hsx_cv_documents')).toBeNull()

    await repo.deleteCv('cv_old')
    expect(await (await load()).listCvs()).toEqual([])
  })

  it('prefers a newer emergency copy written while the tab was closing', async () => {
    const repo = await load()
    const doc = repo.createCv()
    await repo.saveCv(doc)
    const newer = { ...doc, title: 'Bản mới hơn', updatedAt: '2099-01-01T00:00:00.000Z' }
    repo.writePendingCopy(newer)
    expect((await repo.getCv(doc.id))?.title).toBe('Bản mới hơn')
    expect(localStorage.getItem(`hsx_cv_pending_${doc.id}`)).toBeNull()
    expect((await (await load()).getCv(doc.id))?.title).toBe('Bản mới hơn')
  })

  it('ignores an emergency copy that is older than the stored one', async () => {
    const repo = await load()
    const doc = { ...repo.createCv(), title: 'Đã lưu', updatedAt: '2099-01-01T00:00:00.000Z' }
    await repo.saveCv(doc)
    repo.writePendingCopy({ ...doc, title: 'Cũ', updatedAt: '2000-01-01T00:00:00.000Z' })
    expect((await repo.getCv(doc.id))?.title).toBe('Đã lưu')
  })

  it('duplicates with fresh ids for the CV and every item', async () => {
    const repo = await load()
    const doc = repo.createCv({ templateSlug: 'cot-xanh' })
    await repo.saveCv(doc)
    const copy = (await repo.duplicateCv(doc.id))!
    expect(copy.id).not.toBe(doc.id)
    expect(copy.title).toContain('bản sao')
    const originalIds = new Set(doc.data.jobs.map((j) => j.id))
    expect(copy.data.jobs.every((j) => !originalIds.has(j.id))).toBe(true)
    expect(await repo.listCvs()).toHaveLength(2)
  })

  it('restores a JSON backup as a new CV and never overwrites by id', async () => {
    const repo = await load()
    const doc = repo.createCv()
    await repo.saveCv(doc)
    const restored = repo.importCvFromJson(repo.exportCvToJson(doc))
    expect(restored.id).not.toBe(doc.id)
    expect(() => repo.importCvFromJson('not json')).toThrow()
  })
})
