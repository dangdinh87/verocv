// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieJar = new Map<string, string>()

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name)
      return value !== undefined ? { name, value } : undefined
    },
    set: (name: string, value: string) => {
      cookieJar.set(name, value)
    },
    delete: (name: string) => {
      cookieJar.delete(name)
    },
  }),
}))

import { POST as loginPost } from '@/app/api/auth/login/route'
import { GET as meGet } from '@/app/api/auth/me/route'
import { POST as registerPost } from '@/app/api/auth/register/route'
import { GET as publicGet, DELETE as publicDelete } from '@/app/api/public-cv/[slug]/route'
import { POST as publicEventPost } from '@/app/api/public-cv/[slug]/event/route'
import { GET as publicListGet, POST as publicPublishPost } from '@/app/api/public-cv/route'
import { GET as versionsGet, POST as versionsPost } from '@/app/api/resumes/[id]/versions/route'
import { GET as syncGet, POST as syncPost } from '@/app/api/sync/route'
import { MINH_ANH } from '@/components/resume/resume-data'
import { resetTestDatabase } from '@/server/db/store'

function jsonReq(url: string, method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('SaaS Auth, Cloud Sync, Version History & Public CV Analytics', () => {
  beforeEach(() => {
    cookieJar.clear()
    resetTestDatabase()
  })

  it('registers, logs in, syncs workspace bi-directionally, and manages versions', async () => {
    const regRes = await registerPost(
      jsonReq('http://localhost/api/auth/register', 'POST', {
        name: 'Minh Anh',
        email: 'minhanh@verocv.vn',
        password: 'Password123!',
      }),
    )
    expect(regRes.status).toBe(201)
    expect(cookieJar.get('hsx_session')).toBeTruthy()

    const meRes = await meGet(new Request('http://localhost/api/auth/me'))
    const meJson = (await meRes.json()) as { user: { email: string; plan: string } }
    expect(meJson.user.email).toBe('minhanh@verocv.vn')
    expect(meJson.user.plan).toBe('free')

    // Re-login with wrong password fails, right password succeeds
    const badLogin = await loginPost(
      jsonReq('http://localhost/api/auth/login', 'POST', {
        email: 'minhanh@verocv.vn',
        password: 'wrong',
      }),
    )
    expect(badLogin.status).toBe(401)

    // Sync CV + Kanban + Letter
    const now = new Date().toISOString()
    const syncRes = await syncPost(
      jsonReq('http://localhost/api/sync', 'POST', {
        cvs: [{ id: 'cv_1', title: 'CV Gốc', layout: 'thu-gon', isMaster: true, data: MINH_ANH, updatedAt: now, createdAt: now }],
        letters: [],
        applications: [
          {
            id: 'app_1',
            company: 'Shopee',
            role: 'Growth Marketing',
            columnId: 'applied',
            todos: [],
            updatedAt: now,
            createdAt: now,
          },
        ],
      }),
    )
    expect(syncRes.status).toBe(200)
    const syncData = (await syncRes.json()) as { cvs: { id: string }[]; applications: { company: string }[] }
    expect(syncData.cvs).toHaveLength(1)
    expect(syncData.applications[0].company).toBe('Shopee')

    const fetchSync = await syncGet()
    expect(fetchSync.status).toBe(200)

    // Save & list CV version snapshot
    const verPost = await versionsPost(
      jsonReq('http://localhost/api/resumes/cv_1/versions', 'POST', {
        label: 'Trước khi nộp Shopee',
        doc: { id: 'cv_1', title: 'CV Gốc', layout: 'thu-gon', data: MINH_ANH },
      }) as never,
      { params: Promise.resolve({ id: 'cv_1' }) },
    )
    expect(verPost.status).toBe(201)

    const verList = await versionsGet(new Request('http://localhost/api/resumes/cv_1/versions') as never, {
      params: Promise.resolve({ id: 'cv_1' }),
    })
    const verJson = (await verList.json()) as { versions: { label: string }[] }
    expect(verJson.versions[0].label).toBe('Trước khi nộp Shopee')
  })

  it('publishes public CV link with privacy + PIN protection and tracks recruiter events', async () => {
    await registerPost(
      jsonReq('http://localhost/api/auth/register', 'POST', {
        name: 'Quốc Huy',
        email: 'huy@verocv.vn',
        password: 'Password123!',
      }),
    )

    const pubRes = await publicPublishPost(
      jsonReq('http://localhost/api/public-cv', 'POST', {
        slug: 'quoc-huy-fe',
        resumeId: 'cv_huy',
        doc: { id: 'cv_huy', title: 'CV Frontend', layout: 'cot-xanh', data: MINH_ANH },
        hidePhone: true,
        hideEmail: false,
        passcode: '2026',
        isActive: true,
      }),
    )
    expect(pubRes.status).toBe(200)

    // Locked without PIN
    const lockedRes = await publicGet(new Request('http://localhost/api/public-cv/quoc-huy-fe') as never, {
      params: Promise.resolve({ slug: 'quoc-huy-fe' }),
    })
    const lockedJson = (await lockedRes.json()) as { protected: boolean }
    expect(lockedJson.protected).toBe(true)

    // Wrong PIN -> 403
    const wrongPinRes = await publicGet(
      new Request('http://localhost/api/public-cv/quoc-huy-fe', { headers: { 'x-cv-passcode': '9999' } }) as never,
      { params: Promise.resolve({ slug: 'quoc-huy-fe' }) },
    )
    expect(wrongPinRes.status).toBe(403)

    // Correct PIN -> unlocked & phone hidden
    const unlockedRes = await publicGet(
      new Request('http://localhost/api/public-cv/quoc-huy-fe', { headers: { 'x-cv-passcode': '2026' } }) as never,
      { params: Promise.resolve({ slug: 'quoc-huy-fe' }) },
    )
    const unlockedJson = (await unlockedRes.json()) as { protected: boolean; doc: { data: { phone: string; email: string } } }
    expect(unlockedJson.protected).toBe(false)
    expect(unlockedJson.doc.data.phone).toBe('')
    expect(unlockedJson.doc.data.email).toBe(MINH_ANH.email)

    // Track view & download from Shopee
    await publicEventPost(
      jsonReq('http://localhost/api/public-cv/quoc-huy-fe/event', 'POST', { eventType: 'view', refTag: 'Shopee' }) as never,
      { params: Promise.resolve({ slug: 'quoc-huy-fe' }) },
    )
    await publicEventPost(
      jsonReq('http://localhost/api/public-cv/quoc-huy-fe/event', 'POST', { eventType: 'download_pdf', refTag: 'Shopee' }) as never,
      { params: Promise.resolve({ slug: 'quoc-huy-fe' }) },
    )

    const listRes = await publicListGet()
    const listJson = (await listRes.json()) as {
      links: { slug: string; analytics: { totalViews: number; pdfDownloads: number; byRef: { refTag: string }[] } }[]
    }
    expect(listJson.links[0].analytics.totalViews).toBe(1)
    expect(listJson.links[0].analytics.pdfDownloads).toBe(1)
    expect(listJson.links[0].analytics.byRef[0].refTag).toBe('Shopee')

    const delRes = await publicDelete(new Request('http://localhost/api/public-cv/quoc-huy-fe', { method: 'DELETE' }) as never, {
      params: Promise.resolve({ slug: 'quoc-huy-fe' }),
    })
    expect(delRes.status).toBe(200)
  })
})
