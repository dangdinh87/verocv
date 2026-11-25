/*
  Reads the text of a PDF CV in the browser so it can be handed to the CV parser. Nothing is uploaded.

  A PDF has no paragraphs, only positioned snippets, so reading order is rebuilt here across four CV geometries:
  1. Single-column sheets: lines read top-to-bottom, joined left-to-right on each baseline.
  2. Full-height two-column sheets (e.g. "cot-xanh"): read the sidebar column completely, then the main column.
  3. Full-width header band over a two-column body (e.g. "bia-kraft", "thu-gon", "con-dau"): read the header band
     first so name/role/contact stay intact, then read the body's left and right columns separately.
  4. Left section-label rail next to content (e.g. "anh-tron"): pair each left-column heading with the right-column
     content aligned at or below its baseline so headings stay attached to their sections.
*/

export type TextSnippet = { str: string; x: number; y: number; width: number; height: number }

export type PdfImportErrorCode = 'password' | 'invalid' | 'no-text'

export class PdfImportError extends Error {
  constructor(readonly code: PdfImportErrorCode) {
    super(code)
    this.name = 'PdfImportError'
  }
}

const BINS = 100

const LABEL_RAIL_HEADING =
  /^(giới thiệu|mục tiêu|kinh nghiệm|kinh nghiệm làm việc|hoạt động và kinh nghiệm|học vấn|kỹ năng|ngoại ngữ|ngôn ngữ|chứng chỉ|dự án|dự án cá nhân|hoạt động khác|giải thưởng|liên hệ|summary|objective|profile|experience|work experience|education|skills|languages|projects|certifications|awards|contact)$/i

const isText = (s: TextSnippet) => s.str.trim().length > 0

// Snippets whose baselines (nearly) coincide form a row.
function groupRows(snippets: TextSnippet[]): TextSnippet[][] {
  const sorted = [...snippets].sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: TextSnippet[][] = []
  for (const s of sorted) {
    const row = rows[rows.length - 1]
    const tolerance = Math.max(2, s.height * 0.5)
    if (row && Math.abs(row[0].y - s.y) <= tolerance) row.push(s)
    else rows.push([s])
  }
  return rows
}

/*
  Looks for a vertical strip that (almost) no row of text crosses. Rows are counted once per position, not per snippet:
  pdf.js emits one snippet per glyph for accented letters, so a single full-width heading would otherwise look like many.
*/
function findGutter(rows: TextSnippet[][], pageWidth: number, maxQuietRatio = 0.15): number | null {
  if (rows.length < 2 || pageWidth <= 0) return null
  const coverage = new Array<number>(BINS).fill(0)
  for (const row of rows) {
    const touched = new Set<number>()
    for (const s of row) {
      const from = Math.max(0, Math.floor((s.x / pageWidth) * BINS))
      const to = Math.min(BINS - 1, Math.floor(((s.x + s.width) / pageWidth) * BINS))
      for (let b = from; b <= to; b++) touched.add(b)
    }
    touched.forEach((b) => coverage[b]++)
  }

  const quiet = Math.floor(rows.length * maxQuietRatio)
  let strip: { start: number; end: number } | null = null
  let start = -1
  for (let b = 15; b <= 85; b++) {
    if (coverage[b] <= quiet) {
      if (start < 0) start = b
      if (!strip || b - start > strip.end - strip.start) strip = { start, end: b }
    } else start = -1
  }
  if (!strip || strip.end - strip.start + 1 < 3) return null

  const floor = Math.min(...coverage.slice(strip.start, strip.end + 1))
  let cut = strip
  let run = -1
  for (let b = strip.start; b <= strip.end; b++) {
    if (coverage[b] === floor) {
      if (run < 0) run = b
      if (b - run >= cut.end - cut.start || cut === strip) cut = { start: run, end: b }
    } else run = -1
  }
  const centre = ((cut.start + cut.end + 1) / 2 / BINS) * pageWidth

  const all = rows.flat().filter(isText)
  const left = all.filter((s) => s.x + s.width / 2 < centre).length
  return left >= all.length * 0.08 && all.length - left >= all.length * 0.12 ? centre : null
}

function rowCrosses(row: TextSnippet[], xCut: number): boolean {
  const textRow = row.filter(isText)
  if (textRow.length === 0) return false
  // Single snippet crossing the cut: definitely a spanning heading/paragraph.
  if (textRow.some((s) => s.x < xCut - 2 && s.x + s.width > xCut + 2)) return true
  // Tightly spaced words on one line crossing the cut (not two separate columns with a wide gap).
  const ordered = [...textRow].sort((a, b) => a.x - b.x)
  const minX = ordered[0].x
  const maxX = Math.max(...ordered.map((s) => s.x + s.width))
  if (!(minX < xCut - 4 && maxX > xCut + 4)) return false
  for (let i = 1; i < ordered.length; i++) {
    const prevEnd = ordered[i - 1].x + ordered[i - 1].width
    const gap = ordered[i].x - prevEnd
    const maxWordGap = Math.max(ordered[i].height, 8) * 2.2
    if (prevEnd <= xCut + 4 && ordered[i].x >= xCut - 4 && gap > maxWordGap) {
      return false
    }
  }
  return true
}

