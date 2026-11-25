import { Fragment } from 'react'

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'link'; label: string; href: string }

function sanitizeHref(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed)) return trimmed
  if (/^tel:[+\d\s()-]{7,}$/i.test(trimmed)) return trimmed
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return null
  } catch {
    return null
  }
}

const TOKEN_REGEX = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|\[[^\]\n]+?\]\((?:\([^()\s]*\)|[^)\s])+\))/g

export function parseInlineTokens(input: string): InlineToken[] {
  if (!input) return []
  const tokens: InlineToken[] = []
  let lastIndex = 0
  TOKEN_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = TOKEN_REGEX.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: input.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ type: 'bold', value: raw.slice(2, -2) })
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', value: raw.slice(1, -1) })
    } else if (raw.startsWith('[')) {
      const closeIdx = raw.indexOf('](')
      if (closeIdx > 0) {
        const label = raw.slice(1, closeIdx)
        const rawUrl = raw.slice(closeIdx + 2, -1)
        const href = sanitizeHref(rawUrl)
        if (href) {
          tokens.push({ type: 'link', label, href })
        } else {
          tokens.push({ type: 'text', value: label })
        }
      } else {
        tokens.push({ type: 'text', value: raw })
      }
    }
    lastIndex = match.index + raw.length
  }

  if (lastIndex < input.length) {
    tokens.push({ type: 'text', value: input.slice(lastIndex) })
  }
  return tokens
}

export function stripInlineFormatting(input: string): string {
  return parseInlineTokens(input)
    .map((t) => (t.type === 'link' ? t.label : t.value))
    .join('')
}

export function InlineFormatted({ text, interactive = false }: { text: string; interactive?: boolean }) {
  const tokens = parseInlineTokens(text)
  if (tokens.length === 0) return <>{text}</>
  return (
    <>
      {tokens.map((token, idx) => {
        if (token.type === 'bold') return <strong key={idx}>{token.value}</strong>
        if (token.type === 'italic') return <em key={idx}>{token.value}</em>
        if (token.type === 'link') {
          return interactive ? (
            <a key={idx} href={token.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              {token.label}
            </a>
          ) : (
            <span key={idx} style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              {token.label}
            </span>
          )
        }
        return <Fragment key={idx}>{token.value}</Fragment>
      })}
    </>
  )
}
