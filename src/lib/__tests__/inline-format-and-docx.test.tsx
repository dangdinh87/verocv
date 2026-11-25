import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SAMPLE_LETTER } from '@/components/resume/letter-paper'
import { MINH_ANH } from '@/components/resume/resume-data'
import { buildLetterDocx, buildResumeDocx } from '@/lib/docx-export'
import { extractDocxText } from '@/lib/docx-text'
import { InlineFormatted, parseInlineTokens, stripInlineFormatting } from '@/lib/inline-format'
import { generateQrMatrix, qrMatrixToSvgString } from '@/lib/qr-svg'
import { importWorkspaceFromJson } from '@/lib/workspace-backup'
import { buildVietQrTransferPayload, extractOrderCodeFromTransferContent } from '@/server/billing/vietqr'
import { migrateToV2 } from '@/types/schema'

describe('Inline formatting, QR SVG & DOCX export', () => {
  it('parses bold, italic, and safe links while stripping unsafe javascript: URLs', () => {
    const text = 'Tăng **42% doanh thu** tại *Shopee* qua [Portfolio](https://verocv.vn) và [Bad](javascript:alert(1))'
    const tokens = parseInlineTokens(text)
    expect(tokens.some((t) => t.type === 'bold' && t.value === '42% doanh thu')).toBe(true)
    expect(tokens.some((t) => t.type === 'italic' && t.value === 'Shopee')).toBe(true)
    expect(tokens.some((t) => t.type === 'link' && t.href === 'https://verocv.vn/')).toBe(true)
    expect(tokens.some((t) => t.type === 'link' && t.href.includes('javascript:'))).toBe(false)

    expect(stripInlineFormatting(text)).toBe('Tăng 42% doanh thu tại Shopee qua Portfolio và Bad')

    render(<InlineFormatted text="Đạt **99% SLA** với [demo](https://verocv.vn)" interactive />)
    expect(screen.getByText('99% SLA').tagName).toBe('STRONG')
    expect(screen.getByRole('link', { name: 'demo' })).toHaveAttribute('href', 'https://verocv.vn/')
  })

  it('generates valid QR matrices and VietQR EMVCo payloads', () => {
    const matrix = generateQrMatrix('https://verocv.vn/p/minh-anh')
    expect(matrix.length).toBeGreaterThanOrEqual(21)
    expect(matrix.length).toBe(matrix[0].length)
    const svg = qrMatrixToSvgString(matrix, 160)
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox=')

    const emv = buildVietQrTransferPayload({
      bankBin: '970422',
      accountNo: '0123456789',
      amountVnd: 49000,
      orderCode: 'HSX2345ABCD',
    })
    expect(emv).toContain('970422')
    expect(emv).toContain('HSX2345ABCD')
    expect(emv).toMatch(/6304[0-9A-F]{4}$/)
    expect(extractOrderCodeFromTransferContent('MBVCB.12345.HSX2345ABCD.CT')).toBe('HSX2345ABCD')
  })

  it('exports valid UTF-8 .docx files for both CV and Cover Letter readable by extractDocxText', async () => {
    const cv = migrateToV2({
      id: 'cv_docx_test',
      title: 'CV Kiểm Thử',
      layout: 'ke-ngang',
      data: {
        ...MINH_ANH,
        summary: 'Tăng **42% chuyển đổi** cho hệ thống thương mại điện tử.',
      },
    })
    const cvBytes = buildResumeDocx(cv)
    const cvAb = cvBytes.buffer.slice(cvBytes.byteOffset, cvBytes.byteOffset + cvBytes.byteLength) as ArrayBuffer
    const cvExtracted = await extractDocxText(cvAb)
    expect(cvExtracted.text).toContain('Nguyễn Minh Anh')
    expect(cvExtracted.text).toContain('Tăng 42% chuyển đổi cho hệ thống thương mại điện tử.')
    expect(cvExtracted.text).toContain('Công ty Cổ phần Ánh Dương')

    const letterBytes = buildLetterDocx({
      id: 'let_docx_test',
      title: 'Thư test',
      layout: 'thang',
      accent: 'pen',
      paperSize: 'a4',
      ...SAMPLE_LETTER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    const letterAb = letterBytes.buffer.slice(letterBytes.byteOffset, letterBytes.byteOffset + letterBytes.byteLength) as ArrayBuffer
    const letterExtracted = await extractDocxText(letterAb)
    expect(letterExtracted.text).toContain('Nguyễn Minh Anh')
    expect(letterExtracted.text).toContain('Công ty Cổ phần Thiên Phú')
  })

  it('accepts both verocv-workspace and legacy ho-so-xanh-workspace backup formats', async () => {
    const legacyJson = JSON.stringify({
      format: 'ho-so-xanh-workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      cvs: [{ id: 'cv_legacy_1', title: 'CV Cũ', layout: 'ke-ngang', data: MINH_ANH }],
      letters: [],
      applications: [],
    })
    const summary = await importWorkspaceFromJson(legacyJson)
    expect(summary.cvs).toBe(1)
  })
})
