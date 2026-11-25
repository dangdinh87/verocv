import { z } from 'zod'
import type { ResumeData } from '@/components/resume/resume-data'
import { localGenerateCoverLetter, type CoverLetterAiOutput } from '@/server/ai/local-fallback'
import { AiQuotaExceededError, runAiTask } from '@/server/ai/workers-ai'
import { jsonError, jsonOk } from '@/server/http'

const CoverLetterRequestSchema = z.object({
  resumeData: z.unknown().optional(),
  company: z.string().max(150).default(''),
  role: z.string().max(150).default(''),
  jdText: z.string().max(15_000).default(''),
  tone: z.enum(['formal', 'modern', 'concise']).default('modern'),
  lang: z.enum(['vi', 'en']).default('vi'),
})

const CoverLetterOutputSchema = z.object({
  subject: z.string(),
  salutation: z.string(),
  paragraphs: z.array(z.string()).min(2),
  signOff: z.string(),
})

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = CoverLetterRequestSchema.safeParse(raw)
  if (!parsed.success) return jsonError('Dữ liệu soạn thư không hợp lệ.', 400)

  const resumeData = parsed.data.resumeData as ResumeData | undefined

  try {
    const result = await runAiTask<CoverLetterAiOutput>({
      req,
      feature: 'cover-letter',
      systemPrompt:
        'Write a tailored cover letter as strictly valid JSON: { "subject": string, "salutation": string, "paragraphs": string[], "signOff": string }. Use only verified facts from resumeData.',
      userPrompt: JSON.stringify(parsed.data),
      validate: (obj) => {
        const res = CoverLetterOutputSchema.safeParse(obj)
        return res.success ? res.data : null
      },
      fallback: () =>
        localGenerateCoverLetter({
          resumeData,
          company: parsed.data.company,
          role: parsed.data.role,
          jdText: parsed.data.jdText,
          tone: parsed.data.tone,
          lang: parsed.data.lang,
        }),
    })

    return jsonOk(result)
  } catch (err) {
    if (err instanceof AiQuotaExceededError) {
      return jsonError(err.message, 429, { limit: err.limit })
    }
    return jsonError('Không thể tạo thư xin việc lúc này.', 500)
  }
}
