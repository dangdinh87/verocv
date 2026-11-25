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

import { POST as aiCoverLetterPost } from '@/app/api/ai/cover-letter/route'
import { POST as aiInterviewPost } from '@/app/api/ai/interview-prep/route'
import { POST as aiTailorPost } from '@/app/api/ai/tailor-jd/route'
import { POST as aiTranslatePost } from '@/app/api/ai/translate-cv/route'
import { POST as registerPost } from '@/app/api/auth/register/route'
import { POST as checkoutPost } from '@/app/api/billing/checkout/route'
import { POST as vietqrWebhookPost } from '@/app/api/billing/webhook/vietqr/route'
import { assertSafeJobUrl, extractJobFromHtml, POST as jobExtractPost } from '@/app/api/jobs/extract/route'
import { MINH_ANH, QUOC_HUY } from '@/components/resume/resume-data'
import { resetTestDatabase } from '@/server/db/store'

function jsonReq(url: string, method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('SaaS VietQR Billing, AI Copilot & Job URL Clipper Security', () => {
  beforeEach(() => {
    cookieJar.clear()
    resetTestDatabase()
    process.env.VIETQR_WEBHOOK_SECRET = 'test_vietqr_secret_123'
  })

  it('creates VietQR checkout order and activates plan idempotently via authenticated webhook', async () => {
    await registerPost(
      jsonReq('http://localhost/api/auth/register', 'POST', {
        name: 'Thu Hà',
        email: 'ha@verocv.vn',
        password: 'Password123!',
      }),
    )

    const coRes = await checkoutPost(jsonReq('http://localhost/api/billing/checkout', 'POST', { planId: 'pass_14d' }))
    expect(coRes.status).toBe(200)
    const coJson = (await coRes.json()) as { order: { orderCode: string; amountVnd: number }; qrEmvString: string }
    expect(coJson.order.orderCode).toMatch(/^HSX/)
    expect(coJson.order.amountVnd).toBe(49000)
    expect(coJson.qrEmvString).toContain(coJson.order.orderCode)

    // Invalid secret rejected
    const badSec = await vietqrWebhookPost(
      jsonReq(
        'http://localhost/api/billing/webhook/vietqr',
        'POST',
        { content: coJson.order.orderCode, transferAmount: 49000 },
        { Authorization: 'Apikey wrong_secret' },
      ),
    )
    expect(badSec.status).toBe(401)

    // Underpaid transfer rejected
    const underPaid = await vietqrWebhookPost(
      jsonReq(
        'http://localhost/api/billing/webhook/vietqr',
        'POST',
        { content: coJson.order.orderCode, transferAmount: 10000 },
        { Authorization: 'Apikey test_vietqr_secret_123' },
      ),
    )
    expect(underPaid.status).toBe(422)

    // Valid webhook upgrades user to pass_14d
    const okHook = await vietqrWebhookPost(
      jsonReq(
        'http://localhost/api/billing/webhook/vietqr',
        'POST',
        { id: 'TX999', content: `Thanh toan ${coJson.order.orderCode}`, transferAmount: 49000 },
        { Authorization: 'Apikey test_vietqr_secret_123' },
      ),
    )
    expect(okHook.status).toBe(200)
    const hookJson = (await okHook.json()) as { ok: boolean; alreadyPaid: boolean; plan: string }
    expect(hookJson.ok).toBe(true)
    expect(hookJson.alreadyPaid).toBe(false)
    expect(hookJson.plan).toBe('pass_14d')

    // Duplicate webhook is idempotent
    const dupHook = await vietqrWebhookPost(
      jsonReq(
        'http://localhost/api/billing/webhook/vietqr',
        'POST',
        { id: 'TX999', content: coJson.order.orderCode, transferAmount: 49000 },
        { Authorization: 'Apikey test_vietqr_secret_123' },
      ),
    )
    const dupJson = (await dupHook.json()) as { alreadyPaid: boolean }
    expect(dupJson.alreadyPaid).toBe(true)
  })

  it('runs AI JD Tailor, CV Translation, Cover Letter & Interview Prep with quota tracking', async () => {
    const tailorRes = await aiTailorPost(
      jsonReq('http://localhost/api/ai/tailor-jd', 'POST', {
        resumeData: QUOC_HUY,
        jdText: 'We need a Senior Frontend Engineer experienced in React, TypeScript, Next.js, GraphQL, Docker, and AWS.',
        lang: 'vi',
      }),
    )
    expect(tailorRes.status).toBe(200)
    const tailorJson = (await tailorRes.json()) as {
      data: { matchScore: number; matchedKeywords: string[]; missingKeywords: string[]; bulletRewrites: unknown[] }
      quota: { usedToday: number }
    }
    expect(tailorJson.data.matchedKeywords).toContain('React')
    expect(tailorJson.data.missingKeywords).toContain('GraphQL')
    expect(tailorJson.data.bulletRewrites.length).toBeGreaterThan(0)
    expect(tailorJson.quota.usedToday).toBe(1)

    const trRes = await aiTranslatePost(
      jsonReq('http://localhost/api/ai/translate-cv', 'POST', {
        resumeData: MINH_ANH,
        targetLang: 'en',
      }),
    )
    expect(trRes.status).toBe(200)
    const trJson = (await trRes.json()) as { data: { role: string } }
    expect(trJson.data.role).toContain('Marketing Specialist')

    const clRes = await aiCoverLetterPost(
      jsonReq('http://localhost/api/ai/cover-letter', 'POST', {
        resumeData: MINH_ANH,
        company: 'VNG',
        role: 'Growth Lead',
        jdText: 'Looking for Performance Marketing and GA4 expert.',
        tone: 'modern',
        lang: 'vi',
      }),
    )
    expect(clRes.status).toBe(200)
    const clJson = (await clRes.json()) as { data: { paragraphs: string[]; subject: string } }
    expect(clJson.data.subject).toContain('VNG')
    expect(clJson.data.paragraphs.length).toBeGreaterThanOrEqual(3)

    const prepRes = await aiInterviewPost(
      jsonReq('http://localhost/api/ai/interview-prep', 'POST', {
        resumeData: MINH_ANH,
        company: 'Shopee',
        role: 'Marketing Specialist',
        jdText: 'Performance Ads, Meta Ads, GA4',
        lang: 'vi',
      }),
    )
    expect(prepRes.status).toBe(200)
    const prepJson = (await prepRes.json()) as { data: { questions: { question: string; hint: string }[] } }
    expect(prepJson.data.questions).toHaveLength(8)
  })

  it('blocks SSRF internal hosts and parses JobPosting JSON-LD cleanly', async () => {
    expect(() => assertSafeJobUrl('http://localhost:3000/admin')).toThrow()
    expect(() => assertSafeJobUrl('http://127.0.0.1/secret')).toThrow()
    expect(() => assertSafeJobUrl('http://169.254.169.254/latest/meta-data')).toThrow()
    expect(() => assertSafeJobUrl('http://192.168.1.10/')).toThrow()
    expect(() => assertSafeJobUrl('file:///etc/passwd')).toThrow()

    const ssrfRes = await jobExtractPost(jsonReq('http://localhost/api/jobs/extract', 'POST', { url: 'http://127.0.0.1:8080' }))
    expect(ssrfRes.status).toBe(400)

    const sampleHtml = `
      <html>
        <head>
          <title>Senior Next.js Engineer - VeroCV</title>
          <script type="application/ld+json">
            {
              "@type": "JobPosting",
              "title": "Senior Next.js Engineer",
              "hiringOrganization": { "name": "VeroCV Labs" },
              "jobLocation": { "address": { "addressLocality": "Hà Nội" } },
              "baseSalary": { "currency": "VND", "value": { "minValue": 35000000, "maxValue": 55000000 } },
              "description": "<p>Build fast Cloudflare Workers apps with TypeScript.</p>"
            }
          </script>
        </head>
        <body></body>
      </html>
    `
    const job = extractJobFromHtml(sampleHtml, 'https://careers.example.com/jobs/1')
    expect(job.company).toBe('VeroCV Labs')
    expect(job.role).toBe('Senior Next.js Engineer')
    expect(job.location).toBe('Hà Nội')
    expect(job.jdText).toContain('Cloudflare Workers')
  })
})
