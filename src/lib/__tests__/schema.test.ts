import { describe, expect, it } from 'vitest'
import { computeInitials } from '@/types/resume'
import { migrateToV2 } from '@/types/schema'

describe('migrateToV2', () => {
  it('upgrades a legacy document: version 2, ids on every list item', () => {
    const doc = migrateToV2({
      id: 'cv_legacy',
      title: 'CV cũ',
      layout: 'cot-xanh',
      data: {
        name: 'Trần Quốc Huy',
        jobs: [{ title: 'Dev', org: 'Sao Mai', period: '2022', bullets: ['Viết React'] }],
        education: [{ school: 'ĐH Bách khoa', degree: 'Kỹ sư', period: '2021' }],
        languages: [{ name: 'Tiếng Anh', level: 'IELTS 7.5' }],
      },
    })
    expect(doc.version).toBe(2)
    expect(doc.data.jobs[0].id).toBeTruthy()
    expect(doc.data.education[0].id).toBeTruthy()
    expect(doc.data.languages[0].id).toBeTruthy()
    expect(doc.settings.paperSize).toBe('a4')
  })

  it('keeps existing item ids', () => {
    const doc = migrateToV2({ id: 'a', data: { jobs: [{ id: 'job_keep', title: 'x' }] } })
    expect(doc.data.jobs[0].id).toBe('job_keep')
  })

  it('fills defaults for a nearly empty document', () => {
    const doc = migrateToV2({ id: 'a' })
    expect(doc.title).toBe('CV chưa đặt tên')
    expect(doc.layout).toBe('ke-ngang')
    expect(doc.data.skills).toEqual([])
  })

  it('rejects non-objects and unknown layouts instead of storing garbage', () => {
    expect(() => migrateToV2(null)).toThrow()
    expect(() => migrateToV2('text')).toThrow()
    expect(() => migrateToV2({ id: 'a', layout: 'khong-co-mau-nay' })).toThrow()
  })
})

describe('computeInitials', () => {
  it('uses the first and last word, with Vietnamese capitals', () => {
    expect(computeInitials('Nguyễn Minh Anh')).toBe('NA')
    expect(computeInitials('đỗ thị ánh')).toBe('ĐÁ')
    expect(computeInitials('Bảo')).toBe('BẢ')
    expect(computeInitials('   ')).toBe('')
  })
})
