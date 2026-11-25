import { describe, expect, it, vi } from 'vitest'
import { GIA_BAO, MINH_ANH, QUOC_HUY, THU_HA, type ResumeData } from '@/components/resume/resume-data'
import { evaluateCvReview } from '@/lib/cv-reviewer'
import { EMPTY_RESUME_DATA } from '@/types/resume'

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}))

describe('evaluateCvReview', () => {
  it('scores an empty CV around 15-25 and flags critical completeness issues', () => {
    const report = evaluateCvReview(EMPTY_RESUME_DATA, 'vi')
    expect(report.overallScore).toBeGreaterThanOrEqual(15)
    expect(report.overallScore).toBeLessThanOrEqual(25)
    expect(report.fixes.some((f) => f.severity === 'critical' && f.target.kind === 'field' && f.target.field === 'name')).toBe(true)
    expect(report.fixes.some((f) => f.target.kind === 'summary')).toBe(true)
    expect(report.fixes.some((f) => f.target.kind === 'skills-add')).toBe(true)
  })

  it('scores an unpolished draft in the 45-68 range and detects weak openings, punctuation, and missing metrics', () => {
    const draft: ResumeData = {
      ...EMPTY_RESUME_DATA,
      name: 'Nguyễn Văn An',
      role: 'Chuyên viên Marketing',
      email: 'vanan@example.com',
      phone: '0901234567',
      summary: 'Tôi muốn tìm công việc phù hợp để phát triển bản thân .',
      jobs: [
        {
          title: 'Nhân viên Marketing',
          org: 'Công ty ABC',
          period: '2023 – nay',
          bullets: [
            'Chịu trách nhiệm quản lý fanpage của công ty',
            'Tham gia tổ chức sự kiện cuối năm , hỗ trợ các bộ phận',
          ],
        },
      ],
      education: [{ school: 'Đại học Kinh tế', degree: 'Cử nhân Marketing', period: '2019 – 2023' }],
      skills: ['Facebook', 'Content'],
    }

    const report = evaluateCvReview(draft, 'vi')
    expect(report.overallScore).toBeGreaterThanOrEqual(45)
    expect(report.overallScore).toBeLessThanOrEqual(68)
    expect(report.subScores.impact).toBeLessThan(40)

    const bulletFix0 = report.fixes.find(
      (f) => f.target.kind === 'job-bullet' && f.target.jobIndex === 0 && f.target.bulletIndex === 0,
    )
    expect(bulletFix0).toBeDefined()
    expect(bulletFix0?.severity).toBe('critical')
    expect(bulletFix0?.suggestedText).toBeTruthy()
    expect(bulletFix0?.suggestedText).not.toMatch(/^Chịu trách nhiệm/i)
  })

  it('scores strong quantified personas (QUOC_HUY, MINH_ANH, THU_HA, GIA_BAO) in the 85-98 range', () => {
    for (const persona of [QUOC_HUY, MINH_ANH, THU_HA, GIA_BAO]) {
      const report = evaluateCvReview(persona, 'vi')
      expect(report.overallScore).toBeGreaterThanOrEqual(85)
      expect(report.overallScore).toBeLessThanOrEqual(98)
      expect(report.subScores.ats).toBeGreaterThanOrEqual(85)
      expect(report.subScores.completeness).toBeGreaterThanOrEqual(90)
      expect(report.strengths.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('produces accurate targets across custom sections and respects hidden jobs/sections', () => {
    const withCustomAndHidden: ResumeData = {
      ...MINH_ANH,
      jobs: [
        ...MINH_ANH.jobs,
        {
          title: 'Hidden Job',
          org: 'Hidden Corp',
          period: '',
          bullets: ['Chịu trách nhiệm việc bí mật'],
          hidden: true,
        },
      ],
      customSections: [
        {
          id: 'custom_proj',
          kind: 'projects',
          title: 'Dự án nổi bật',
          entries: [
            {
              id: 'p1',
              title: 'Website Bán hàng',
              bullets: ['Tham gia xây dựng giao diện bán hàng'],
            },
          ],
        },
      ],
    }

    const report = evaluateCvReview(withCustomAndHidden, 'vi', ['summary'])
    expect(report.fixes.some((f) => f.target.kind === 'summary')).toBe(false)
    expect(
      report.fixes.some((f) => f.target.kind === 'job-bullet' && f.target.jobIndex === 3),
    ).toBe(false)

    const customFix = report.fixes.find(
      (f) =>
        f.target.kind === 'custom-bullet' &&
        f.target.sectionId === 'custom_proj' &&
        f.target.entryIndex === 0 &&
        f.target.bulletIndex === 0,
    )
    expect(customFix).toBeDefined()
    expect(customFix?.suggestedText).toBeTruthy()
  })

  it('strictly improves overallScore after applying suggested fixes', () => {
    const draft: ResumeData = {
      ...EMPTY_RESUME_DATA,
      name: 'Trần Thị Bình',
      role: 'Frontend Developer',
      email: 'binh@example.com',
      phone: '0912345678',
      summary: '',
      jobs: [
        {
          title: 'Frontend Developer',
          org: 'Công ty XYZ',
          period: '2023 – nay',
          bullets: ['Chịu trách nhiệm xây dựng giao diện trang chủ cho sản phẩm thương mại điện tử'],
        },
      ],
      education: [{ school: 'Đại học Bách khoa', degree: 'Kỹ sư CNTT', period: '2019 – 2023' }],
      skills: [],
    }

    const before = evaluateCvReview(draft, 'vi')
    const updated: ResumeData = JSON.parse(JSON.stringify(draft))

    for (const fix of before.fixes) {
      if (fix.target.kind === 'summary' && fix.suggestedText) {
        updated.summary = fix.suggestedText
      } else if (fix.target.kind === 'job-bullet' && fix.suggestedText) {
        updated.jobs[fix.target.jobIndex].bullets[fix.target.bulletIndex] = fix.suggestedText
      } else if (fix.target.kind === 'skills-add') {
        updated.skills.push(...fix.target.suggestedSkills)
      }
    }

    const after = evaluateCvReview(updated, 'vi')
    expect(after.overallScore).toBeGreaterThan(before.overallScore)
    expect(after.subScores.impact).toBeGreaterThan(before.subScores.impact)
    expect(after.subScores.ats).toBeGreaterThan(before.subScores.ats)
    expect(after.subScores.completeness).toBeGreaterThan(before.subScores.completeness)
  })
})

describe('POST /api/ai/review-cv', () => {
  it('returns HTTP 200 with valid review report and optional JD match metadata', async () => {
    const { POST } = await import('@/app/api/ai/review-cv/route')
    const req = new Request('http://localhost/api/ai/review-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeData: QUOC_HUY,
        targetRole: 'Senior Frontend Developer',
        jdText: 'Tuyển Senior Frontend Developer thành thạo React, TypeScript, Next.js, GraphQL và Docker.',
        lang: 'vi',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      data: {
        overallScore: number
        gradeLabel: string
        recruiterVerdict: string
        strengths: string[]
        subScores: Record<string, number>
        fixes: unknown[]
        jdMatchScore?: number
      }
      provider: string
      quota: { remaining: number }
    }

    expect(json.data.overallScore).toBeGreaterThanOrEqual(85)
    expect(json.data.gradeLabel).toBeTruthy()
    expect(json.data.recruiterVerdict).toContain('JD')
    expect(json.data.jdMatchScore).toBeGreaterThan(0)
    expect(Array.isArray(json.data.fixes)).toBe(true)
    expect(json.provider).toBeTruthy()
    expect(typeof json.quota.remaining).toBe('number')
  })

  it('returns HTTP 400 on malformed JSON body', async () => {
    const { POST } = await import('@/app/api/ai/review-cv/route')
    const req = new Request('http://localhost/api/ai/review-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
