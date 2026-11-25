import { getCurrentUser } from '@/server/auth'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return jsonError('Cần đăng nhập.', 401)
  const orders = await getSaasDb().listPaymentOrdersByUser(user.id)
  return jsonOk({ orders })
}
