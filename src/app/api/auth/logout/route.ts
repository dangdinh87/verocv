import { destroyCurrentSession } from '@/server/auth'
import { jsonOk } from '@/server/http'

export async function POST() {
  await destroyCurrentSession()
  return jsonOk({ ok: true })
}