function rowText(row: TextSnippet[]): string {
  const ordered = [...row].sort((a, b) => a.x - b.x)
  let text = ''
  let cursor = ordered[0].x
  for (const s of ordered) {
    const gap = s.x - cursor
    const spaced = text.endsWith(' ') || s.str.startsWith(' ')
    if (text && !spaced && gap > Math.max(s.height, 1) * 0.15) text += gap > s.height * 4 ? '  ' : ' '
    text += s.str
    cursor = s.x + s.width
  }
  return text.replace(/\s+$/, '')
}

type PositionedLine = { text: string; y: number; height: number }

function columnToPositionedLines(snippets: TextSnippet[]): PositionedLine[] {
  const heights = snippets
    .filter(isText)
    .map((s) => s.height)
    .filter((h) => h > 0)
    .sort((a, b) => a - b)
  const body = heights[Math.floor(heights.length / 2)] || 10

  const lines = groupRows(snippets)
    .map((row) => ({ text: rowText(row), y: row[0].y, height: Math.max(...row.filter(isText).map((s) => s.height), 0) }))
    .filter((l) => l.text.trim().length > 0)

  // Rejoin a multi-line large headline (e.g. a long name wrapped in a narrow sidebar).
  const merged: PositionedLine[] = []
  for (const line of lines) {
    const prev = merged[merged.length - 1]
    const headline = line.height >= body * 1.5
    if (
      prev &&
      headline &&
      prev.height >= body * 1.5 &&
      Math.abs(prev.height - line.height) <= line.height * 0.1 &&
      prev.y - line.y <= line.height * 1.6
    ) {
      prev.text += ` ${line.text}`
      prev.y = line.y
    } else merged.push({ ...line })
  }
  return merged
}

function columnToLines(snippets: TextSnippet[]): string[] {
  return columnToPositionedLines(snippets).map((l) => l.text)
}

/*
  Detects a narrow left "label rail" (like the "anh-tron" template) where section headings sit on the left
  and their bodies sit on the right at matching vertical positions.
*/
function isSectionLabelRail(leftLines: PositionedLine[], rightLines: PositionedLine[], gutterRatio: number): boolean {
  if (gutterRatio > 0.36 || leftLines.length === 0 || rightLines.length < leftLines.length) return false
  // Ignore a 1-3 character avatar monogram at the very top when checking headings.
  const candidates = leftLines.filter((l, idx) => !(idx === 0 && l.text.trim().length <= 3))
  if (candidates.length === 0 || candidates.length > 8) return false
  if (candidates.some((l) => l.text.length > 35 || /[@•]/.test(l.text))) return false
  const headingMatches = candidates.filter((l) => LABEL_RAIL_HEADING.test(l.text.trim().replace(/[:：]+$/, ''))).length
  return headingMatches >= Math.max(1, Math.ceil(candidates.length * 0.5))
}

function mergeLabelRailAndBody(leftSnippets: TextSnippet[], rightSnippets: TextSnippet[]): string[] {
  const leftLines = columnToPositionedLines(leftSnippets)
  const labels = leftLines.filter((l, idx) => !(idx === 0 && l.text.trim().length <= 3 && !LABEL_RAIL_HEADING.test(l.text.trim())))
  if (labels.length === 0) return [...leftLines.map((l) => l.text), ...columnToLines(rightSnippets)]

  const out: string[] = []
  const firstLabelTop = labels[0].y + labels[0].height * 0.85
  const headerRight = rightSnippets.filter((s) => s.y > firstLabelTop)
  if (headerRight.length > 0) {
    out.push(...columnToLines(headerRight))
  }

  for (let i = 0; i < labels.length; i++) {
    const current = labels[i]
    const next = labels[i + 1]
    const upperBound = i === 0 ? firstLabelTop : current.y + current.height * 0.85
    const lowerBound = next ? next.y + next.height * 0.85 : -Infinity
    const sectionRight = rightSnippets.filter((s) => s.y <= upperBound && s.y > lowerBound)
    out.push(current.text)
    out.push(...columnToLines(sectionRight))
  }
  return out
}

