import { describe, expect, it } from 'vitest'
import { fileSafeName } from '@/lib/print-document'

describe('fileSafeName', () => {
  it('turns a Vietnamese name into a safe file name', () => {
    expect(fileSafeName('Nguyễn Đức Anh')).toBe('Nguyen-Duc-Anh')
    expect(fileSafeName('Đỗ Thị Ánh / CV (mới)')).toBe('Do-Thi-Anh-CV-moi')
  })

  it('falls back when nothing usable is left', () => {
    expect(fileSafeName('')).toBe('Ung-vien')
    expect(fileSafeName('???', 'x')).toBe('x')
  })
})
