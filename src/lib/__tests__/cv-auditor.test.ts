import { describe, expect, it } from 'vitest'
import { GIA_BAO, MINH_ANH, QUOC_HUY, THU_HA } from '@/components/resume/resume-data'
import { auditCvQuality } from '@/lib/cv-auditor'

const ids = (data: Parameters<typeof auditCvQuality>[0], lang: 'vi' | 'en' = 'vi') => auditCvQuality(data, lang).map((i) => i.id)

describe('auditCvQuality', () => {
  it('raises no warnings for any of the four complete sample personas', () => {
    for (const persona of [QUOC_HUY, MINH_ANH, THU_HA, GIA_BAO]) {
      expect(auditCvQuality(persona).filter((i) => i.type === 'warning')).toEqual([])
    }
  })

  it('asks for numbers when no bullet has one', () => {
    const data = {
      ...MINH_ANH,
      jobs: [{ title: 'Nhân viên', org: 'Công ty', period: '2023', bullets: ['Làm các công việc hành chính hằng ngày'] }],
    }
    expect(ids(data)).toContain('no-metrics')
  })

  it('does not count words like "tăng" as numbers', () => {
    const data = {
      ...MINH_ANH,
      jobs: [{ title: 'Nhân viên', org: 'Công ty', period: '2023', bullets: ['Tăng doanh số bán hàng cho cửa hàng'] }],
    }
    expect(ids(data)).toContain('no-metrics')
  })

  it('flags unfilled [x] placeholders left by AI suggestions', () => {
    const data = { ...MINH_ANH, summary: 'Đạt [x]% chỉ tiêu quý.' }
    const issue = auditCvQuality(data).find((i) => i.id === 'placeholders')
    expect(issue?.type).toBe('warning')
    expect(issue?.target).toBe('summary')
  })

  it('checks email and phone format', () => {
    expect(ids({ ...MINH_ANH, email: 'minhanh@' })).toContain('bad-email')
    expect(ids({ ...MINH_ANH, phone: '123' })).toContain('bad-phone')
    expect(ids(MINH_ANH)).not.toContain('bad-email')
  })

  it('reports a CV with nothing filled in', () => {
    const blank = { ...MINH_ANH, name: '', email: '', phone: '', summary: '', jobs: [], education: [], skills: [] }
    expect(ids(blank)).toEqual(expect.arrayContaining(['no-name', 'no-contact', 'no-summary', 'no-history', 'no-skills']))
  })

  it('flags weak passive openings, spacing before punctuation, and duplicate skills, and recognizes English verbs', () => {
    const messy = {
      ...QUOC_HUY,
      summary: 'Kinh nghiệm làm việc tốt , có trách nhiệm .',
      skills: ['React', 'react', 'TypeScript'],
      jobs: [
        {
          title: 'Dev',
          org: 'ABC',
          period: '2023',
          bullets: ['Tham gia vào dự án thương mại điện tử phục vụ 10.000 người dùng.'],
        },
      ],
    }
    expect(ids(messy)).toEqual(expect.arrayContaining(['punctuation-spacing', 'duplicate-skills', 'weak-opening']))

    const englishCv = {
      ...QUOC_HUY,
      jobs: [{ title: 'Engineer', org: 'Acme', period: '2023', bullets: ['Built CI pipeline cutting build time by 40%.'] }],
    }
    expect(ids(englishCv, 'en')).not.toContain('short-bullet-0-0')
  })

  it('ignores hidden entries/sections and checks customSections placeholders and metrics', () => {
    const withHidden = {
      ...MINH_ANH,
      jobs: [...MINH_ANH.jobs, { title: 'Draft', org: 'Hidden Corp', period: '', bullets: ['Cần điền [x]'], hidden: true }],
      languages: [{ name: 'Tiếng Nhật', level: '[trình độ]', hidden: true }],
    }
    expect(ids(withHidden)).not.toContain('placeholders')
    expect(ids(withHidden)).not.toContain('no-period-3')

    const hiddenSummary = { ...MINH_ANH, summary: '' }
    expect(auditCvQuality(hiddenSummary, 'vi', ['summary']).map((i) => i.id)).not.toContain('no-summary')

    const freshGradProjects = {
      ...MINH_ANH,
      jobs: [],
      customSections: [
        {
          id: 'custom_proj',
          kind: 'projects' as const,
          title: 'Dự án tiêu biểu',
          entries: [
            {
              id: 'p1',
              title: 'Hệ thống Đặt lịch',
              subtitle: 'Next.js & PostgreSQL',
              period: '2025',
              bullets: ['Phục vụ 1.200 lượt đặt mỗi tuần, giảm 35% thời gian chờ.'],
            },
            {
              id: 'p2',
              title: 'Bản nháp',
              bullets: ['Đạt [x]% hiệu năng.'],
            },
          ],
        },
      ],
    }
    const issues = auditCvQuality(freshGradProjects)
    expect(issues.map((i) => i.id)).not.toContain('no-metrics')
    const placeholder = issues.find((i) => i.id === 'placeholders')
    expect(placeholder?.target).toBe('custom_proj')
  })
})
