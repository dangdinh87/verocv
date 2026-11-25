import { z } from 'zod'
import { getCurrentUser, PLAN_CATALOG } from '@/server/auth'
import { buildVietQrImageUrl, buildVietQrTransferPayload, getVietQrBankConfig } from '@/server/billing/vietqr'
import { generateOrderCode } from '@/server/crypto'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

const CheckoutSchema = z.object({
  planId: z.enum(['pass_14d', 'pro_monthly', 'pro_yearly']),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return jsonError('Vui lòng đăng nhập trước khi thanh toán nâng cấp gói.', 401)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = CheckoutSchema.safeParse(raw)
  if (!parsed.success) return jsonError('Gói cước không hợp lệ.', 400)

  const plan = PLAN_CATALOG[parsed.data.planId]
  const orderCode = generateOrderCode()
  const now = new Date().toISOString()

  const order = {
    orderCode,
    userId: user.id,
    planId: parsed.data.planId,
    amountVnd: plan.priceVnd,
    status: 'pending' as const,
    providerTxId: null,
    paidAt: null,
    createdAt: now,
  }

  await getSaasDb().createPaymentOrder(order)

  const bank = getVietQrBankConfig()
  const qrEmvString = buildVietQrTransferPayload({
    bankBin: bank.bankBin,
    accountNo: bank.accountNo,
    amountVnd: order.amountVnd,
    orderCode,
  })
  const qrImageUrl = buildVietQrImageUrl({
    bankBin: bank.bankBin,
    accountNo: bank.accountNo,
    accountName: bank.accountName,
    amountVnd: order.amountVnd,
    orderCode,
  })

  return jsonOk({
    order,
    planName: plan.name,
    bank,
    qrEmvString,
    qrImageUrl,
  })
}
