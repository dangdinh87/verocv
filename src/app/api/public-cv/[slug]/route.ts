import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/server/auth'
import { sha256Hex, timingSafeEqualStr } from '@/server/crypto'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'
import { migrateToV2 } from '@/types/schema'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/public-cv/[slug]'>) {
  const { slug } = await ctx.params
  const db = getSaasDb()
  const link = await db.getPublicLink(slug)
  if (!link || !link.isActive) {
    return jsonError('Liên kết CV không tồn tại hoặc đã tạm ẩn.', 404)
  }

  if (link.passcodeHash) {
    const submitted = req.headers.get('x-cv-passcode')?.trim() ?? ''
    if (!submitted) {
      return jsonOk({ protected: true, slug: link.slug })
    }
    const submittedHash = await sha256Hex(`pin:${link.slug}:${submitted}`)
    if (!timingSafeEqualStr(submittedHash, link.passcodeHash)) {
      return jsonError('Mã PIN chưa chính xác.', 403)
    }
  }

  const doc = migrateToV2(JSON.parse(link.docSnapshotJson))
  if (link.hidePhone) doc.data.phone = ''
  if (link.hideEmail) doc.data.email = ''

  return jsonOk({
    protected: false,
    slug: link.slug,
    updatedAt: link.updatedAt,
    doc,
  })
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/public-cv/[slug]'>) {
  const user = await getCurrentUser()
  if (!user) return jsonError('Cần đăng nhập.', 401)
  const { slug } = await ctx.params
  const removed = await getSaasDb().deletePublicLink(user.id, slug)
  if (!removed) return jsonError('Không tìm thấy liên kết để xoá.', 404)
  return jsonOk({ ok: true })
}
