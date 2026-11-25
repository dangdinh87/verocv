import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@/server/auth'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/billing/orders/[orderCode]'>) {
  const user = await getCurrentUser()
  if (!user) return jsonError('Cần đăng nhập.', 401)

  const { orderCode } = await ctx.params
  const order = await getSaasDb().getPaymentOrder(orderCode)
  if (!order || order.userId !== user.id) {
    return jsonError('Không tìm thấy đơn hàng.', 404)
  }

  return jsonOk({ order })
}
