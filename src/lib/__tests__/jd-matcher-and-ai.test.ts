import { describe, expect, it } from 'vitest'
import { QUOC_HUY } from '@/components/resume/resume-data'
import { suggestBulletImprovement, suggestSkillsForRole, suggestSummary } from '@/lib/ai-suggestions'
import { formatResumeAsAtsText, matchResumeAgainstJd } from '@/lib/jd-matcher'

describe('matchResumeAgainstJd', () => {
  it('identifies matched and missing skills across Vietnamese and English JDs, including symbolic terms', () => {
    const jd = `
      Tuyển Frontend Engineer:
      - Thành thạo React, TypeScript, Next.js và Tailwind CSS.
      - Có kinh nghiệm với GraphQL, Docker, CI/CD và kiểm thử tự động (Vitest/Playwright).
      - Điểm cộng nếu biết C# hoặc .NET.
    `
    const res = matchResumeAgainstJd(QUOC_HUY, jd)
    expect(res.matched).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Kiểm thử tự động']))
    expect(res.missing).toEqual(expect.arrayContaining(['GraphQL', 'Docker', 'CI/CD', 'C# / .NET']))
    expect(res.matchPercent).toBeGreaterThan(40)
    expect(res.matchPercent).toBeLessThan(80)
  })

  it('returns zero counts on an empty JD', () => {
    expect(matchResumeAgainstJd(QUOC_HUY, '   ')).toEqual({
      matched: [],
      missing: [],
      matchPercent: 0,
      totalKeywords: 0,
    })
  })
})

describe('formatResumeAsAtsText', () => {
  it('formats linear plain text in Vietnamese and English', () => {
    const vi = formatResumeAsAtsText(QUOC_HUY, 'vi')
    expect(vi).toContain('TRẦN QUỐC HUY')
    expect(vi).toContain('KINH NGHIỆM LÀM VIỆC')
    expect(vi).toContain('• Xây lại trang thanh toán')

    const en = formatResumeAsAtsText(QUOC_HUY, 'en')
    expect(en).toContain('SUMMARY')
    expect(en).toContain('EXPERIENCE')
    expect(en).toContain('EDUCATION')
    expect(en).toContain('SKILLS')
  })
})

describe('AI writing assistant modes & career tracks', () => {
  it('strips weak passive prefixes and generates distinct impact, concise and detailed rewrites without inventing numbers', async () => {
    const impact = await suggestBulletImprovement('Chịu trách nhiệm quản lý fanpage của công ty', 'Marketing', 'impact', 'vi')
    const concise = await suggestBulletImprovement(
      'Chịu trách nhiệm quản lý fanpage của công ty, nhằm tăng tương tác',
      'Marketing',
      'concise',
      'vi',
    )
    const detailed = await suggestBulletImprovement('Quản lý fanpage', 'Marketing', 'detailed', 'vi')

    expect(impact.options[0]).not.toMatch(/Chịu trách nhiệm/i)
    expect(impact.options[0]).toContain('[x]')
    expect(concise.options[0].length).toBeLessThan(detailed.options[0].length)

    const en = await suggestBulletImprovement('Responsible for building API endpoints', 'Backend Developer', 'impact', 'en')
    expect(en.options[0]).not.toMatch(/Responsible for/i)
    expect(en.options[0]).toContain('[x]')
  })

  it('returns role-appropriate skills and summaries in both Vietnamese and English', async () => {
    expect(await suggestSkillsForRole('Chuyên viên Xuất nhập khẩu Logistics')).toContain('Chứng từ xuất nhập khẩu')
    expect(await suggestSkillsForRole('UI/UX Designer')).toContain('Figma')
    const enSummary = await suggestSummary('Frontend Engineer', '4', 'concise', 'en')
    expect(enSummary.options[0]).toContain('Frontend Engineer')
  })
})
