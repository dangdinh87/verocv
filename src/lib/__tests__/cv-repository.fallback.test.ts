import { beforeEach, describe, expect, it, vi } from 'vitest'

/* jsdom has no IndexedDB, so this exercises the localStorage fallback used in private modes. */

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

describe('cv-repository (localStorage fallback)', () => {
  it('supports the same save / list / delete cycle', async () => {
    const repo = await import('@/lib/cv-repository')
    const a = repo.createCv()
    await repo.saveCv(a)
    expect((await repo.listCvs()).map((d) => d.id)).toEqual([a.id])
    await repo.deleteCv(a.id)
    expect(await repo.listCvs()).toEqual([])
  })

  it('skips corrupted entries instead of failing the whole list', async () => {
    localStorage.setItem('hsx_cv_v2', JSON.stringify([{ nope: 1 }, 'text', null]))
    const repo = await import('@/lib/cv-repository')
    expect(await repo.listCvs()).toEqual([])
  })
})
