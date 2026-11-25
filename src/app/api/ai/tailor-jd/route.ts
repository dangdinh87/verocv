import { z } from 'zod'
import type { ResumeData } from '@/components/resume/resume-data'
import { localTailorCvToJd, type JdTailorOutput } from '@/server/ai/local-fallback'
import { AiQuotaExceededError, runAiTask } from '@/server/ai/workers-ai'
import { jsonError, jsonOk } from '@/server/http'

const TailorRequestSchema = z.object({
  resumeData: z.unknown(),
  jdText: z.string().trim().min(20, 'Vui lòng dán nội dung tin tuyển dụng (ít nhất 20 ký tự).').max(20_000),
  lang: z.enum(['vi', 'en']).default('vi'),
})

const TailorOutputSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  gapSummary: z.string(),
  suggestedSummary: z.string(),
  bulletRewrites: z.array(
    z.object({
      jobIndex: z.number().int().min(0),
      bulletIndex: z.number().int().min(0),
      original: z.string(),
      improved: z.string(),
      reason: z.string(),
    }),
  ),
})

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const parsed = TailorRequestSchema.safeParse(raw)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Yêu cầu không hợp lệ.', 400)

  const resumeData = parsed.data.resumeData as ResumeData
  const { jdText, lang } = parsed.data

  try {
    const result = await runAiTask<JdTailorOutput>({
      req,
      feature: 'tailor-jd',
      systemPrompt:
        'You are an ATS and career coach. Return strictly valid JSON with fields: matchScore (0-100), matchedKeywords (string[]), missingKeywords (string[]), gapSummary (string), suggestedSummary (string), bulletRewrites ({jobIndex,bulletIndex,original,improved,reason}[]). Never invent fake metrics; use **[x]%** placeholders when numbers are missing.',
      userPrompt: JSON.stringify({ lang, jdText, resumeData }),
      validate: (obj) => {
        const res = TailorOutputSchema.safeParse(obj)
        return res.success ? res.data : null
      },
      fallback: () => localTailorCvToJd(resumeData, jdText, lang),
    })

    return jsonOk(result)
  } catch (err) {
    if (err instanceof AiQuotaExceededError) {
      return jsonError(err.message, 429, { limit: err.limit })
    }
    return jsonError('Không thể phân tích JD lúc này.', 500)
  }
}
