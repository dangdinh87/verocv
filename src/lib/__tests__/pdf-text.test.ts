// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseRawCvText } from '@/lib/cv-parser'
import { extractPdfText, layoutPageText, PdfImportError } from '@/lib/pdf-text'

const fixture = (name: string) => {
  const buf = readFileSync(path.join(__dirname, 'fixtures', name))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}
// The Node build of pdf.js (the browser uses the default dynamic import).
const nodePdfjs = () => import('pdfjs-dist/legacy/build/pdf.mjs') as never

describe('layoutPageText', () => {
  const s = (str: string, x: number, y: number, width = str.length * 6) => ({ str, x, y, width, height: 10 })

  it('joins snippets on one baseline and orders lines top to bottom', () => {
    const text = layoutPageText([s('Kỹ sư', 50, 700), s('phần mềm', 90, 700), s('Nguyễn An', 50, 750)], 600)
    expect(text).toBe('Nguyễn An\nKỹ sư phần mềm')
  })

  it('reads a left sidebar fully before the main column', () => {
    const items = [
      s('Liên hệ', 30, 700, 80),
      s('an@example.com', 30, 680, 110),
      s('React', 30, 640, 60),
      s('Kinh nghiệm', 300, 700, 120),
      s('Lập trình viên', 300, 680, 140),
      s('Học vấn', 300, 600, 70),
      s('x'.repeat(30), 300, 660, 280),
    ]
    const lines = layoutPageText(items, 600).split('\n')
    expect(lines.slice(0, 3)).toEqual(['Liên hệ', 'an@example.com', 'React'])
    expect(lines[3]).toBe('Kinh nghiệm')
  })

  it('does not split a single column just because a date is right-aligned', () => {
    const items = [
      s('Chuyên viên', 40, 700, 90),
      s('2022 – nay', 480, 700, 70),
      s('Công ty ABC', 40, 680, 90),
      s('Mô tả công việc dài trên toàn trang', 40, 660, 480),
    ]
    const first = layoutPageText(items, 600).split('\n')[0]
    expect(first).toContain('Chuyên viên')
    expect(first).toContain('2022 – nay')
  })

  it('reads a full-width top header band before splitting a two-column body (bia-kraft / thu-gon / con-dau)', () => {
    const items = [
      // Spanning header band across x=40..540
      s('Phạm Gia Bảo', 40, 780, 220),
      s('Sinh viên năm cuối ngành Kinh tế', 40, 755, 340),
      s('Thủ Đức, TP. Hồ Chí Minh | giabao@example.com | 0978 567 890', 40, 735, 500),
      // Left main column (x=40..340)
      s('Mục tiêu', 40, 680, 80),
      s('Đang tìm vị trí thực tập phân tích dữ liệu.', 40, 660, 290),
      s('Hoạt động và kinh nghiệm', 40, 620, 190),
      s('Phó ban Nội dung 2023 – nay', 40, 600, 220),
      s('Đại học Kinh tế TP. Hồ Chí Minh', 40, 582, 220),
      s('• Quản lý nhóm 6 bạn.', 40, 564, 180),
      // Right side column (x=390..560)
      s('Học vấn', 390, 680, 70),
      s('Cử nhân Kinh tế 2022 – 2026', 390, 660, 165),
      s('Đại học Kinh tế TP. Hồ Chí Minh', 390, 642, 165),
      s('Kỹ năng', 390, 600, 70),
      s('Excel, Power BI, SQL', 390, 580, 150),
    ]
    const text = layoutPageText(items, 600)
    const parsed = parseRawCvText(text)
    expect(parsed.data.name).toBe('Phạm Gia Bảo')
    expect(parsed.data.email).toBe('giabao@example.com')
    expect(parsed.data.jobs).toHaveLength(1)
    expect(parsed.data.jobs[0].title).toContain('Phó ban Nội dung')
    expect(parsed.data.education).toHaveLength(1)
    expect(parsed.data.skills).toEqual(['Excel', 'Power BI', 'SQL'])
  })

  it('pairs left section-label rail headings with their right-hand content (anh-tron)', () => {
    const items = [
      // Header
      s('MA', 45, 770, 25),
      s('Nguyễn Minh Anh', 160, 780, 200),
      s('Chuyên viên Marketing', 160, 758, 180),
      s('minhanh@example.com', 160, 738, 160),
      s('0901 234 567', 160, 720, 110),
      // Label rail at x=40..130, content at x=170..540
      s('Giới thiệu', 40, 660, 80),
      s('Hơn 4 năm làm marketing cho ngành bán lẻ.', 170, 660, 320),
      s('Kinh nghiệm', 40, 600, 90),
      s('Chuyên viên Marketing 2023 – nay', 170, 600, 260),
      s('Công ty Cổ phần Ánh Dương', 170, 582, 200),
      s('• Lập kế hoạch 12 chiến dịch quảng cáo.', 170, 564, 280),
      s('Học vấn', 40, 510, 70),
      s('Cử nhân Marketing 2016 – 2020', 170, 510, 240),
      s('Đại học Kinh tế Quốc dân', 170, 492, 200),
      s('Kỹ năng', 40, 440, 70),
      s('Quảng cáo Meta, Google Analytics, SEO', 170, 440, 280),
    ]
    const text = layoutPageText(items, 600)
    const parsed = parseRawCvText(text)
    expect(parsed.data.name).toBe('Nguyễn Minh Anh')
    expect(parsed.data.summary).toContain('Hơn 4 năm làm marketing')
    expect(parsed.data.jobs).toHaveLength(1)
    expect(parsed.data.jobs[0]).toMatchObject({
      title: 'Chuyên viên Marketing',
      org: 'Công ty Cổ phần Ánh Dương',
      period: '2023 – nay',
    })
    expect(parsed.data.education[0]?.school).toBe('Đại học Kinh tế Quốc dân')
    expect(parsed.data.skills).toContain('Google Analytics')
  })
})

