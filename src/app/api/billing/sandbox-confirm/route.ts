import { z } from 'zod'
import { computePlanExpiry, getCurrentUser, toPublicUser } from '@/server/auth'
import { getServerEnv } from '@/server/cf-env'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

const SandboxSchema = z.object({
  orderCode: z.string().min(4),
})

export async function POST(req: Request) {
  if (getServerEnv().NODE_ENV === 'production') {
    return jsonError('Tính năng giả lập thanh toán chỉ khả dụng ở môi trường phát triển.', 403)
  }

  const user = await getCurrentUser()
  if (!user) return jsonError('Cần đăng nhập.', 401)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = SandboxSchema.safeParse(raw)
  if (!parsed.success) return jsonError('Mã đơn không hợp lệ.', 400)

  const db = getSaasDb()
  const order = await db.getPaymentOrder(parsed.data.orderCode)
  if (!order || order.userId !== user.id) {
    return jsonError('Không tìm thấy đơn hàng của bạn.', 404)
  }

  const nextExpiry = computePlanExpiry(order.planId, user.plan === order.planId ? user.planExpiresAt : null)
  const result = await db.markOrderPaidAndUpgrade(order.orderCode, `sandbox_${Date.now()}`, nextExpiry)
  if (!result) return jsonError('Không thể cập nhật đơn hàng.', 500)

  return jsonOk({
    ok: true,
    order: result.order,
    user: toPublicUser(result.user),
  })
}
