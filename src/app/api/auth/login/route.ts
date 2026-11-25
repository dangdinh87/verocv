import { z } from 'zod'
import { attachSessionCookie, createUserSession, toPublicUser } from '@/server/auth'
import { verifyPassword } from '@/server/crypto'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

const LoginSchema = z.object({
  email: z.string().trim().email('Email chưa đúng định dạng.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
})

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Thông tin đăng nhập chưa hợp lệ.', 400)
  }

  const db = getSaasDb()
  const user = await db.getUserByEmail(parsed.data.email)
  if (!user) {
    return jsonError('Email hoặc mật khẩu chưa đúng.', 401)
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash)
  if (!ok) {
    return jsonError('Email hoặc mật khẩu chưa đúng.', 401)
  }

  const session = await createUserSession(user.id)
  await attachSessionCookie(session.token, session.expiresAt)

  return jsonOk({ user: toPublicUser(user) })
}