describe('extractPdfText (real PDFs exported by this app)', () => {
  it('reads a one-column CV with Vietnamese diacritics intact', async () => {
    const { text, pages } = await extractPdfText(fixture('one-column.pdf'), { loadPdfjs: nodePdfjs })
    expect(pages).toBe(2)
    expect(text).toContain('Nguyễn Đức Ánh')
    expect(text).toContain('Chuyên viên Vận hành')

    const parsed = parseRawCvText(text)
    expect(parsed.data.name).toBe('Nguyễn Đức Ánh')
    expect(parsed.data.email).toBe('anh@example.com')
    expect(parsed.data.jobs.length).toBeGreaterThanOrEqual(5)
    expect(parsed.data.jobs[0].period).toMatch(/2015/)
  })

  it('keeps the sidebar of a two-column CV apart from the main column', async () => {
    const { text } = await extractPdfText(fixture('two-column.pdf'), { loadPdfjs: nodePdfjs })
    const parsed = parseRawCvText(text)
    expect(parsed.data.name).toBe('Nguyễn Đức Ánh')
    expect(parsed.data.email).toBe('anh@example.com')
    expect(parsed.data.skills).toEqual(expect.arrayContaining(['Excel', 'SQL']))
    expect(parsed.data.jobs.length).toBeGreaterThanOrEqual(5)
    expect(parsed.data.jobs.flatMap((j) => j.bullets).join(' ')).not.toMatch(/Power BI/)
  })

  it('parses PDF-style text where the company sits on the line after the title', () => {
    const { data } = parseRawCvText(
      [
        'Nguyễn Đức Ánh',
        'Chuyên viên Vận hành',
        'anh@example.com',
        'Kinh nghiệm',
        'Chuyên viên 1 2015 – 2016',
        'Công ty Số 1',
        'Lập kế hoạch và triển khai chương trình.',
        'Học vấn',
        'Cử nhân Quản trị 2010 – 2014',
        'Đại học Kinh tế',
      ].join('\n'),
    )
    expect(data.jobs[0]).toMatchObject({
      title: 'Chuyên viên 1',
      org: 'Công ty Số 1',
      period: '2015 – 2016',
      bullets: ['Lập kế hoạch và triển khai chương trình.'],
    })
    expect(data.education).toEqual([{ school: 'Đại học Kinh tế', degree: 'Cử nhân Quản trị', period: '2010 – 2014' }])
  })

  it('parses timeline text where the dates come first and skips the "Liên hệ" heading as a role', () => {
    const { data } = parseRawCvText(
      [
        'Nguyễn Đức Ánh',
        'Liên hệ',
        'anh@example.com',
        'Chuyên viên Vận hành',
        'Kinh nghiệm',
        '2015 – 2016',
        'Chuyên viên 1',
        'Công ty Số 1',
        'Lập kế hoạch.',
      ].join('\n'),
    )
    expect(data.role).toBe('Chuyên viên Vận hành')
    expect(data.jobs[0]).toMatchObject({ title: 'Chuyên viên 1', org: 'Công ty Số 1', period: '2015 – 2016' })
  })

  it('rejects data that is not a PDF', async () => {
    await expect(
      extractPdfText(new TextEncoder().encode('not a pdf').buffer as ArrayBuffer, { loadPdfjs: nodePdfjs }),
    ).rejects.toBeInstanceOf(PdfImportError)
  })
})
