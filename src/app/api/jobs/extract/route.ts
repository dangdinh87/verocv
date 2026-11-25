import { z } from 'zod'
import { jsonError, jsonOk } from '@/server/http'

const ExtractSchema = z.object({
  url: z.string().trim().min(1, 'Vui lòng nhập đường dẫn tin tuyển dụng.').max(1500),
})

const MAX_HTML_BYTES = 512 * 1024

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host === '::1') return true
  if (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 127 || a === 10 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
  }
  return false
}

export function assertSafeJobUrl(raw: string): URL {
  const trimmed = raw.trim()
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed}`
  const parsed = new URL(candidate)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('UNSUPPORTED_PROTOCOL')
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error('BLOCKED_HOST')
  }
  return parsed
}

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/?(?:p|div|li|br|h1|h2|h3|h4|tr)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function extractJobFromHtml(html: string, sourceUrl: string) {
  let company = ''
  let role = ''
  let salary = ''
  let location = ''
  let jdText = ''

  // 1. Try schema.org JobPosting JSON-LD first
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = ldRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as Record<string, unknown> | Record<string, unknown>[]
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        if (item && item['@type'] === 'JobPosting') {
          if (typeof item.title === 'string') role = item.title.trim()
          const org = item.hiringOrganization as { name?: string } | undefined
          if (org?.name) company = org.name.trim()
          const loc = item.jobLocation as { address?: { addressLocality?: string; addressRegion?: string } } | undefined
          if (loc?.address) {
            location = [loc.address.addressLocality, loc.address.addressRegion].filter(Boolean).join(', ')
          }
          const sal = item.baseSalary as { value?: { minValue?: number; maxValue?: number; value?: number }; currency?: string } | undefined
          if (sal?.value) {
            const cur = sal.currency || ''
            if (sal.value.minValue && sal.value.maxValue) {
              salary = `${sal.value.minValue.toLocaleString('vi-VN')} - ${sal.value.maxValue.toLocaleString('vi-VN')} ${cur}`.trim()
            } else if (sal.value.value) {
              salary = `${sal.value.value.toLocaleString('vi-VN')} ${cur}`.trim()
            }
          }
          if (typeof item.description === 'string') {
            jdText = stripTags(item.description)
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }

  // 2. Fallback to OpenGraph / Title / Meta description
  const metaContent = (attr: string, name: string) => {
    const m = html.match(new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
    return m ? decodeHtml(m[1].trim()) : ''
  }

  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ''
  const ogTitle = metaContent('property', 'og:title') || decodeHtml(titleTag)
  const ogSite = metaContent('property', 'og:site_name')
  const metaDesc = metaContent('name', 'description') || metaContent('property', 'og:description')

  if (!role && ogTitle) {
    const parts = ogTitle.split(/\s+[-–|]\s+/)
    role = parts[0]?.trim() || ogTitle
    if (!company && parts.length > 1) company = parts[1]?.trim() || ''
  }
  if (!company) {
    company = ogSite || new URL(sourceUrl).hostname.replace(/^www\./, '')
  }
  if (!jdText) {
    const mainBody = stripTags(html)
    jdText = (mainBody.length > 120 ? mainBody : metaDesc).slice(0, 6000)
  }

  return {
    company: company.slice(0, 140),
    role: role.slice(0, 140),
    salary: salary.slice(0, 100),
    location: location.slice(0, 100),
    jdText: jdText.slice(0, 8000),
  }
}

async function readBoundedText(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      total += value.byteLength
      if (total > maxBytes) {
        chunks.push(value.subarray(0, value.byteLength - (total - maxBytes)))
        await reader.cancel()
        break
      }
      chunks.push(value)
    }
  }
  const merged = new Uint8Array(Math.min(total, maxBytes))
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.byteLength
  }
  return new TextDecoder('utf-8').decode(merged)
}

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu không hợp lệ.', 400)
  }

  const parsed = ExtractSchema.safeParse(raw)
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'URL không hợp lệ.', 400)

  let safeUrl: URL
  try {
    safeUrl = assertSafeJobUrl(parsed.data.url)
  } catch (err) {
    const msg =
      err instanceof Error && err.message === 'BLOCKED_HOST'
        ? 'Không thể truy cập địa chỉ nội bộ hoặc localhost.'
        : 'Đường dẫn tin tuyển dụng không hợp lệ.'
    return jsonError(msg, 400)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(safeUrl.toString(), {
      headers: {
        'User-Agent': 'VeroCV-JobClipper/1.0 (+https://verocv.vn)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!res.ok) {
      return jsonError(`Trang tuyển dụng trả về mã ${res.status}. Hãy dán trực tiếp mô tả công việc.`, 422)
    }
    const finalHost = new URL(res.url || safeUrl.toString()).hostname
    if (isBlockedHostname(finalHost)) {
      return jsonError('Đích chuyển hướng không hợp lệ.', 400)
    }
    const html = await readBoundedText(res, MAX_HTML_BYTES)
    const extracted = extractJobFromHtml(html, safeUrl.toString())
    return jsonOk({ job: extracted })
  } catch {
    return jsonError('Không tải được trang tuyển dụng (có thể trang chặn bot). Hãy dán trực tiếp nội dung JD.', 422)
  } finally {
    clearTimeout(timer)
  }
}
