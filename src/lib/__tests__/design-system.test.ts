// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function collectFiles(dir: string, exts: Set<string>): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__') continue
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...collectFiles(full, exts))
    else if (exts.has(path.extname(entry))) out.push(full)
  }
  return out
}

const FORBIDDEN_SHADOW = /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)\b/
const FORBIDDEN_RAW_COLOR =
  /\b(?:bg|text|border|ring|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/

describe('VeroCV Design System Guardrails', () => {
  const srcRoot = path.resolve(__dirname, '../..')
  const files = collectFiles(srcRoot, new Set(['.tsx', '.ts', '.css']))

  it('never uses Tailwind drop-shadow utilities (flat 1px rule sheet aesthetic)', () => {
    const offenders = files.filter((file) => FORBIDDEN_SHADOW.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('never uses raw Tailwind color palettes outside VeroCV tokens', () => {
    const offenders = files.filter((file) => FORBIDDEN_RAW_COLOR.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })
})
