import { z } from 'zod'
import type { ResumeData } from '@/components/resume/resume-data'
import { localInterviewPrep } from '@/server/ai/local-fallback'
import { AiQuotaExceededError, runAiTask } from '@/server/ai/workers-ai'
import { jsonError, jsonOk } from '@/server/http'
import type { InterviewPrepQuestion } from '@/types/resume'

const InterviewRequestSchema = z.object({
  resumeData: z.unknown().optional(),
  jdText: z.string().max(15_000).default(''),
  company: z.string().max(150).default(''),
  role: z.string().max(150).default(''),
  lang: z.enum(['vi', 'en']).default('vi'),
})

const InterviewOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        hint: z.string(),
      }),
    )
    .min(4),
})

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = InterviewRequestSchema.safeParse(raw)
  if (!parsed.success) return jsonError('Dữ liệu luyện phỏng vấn không hợp lệ.', 400)

  const resumeData = parsed.data.resumeData as ResumeData | undefined

  try {
    const result = await runAiTask<{ questions: InterviewPrepQuestion[] }>({
      req,
      feature: 'interview-prep',
      systemPrompt:
        'Generate 8 targeted STAR interview questions as strictly valid JSON: { "questions": [{ "question": string, "hint": string }] } comparing the candidate resume against the job description.',
      userPrompt: JSON.stringify(parsed.data),
      validate: (obj) => {
        const res = InterviewOutputSchema.safeParse(obj)
        return res.success ? res.data : null
      },
      fallback: () => ({
        questions: localInterviewPrep({
          resumeData,
          jdText: parsed.data.jdText,
          company: parsed.data.company,
          role: parsed.data.role,
          lang: parsed.data.lang,
        }),
      }),
    })

    return jsonOk(result)
  } catch (err) {
    if (err instanceof AiQuotaExceededError) {
      return jsonError(err.message, 429, { limit: err.limit })
    }
    return jsonError('Không thể tạo câu hỏi phỏng vấn lúc này.', 500)
  }
}
