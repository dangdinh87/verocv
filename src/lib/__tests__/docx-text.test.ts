// @vitest-environment node
import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { parseRawCvText } from '@/lib/cv-parser'
import { DocxImportError, extractDocxText } from '@/lib/docx-text'

function buildSingleFileZip(entryName: string, content: string, deflate = true): ArrayBuffer {
  const encoder = new TextEncoder()
  const nameBytes = encoder.encode(entryName)
  const rawBytes = encoder.encode(content)
  const payload = deflate ? new Uint8Array(deflateRawSync(rawBytes)) : rawBytes
  const method = deflate ? 8 : 0

  const localLen = 30 + nameBytes.length + payload.length
  const centralLen = 46 + nameBytes.length
  const eocdLen = 22
  const total = localLen + centralLen + eocdLen
  const buf = new ArrayBuffer(total)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  // Local file header
  view.setUint32(0, 0x04034b50, true)
  view.setUint16(4, 20, true)
  view.setUint16(8, method, true)
  view.setUint32(18, payload.length, true)
  view.setUint32(22, rawBytes.length, true)
  view.setUint16(26, nameBytes.length, true)
  bytes.set(nameBytes, 30)
  bytes.set(payload, 30 + nameBytes.length)

  // Central directory header
  const cdOffset = localLen
  view.setUint32(cdOffset, 0x02014b50, true)
  view.setUint16(cdOffset + 4, 20, true)
  view.setUint16(cdOffset + 6, 20, true)
  view.setUint16(cdOffset + 10, method, true)
  view.setUint32(cdOffset + 20, payload.length, true)
  view.setUint32(cdOffset + 24, rawBytes.length, true)
  view.setUint16(cdOffset + 28, nameBytes.length, true)
  view.setUint32(cdOffset + 42, 0, true)
  bytes.set(nameBytes, cdOffset + 46)

  // End of central directory
  const eocdOffset = localLen + centralLen
  view.setUint32(eocdOffset, 0x06054b50, true)
  view.setUint16(eocdOffset + 8, 1, true)
  view.setUint16(eocdOffset + 10, 1, true)
  view.setUint32(eocdOffset + 12, centralLen, true)
  view.setUint32(eocdOffset + 16, cdOffset, true)

  return buf
}

const SAMPLE_WORD_XML = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Lê Thu Hà</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kế toán tổng hợp</w:t></w:r></w:p>
    <w:p><w:r><w:t>Hải Châu, Đà Nẵng</w:t></w:r></w:p>
    <w:p><w:r><w:t>thuha@example.com | 0935 456 789</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kinh nghiệm làm việc</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kế toán tổng hợp - Công ty Đại Dương</w:t><w:tab/><w:t>2021 – nay</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Khoá sổ &amp; lập báo cáo tài chính hằng tháng, rút từ 7 ngày xuống 4 ngày.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Học vấn</w:t></w:r></w:p>
    <w:p><w:r><w:t>Cử nhân Kế toán - Đại học Kinh tế Đà Nẵng (2014 – 2018)</w:t></w:r></w:p>
    <w:p><w:r><w:t>Kỹ năng</w:t></w:r></w:p>
    <w:p><w:r><w:t>MISA, Báo cáo thuế, Excel nâng cao</w:t></w:r></w:p>
  </w:body>
</w:document>`

describe('extractDocxText', () => {
  it('decompresses deflated word/document.xml and parses Vietnamese CV sections accurately', async () => {
    const zip = buildSingleFileZip('word/document.xml', SAMPLE_WORD_XML, true)
    const { text } = await extractDocxText(zip)
    expect(text).toContain('Lê Thu Hà')
    expect(text).toContain('• Khoá sổ & lập báo cáo tài chính')

    const parsed = parseRawCvText(text)
    expect(parsed.data.name).toBe('Lê Thu Hà')
    expect(parsed.data.email).toBe('thuha@example.com')
    expect(parsed.data.jobs[0]).toMatchObject({
      title: 'Kế toán tổng hợp',
      org: 'Công ty Đại Dương',
      period: '2021 – nay',
    })
    expect(parsed.data.education[0]?.school).toContain('Đại học Kinh tế Đà Nẵng')
    expect(parsed.data.skills).toEqual(['MISA', 'Báo cáo thuế', 'Excel nâng cao'])
  })

  it('supports uncompressed (stored) docx entries', async () => {
    const zip = buildSingleFileZip('word/document.xml', SAMPLE_WORD_XML, false)
    const { text } = await extractDocxText(zip)
    expect(text).toContain('Kế toán tổng hợp')
  })

  it('identifies legacy binary .doc (OLE2) files with code legacy-doc', async () => {
    const ole2 = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0, 0, 0])
    await expect(extractDocxText(ole2.buffer)).rejects.toMatchObject({
      name: 'DocxImportError',
      code: 'legacy-doc',
    })
  })

  it('rejects non-zip files and empty documents cleanly', async () => {
    const garbage = new TextEncoder().encode('not a zip file').buffer as ArrayBuffer
    await expect(extractDocxText(garbage)).rejects.toBeInstanceOf(DocxImportError)

    const emptyDoc = buildSingleFileZip(
      'word/document.xml',
      '<w:document><w:body><w:p><w:r><w:t>Hi</w:t></w:r></w:p></w:body></w:document>',
    )
    await expect(extractDocxText(emptyDoc)).rejects.toMatchObject({ code: 'no-text' })
  })
})