function layoutTwoColumnRegion(snippets: TextSnippet[], gutter: number, pageWidth: number): string[] {
  const left = snippets.filter((s) => s.x + s.width / 2 < gutter)
  const right = snippets.filter((s) => s.x + s.width / 2 >= gutter)
  const leftLines = columnToPositionedLines(left)
  const rightLines = columnToPositionedLines(right)

  if (isSectionLabelRail(leftLines, rightLines, gutter / pageWidth)) {
    return mergeLabelRailAndBody(left, right)
  }
  return [...leftLines.map((l) => l.text), ...rightLines.map((l) => l.text)]
}

export function layoutPageText(items: TextSnippet[], pageWidth: number): string {
  const snippets = items.filter((s) => s.str.length > 0)
  const textSnippets = snippets.filter(isText)
  if (textSnippets.length === 0) return ''

  const rows = groupRows(textSnippets)
  const fullGutter = findGutter(rows, pageWidth, 0.15)

  // Case A: Full-page gutter found, but check if top header rows actually span across that gutter (e.g. "bia-kraft").
  if (fullGutter !== null) {
    let headerRowCount = 0
    const maxHeaderScan = Math.min(8, Math.floor(rows.length * 0.45))
    for (let i = 0; i < maxHeaderScan; i++) {
      if (rowCrosses(rows[i], fullGutter)) headerRowCount = i + 1
    }
    if (headerRowCount > 0 && rows.length - headerRowCount >= 3) {
      const splitY = rows[headerRowCount - 1][0].y - Math.max(2, rows[headerRowCount - 1][0].height * 0.45)
      const top = snippets.filter((s) => s.y >= splitY)
      const body = snippets.filter((s) => s.y < splitY)
      const bodyGutter = findGutter(groupRows(body.filter(isText)), pageWidth, 0.05) ?? fullGutter
      return [...columnToLines(top), ...layoutTwoColumnRegion(body, bodyGutter, pageWidth)].join('\n')
    }
    return layoutTwoColumnRegion(snippets, fullGutter, pageWidth).join('\n')
  }

  // Case B: Full-page gutter failed because a top header band (e.g. "thu-gon", "con-dau", "bia-kraft") has a different layout.
  const maxHeaderRows = Math.min(9, Math.floor(rows.length * 0.45))
  for (let k = 1; k <= maxHeaderRows; k++) {
    const bodyRows = rows.slice(k)
    if (bodyRows.length < 4) break
    const bodyGutter = findGutter(bodyRows, pageWidth, 0.04)
    if (bodyGutter !== null) {
      const splitY = rows[k - 1][0].y - Math.max(2, rows[k - 1][0].height * 0.45)
      const top = snippets.filter((s) => s.y >= splitY)
      const body = snippets.filter((s) => s.y < splitY)
      return [...columnToLines(top), ...layoutTwoColumnRegion(body, bodyGutter, pageWidth)].join('\n')
    }
  }

  // Case C: Single-column document.
  return columnToLines(snippets).join('\n')
}

type PdfjsModule = {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (src: { data: Uint8Array }) => { promise: Promise<PdfDocument>; destroy: () => Promise<void> }
}
type PdfDocument = {
  numPages: number
  getPage: (n: number) => Promise<{
    getViewport: (o: { scale: number }) => { width: number }
    getTextContent: () => Promise<{ items: unknown[] }>
  }>
}

type Options = {
  // Injected in tests (Node build of pdf.js); in the browser the default dynamic import is used.
  loadPdfjs?: () => Promise<PdfjsModule>
  workerSrc?: string
}

const MAX_PAGES = 10

export async function extractPdfText(data: ArrayBuffer, options: Options = {}): Promise<{ text: string; pages: number }> {
  const pdfjs = await (options.loadPdfjs ?? (() => import('pdfjs-dist') as unknown as Promise<PdfjsModule>))()
  if (options.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = options.workerSrc

  const task = pdfjs.getDocument({ data: new Uint8Array(data) })
  let doc: PdfDocument
  try {
    doc = await task.promise
  } catch (error) {
    await task.destroy()
    throw new PdfImportError((error as { name?: string })?.name === 'PasswordException' ? 'password' : 'invalid')
  }

  try {
    const pageTexts: string[] = []
    const pages = Math.min(doc.numPages, MAX_PAGES)
    for (let n = 1; n <= pages; n++) {
      const page = await doc.getPage(n)
      const width = page.getViewport({ scale: 1 }).width
      const content = await page.getTextContent()
      const snippets = content.items
        .filter(
          (item): item is { str: string; transform: number[]; width: number; height: number } =>
            typeof (item as { str?: unknown }).str === 'string',
        )
        .map((item) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height || Math.abs(item.transform[3]),
        }))
      pageTexts.push(layoutPageText(snippets, width))
    }
    const text = pageTexts.join('\n').trim()
    // A scanned CV is a picture: there is no text to read.
    if (text.replace(/\s/g, '').length < 20) throw new PdfImportError('no-text')
    return { text, pages: doc.numPages }
  } finally {
    await task.destroy()
  }
}
