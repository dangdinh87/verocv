import { z } from 'zod'
import { localRewriteOptions } from '@/server/ai/local-fallback'
import { AiQuotaExceededError, runAiTask } from '@/server/ai/workers-ai'
import { jsonError, jsonOk } from '@/server/http'

const RewriteRequestSchema = z.object({
  kind: z.enum(['bullet', 'summary', 'skills']),
  text: z.string().max(4000).default(''),
  role: z.string().max(200).optional(),
  mode: z.enum(['impact', 'concise', 'detailed']).default('impact'),
  lang: z.enum(['vi', 'en']).default('vi'),
})

const RewriteOutputSchema = z.object({
  options: z.array(z.string()).min(1),
  note: z.string().optional(),
})

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = RewriteRequestSchema.safeParse(raw)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Yêu cầu không hợp lệ.', 400)

  try {
    const result = await runAiTask<{ options: string[]; note?: string }>({
      req,
      feature: `rewrite-${parsed.data.kind}`,
      systemPrompt:
        'You are a professional resume writer. Return strictly valid JSON { "options": string[], "note": string }. Provide 3 strong options in the requested language and mode. Never invent fake numbers; use [x] placeholders.',
      userPrompt: JSON.stringify(parsed.data),
      validate: (obj) => {
        const res = RewriteOutputSchema.safeParse(obj)
        return res.success ? res.data : null
      },
      fallback: () => localRewriteOptions(parsed.data),
    })

    return jsonOk(result)
  } catch (err) {
    if (err instanceof AiQuotaExceededError) {
      return jsonError(err.message, 429, { limit: err.limit })
    }
    return jsonError('Không thể tạo gợi ý lúc này.', 500)
  }
}
