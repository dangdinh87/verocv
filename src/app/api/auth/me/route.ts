import { getCurrentUser, PLAN_CATALOG, resolveEffectivePlan, toPublicUser } from '@/server/auth'
import { getInfraMode } from '@/server/cf-env'
import { getSaasDb } from '@/server/db/store'
import { getClientIp, jsonOk } from '@/server/http'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  const db = getSaasDb()
  const infra = getInfraMode()

  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)
  const actorKey = user ? `user:${user.id}` : `ip:${getClientIp(req)}`
  const usedToday = await db.countAiUsageSince(actorKey, dayStart.toISOString())
  const effectivePlan = resolveEffectivePlan(user)

  return jsonOk({
    user: user ? toPublicUser(user) : null,
    quota: {
      usedToday,
      dailyLimit: effectivePlan.dailyAiLimit,
      remaining: Math.max(0, effectivePlan.dailyAiLimit - usedToday),
      planId: effectivePlan.id,
      catalog: PLAN_CATALOG,
    },
    infra,
  })
}
