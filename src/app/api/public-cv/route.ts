import { z } from 'zod'
import { getCurrentUser, resolveEffectivePlan } from '@/server/auth'
import { sha256Hex } from '@/server/crypto'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'
import { migrateToV2 } from '@/types/schema'

const PublishSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/, 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang (3–48 ký tự).'),
  resumeId: z.string().min(1),
  doc: z.unknown(),
  hidePhone: z.boolean().default(false),
  hideEmail: z.boolean().default(false),
  passcode: z.string().max(32).optional(),
  clearPasscode: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return jsonError('Cần đăng nhập để xem danh sách Link CV.', 401)

  const db = getSaasDb()
  const links = await db.listPublicLinksByUser(user.id)
  const withStats = await Promise.all(
    links.map(async (l) => ({
      slug: l.slug,
      resumeId: l.resumeId,
      hidePhone: l.hidePhone,
      hideEmail: l.hideEmail,
      hasPasscode: Boolean(l.passcodeHash),
      isActive: l.isActive,
      updatedAt: l.updatedAt,
      createdAt: l.createdAt,
      analytics: await db.getLinkAnalytics(l.slug),
    })),
  )
  return jsonOk({ links: withStats })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return jsonError('Bạn cần đăng nhập để xuất bản Link CV trực tuyến.', 401)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = PublishSchema.safeParse(raw)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Đường dẫn không hợp lệ.', 400)

  let doc
  try {
    doc = migrateToV2(parsed.data.doc)
  } catch {
    return jsonError('Dữ liệu CV không hợp lệ.', 400)
  }

  const db = getSaasDb()
  const existing = await db.getPublicLink(parsed.data.slug)
  if (existing && existing.userId !== user.id) {
    return jsonError('Đường dẫn này đã có người sử dụng. Hãy chọn tên khác.', 409)
  }

  const effective = resolveEffectivePlan(user)
  if (!existing) {
    const userLinks = await db.listPublicLinksByUser(user.id)
    if (userLinks.length >= effective.maxPublicLinks) {
      return jsonError(
        `Gói ${effective.name} cho phép tối đa ${effective.maxPublicLinks} Link CV Online. Nâng cấp Pass 14 ngày hoặc Pro để tạo thêm.`,
        403,
      )
    }
  }

  let passcodeHash = existing?.passcodeHash ?? null
  if (parsed.data.clearPasscode) {
    passcodeHash = null
  } else if (parsed.data.passcode && parsed.data.passcode.trim().length > 0) {
    passcodeHash = await sha256Hex(`pin:${parsed.data.slug}:${parsed.data.passcode.trim()}`)
  }

  const now = new Date().toISOString()
  await db.upsertPublicLink({
    slug: parsed.data.slug,
    resumeId: parsed.data.resumeId,
    userId: user.id,
    docSnapshotJson: JSON.stringify(doc),
    hidePhone: parsed.data.hidePhone,
    hideEmail: parsed.data.hideEmail,
    passcodeHash,
    isActive: parsed.data.isActive,
    updatedAt: now,
    createdAt: existing?.createdAt ?? now,
  })

  const analytics = await db.getLinkAnalytics(parsed.data.slug)
  return jsonOk({
    link: {
      slug: parsed.data.slug,
      resumeId: parsed.data.resumeId,
      hidePhone: parsed.data.hidePhone,
      hideEmail: parsed.data.hideEmail,
      hasPasscode: Boolean(passcodeHash),
      isActive: parsed.data.isActive,
      updatedAt: now,
      analytics,
    },
  })
}
