import { beforeEach, describe, expect, it } from 'vitest'
import { createCv } from '@/lib/cv-repository'
import {
  createLetterFromTemplate,
  deleteApplication,
  deleteLetter,
  duplicateLetter,
  getApplications,
  getLetterById,
  getLetterList,
  sampleApplications,
  saveAllApplications,
  saveLetterDocument,
} from '@/lib/storage'

beforeEach(() => localStorage.clear())

describe('letters', () => {
  it('uses bracketed placeholders, not a stranger’s name, when there is no CV', () => {
    const letter = createLetterFromTemplate('thu-thang')
    expect(letter.senderName).toBe('[Họ và tên]')
    expect(JSON.stringify(letter)).not.toMatch(/Nguyễn Minh Anh|Thiên Phú/)
  })

  it('takes sender details and paper size from the chosen CV', () => {
    const cv = createCv({ blank: true })
    cv.data.name = 'Lê Thu Hà'
    cv.data.role = 'Kế toán'
    cv.settings.paperSize = 'letter'
    const letter = createLetterFromTemplate('dai-xanh', undefined, cv)
    expect(letter).toMatchObject({ senderName: 'Lê Thu Hà', paperSize: 'letter', linkedCvId: cv.id })
    expect(letter.subject).toContain('Kế toán')
  })

  it('does not seed anything and survives corrupted storage', () => {
    expect(getLetterList()).toEqual([])
    localStorage.setItem('hsx_letter_documents', '{not json')
    expect(getLetterList()).toEqual([])
    localStorage.setItem('hsx_letter_documents', JSON.stringify({ not: 'an array' }))
    expect(getLetterList()).toEqual([])
  })

  it('saves, duplicates and deletes', () => {
    const letter = createLetterFromTemplate('thu-thang')
    saveLetterDocument(letter)
    const copy = duplicateLetter(letter.id)!
    expect(getLetterList()).toHaveLength(2)
    deleteLetter(letter.id)
    expect(getLetterById(letter.id)).toBeNull()
    expect(getLetterById(copy.id)).not.toBeNull()
  })
})

describe('applications', () => {
  it('starts empty and stores what is saved', () => {
    expect(getApplications()).toEqual([])
    const samples = sampleApplications()
    expect(saveAllApplications(samples)).toBe(true)
    expect(getApplications()).toHaveLength(samples.length)
    deleteApplication(samples[0].id)
    expect(getApplications()).toHaveLength(samples.length - 1)
  })

  it('gives every sample card and todo a unique id', () => {
    const samples = sampleApplications()
    const ids = [...samples.map((s) => s.id), ...samples.flatMap((s) => s.todos.map((t) => t.id))]
    expect(new Set(ids).size).toBe(ids.length)
  })
})
