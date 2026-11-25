import { describe, expect, it } from 'vitest'
import { parseRawCvText } from '@/lib/cv-parser'

const FULL_CV = `
Nguyễn Minh Anh
Chuyên viên Marketing
Cầu Giấy, Hà Nội
minhanh@gmail.com | 0901 234 567
linkedin.com/in/minhanh

Giới thiệu
Hơn 4 năm làm marketing cho ngành bán lẻ.

Kinh nghiệm làm việc
Chuyên viên Marketing - Công ty Cổ phần Ánh Dương
2023 - nay
• Lập kế hoạch 12 chiến dịch quảng cáo.
• Tăng đơn hàng 28% sau 9 tháng.
Nhân viên Content | Công ty TNHH Lá Xanh | 2021 – 2023
- Viết bài cho website và fanpage.

Học vấn
Đại học Kinh tế Quốc dân
Cử nhân Marketing 2016 - 2020

Kỹ năng
Quảng cáo Meta, Google Analytics, SEO cơ bản

Ngoại ngữ
Tiếng Anh: IELTS 7.0
`

describe('parseRawCvText', () => {
  const parsed = parseRawCvText(FULL_CV)

  it('reads contact details', () => {
    expect(parsed.data.name).toBe('Nguyễn Minh Anh')
    expect(parsed.data.role).toBe('Chuyên viên Marketing')
    expect(parsed.data.email).toBe('minhanh@gmail.com')
    expect(parsed.data.phone.replace(/\D/g, '')).toBe('0901234567')
    expect(parsed.data.location).toBe('Cầu Giấy, Hà Nội')
  })

  it('does not mistake the email domain for a website', () => {
    expect(parsed.data.link).toBe('linkedin.com/in/minhanh')
    expect(parseRawCvText('An Nguyen\nan@gmail.com').data.link).toBe('')
  })

  it('splits two jobs, with the date on its own line or inline', () => {
    expect(parsed.data.jobs).toHaveLength(2)
    expect(parsed.data.jobs[0]).toMatchObject({ title: 'Chuyên viên Marketing', org: 'Công ty Cổ phần Ánh Dương', period: '2023 - nay' })
    expect(parsed.data.jobs[0].bullets).toEqual(['Lập kế hoạch 12 chiến dịch quảng cáo.', 'Tăng đơn hàng 28% sau 9 tháng.'])
    expect(parsed.data.jobs[1]).toMatchObject({ title: 'Nhân viên Content', org: 'Công ty TNHH Lá Xanh', period: '2021 – 2023' })
  })

  it('reads education, skills and languages', () => {
    expect(parsed.data.education[0]).toMatchObject({ school: 'Đại học Kinh tế Quốc dân' })
    expect(parsed.data.skills).toEqual(['Quảng cáo Meta', 'Google Analytics', 'SEO cơ bản'])
    expect(parsed.data.languages).toEqual([{ name: 'Tiếng Anh', level: 'IELTS 7.0' }])
    expect(parsed.confidence.jobs).toBe(true)
  })

  it('does not split hyphenated words in skills or titles', () => {
    const result = parseRawCvText('Lê Văn Bình\nKỹ năng\nFull-stack, Back-end, CI/CD')
    expect(result.data.skills).toEqual(['Full-stack', 'Back-end', 'CI/CD'])
  })

  it('never invents content when the text is nearly empty', () => {
    const empty = parseRawCvText('abc')
    expect(empty.data.jobs).toEqual([])
    expect(empty.data.education).toEqual([])
    expect(empty.data.skills).toEqual([])
    expect(empty.data.languages).toEqual([])
    expect(empty.data.location).toBe('')
    expect(empty.data.extra.items).toEqual([])
    expect(JSON.stringify(empty.data)).not.toMatch(/Tên công ty|Trường Đại học|Giao tiếp|2022 - nay|Hà Nội, Việt Nam/)
    expect(empty.warnings.length).toBeGreaterThan(0)
  })

  it('keeps a job without dates for review instead of dropping it', () => {
    const result = parseRawCvText('Phạm Gia Bảo\nKinh nghiệm\nNhân viên bán hàng\n- Tư vấn khách')
    expect(result.data.jobs).toHaveLength(1)
    expect(result.data.jobs[0].period).toBe('')
    expect(result.confidence.jobs).toBe(false)
  })

  it('extracts both primary link and additional profile links without duplicating the primary one', () => {
    const result = parseRawCvText(
      [
        'Trần Quốc Huy',
        'Frontend Developer',
        'quochuy@example.com | 0912 345 678',
        'linkedin.com/in/quochuy | https://github.com/quochuy | https://github.com/quochuy/',
      ].join('\n'),
    )
    expect(result.data.link).toBe('linkedin.com/in/quochuy')
    expect(result.data.links).toHaveLength(1)
    expect(result.data.links?.[0]).toMatchObject({ label: 'GitHub', url: 'https://github.com/quochuy' })
  })
})
