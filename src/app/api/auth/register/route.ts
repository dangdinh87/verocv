import { z } from 'zod'
import { attachSessionCookie, createUserSession, toPublicUser } from '@/server/auth'
import { hashPassword } from '@/server/crypto'
import { getSaasDb } from '@/server/db/store'
import { jsonError, jsonOk } from '@/server/http'

const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(80),
  email: z.string().trim().email('Email chưa đúng định dạng.'),
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.').max(128),
})

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Thông tin đăng ký chưa hợp lệ.', 400)
  }

  const db = getSaasDb()
  const existing = await db.getUserByEmail(parsed.data.email)
  if (existing) {
    return jsonError('Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.', 409)
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const user = await db.createUser({
    id: `usr_${crypto.randomUUID()}`,
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
  })

  const session = await createUserSession(user.id)
  await attachSessionCookie(session.token, session.expiresAt)

  return jsonOk({ user: toPublicUser(user) }, 201)
}
