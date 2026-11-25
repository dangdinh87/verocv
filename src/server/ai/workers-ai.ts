import { getCurrentUser, resolveEffectivePlan } from '@/server/auth'
import { getServerEnv } from '@/server/cf-env'
import { getSaasDb } from '@/server/db/store'
import { getClientIp } from '@/server/http'

export class AiQuotaExceededError extends Error {
  constructor(readonly limit: number) {
    super(`Bạn đã dùng hết ${limit} lượt AI trong ngày hôm nay.`)
    this.name = 'AiQuotaExceededError'
  }
}

export type AiExecutionResult<T> = {
  data: T
  provider: 'workers-ai' | 'local-engine'
  model: string
  quota: {
    usedToday: number
    dailyLimit: number
    remaining: number
  }
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('INVALID_AI_JSON')
  }
}

async function invokeCloudflareWorkersAi(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ rawText: string; model: string } | null> {
  const env = getServerEnv()
  const model = env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

  const payload = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.25,
    max_tokens: 1800,
    response_format: { type: 'json_object' },
  }

  if (env.AI) {
    const res = (await env.AI.run(model, payload)) as { response?: unknown } | string
    const text = typeof res === 'string' ? res : typeof res?.response === 'string' ? res.response : JSON.stringify(res?.response ?? res)
    return { rawText: text, model }
  }

  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      if (!res.ok) return null
      const json = (await res.json()) as { success?: boolean; result?: { response?: unknown } }
      if (!json.success || !json.result) return null
      const r = json.result.response
      const text = typeof r === 'string' ? r : JSON.stringify(r ?? json.result)
      return { rawText: text, model }
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  return null
}

export async function resolveAiActor(req: Request): Promise<{ actorKey: string; dailyLimit: number }> {
  const user = await getCurrentUser()
  const plan = resolveEffectivePlan(user)
  const actorKey = user ? `user:${user.id}` : `ip:${getClientIp(req)}`
  return { actorKey, dailyLimit: plan.dailyAiLimit }
}

export async function runAiTask<T>(params: {
  req: Request
  feature: string
  systemPrompt: string
  userPrompt: string
  validate?: (raw: unknown) => T | null
  fallback: () => Promise<T> | T
}): Promise<AiExecutionResult<T>> {
  const { actorKey, dailyLimit } = await resolveAiActor(params.req)
  const db = getSaasDb()
  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)

  const usedBefore = await db.countAiUsageSince(actorKey, dayStart.toISOString())
  if (usedBefore >= dailyLimit) {
    throw new AiQuotaExceededError(dailyLimit)
  }

  let data: T | null = null
  let provider: 'workers-ai' | 'local-engine' = 'local-engine'
  let model = 'verocv-semantic-local'

  const remote = await invokeCloudflareWorkersAi(params.systemPrompt, params.userPrompt)
  if (remote) {
    try {
      const parsed = extractJsonObject(remote.rawText)
      const valid = params.validate ? params.validate(parsed) : (parsed as T)
      if (valid !== null) {
        data = valid
        provider = 'workers-ai'
        model = remote.model
      }
    } catch {
      // Fallback safely to local semantic engine if Workers AI output is malformed
    }
  }

  if (data === null) {
    data = await params.fallback()
  }

  await db.recordAiUsage({
    id: `ai_${crypto.randomUUID()}`,
    actorKey,
    feature: params.feature,
    provider,
    createdAt: new Date().toISOString(),
  })

  const usedToday = usedBefore + 1
  return {
    data,
    provider,
    model,
    quota: {
      usedToday,
      dailyLimit,
      remaining: Math.max(0, dailyLimit - usedToday),
    },
  }
}
