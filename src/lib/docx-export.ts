import { resolveSectionTitle } from '@/components/resume/resume-paper'
import { parseInlineTokens } from '@/lib/inline-format'
import type { LetterDocument } from '@/types/resume'
import { isCustomSectionKey, normalizeSectionOrder, type ResumeDocumentV2 } from '@/types/schema'

/*
  Zero-dependency OOXML (.docx) generator & ZIP archive packager.
  Produces valid Word documents (UTF-8 Vietnamese intact, A4/Letter size, accent headings, inline bold/italic runs)
  that open cleanly in Microsoft Word, Google Docs, and VeroCV's own `extractDocxText`.
*/

const textEncoder = new TextEncoder()

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function createZipArchive(entries: { name: string; content: string }[]): Uint8Array {
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.name)
    const dataBytes = textEncoder.encode(entry.content)
    const crc = crc32(dataBytes)

    const localHeader = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(localHeader.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0x0800, true)
    lv.setUint16(8, 0, true)
    lv.setUint16(10, 0, true)
    lv.setUint16(12, 0, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, dataBytes.length, true)
    lv.setUint32(22, dataBytes.length, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)
    localHeader.set(nameBytes, 30)

    localChunks.push(localHeader, dataBytes)

    const centralHeader = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(centralHeader.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, 0, true)
    cv.setUint16(14, 0, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, dataBytes.length, true)
    cv.setUint32(24, dataBytes.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    cv.setUint32(38, 0, true)
    cv.setUint32(42, offset, true)
    centralHeader.set(nameBytes, 46)

    centralChunks.push(centralHeader)
    offset += localHeader.length + dataBytes.length
  }

  const centralSize = centralChunks.reduce((sum, c) => sum + c.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  ev.setUint16(20, 0, true)

  const totalLength = offset + centralSize + eocd.length
  const out = new Uint8Array(totalLength)
  let cursor = 0
  for (const chunk of localChunks) {
    out.set(chunk, cursor)
    cursor += chunk.length
  }
  for (const chunk of centralChunks) {
    out.set(chunk, cursor)
    cursor += chunk.length
  }
  out.set(eocd, cursor)
  return out
}

function escXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cleanHexColor(hex?: string, fallback = '4F46E5'): string {
  const m = (hex ?? '').trim().match(/^#?([0-9a-fA-F]{6})$/)
  return m ? m[1].toUpperCase() : fallback
}

function wRun(text: string, opts: { bold?: boolean; italic?: boolean; sizeHalfPt?: number; color?: string } = {}): string {
  const rPr: string[] = []
  if (opts.bold) rPr.push('<w:b/>')
  if (opts.italic) rPr.push('<w:i/>')
  if (opts.color) rPr.push(`<w:color w:val="${opts.color}"/>`)
  if (opts.sizeHalfPt) rPr.push(`<w:sz w:val="${opts.sizeHalfPt}"/><w:szCs w:val="${opts.sizeHalfPt}"/>`)
  const prXml = rPr.length > 0 ? `<w:rPr>${rPr.join('')}</w:rPr>` : ''
  return `<w:r>${prXml}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`
}

function wRichRuns(text: string, opts: { sizeHalfPt?: number; color?: string } = {}): string {
  const tokens = parseInlineTokens(text)
  if (tokens.length === 0) return wRun(text, opts)
  return tokens
    .map((t) => {
      if (t.type === 'bold') return wRun(t.value, { ...opts, bold: true })
      if (t.type === 'italic') return wRun(t.value, { ...opts, italic: true })
      if (t.type === 'link') return wRun(t.label, { ...opts })
      return wRun(t.value, opts)
    })
    .join('')
}

function wParagraph(
  runsXml: string,
  opts: {
    spaceBefore?: number
    spaceAfter?: number
    line?: number
    align?: 'left' | 'center' | 'right'
    bottomBorderColor?: string
    indentLeft?: number
  } = {},
): string {
  const pPr: string[] = []
  if (opts.bottomBorderColor) {
    pPr.push(`<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${opts.bottomBorderColor}"/></w:pBdr>`)
  }
  pPr.push(
    `<w:spacing w:before="${opts.spaceBefore ?? 0}" w:after="${opts.spaceAfter ?? 80}" w:line="${opts.line ?? 276}" w:lineRule="auto"/>`,
  )
  if (opts.indentLeft) {
    pPr.push(`<w:ind w:left="${opts.indentLeft}"/>`)
  }
  if (opts.align) {
    pPr.push(`<w:jc w:val="${opts.align}"/>`)
  }
  return `<w:p><w:pPr>${pPr.join('')}</w:pPr>${runsXml}</w:p>`
}

function wrapDocxPackage(bodyXml: string, paperSize: 'a4' | 'letter'): Uint8Array {
  const pgW = paperSize === 'letter' ? 12240 : 11906
  const pgH = paperSize === 'letter' ? 15840 : 16838

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:color w:val="0F172A"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="${pgW}" w:h="${pgH}"/>
      <w:pgMar w:top="960" w:right="1020" w:bottom="960" w:left="1020" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`

  return createZipArchive([
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rels },
    { name: 'word/_rels/document.xml.rels', content: docRels },
    { name: 'word/styles.xml', content: styles },
    { name: 'word/document.xml', content: documentXml },
  ])
}

export function buildResumeDocx(doc: ResumeDocumentV2): Uint8Array {
  const accent = cleanHexColor(doc.settings.accentColor, '4F46E5')
  const d = doc.data
  const hiddenSet = new Set(doc.settings.hiddenSections ?? [])
  const order = normalizeSectionOrder(
    doc.settings.sectionOrder,
    d.customSections.map((c) => c.id),
  )
  const parts: string[] = []

  const nameText = d.name.trim() || 'Ứng viên'
  parts.push(wParagraph(wRun(nameText, { bold: true, sizeHalfPt: 40, color: '0F172A' }), { spaceAfter: 40 }))
  if (d.role.trim()) {
    parts.push(wParagraph(wRun(d.role.trim(), { bold: true, sizeHalfPt: 24, color: accent }), { spaceAfter: 60 }))
  }

  const contacts = [
    d.location.trim(),
    d.email.trim(),
    d.phone.trim(),
    d.link.trim(),
    ...d.links.filter((l) => l.url.trim()).map((l) => (l.label.trim() ? `${l.label.trim()}: ${l.url.trim()}` : l.url.trim())),
  ].filter(Boolean)
  if (contacts.length > 0) {
    parts.push(wParagraph(wRun(contacts.join('  |  '), { sizeHalfPt: 19, color: '475569' }), { spaceAfter: 140 }))
  }

  const addHeading = (label: string) => {
    const text = doc.settings.headingCase === 'uppercase' ? label.toUpperCase() : label
    parts.push(
      wParagraph(wRun(text, { bold: true, sizeHalfPt: 24, color: accent }), {
        spaceBefore: 160,
        spaceAfter: 80,
        bottomBorderColor: accent,
      }),
    )
  }

  for (const key of order) {
    if (hiddenSet.has(key)) continue

    if (isCustomSectionKey(key)) {
      const cs = d.customSections.find((c) => c.id === key && !c.hidden)
      if (!cs) continue
      const visibleEntries = cs.entries.filter((e) => !e.hidden && (e.title.trim() || e.subtitle.trim() || e.bullets.some((b) => b.trim())))
      if (visibleEntries.length === 0) continue
      addHeading(resolveSectionTitle(key, doc.layout, doc.settings, d.extra.title, cs.title))
      for (const en of visibleEntries) {
        const header = [en.title.trim(), en.period.trim()].filter(Boolean).join('  —  ')
        if (header) parts.push(wParagraph(wRun(header, { bold: true, sizeHalfPt: 22 }), { spaceBefore: 60, spaceAfter: 30 }))
        if (en.subtitle.trim()) parts.push(wParagraph(wRun(en.subtitle.trim(), { italic: true, sizeHalfPt: 20, color: '334155' }), { spaceAfter: 30 }))
        for (const b of en.bullets.map((x) => x.trim()).filter(Boolean)) {
          parts.push(wParagraph(wRun('• ', { bold: true, sizeHalfPt: 21, color: accent }) + wRichRuns(b, { sizeHalfPt: 21 }), { indentLeft: 260, spaceAfter: 40 }))
        }
      }
      continue
    }

    if (key === 'summary' && d.summary.trim()) {
      addHeading(resolveSectionTitle('summary', doc.layout, doc.settings, d.extra.title))
      parts.push(wParagraph(wRichRuns(d.summary.trim(), { sizeHalfPt: 21 }), { spaceAfter: 80 }))
    } else if (key === 'jobs') {
      const jobs = d.jobs.filter((j) => !j.hidden && (j.title.trim() || j.org.trim() || j.bullets.some((b) => b.trim())))
      if (jobs.length === 0) continue
      addHeading(resolveSectionTitle('jobs', doc.layout, doc.settings, d.extra.title))
      for (const job of jobs) {
        const titleLine = [job.title.trim(), job.period.trim()].filter(Boolean).join('  —  ')
        if (titleLine) parts.push(wParagraph(wRun(titleLine, { bold: true, sizeHalfPt: 22 }), { spaceBefore: 60, spaceAfter: 20 }))
        const orgLine = [job.org.trim(), job.location.trim()].filter(Boolean).join(' · ')
        if (orgLine) parts.push(wParagraph(wRun(orgLine, { italic: true, sizeHalfPt: 20, color: '334155' }), { spaceAfter: 40 }))
        for (const b of job.bullets.map((x) => x.trim()).filter(Boolean)) {
          parts.push(wParagraph(wRun('• ', { bold: true, sizeHalfPt: 21, color: accent }) + wRichRuns(b, { sizeHalfPt: 21 }), { indentLeft: 260, spaceAfter: 40 }))
        }
      }
    } else if (key === 'education') {
      const edu = d.education.filter((e) => !e.hidden && (e.degree.trim() || e.school.trim()))
      if (edu.length === 0) continue
      addHeading(resolveSectionTitle('education', doc.layout, doc.settings, d.extra.title))
      for (const e of edu) {
        const line1 = [e.degree.trim(), e.period.trim()].filter(Boolean).join('  —  ')
        if (line1) parts.push(wParagraph(wRun(line1, { bold: true, sizeHalfPt: 22 }), { spaceBefore: 50, spaceAfter: 20 }))
        const line2 = [e.school.trim(), e.location.trim(), e.gpa.trim() ? `GPA: ${e.gpa.trim()}` : ''].filter(Boolean).join(' · ')
        if (line2) parts.push(wParagraph(wRun(line2, { sizeHalfPt: 20, color: '334155' }), { spaceAfter: 50 }))
      }
    } else if (key === 'skills') {
      const skills = d.skills.map((s) => s.trim()).filter(Boolean)
      if (skills.length === 0) continue
      addHeading(resolveSectionTitle('skills', doc.layout, doc.settings, d.extra.title))
      parts.push(wParagraph(wRun(skills.join(' · '), { sizeHalfPt: 21 }), { spaceAfter: 80 }))
    } else if (key === 'languages') {
      const langs = d.languages.filter((l) => !l.hidden && l.name.trim())
      if (langs.length === 0) continue
      addHeading(resolveSectionTitle('languages', doc.layout, doc.settings, d.extra.title))
      for (const l of langs) {
        const txt = l.level.trim() ? `${l.name.trim()}: ${l.level.trim()}` : l.name.trim()
        parts.push(wParagraph(wRun(`• ${txt}`, { sizeHalfPt: 21 }), { indentLeft: 240, spaceAfter: 40 }))
      }
    } else if (key === 'extra') {
      const items = d.extra.items.map((x) => x.trim()).filter(Boolean)
      if (items.length === 0) continue
      addHeading(resolveSectionTitle('extra', doc.layout, doc.settings, d.extra.title))
      for (const item of items) {
        parts.push(
          wParagraph(wRun('• ', { bold: true, sizeHalfPt: 21, color: accent }) + wRichRuns(item, { sizeHalfPt: 21 }), {
            indentLeft: 260,
            spaceAfter: 40,
          }),
        )
      }
    }
  }

  return wrapDocxPackage(parts.join('\n'), doc.settings.paperSize)
}

export function buildLetterDocx(doc: LetterDocument): Uint8Array {
  const accent = cleanHexColor(doc.customAccentColor, doc.accent === 'ink' ? '0F172A' : '4F46E5')
  const parts: string[] = []

  parts.push(wParagraph(wRun(doc.senderName.trim() || 'Ứng viên', { bold: true, sizeHalfPt: 34, color: '0F172A' }), { spaceAfter: 30 }))
  if (doc.senderRole.trim()) {
    parts.push(wParagraph(wRun(doc.senderRole.trim(), { bold: true, sizeHalfPt: 22, color: accent }), { spaceAfter: 40 }))
  }
  const contacts = [doc.senderLocation.trim(), doc.senderEmail.trim(), doc.senderPhone.trim()].filter(Boolean)
  if (contacts.length > 0) {
    parts.push(wParagraph(wRun(contacts.join('  |  '), { sizeHalfPt: 19, color: '475569' }), { spaceAfter: 160, bottomBorderColor: accent }))
  }

  if (doc.dateStr.trim()) {
    parts.push(wParagraph(wRun(doc.dateStr.trim(), { italic: true, sizeHalfPt: 20, color: '64748B' }), { spaceBefore: 120, spaceAfter: 80 }))
  }
  const toLines = [doc.recipientTitle.trim() ? `Kính gửi: ${doc.recipientTitle.trim()}` : '', doc.recipientCompany.trim()].filter(Boolean)
  for (const line of toLines) {
    parts.push(wParagraph(wRun(line, { bold: true, sizeHalfPt: 21 }), { spaceAfter: 30 }))
  }
  if (doc.subject.trim()) {
    parts.push(wParagraph(wRun(doc.subject.trim(), { bold: true, sizeHalfPt: 22, color: accent }), { spaceBefore: 120, spaceAfter: 120 }))
  }
  const greeting = doc.salutation === undefined ? 'Kính gửi quý công ty,' : doc.salutation.trim()
  if (greeting) {
    parts.push(wParagraph(wRun(greeting, { sizeHalfPt: 21 }), { spaceAfter: 100 }))
  }
  for (const p of doc.paragraphs.map((x) => x.trim()).filter(Boolean)) {
    parts.push(wParagraph(wRichRuns(p, { sizeHalfPt: 21 }), { spaceAfter: 120, line: 300 }))
  }
  if (doc.signOff.trim()) {
    parts.push(wParagraph(wRun(doc.signOff.trim(), { sizeHalfPt: 21 }), { spaceBefore: 140, spaceAfter: 60 }))
  }
  const signName = (doc.signatureText?.trim() || doc.senderName.trim()).trim()
  if (signName) {
    parts.push(wParagraph(wRun(signName, { bold: true, sizeHalfPt: 24, color: accent }), { spaceAfter: 60 }))
  }

  return wrapDocxPackage(parts.join('\n'), doc.paperSize)
}

export function triggerDocxDownload(bytes: Uint8Array, fileName: string): void {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const blob = new Blob([copy], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
