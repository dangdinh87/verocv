import { cookies } from 'next/headers'
import { PRICES } from '@/config/brand'
import { getServerEnv } from '@/server/cf-env'
import { generateSessionToken, sha256Hex } from '@/server/crypto'
import { getSaasDb, type DbUser, type UserPlanId } from '@/server/db/store'

export const SESSION_COOKIE_NAME = 'hsx_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type PlanInfo = {
  id: UserPlanId
  name: string
  priceVnd: number
  durationDays: number | null
  dailyAiLimit: number
  maxPublicLinks: number
  unlimitedDocuments: boolean
  docxExport: boolean
  recruiterAnalytics: boolean
}

export const PLAN_CATALOG: Record<UserPlanId, PlanInfo> = {
  free: {
    id: 'free',
    name: 'Miễn phí',
    priceVnd: 0,
    durationDays: null,
    dailyAiLimit: 8,
    maxPublicLinks: 1,
    unlimitedDocuments: true,
    docxExport: true,
    recruiterAnalytics: true,
  },
  pass_14d: {
    id: 'pass_14d',
    name: 'Pass Săn Việc 14 ngày',
    priceVnd: PRICES.pass14d,
    durationDays: 14,
    dailyAiLimit: 100,
    maxPublicLinks: 10,
    unlimitedDocuments: true,
    docxExport: true,
    recruiterAnalytics: true,
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Theo tháng',
    priceVnd: PRICES.proMonthly,
    durationDays: 30,
    dailyAiLimit: 200,
    maxPublicLinks: 50,
    unlimitedDocuments: true,
    docxExport: true,
    recruiterAnalytics: true,
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Theo năm',
    priceVnd: PRICES.proYearly,
    durationDays: 365,
    dailyAiLimit: 300,
    maxPublicLinks: 100,
    unlimitedDocuments: true,
    docxExport: true,
    recruiterAnalytics: true,
  },
}

export function resolveEffectivePlan(user: DbUser | null): PlanInfo {
  if (!user || user.plan === 'free') return PLAN_CATALOG.free
  if (user.planExpiresAt && user.planExpiresAt <= new Date().toISOString()) {
    return PLAN_CATALOG.free
  }
  return PLAN_CATALOG[user.plan] ?? PLAN_CATALOG.free
}

export type PublicUserProfile = {
  id: string
  email: string
  name: string
  plan: UserPlanId
  planName: string
  planExpiresAt: string | null
  entitlements: PlanInfo
}

export function toPublicUser(user: DbUser): PublicUserProfile {
  const effective = resolveEffectivePlan(user)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: effective.id,
    planName: effective.name,
    planExpiresAt: effective.id === 'free' ? null : user.planExpiresAt,
    entitlements: effective,
  }
}

export async function createUserSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = generateSessionToken()
  const tokenHash = await sha256Hex(`${getServerEnv().SESSION_SECRET}:${token}`)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString()

  await getSaasDb().createSession({
    tokenHash,
    userId,
    expiresAt,
    createdAt: now.toISOString(),
  })

  return { token, expiresAt }
}

export async function attachSessionCookie(token: string, expiresAt: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getServerEnv().NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  const tokenHash = await sha256Hex(`${getServerEnv().SESSION_SECRET}:${token}`)
  const found = await getSaasDb().getSessionWithUser(tokenHash)
  return found?.user ?? null
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (token) {
    const tokenHash = await sha256Hex(`${getServerEnv().SESSION_SECRET}:${token}`)
    await getSaasDb().deleteSession(tokenHash)
  }
  await clearSessionCookie()
}

export function computePlanExpiry(planId: Exclude<UserPlanId, 'free'>, existingExpiresAt?: string | null): string {
  const days = PLAN_CATALOG[planId].durationDays ?? 30
  const baseMs =
    existingExpiresAt && existingExpiresAt > new Date().toISOString() ? new Date(existingExpiresAt).getTime() : Date.now()
  return new Date(baseMs + days * 24 * 60 * 60 * 1000).toISOString()
}
