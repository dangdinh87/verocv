import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QUOC_HUY, ROLE_STARTER_KITS } from '@/components/resume/resume-data'
import { ResumePaper, type CvLayout } from '@/components/resume/resume-paper'
import { EMPTY_RESUME_DATA } from '@/types/resume'

const LAYOUTS: CvLayout[] = [
  'ke-ngang',
  'cot-xanh',
  'bia-kraft',
  'thu-gon',
  'anh-tron',
  'moc-thoi-gian',
  'toi-gian',
  'con-dau',
  'harvard',
  'cong-nghe',
  'hien-dai',
  'sang-tao',
]

describe('ResumePaper', () => {
  it.each(LAYOUTS)('%s renders all populated sections (including summary and languages) without React key warnings', (layout) => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<ResumePaper layout={layout} data={QUOC_HUY} />)
    const text = container.textContent ?? ''
    expect(text).toContain('Trần Quốc Huy')
    expect(text).toContain('Frontend Developer')
    expect(text).toContain('3 năm làm giao diện web')
    expect(text).toContain('Đại học Bách khoa TP. Hồ Chí Minh')
    expect(text).toContain('TypeScript')
    expect(text).toContain('Đọc tài liệu kỹ thuật tốt')
    expect(text).toContain('Thư viện component mã nguồn mở')
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it.each(LAYOUTS)('%s hides headings of empty sections on a blank CV', (layout) => {
    const { container } = render(<ResumePaper layout={layout} data={EMPTY_RESUME_DATA} />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Kinh nghiệm|Học vấn|Kỹ năng|Giới thiệu|Ngoại ngữ|Chứng chỉ|Mục tiêu/)
  })

  it('shows a greyed hint for a missing name in Vietnamese and English', () => {
    const vi = render(<ResumePaper layout="ke-ngang" data={EMPTY_RESUME_DATA} />).container
    expect(vi.querySelector('.ph')?.textContent).toBe('Họ và tên')
    const en = render(<ResumePaper layout="ke-ngang" data={EMPTY_RESUME_DATA} settings={{ documentLanguage: 'en' }} />).container
    expect(en.querySelector('.ph')?.textContent).toBe('Full Name')
  })

  it('translates default headings to English and respects custom sectionTitles', () => {
    const { container } = render(
      <ResumePaper
        layout="ke-ngang"
        data={QUOC_HUY}
        settings={{
          documentLanguage: 'en',
          sectionTitles: { jobs: 'Work History' },
        }}
      />,
    )
    const headings = Array.from(container.querySelectorAll('.h2')).map((el) => el.textContent)
    expect(headings).toEqual(['Summary', 'Work History', 'Education', 'Dự án cá nhân', 'Skills', 'Languages'])
  })

  it('reorders sections dynamically according to settings.sectionOrder', () => {
    const { container } = render(
      <ResumePaper
        layout="ke-ngang"
        data={QUOC_HUY}
        settings={{
          sectionOrder: ['education', 'skills', 'jobs', 'summary', 'languages', 'extra'],
        }}
      />,
    )
    const headings = Array.from(container.querySelectorAll('.h2')).map((el) => el.textContent)
    expect(headings).toEqual(['Học vấn', 'Kỹ năng', 'Kinh nghiệm làm việc', 'Giới thiệu', 'Ngoại ngữ', 'Dự án cá nhân'])
  })

  it('renders portrait photo in photo-capable templates and falls back to initials or clean header otherwise', () => {
    const withPhoto = { ...QUOC_HUY, photo: 'data:image/webp;base64,UklGRg==' }
    for (const layout of ['cot-xanh', 'anh-tron', 'con-dau', 'sang-tao', 'cong-nghe', 'hien-dai'] as const) {
      const { container } = render(<ResumePaper layout={layout} data={withPhoto} />)
      const img = container.querySelector('img.photo') as HTMLImageElement | null
      expect(img).not.toBeNull()
      expect(img?.getAttribute('src')).toBe(withPhoto.photo)
    }

    const withoutPhoto = { ...QUOC_HUY, photo: '' }
    for (const layout of ['cong-nghe', 'hien-dai'] as const) {
      const { container } = render(<ResumePaper layout={layout} data={withoutPhoto} />)
      expect(container.querySelector('.head-photo')).toBeNull()
      expect(container.querySelector('img.photo')).toBeNull()
    }
  })

  it('renders clickable mailto, tel and https links on flowing sheets, and plain text on thumbnails (no nested anchors)', () => {
    const thumb = render(<ResumePaper layout="ke-ngang" data={QUOC_HUY} />).container
    expect(thumb.querySelectorAll('a')).toHaveLength(0)

    const { container } = render(<ResumePaper layout="ke-ngang" data={QUOC_HUY} flow />)
    const hrefs = Array.from(container.querySelectorAll('.contact a')).map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('mailto:quochuy@example.com')
    expect(hrefs).toContain('tel:0912345678')
    expect(hrefs).toContain('https://github.com/quochuy')
  })

  it('defaults ke-ngang and harvard to serif font when settings.fontFamily is omitted', () => {
    const keNgang = render(<ResumePaper layout="ke-ngang" data={QUOC_HUY} />).container
    expect((keNgang.querySelector('.cv') as HTMLElement).style.fontFamily).toBe('var(--font-serif)')
    const harvard = render(<ResumePaper layout="harvard" data={QUOC_HUY} />).container
    expect((harvard.querySelector('.cv') as HTMLElement).style.fontFamily).toBe('var(--font-serif)')
    const cotXanh = render(<ResumePaper layout="cot-xanh" data={QUOC_HUY} />).container
    expect((cotXanh.querySelector('.cv') as HTMLElement).style.fontFamily).toBe('var(--font-sans)')
  })

  it('drops blank bullets and skills, and handles two jobs at the same company', () => {
    const data = {
      ...QUOC_HUY,
      skills: ['React', '  ', ''],
      jobs: [
        { title: 'A', org: 'Cùng công ty', period: '2020', bullets: ['Một', ''] },
        { title: 'B', org: 'Cùng công ty', period: '2022', bullets: [] },
      ],
    }
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<ResumePaper layout="ke-ngang" data={data} />)
    expect(container.querySelectorAll('.job .bul li')).toHaveLength(1)
    expect(container.textContent).toContain('React')
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('skips empty contact fields instead of printing stray separators', () => {
    const { container } = render(<ResumePaper layout="ke-ngang" data={{ ...QUOC_HUY, location: '', link: '' }} />)
    expect(container.querySelector('.contact')?.textContent).toBe('quochuy@example.com | 0912 345 678')
  })

  it('uses a flowing sheet in the editor and a clipped page for thumbnails', () => {
    const flow = render(<ResumePaper layout="ke-ngang" data={QUOC_HUY} flow />).container
    expect(flow.querySelector('.cv-frame')?.getAttribute('data-flow')).toBe('true')
    expect((flow.querySelector('.cv') as HTMLElement).style.aspectRatio).toBe('')
    const thumb = render(<ResumePaper layout="ke-ngang" data={QUOC_HUY} />).container
    expect((thumb.querySelector('.cv') as HTMLElement).style.aspectRatio).toContain('1.41')
  })

  it('supports FlowCV eye-visibility toggles on entries and whole sections without deleting data', () => {
    const data = {
      ...QUOC_HUY,
      jobs: [
        { ...QUOC_HUY.jobs[0], title: 'Visible Lead', hidden: false },
        { ...QUOC_HUY.jobs[1], title: 'Hidden Internship', hidden: true },
      ],
    }
    const { container } = render(<ResumePaper layout="ke-ngang" data={data} settings={{ hiddenSections: ['languages'] }} />)
    const text = container.textContent ?? ''
    expect(text).toContain('Visible Lead')
    expect(text).not.toContain('Hidden Internship')
    expect(text).not.toContain('Ngoại ngữ')
  })

  it.each(LAYOUTS)('%s renders structured FlowCV custom sections (Projects & Interests)', (layout) => {
    const data = {
      ...QUOC_HUY,
      customSections: [
        {
          id: 'custom_proj',
          kind: 'projects' as const,
          title: 'Dự án tiêu biểu',
          entries: [
            {
              id: 'p1',
              title: 'Hệ thống Quản lý Kho',
              subtitle: 'Tech Lead · Next.js',
              period: '2025',
              link: 'github.com/huy/wms',
              bullets: ['Xử lý 50.000 đơn mỗi ngày.'],
            },
          ],
        },
        {
          id: 'custom_int',
          kind: 'interests' as const,
          title: 'Sở thích',
          entries: [
            { id: 'i1', title: 'Chạy bộ đường dài', bullets: [] },
            { id: 'i2', title: 'Nhiếp ảnh phim', bullets: [] },
          ],
        },
      ],
    }
    const { container } = render(<ResumePaper layout={layout} data={data} flow />)
    const text = container.textContent ?? ''
    expect(text).toContain('Dự án tiêu biểu')
    expect(text).toContain('Hệ thống Quản lý Kho')
    expect(text).toContain('Chạy bộ đường dài, Nhiếp ảnh phim')
  })

  it('applies FlowCV customize styles (skill pills/grid, heading style, contact icons, margins) and click-to-jump', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <ResumePaper
        layout="toi-gian"
        data={QUOC_HUY}
        flow
        onSelectSection={onSelect}
        settings={{
          skillStyle: 'pills',
          headingStyle: 'left-accent',
          headingCase: 'uppercase',
          showContactIcons: true,
          pageMargin: 'compact',
          photoShape: 'rounded',
        }}
      />,
    )
    const cvEl = container.querySelector('.cv') as HTMLElement
    expect(cvEl.getAttribute('data-heading-style')).toBe('left-accent')
    expect(cvEl.getAttribute('data-heading-case')).toBe('uppercase')
    expect(cvEl.getAttribute('data-photo-shape')).toBe('rounded')
    expect(container.querySelectorAll('.sk-pills .tag').length).toBeGreaterThanOrEqual(5)
    expect(container.querySelectorAll('svg.c-ico').length).toBeGreaterThanOrEqual(3)

    const eduZone = container.querySelector('[data-cv-section="education"]') as HTMLElement
    fireEvent.click(eduZone)
    expect(onSelect).toHaveBeenCalledWith('education')
  })

  it('marks activeSection on interactive preview zones and renders custom projects on the timeline in moc-thoi-gian', () => {
    const data = {
      ...QUOC_HUY,
      customSections: [
        {
          id: 'custom_proj',
          kind: 'projects' as const,
          title: 'Dự án tiêu biểu',
          entries: [
            {
              id: 'p1',
              title: 'Hồ Sơ Xanh',
              subtitle: 'Tác giả chính',
              period: '2026',
              bullets: ['Xuất PDF chuẩn A4.'],
            },
          ],
        },
      ],
    }
    const { container } = render(
      <ResumePaper layout="moc-thoi-gian" data={data} flow activeSection="custom_proj" onSelectSection={() => {}} />,
    )
    const activeZone = container.querySelector('[data-cv-section="custom_proj"]')
    expect(activeZone?.getAttribute('data-active')).toBe('true')
    expect(activeZone?.querySelectorAll('.line .entry')).toHaveLength(1)
  })

  it.each(LAYOUTS)('%s renders QrBadge and language proficiency dots when configured', (layout) => {
    const data = {
      ...QUOC_HUY,
      languages: [{ id: 'l1', name: 'Tiếng Anh', level: 'IELTS 7.5', proficiency: 4 }],
    }
    const { container } = render(
      <ResumePaper
        layout={layout}
        data={data}
        flow
        settings={{
          showQrCode: true,
          qrUrl: 'https://verocv.vn/ho-so',
          showContactIcons: true,
          skillStyle: 'pills',
        }}
      />,
    )
    expect(container.querySelector('.cv-qr-box')).not.toBeNull()
    expect(container.querySelectorAll('.cv-lang-dot.filled')).toHaveLength(4)
    expect(container.querySelectorAll('svg.c-ico').length).toBeGreaterThanOrEqual(3)
    expect(container.querySelectorAll('.sk-pills .tag').length).toBeGreaterThanOrEqual(5)
  })

  it.each(['harvard', 'cong-nghe', 'hien-dai', 'sang-tao'] as const)(
    '%s supports hiddenSections and interactive section click-to-jump',
    (layout) => {
      const onSelect = vi.fn()
      const { container } = render(
        <ResumePaper
          layout={layout}
          data={QUOC_HUY}
          flow
          activeSection="jobs"
          onSelectSection={onSelect}
          settings={{ hiddenSections: ['languages'] }}
        />,
      )
      expect(container.textContent).not.toContain('Ngoại ngữ')
      const jobsZone = container.querySelector('[data-cv-section="jobs"]') as HTMLElement
      expect(jobsZone.getAttribute('data-active')).toBe('true')
      fireEvent.click(jobsZone)
      expect(onSelect).toHaveBeenCalledWith('jobs')
    },
  )

  it('exports at least 6 ROLE_STARTER_KITS whose layouts and personas render cleanly', () => {
    expect(ROLE_STARTER_KITS.length).toBeGreaterThanOrEqual(6)
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const kit of ROLE_STARTER_KITS) {
      expect(LAYOUTS).toContain(kit.recommendedLayout)
      const { container } = render(
        <ResumePaper layout={kit.recommendedLayout} data={kit.data} settings={{ accentColor: kit.accentColor }} />,
      )
      expect(container.textContent).toContain(kit.data.name)
    }
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('applies data-header-layout for left/center/split and omits it for template', () => {
    const templateView = render(<ResumePaper layout="ke-ngang" data={QUOC_HUY} settings={{ headerLayout: 'template' }} />).container
    expect((templateView.querySelector('.cv') as HTMLElement).getAttribute('data-header-layout')).toBeNull()

    for (const hl of ['left', 'center', 'split'] as const) {
      const { container } = render(<ResumePaper layout="harvard" data={QUOC_HUY} settings={{ headerLayout: hl }} />)
      expect((container.querySelector('.cv') as HTMLElement).getAttribute('data-header-layout')).toBe(hl)
    }

    const splitView = render(<ResumePaper layout="ke-ngang" data={QUOC_HUY} settings={{ headerLayout: 'split' }} />).container
    expect(splitView.querySelector('.contact')?.textContent).not.toContain(' | ')
  })

  it('renders SectionSvg icons inside .h2 when showSectionIcons is true without altering .h2 textContent', () => {
    const data = {
      ...QUOC_HUY,
      customSections: [
        {
          id: 'custom_proj',
          kind: 'projects' as const,
          title: 'Dự án tiêu biểu',
          entries: [{ id: 'p1', title: 'VeroCV', bullets: ['Xuất PDF.'] }],
        },
      ],
    }
    const { container } = render(
      <ResumePaper layout="ke-ngang" data={data} settings={{ showSectionIcons: true }} />,
    )
    const headings = Array.from(container.querySelectorAll('.h2'))
    expect(headings.map((el) => el.textContent)).toEqual([
      'Giới thiệu',
      'Kinh nghiệm làm việc',
      'Học vấn',
      'Dự án cá nhân',
      'Kỹ năng',
      'Ngoại ngữ',
      'Dự án tiêu biểu',
    ])
    expect(container.querySelectorAll('.h2.has-ico svg.s-ico')).toHaveLength(7)

    const anhTron = render(<ResumePaper layout="anh-tron" data={data} settings={{ showSectionIcons: true }} />).container
    expect(anhTron.querySelectorAll('.h2.has-ico svg.s-ico')).toHaveLength(7)
  })

  it.each(['template', 'comma', 'bullets', 'grid', 'pills'] as const)(
    'renders grouped skills ("Category: Skill A, Skill B") cleanly in %s mode',
    (skillStyle) => {
      const groupedData = {
        ...QUOC_HUY,
        skills: ['Backend: Go, PostgreSQL', 'Cloud: Docker, Kubernetes'],
      }
      const { container } = render(
        <ResumePaper layout="cong-nghe" data={groupedData} settings={{ skillStyle }} />,
      )
      const cats = Array.from(container.querySelectorAll('.sk-cat')).map((el) => el.textContent)
      expect(cats).toEqual(['Backend:', 'Cloud:'])
      expect(container.textContent).toContain('Go')
      expect(container.textContent).toContain('PostgreSQL')
      expect(container.textContent).toContain('Docker')
      if (skillStyle === 'pills') {
        expect(container.querySelectorAll('.sk-groups-pills .tag').length).toBeGreaterThanOrEqual(4)
      }
    },
  )
})
