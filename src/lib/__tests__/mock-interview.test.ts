import { describe, expect, it, vi } from 'vitest'
import { QUOC_HUY } from '@/components/resume/resume-data'

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}))

describe('POST /api/ai/mock-interview', () => {
  it('action=start returns HTTP 200 with 6 tailored interview questions', async () => {
    const { POST } = await import('@/app/api/ai/mock-interview/route')
    const req = new Request('http://localhost/api/ai/mock-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        resumeData: QUOC_HUY,
        role: 'Senior Frontend Developer',
        company: 'TechCorp',
        jdText: 'Tuyển Senior Frontend Developer thành thạo React, TypeScript, Next.js, GraphQL và tối ưu Web Vitals.',
        lang: 'vi',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      data: {
        questions: { id: string; category: 'behavioral' | 'technical' | 'gap'; question: string; hint: string }[]
      }
      provider: string
      quota: { remaining: number }
    }

    expect(json.data.questions).toHaveLength(6)
    expect(json.data.questions.every((q) => q.id && q.question.length > 10 && q.hint.length > 5)).toBe(true)
    expect(json.data.questions.some((q) => q.category === 'technical')).toBe(true)
    expect(json.data.questions.some((q) => q.category === 'gap')).toBe(true)
    expect(json.provider).toBeTruthy()
    expect(typeof json.quota.remaining).toBe('number')
  })

  it('action=evaluate scores a strong STAR answer with metrics highly and populates all starBreakdown flags', async () => {
    const { POST } = await import('@/app/api/ai/mock-interview/route')
    const req = new Request('http://localhost/api/ai/mock-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate',
        resumeData: QUOC_HUY,
        role: 'Senior Frontend Developer',
        company: 'TechCorp',
        lang: 'vi',
        question: 'Hãy phân tích một dự án bạn tối ưu hiệu năng React/Next.js.',
        answer:
          'Tại Công ty Phần mềm Sao Mai năm 2023, trong dự án nâng cấp trang thanh toán, mục tiêu của tôi là giảm độ trễ tải trang gây rớt đơn hàng. Tôi đã trực tiếp phân tích bundle, tách dynamic import bằng React và TypeScript, đồng thời viết kiểm thử tự động cho luồng đặt hàng. Kết quả là thời gian tải giảm từ 4,1 giây xuống 1,8 giây và tỷ lệ hoàn tất thanh toán tăng 18%.',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      data: {
        score: number
        verdict: string
        starBreakdown: { situation: boolean; task: boolean; action: boolean; result: boolean; hasMetrics: boolean }
        strengths: string[]
        gaps: string[]
        improvedAnswer: string
        followUpQuestion: string
      }
    }

    expect(json.data.score).toBeGreaterThanOrEqual(80)
    expect(json.data.starBreakdown).toEqual({
      situation: true,
      task: true,
      action: true,
      result: true,
      hasMetrics: true,
    })
    expect(json.data.strengths.length).toBeGreaterThanOrEqual(3)
    expect(json.data.improvedAnswer.length).toBeGreaterThan(30)
    expect(json.data.followUpQuestion.length).toBeGreaterThan(10)
  })

  it('action=evaluate flags missing STAR parts and metrics on a vague short answer', async () => {
    const { POST } = await import('@/app/api/ai/mock-interview/route')
    const req = new Request('http://localhost/api/ai/mock-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate',
        resumeData: QUOC_HUY,
        role: 'Frontend Developer',
        lang: 'vi',
        question: 'Bạn đã từng xử lý xung đột hoặc deadline gấp chưa?',
        answer: 'Em cố gắng làm thêm giờ để kịp tiến độ chung của nhóm.',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      data: {
        score: number
        starBreakdown: { hasMetrics: boolean; action: boolean }
        gaps: string[]
      }
    }

    expect(json.data.score).toBeLessThan(65)
    expect(json.data.starBreakdown.hasMetrics).toBe(false)
    expect(json.data.gaps.length).toBeGreaterThanOrEqual(2)
  })

  it('returns HTTP 400 when evaluate answer is too short or invalid payload', async () => {
    const { POST } = await import('@/app/api/ai/mock-interview/route')
    const req = new Request('http://localhost/api/ai/mock-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate',
        question: 'Bạn có kinh nghiệm gì?',
        answer: 'ok',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
