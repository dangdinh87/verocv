import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/server/auth'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'
import { migrateToV2 } from '@/types/schema'

const SaveVersionSchema = z.object({
  label: z.string().trim().min(1, 'Cần nhập tên mốc phiên bản.').max(80),
  doc: z.unknown(),
})

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/resumes/[id]/versions'>) {
  const user = await getCurrentUser()
  if (!user) return jsonError('Cần đăng nhập để xem lịch sử phiên bản trên đám mây.', 401)
  const { id } = await ctx.params
  const versions = await getSaasDb().listResumeVersions(user.id, id)
  return jsonOk({
    versions: versions.map((v) => ({
      id: v.id,
      resumeId: v.resumeId,
      label: v.label,
      createdAt: v.createdAt,
      doc: JSON.parse(v.docJson),
    })),
  })
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/resumes/[id]/versions'>) {
  const user = await getCurrentUser()
  if (!user) return jsonError('Cần đăng nhập để lưu mốc phiên bản lên đám mây.', 401)
  const { id } = await ctx.params

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = SaveVersionSchema.safeParse(raw)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.', 400)

  let doc
  try {
    doc = migrateToV2(parsed.data.doc)
  } catch {
    return jsonError('Nội dung CV không hợp lệ.', 400)
  }

  const version = {
    id: `ver_${crypto.randomUUID()}`,
    resumeId: id,
    userId: user.id,
    label: parsed.data.label,
    docJson: JSON.stringify(doc),
    createdAt: new Date().toISOString(),
  }
  await getSaasDb().createResumeVersion(version)

  return jsonOk({ version: { id: version.id, resumeId: version.resumeId, label: version.label, createdAt: version.createdAt, doc } }, 201)
}
