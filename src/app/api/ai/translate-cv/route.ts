import { z } from 'zod'
import type { ResumeData } from '@/components/resume/resume-data'
import { localTranslateResume } from '@/server/ai/local-fallback'
import { AiQuotaExceededError, runAiTask } from '@/server/ai/workers-ai'
import { jsonError, jsonOk } from '@/server/http'

const TranslateRequestSchema = z.object({
  resumeData: z.unknown(),
  targetLang: z.enum(['vi', 'en']),
})

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = TranslateRequestSchema.safeParse(raw)
  if (!parsed.success) return jsonError('Tham số dịch CV không hợp lệ.', 400)

  const resumeData = parsed.data.resumeData as ResumeData
  const { targetLang } = parsed.data

  try {
    const result = await runAiTask<ResumeData>({
      req,
      feature: 'translate-cv',
      systemPrompt: `Translate all textual resume fields into ${targetLang === 'en' ? 'professional English' : 'natural Vietnamese'} keeping exact JSON structure, IDs, emails, URLs, numbers, and **bold** markdown markers intact. Return valid JSON matching the input ResumeData shape.`,
      userPrompt: JSON.stringify({ targetLang, resumeData }),
      validate: (obj) => {
        if (!obj || typeof obj !== 'object') return null
        const candidate = obj as ResumeData
        if (!Array.isArray(candidate.jobs) || !Array.isArray(candidate.skills)) return null
        return { ...resumeData, ...candidate }
      },
      fallback: () => localTranslateResume(resumeData, targetLang),
    })

    return jsonOk(result)
  } catch (err) {
    if (err instanceof AiQuotaExceededError) {
      return jsonError(err.message, 429, { limit: err.limit })
    }
    return jsonError('Không thể dịch CV lúc này.', 500)
  }
}
