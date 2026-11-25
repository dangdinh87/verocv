import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

const EventSchema = z.object({
  eventType: z.enum(['view', 'download_pdf', 'download_docx']),
  refTag: z.string().trim().max(80).optional(),
})

export async function POST(req: NextRequest, ctx: RouteContext<'/api/public-cv/[slug]/event'>) {
  const { slug } = await ctx.params
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu sự kiện không hợp lệ.', 400)
  }

  const parsed = EventSchema.safeParse(raw)
  if (!parsed.success) return jsonError('Loại sự kiện không hợp lệ.', 400)

  const db = getSaasDb()
  const link = await db.getPublicLink(slug)
  if (!link || !link.isActive) return jsonError('Không tìm thấy liên kết.', 404)

  await db.recordLinkEvent({
    id: `ev_${crypto.randomUUID()}`,
    slug,
    eventType: parsed.data.eventType,
    refTag: parsed.data.refTag || null,
    userAgent: req.headers.get('user-agent')?.slice(0, 180) ?? null,
    createdAt: new Date().toISOString(),
  })

  return jsonOk({ ok: true })
}
