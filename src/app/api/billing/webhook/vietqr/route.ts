import { z } from 'zod'
import { computePlanExpiry } from '@/server/auth'
import { extractOrderCodeFromTransferContent } from '@/server/billing/vietqr'
import { getServerEnv } from '@/server/cf-env'
import { timingSafeEqualStr } from '@/server/crypto'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

// Compatible with SePay, PayOS & Casso VietQR transaction webhook payloads.
const WebhookSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  referenceCode: z.string().optional(),
  content: z.string().optional(),
  description: z.string().optional(),
  transferAmount: z.number().optional(),
  amount: z.number().optional(),
  transferType: z.string().optional(),
})

function extractBearerOrApiKey(req: Request): string {
  const auth = req.headers.get('authorization') ?? ''
  if (/^(?:Apikey|Bearer)\s+/i.test(auth)) {
    return auth.replace(/^(?:Apikey|Bearer)\s+/i, '').trim()
  }
  return (req.headers.get('x-webhook-secret') ?? '').trim()
}

export async function POST(req: Request) {
  const env = getServerEnv()
  const expectedSecret = env.VIETQR_WEBHOOK_SECRET?.trim()
  if (!expectedSecret) {
    return jsonError('Webhook secret chưa được cấu hình trên máy chủ.', 503)
  }

  const providedSecret = extractBearerOrApiKey(req)
  if (!providedSecret || !timingSafeEqualStr(providedSecret, expectedSecret)) {
    return jsonError('Chữ ký webhook không hợp lệ.', 401)
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Payload webhook không hợp lệ.', 400)
  }

  const parsed = WebhookSchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError('Cấu trúc webhook không hợp lệ.', 400)
  }

  const body = parsed.data
  if (body.transferType && body.transferType.toLowerCase() === 'out') {
    return jsonOk({ ignored: true, reason: 'outgoing_transfer' })
  }

  const content = `${body.content ?? ''} ${body.description ?? ''}`.trim()
  const orderCode = extractOrderCodeFromTransferContent(content)
  if (!orderCode) {
    return jsonOk({ ignored: true, reason: 'order_code_not_found' })
  }

  const amount = Number(body.transferAmount ?? body.amount ?? 0)
  const db = getSaasDb()
  const order = await db.getPaymentOrder(orderCode)
  if (!order) {
    return jsonError('Không tìm thấy mã đơn hàng.', 404)
  }

  if (amount < order.amountVnd) {
    return jsonError(`Số tiền chuyển khoản (${amount}đ) chưa đủ mức tối thiểu (${order.amountVnd}đ).`, 422)
  }

  const user = await db.getUserById(order.userId)
  if (!user) return jsonError('Không tìm thấy tài khoản.', 404)

  const nextExpiry = computePlanExpiry(order.planId, user.plan === order.planId ? user.planExpiresAt : null)
  const txId = String(body.referenceCode || body.id || `tx_${Date.now()}`)
  const upgraded = await db.markOrderPaidAndUpgrade(orderCode, txId, nextExpiry)

  return jsonOk({
    ok: true,
    alreadyPaid: upgraded?.alreadyPaid ?? false,
    orderCode,
    plan: upgraded?.user.plan,
    planExpiresAt: upgraded?.user.planExpiresAt,
  })
}
