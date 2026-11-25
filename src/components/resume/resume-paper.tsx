import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { InlineFormatted } from '@/lib/inline-format'
import { generateQrMatrix } from '@/lib/qr-svg'
import {
  isCustomSectionKey,
  normalizeSectionOrder,
  type CvColumnSplit,
  type CvFontFamilyV2,
  type CvHeaderLayout,
  type CvHeadingStyle,
  type CvLayout,
  type CvSectionKey,
  type CvSkillStyle,
} from '@/types/schema'
import {
  DUC_ANH,
  GIA_BAO,
  HOANG_NAM,
  KHANH_LINH,
  MINH_ANH,
  QUOC_HUY,
  THAO_VY,
  THU_HA,
  type CustomSection,
  type CustomSectionKind,
  type ResumeData,
} from './resume-data'
import './resume-paper.css'

export type { CvHeaderLayout, CvLayout }

export const LAYOUT_PERSONA: Record<CvLayout, ResumeData> = {
  'ke-ngang': THU_HA,
  'cot-xanh': QUOC_HUY,
  'bia-kraft': MINH_ANH,
  'thu-gon': QUOC_HUY,
  'anh-tron': MINH_ANH,
  'moc-thoi-gian': THU_HA,
  'toi-gian': GIA_BAO,
  'con-dau': GIA_BAO,
  harvard: DUC_ANH,
  'cong-nghe': HOANG_NAM,
  'hien-dai': KHANH_LINH,
  'sang-tao': THAO_VY,
}

export type PaperSettings = {
  accentColor?: string
  fontFamily?: CvFontFamilyV2
  fontSize?: 'compact' | 'normal' | 'relaxed'
  spacing?: 'compact' | 'normal' | 'relaxed'
  pageMargin?: 'compact' | 'normal' | 'spacious'
  sectionSpacing?: 'compact' | 'normal' | 'spacious'
  paperSize?: 'a4' | 'letter'
  documentLanguage?: 'vi' | 'en'
  skillStyle?: CvSkillStyle
  headingStyle?: CvHeadingStyle
  headingCase?: 'normal' | 'uppercase'
  headerLayout?: CvHeaderLayout
  showSectionIcons?: boolean
  showContactIcons?: boolean
  photoShape?: 'circle' | 'rounded' | 'square'
  columnSplit?: CvColumnSplit
  sideSections?: string[]
  showQrCode?: boolean
  qrUrl?: string
  discretePages?: boolean
  sectionOrder?: string[]
  sectionTitles?: Record<string, string>
  hiddenSections?: string[]
}

// Page height / width. Used by the preview's page guides, the page counter and the print stylesheet.
export const PAPER_RATIO = { a4: 297 / 210, letter: 11 / 8.5 } as const

const DEFAULT_EXTRA_VI = /^chứng chỉ(\s*(&|\/|và)\s*dự án)?$/i

export function defaultSectionTitle(
  key: string,
  layout: CvLayout = 'ke-ngang',
  lang: 'vi' | 'en' = 'vi',
  extraDataTitle?: string,
  customSectionTitle?: string,
): string {
  if (isCustomSectionKey(key)) {
    return customSectionTitle?.trim() || (lang === 'en' ? 'Custom Section' : 'Mục tuỳ chỉnh')
  }
  if (lang === 'en') {
    switch (key as CvSectionKey | 'contact') {
      case 'contact':
        return 'Contact'
      case 'summary':
        return layout === 'con-dau' ? 'Objective' : 'Summary'
      case 'jobs':
        return 'Experience'
      case 'education':
        return 'Education'
      case 'skills':
        return 'Skills'
      case 'languages':
        return 'Languages'
      case 'extra': {
        const trimmed = extraDataTitle?.trim() ?? ''
        return !trimmed || DEFAULT_EXTRA_VI.test(trimmed) ? 'Projects & Certifications' : trimmed
      }
    }
  }
  switch (key as CvSectionKey | 'contact') {
    case 'contact':
      return 'Liên hệ'
    case 'summary':
      return layout === 'con-dau' ? 'Mục tiêu' : 'Giới thiệu'
    case 'jobs':
      return layout === 'ke-ngang' ? 'Kinh nghiệm làm việc' : layout === 'con-dau' ? 'Hoạt động và kinh nghiệm' : 'Kinh nghiệm'
    case 'education':
      return 'Học vấn'
    case 'skills':
      return 'Kỹ năng'
    case 'languages':
      return 'Ngoại ngữ'
    case 'extra':
      return extraDataTitle?.trim() || 'Chứng chỉ & Dự án'
  }
}

export function resolveSectionTitle(
  key: string,
  layout: CvLayout,
  settings: PaperSettings | undefined,
  extraDataTitle?: string,
  customSectionTitle?: string,
): string {
  const custom = settings?.sectionTitles?.[key]?.trim()
  if (custom) return custom
  return defaultSectionTitle(key, layout, settings?.documentLanguage ?? 'vi', extraDataTitle, customSectionTitle)
}

// Blank or explicitly hidden entries are dropped so an unfinished or tailored form never leaves stray bullets or empty headings.
function clean(d: ResumeData): ResumeData {
  const filled = (list: string[]) => list.map((s) => s.trim()).filter(Boolean)
  return {
    ...d,
    photo: d.photo?.trim() ?? '',
    links: (d.links ?? []).filter((l) => l.url.trim()),
    skills: filled(d.skills),
    jobs: d.jobs
      .filter((j) => !j.hidden && (j.title.trim() || j.org.trim() || j.bullets.some((b) => b.trim())))
      .map((j) => ({ ...j, bullets: filled(j.bullets) })),
    education: d.education.filter((e) => !e.hidden && (e.degree.trim() || e.school.trim())),
    languages: d.languages.filter((l) => !l.hidden && l.name.trim()),
    extra: { ...d.extra, items: filled(d.extra.items) },
    customSections: (d.customSections ?? [])
      .filter((cs) => !cs.hidden)
      .map((cs) => ({
        ...cs,
        entries: cs.entries
          .filter((en) => !en.hidden && (en.title.trim() || en.subtitle?.trim() || en.bullets.some((b) => b.trim())))
          .map((en) => ({ ...en, bullets: filled(en.bullets) })),
      })),
  }
}

const Ph = ({ text, value }: { text: string; value: string }) => (value.trim() ? <>{value}</> : <span className="ph">{text}</span>)

type ContactKind = 'location' | 'email' | 'phone' | 'linkedin' | 'github' | 'link'
type ContactItem = { key: string; kind: ContactKind; text: string; href?: string; external?: boolean }

function ContactSvg({ kind }: { kind: ContactKind }) {
  const props = {
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'c-ico',
    'aria-hidden': true,
  }
  switch (kind) {
    case 'location':
      return (
        <svg {...props}>
          <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.8 8 14 8 14Z" />
          <circle cx="8" cy="6.5" r="1.5" />
        </svg>
      )
    case 'email':
      return (
        <svg {...props}>
          <rect x="2" y="3.5" width="12" height="9" rx="1.2" />
          <path d="m2.5 4.2 5.5 4.3 5.5-4.3" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...props}>
          <path d="M4.8 2.5h1.8l.9 2.6-1.3 1a8.5 8.5 0 0 0 3.7 3.7l1-1.3 2.6.9v1.8a1.3 1.3 0 0 1-1.4 1.3A10.8 10.8 0 0 1 3.5 3.9a1.3 1.3 0 0 1 1.3-1.4Z" />
        </svg>
      )
    case 'linkedin':
    case 'github':
    case 'link':
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M2.8 8h10.4M8 2.5c1.7 1.6 2.5 3.5 2.5 5.5S9.7 11.9 8 13.5C6.3 11.9 5.5 10 5.5 8S6.3 4.1 8 2.5Z" />
        </svg>
      )
  }
}

function classifyUrlKind(url: string): ContactKind {
  const lower = url.toLowerCase()
  if (lower.includes('linkedin.com')) return 'linkedin'
  if (lower.includes('github.com')) return 'github'
  return 'link'
}

function contactItems(d: ResumeData): ContactItem[] {
  const items: ContactItem[] = []
  const loc = d.location.trim()
  const email = d.email.trim()
  const phone = d.phone.trim()
  const link = d.link.trim()

  if (loc) items.push({ key: `loc:${loc}`, kind: 'location', text: loc })
  if (email) {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    items.push({ key: `email:${email}`, kind: 'email', text: email, href: validEmail ? `mailto:${email}` : undefined })
  }
  if (phone) {
    const digits = phone.replace(/[^\d+]/g, '')
    items.push({ key: `phone:${phone}`, kind: 'phone', text: phone, href: digits.length >= 7 ? `tel:${digits}` : undefined })
  }
  if (link) {
    const href = /^https?:\/\//i.test(link) ? link : `https://${link}`
    items.push({ key: `link:${link}`, kind: classifyUrlKind(link), text: link, href, external: true })
  }
  for (const extraLink of d.links ?? []) {
    const rawUrl = extraLink.url.trim()
    if (!rawUrl) continue
    const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    const display = extraLink.label.trim() || rawUrl.replace(/^https?:\/\/(www\.)?/i, '')
    items.push({
      key: `xlnk:${extraLink.id}:${rawUrl}`,
      kind: classifyUrlKind(rawUrl),
      text: display,
      href,
      external: true,
    })
  }
  return items
}

const ContactNode = ({ item, interactive, showIcons }: { item: ContactItem; interactive: boolean; showIcons?: boolean }) => {
  const inner = (
    <>
      {showIcons && <ContactSvg kind={item.kind} />}
      {item.text}
    </>
  )
  return interactive && item.href ? (
    <a
      href={item.href}
      {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={showIcons ? 'c-item' : undefined}
    >
      {inner}
    </a>
  ) : showIcons ? (
    <span className="c-item">{inner}</span>
  ) : (
    <>{item.text}</>
  )
}

const Contact = ({
  d,
  sep = true,
  interactive = false,
  showIcons = false,
}: {
  d: ResumeData
  sep?: boolean
  interactive?: boolean
  showIcons?: boolean
}) => (
  <>
    {contactItems(d).map((c, i) => (
      <span key={c.key}>
        {i > 0 && sep ? (showIcons ? '   ' : ' | ') : ''}
        <ContactNode item={c} interactive={interactive} showIcons={showIcons} />
      </span>
    ))}
  </>
)

const Bullets = ({ items, interactive = false }: { items: string[]; interactive?: boolean }) =>
  items.length ? (
    <ul className="bul">
      {items.map((b, i) => (
        <li key={i}>
          <InlineFormatted text={b} interactive={interactive} />
        </li>
      ))}
    </ul>
  ) : null

const ClickZone = ({
  sectionKey,
  activeSection,
  onSelect,
  children,
}: {
  sectionKey: string
  activeSection?: string
  onSelect?: (sectionKey: string) => void
  children: ReactNode
}) =>
  onSelect ? (
    <div
      data-cv-section={sectionKey}
      data-active={activeSection === sectionKey ? 'true' : undefined}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) return
        onSelect(sectionKey)
      }}
      className="cv-zone"
    >
      {children}
    </div>
  ) : (
    <>{children}</>
  )

function SectionSvg({ sectionKey, customKind }: { sectionKey: string; customKind?: CustomSectionKind }) {
  const props = {
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 's-ico',
    'aria-hidden': true,
  }
  const kind = isCustomSectionKey(sectionKey) ? (customKind ?? 'custom') : sectionKey
  switch (kind) {
    case 'contact':
      return (
        <svg {...props}>
          <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
          <path d="M5 6.5h6M5 9.5h4" />
        </svg>
      )
    case 'summary':
      return (
        <svg {...props}>
          <circle cx="8" cy="5.2" r="2.3" />
          <path d="M3.2 13.5c.6-2.4 2.4-3.6 4.8-3.6s4.2 1.2 4.8 3.6" />
        </svg>
      )
    case 'jobs':
      return (
        <svg {...props}>
          <rect x="2.2" y="4.8" width="11.6" height="8.2" rx="1.4" />
          <path d="M5.6 4.8V3.4a1 1 0 0 1 1-1h2.8a1 1 0 0 1 1 1v1.4M2.2 8.2h11.6" />
        </svg>
      )
    case 'education':
      return (
        <svg {...props}>
          <path d="m1.8 6.2 6.2-3 6.2 3-6.2 3-6.2-3Z" />
          <path d="M4.2 7.6v3.7c0 1.1 1.7 2 3.8 2s3.8-.9 3.8-2V7.6M13.8 6.6v4.2" />
        </svg>
      )
    case 'skills':
      return (
        <svg {...props}>
          <path d="M9.6 2.3 4.2 8.8h4l-1.8 4.9 5.4-6.5h-4l1.8-4.9Z" />
        </svg>
      )
    case 'languages':
      return (
        <svg {...props}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M2.6 8h10.8M8 2.5c1.7 1.6 2.5 3.5 2.5 5.5S9.7 11.9 8 13.5C6.3 11.9 5.5 10 5.5 8S6.3 4.1 8 2.5Z" />
        </svg>
      )
    case 'projects':
      return (
        <svg {...props}>
          <path d="M5.2 4.5 2 8l3.2 3.5M10.8 4.5 14 8l-3.2 3.5M9 3.5 7 12.5" />
        </svg>
      )
    case 'certificates':
    case 'awards':
    case 'extra':
      return (
        <svg {...props}>
          <circle cx="8" cy="6.2" r="3.4" />
          <path d="m6 9.2-.8 4.5L8 12.2l2.8 1.5-.8-4.5" />
        </svg>
      )
    case 'activities':
      return (
        <svg {...props}>
          <path d="M8 2.5v11M2.5 8h11M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" />
        </svg>
      )
    case 'publications':
      return (
        <svg {...props}>
          <path d="M3.2 2.8h6.4l3.2 3.2v7.2H3.2V2.8Z" />
          <path d="M9.6 2.8V6h3.2M5.5 8.5h5M5.5 11h3.5" />
        </svg>
      )
    case 'references':
      return (
        <svg {...props}>
          <path d="M3 4.2h10v6.6H6.5L3.5 13v-2.2H3V4.2Z" />
        </svg>
      )
    case 'interests':
      return (
        <svg {...props}>
          <path d="M8 13.2s-4.8-3-4.8-6.4a2.8 2.8 0 0 1 4.8-1.9 2.8 2.8 0 0 1 4.8 1.9c0 3.4-4.8 6.4-4.8 6.4Z" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <path d="M8 2.4 9.5 6l3.9.4-2.9 2.6.8 3.9L8 10.9l-3.3 2 .8-3.9L2.6 6.4 6.5 6 8 2.4Z" />
        </svg>
      )
  }
}

const HeadingTitle = ({
  text,
  iconKey,
  customKind,
  showIcon,
}: {
  text: string
  iconKey?: string
  customKind?: CustomSectionKind
  showIcon?: boolean
}) => (
  <div className={showIcon && iconKey ? 'h2 has-ico' : 'h2'}>
    {showIcon && iconKey && <SectionSvg sectionKey={iconKey} customKind={customKind} />}
    {text}
  </div>
)

const Block = ({
  title,
  show,
  sectionKey,
  iconKey,
  customKind,
  showIcon,
  activeSection,
  onSelect,
  children,
}: {
  title: string
  show: boolean
  sectionKey?: string
  iconKey?: string
  customKind?: CustomSectionKind
  showIcon?: boolean
  activeSection?: string
  onSelect?: (sectionKey: string) => void
  children: ReactNode
}) =>
  show ? (
    <ClickZone sectionKey={sectionKey ?? ''} activeSection={activeSection} onSelect={sectionKey ? onSelect : undefined}>
      <HeadingTitle text={title} iconKey={iconKey ?? sectionKey} customKind={customKind} showIcon={showIcon} />
      {children}
    </ClickZone>
  ) : null

const Jobs = ({ d, interactive = false }: { d: ResumeData; interactive?: boolean }) => (
  <>
    {d.jobs.map((j, i) => {
      const orgLine = [j.org.trim(), j.location?.trim()].filter(Boolean).join(' · ')
      return (
        <div key={j.id ?? i} className="job">
          <div className="row">
            <p className="job-title">{j.title}</p>
            <p className="period">{j.period}</p>
          </div>
          {orgLine && <p className="job-org">{orgLine}</p>}
          <Bullets items={j.bullets} interactive={interactive} />
        </div>
      )
    })}
  </>
)

const Education = ({ d }: { d: ResumeData }) => (
  <>
    {d.education.map((e, i) => {
      const schoolLine = [e.school.trim(), e.location?.trim(), e.gpa?.trim() ? `GPA: ${e.gpa.trim()}` : ''].filter(Boolean).join(' · ')
      return (
        <div key={e.id ?? i} className="job">
          <div className="row">
            <p className="job-title">{e.degree}</p>
            <p className="period">{e.period}</p>
          </div>
          {schoolLine && <p className="job-org">{schoolLine}</p>}
        </div>
      )
    })}
  </>
)

const CustomEntries = ({ cs, interactive }: { cs: CustomSection; interactive: boolean }) => {
  // Interests with simple titles render cleanly on one comma-separated line like FlowCV.
  const simpleInline =
    cs.kind === 'interests' && cs.entries.every((e) => !e.subtitle?.trim() && !e.period?.trim() && e.bullets.length === 0)
  if (simpleInline) {
    return (
      <p className="txt" style={{ marginTop: '0.6em' }}>
        {cs.entries
          .map((e) => e.title.trim())
          .filter(Boolean)
          .join(', ')}
      </p>
    )
  }
  return (
    <>
      {cs.entries.map((en) => {
        const rawUrl = en.link?.trim() ?? ''
        const href = rawUrl ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`) : undefined
        return (
          <div key={en.id} className="job">
            <div className="row">
              <p className="job-title">
                {interactive && href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {en.title} ↗
                  </a>
                ) : (
                  en.title
                )}
              </p>
              {en.period?.trim() && <p className="period">{en.period}</p>}
            </div>
            {en.subtitle?.trim() && <p className="job-org">{en.subtitle}</p>}
            <Bullets items={en.bullets} interactive={interactive} />
          </div>
        )
      })}
    </>
  )
}

const Languages = ({ d, firstTop }: { d: ResumeData; firstTop?: string }) => (
  <>
    {d.languages.map((l, i) => {
      const prof = l.proficiency ?? 0
      return (
        <div key={l.id ?? i} className={prof > 0 ? 'small cv-lang-row' : 'small'} style={{ marginTop: i === 0 && firstTop !== undefined ? firstTop : '0.5em' }}>
          <span>
            {l.name}
            {l.level.trim() && (
              <>
                : <span className="muted">{l.level}</span>
              </>
            )}
          </span>
          {prof > 0 && (
            <span className="cv-lang-dots" aria-label={`${prof}/5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`cv-lang-dot ${n <= prof ? 'filled' : ''}`} />
              ))}
            </span>
          )}
        </div>
      )
    })}
  </>
)

const Summary = ({ d, top = '0.7em', interactive = false }: { d: ResumeData; top?: string; interactive?: boolean }) =>
  d.summary.trim() ? (
    <p className="txt" style={{ marginTop: top }}>
      <InlineFormatted text={d.summary} interactive={interactive} />
    </p>
  ) : null

function QrBadge({ url, caption }: { url: string; caption: string }) {
  const clean = url.trim()
  if (!clean) return null
  const fullUrl = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
  const matrix = generateQrMatrix(fullUrl)
  const n = matrix.length
  const margin = 2
  const viewSize = n + margin * 2
  const paths: string[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) paths.push(`M${c + margin},${r + margin}h1v1h-1z`)
    }
  }
  return (
    <div className="cv-qr-box">
      <svg viewBox={`0 0 ${viewSize} ${viewSize}`} shapeRendering="crispEdges" aria-label="Mã QR hồ sơ trực tuyến">
        <rect width={viewSize} height={viewSize} fill="#ffffff" />
        <path d={paths.join('')} fill="#0f172a" />
      </svg>
      <div className="cv-qr-caption">
        <strong style={{ display: 'block', color: '#0f172a' }}>{caption}</strong>
        <span>{clean.replace(/^https?:\/\/(www\.)?/i, '').slice(0, 32)}</span>
      </div>
    </div>
  )
}

function parseSkillEntry(raw: string): { category: string | null; items: string; list: string[] } {
  const idx = raw.indexOf(':')
  if (idx > 0) {
    const category = raw.slice(0, idx).trim()
    const items = raw.slice(idx + 1).trim()
    if (category && items) {
      const list = items
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      return { category, items, list }
    }
  }
  const cleanItem = raw.trim()
  return { category: null, items: cleanItem, list: cleanItem ? [cleanItem] : [] }
}

const SkillsFormatted = ({
  skills,
  skillStyle = 'template',
  fallback,
  top = '0.7em',
}: {
  skills: string[]
  skillStyle?: CvSkillStyle
  fallback: ReactNode
  top?: string
}) => {
  const parsed = skills.map(parseSkillEntry)
  const hasGrouped = parsed.some((p) => p.category !== null)

  if (hasGrouped) {
    if (skillStyle === 'bullets') {
      return (
        <ul className="bul sk-groups-bul" style={{ marginTop: '0.4em' }}>
          {parsed.map((p, i) => (
            <li key={i}>
              {p.category ? (
                <>
                  <strong className="sk-cat">{p.category}:</strong> {p.items}
                </>
              ) : (
                p.items
              )}
            </li>
          ))}
        </ul>
      )
    }
    if (skillStyle === 'grid') {
      return (
        <ul className="sk-grid sk-groups-grid" style={{ marginTop: top }}>
          {parsed.map((p, i) => (
            <li key={i}>
              {p.category ? (
                <>
                  <strong className="sk-cat">{p.category}:</strong> {p.items}
                </>
              ) : (
                p.items
              )}
            </li>
          ))}
        </ul>
      )
    }
    if (skillStyle === 'pills') {
      return (
        <div className="sk-groups-pills" style={{ marginTop: '0.45em' }}>
          {parsed.map((p, i) =>
            p.category ? (
              <div key={i} className="sk-group-pill-row">
                <strong className="sk-cat">{p.category}:</strong>{' '}
                <span className="sk-pills">
                  {p.list.map((item, j) => (
                    <span key={j} className="tag">
                      {item}
                    </span>
                  ))}
                </span>
              </div>
            ) : (
              <span key={i} className="tag">
                {p.items}
              </span>
            ),
          )}
        </div>
      )
    }
    // 'template' & 'comma' with grouped skills
    return (
      <div className="sk-groups" style={{ marginTop: top }}>
        {parsed.map((p, i) => (
          <p key={i} className="sk-group-row txt">
            {p.category ? (
              <>
                <strong className="sk-cat">{p.category}:</strong> {p.items}
              </>
            ) : (
              p.items
            )}
          </p>
        ))}
      </div>
    )
  }

  if (skillStyle === 'template') return <>{fallback}</>
  if (skillStyle === 'comma') {
    return (
      <p className="txt" style={{ marginTop: top }}>
        {skills.join(', ')}
      </p>
    )
  }
  if (skillStyle === 'bullets') {
    return (
      <div style={{ marginTop: '0.4em' }}>
        <Bullets items={skills} />
      </div>
    )
  }
  if (skillStyle === 'grid') {
    return (
      <ul className="sk-grid" style={{ marginTop: top }}>
        {skills.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    )
  }
  // 'pills'
  return (
    <p className="sk-pills" style={{ marginTop: '0.45em' }}>
      {skills.map((s, i) => (
        <span key={i} className="tag">
          {s}
        </span>
      ))}
    </p>
  )
}

function Sheet({
  layout,
  d,
  settings,
  interactive = false,
  activeSection,
  onSelectSection,
}: {
  layout: CvLayout
  d: ResumeData
  settings?: PaperSettings
  interactive?: boolean
  activeSection?: string
  onSelectSection?: (sectionKey: string) => void
}): ReactNode {
  const hiddenSet = new Set(settings?.hiddenSections ?? [])
  const showSec = (key: string) => !hiddenSet.has(key)

  const hasSummary = showSec('summary') && d.summary.trim().length > 0
  const hasSkills = showSec('skills') && d.skills.length > 0
  const hasJobs = showSec('jobs') && d.jobs.length > 0
  const hasEdu = showSec('education') && d.education.length > 0
  const hasLang = showSec('languages') && d.languages.length > 0
  const hasExtra = showSec('extra') && d.extra.items.length > 0
  const hasPhoto = Boolean(d.photo) && !hiddenSet.has('photo')

  const customMap = new Map<string, CustomSection>()
  for (const cs of d.customSections ?? []) {
    if (showSec(cs.id) && cs.entries.length > 0) customMap.set(cs.id, cs)
  }

  const allCustomIds = (d.customSections ?? []).map((cs) => cs.id)
  const order = normalizeSectionOrder(settings?.sectionOrder, allCustomIds)
  const nameHint = settings?.documentLanguage === 'en' ? 'Full Name' : 'Họ và tên'
  const showIcons = Boolean(settings?.showContactIcons)
  const showSectionIcons = Boolean(settings?.showSectionIcons)
  const headerLayout = settings?.headerLayout ?? 'template'
  const inlineContactSep = headerLayout !== 'split'
  const skillStyle = settings?.skillStyle ?? 'template'
  const title = (key: string) => resolveSectionTitle(key, layout, settings, d.extra.title, customMap.get(key)?.title)
  const contacts = contactItems(d)
  const qrBlock =
    settings?.showQrCode && settings?.qrUrl?.trim() ? (
      <QrBadge
        url={settings.qrUrl}
        caption={settings.documentLanguage === 'en' ? 'Scan for live CV' : 'Quét xem CV trực tuyến'}
      />
    ) : null

  const SecBlock = ({
    title: headingText,
    show,
    sectionKey,
    iconKey,
    customKind,
    children,
  }: {
    title: string
    show: boolean
    sectionKey?: string
    iconKey?: string
    customKind?: CustomSectionKind
    children: ReactNode
  }) => (
    <Block
      title={headingText}
      show={show}
      sectionKey={sectionKey}
      iconKey={iconKey}
      customKind={customKind}
      showIcon={showSectionIcons}
      activeSection={activeSection}
      onSelect={onSelectSection}
    >
      {children}
    </Block>
  )

  const renderStandardSection = (sec: string, spacingTop = '0.7em'): ReactNode => {
    if (isCustomSectionKey(sec)) {
      const cs = customMap.get(sec)
      if (!cs) return null
      return (
        <SecBlock key={sec} sectionKey={sec} customKind={cs.kind} title={title(sec)} show>
          <CustomEntries cs={cs} interactive={interactive} />
        </SecBlock>
      )
    }
    switch (sec as CvSectionKey) {
      case 'summary':
        return (
          <SecBlock key={sec} sectionKey={sec} title={title('summary')} show={hasSummary}>
            <Summary d={d} top={spacingTop} interactive={interactive} />
          </SecBlock>
        )
      case 'jobs':
        return (
          <SecBlock key={sec} sectionKey={sec} title={title('jobs')} show={hasJobs}>
            <Jobs d={d} interactive={interactive} />
          </SecBlock>
        )
      case 'education':
        return (
          <SecBlock key={sec} sectionKey={sec} title={title('education')} show={hasEdu}>
            <Education d={d} />
          </SecBlock>
        )
      case 'extra':
        return (
          <SecBlock key={sec} sectionKey={sec} title={title('extra')} show={hasExtra}>
            <div style={{ marginTop: '0.4em' }}>
              <Bullets items={d.extra.items} interactive={interactive} />
            </div>
          </SecBlock>
        )
      case 'skills':
        return (
          <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
            <SkillsFormatted
              skills={d.skills}
              skillStyle={skillStyle}
              top={spacingTop}
              fallback={
                <p className="txt" style={{ marginTop: spacingTop }}>
                  {d.skills.join(', ')}
                </p>
              }
            />
          </SecBlock>
        )
      case 'languages':
        return (
          <SecBlock key={sec} sectionKey={sec} title={title('languages')} show={hasLang}>
            <Languages d={d} />
          </SecBlock>
        )
    }
  }

  const splitTwoColumns = (sideBuiltins: readonly string[]) => {
    const customSide = settings?.sideSections && settings.sideSections.length > 0 ? settings.sideSections : null
    const sideSet = new Set<string>(customSide ?? sideBuiltins)
    const sideOrder: string[] = []
    const mainOrder: string[] = []
    for (const key of order) {
      if (isCustomSectionKey(key)) {
        const cs = customMap.get(key)
        if (!cs) continue
        if (customSide ? sideSet.has(key) : cs.kind === 'interests') sideOrder.push(key)
        else mainOrder.push(key)
      } else if (sideSet.has(key)) {
        sideOrder.push(key)
      } else {
        mainOrder.push(key)
      }
    }
    return { mainOrder, sideOrder }
  }

  switch (layout) {
    case 'ke-ngang':
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className="head-main">
                <div className="h1">
                  <Ph text={nameHint} value={d.name} />
                </div>
                <p className="role">{d.role}</p>
              </div>
              <p className="contact">
                <Contact d={d} sep={inlineContactSep} interactive={interactive} showIcons={showIcons} />
              </p>
            </div>
          </ClickZone>
          {order.map((sec) => renderStandardSection(sec, '0.7em'))}
          {qrBlock}
        </>
      )

    case 'cot-xanh': {
      const { mainOrder, sideOrder } = splitTwoColumns(['skills', 'languages'])
      const customSummaryTitle = Boolean(settings?.sectionTitles?.summary?.trim())
      return (
        <>
          <div className="side-col">
            <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
              <div className="mono">{hasPhoto ? <img src={d.photo} alt="" className="photo" /> : <span>{d.initials}</span>}</div>
              <div className="h1">
                <Ph text={nameHint} value={d.name} />
              </div>
              <SecBlock title={title('contact')} iconKey="contact" show={contacts.length > 0}>
                {contacts.map((c) => (
                  <p key={c.key}>
                    <ContactNode item={c} interactive={interactive} showIcons={showIcons} />
                  </p>
                ))}
              </SecBlock>
            </ClickZone>
            {sideOrder.map((sec) => {
              if (sec === 'skills') {
                return (
                  <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
                    <SkillsFormatted
                      skills={d.skills}
                      skillStyle={skillStyle}
                      fallback={
                        <ul>
                          {d.skills.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      }
                    />
                  </SecBlock>
                )
              }
              if (sec === 'languages') {
                return (
                  <SecBlock key={sec} sectionKey={sec} title={title('languages')} show={hasLang}>
                    <Languages d={d} firstTop="0.4em" />
                  </SecBlock>
                )
              }
              return renderStandardSection(sec, '0.5em')
            })}
            {qrBlock}
          </div>
          <div className="main-col">
            {d.role.trim() && (
              <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
                <div className="h2 role-head">{d.role}</div>
              </ClickZone>
            )}
            {mainOrder.map((sec, idx) => {
              if (sec === 'summary') {
                if (idx === 0 && !customSummaryTitle && d.role.trim()) {
                  return (
                    <Fragment key={sec}>
                      {hasSummary ? (
                        <ClickZone sectionKey="summary" activeSection={activeSection} onSelect={onSelectSection}>
                          <Summary d={d} />
                        </ClickZone>
                      ) : null}
                    </Fragment>
                  )
                }
                return renderStandardSection('summary', '0.7em')
              }
              return renderStandardSection(sec, '0.7em')
            })}
          </div>
        </>
      )
    }

    case 'bia-kraft': {
      const { mainOrder, sideOrder } = splitTwoColumns(['skills', 'education', 'languages'])
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="band">
              <div className="head-main">
                <div className="h1">
                  <Ph text={nameHint} value={d.name} />
                </div>
                <p className="role">{d.role}</p>
              </div>
              <p className="contact">
                <Contact d={d} sep={false} interactive={interactive} showIcons={showIcons} />
              </p>
            </div>
          </ClickZone>
          <div className="body">
            <div>{mainOrder.map((sec) => renderStandardSection(sec, '0.6em'))}</div>
            <div>
              {sideOrder.map((sec) => {
                if (sec === 'skills') {
                  return (
                    <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
                      <SkillsFormatted
                        skills={d.skills}
                        skillStyle={skillStyle}
                        fallback={
                          <>
                            {d.skills.map((s, i) => (
                              <span key={i} className="chip">
                                {s}
                              </span>
                            ))}
                          </>
                        }
                      />
                    </SecBlock>
                  )
                }
                if (sec === 'education') {
                  return (
                    <SecBlock key={sec} sectionKey={sec} title={title('education')} show={hasEdu}>
                      {d.education.map((e, i) => {
                        const schoolLine = [e.school.trim(), e.location?.trim(), e.gpa?.trim() ? `GPA: ${e.gpa.trim()}` : '']
                          .filter(Boolean)
                          .join(' · ')
                        return (
                          <div key={e.id ?? i} style={{ marginTop: '0.7em' }}>
                            <p className="job-title" style={{ fontSize: '1.2em' }}>
                              {e.degree}
                            </p>
                            {schoolLine && <p className="small muted">{schoolLine}</p>}
                            <p className="small muted">{e.period}</p>
                          </div>
                        )
                      })}
                    </SecBlock>
                  )
                }
                return renderStandardSection(sec, '0.6em')
              })}
              {qrBlock}
            </div>
          </div>
        </>
      )
    }

    case 'thu-gon': {
      const { mainOrder, sideOrder } = splitTwoColumns(['skills', 'education', 'languages'])
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className="head-main">
                <div className="h1">
                  <Ph text={nameHint} value={d.name} />
                </div>
                <p className="role">{d.role}</p>
              </div>
              <p className="contact">
                {contacts.map((c) => (
                  <span key={c.key}>
                    <ContactNode item={c} interactive={interactive} showIcons={showIcons} />
                    <br />
                  </span>
                ))}
              </p>
            </div>
          </ClickZone>
          <div className="body">
            <div>{mainOrder.map((sec) => renderStandardSection(sec, '0.5em'))}</div>
            <div className="side">
              {sideOrder.map((sec) => {
                if (sec === 'skills') {
                  return (
                    <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
                      <SkillsFormatted
                        skills={d.skills}
                        skillStyle={skillStyle}
                        fallback={
                          <p>
                            {d.skills.map((s, i) => (
                              <span key={i} className="tag">
                                {s}
                              </span>
                            ))}
                          </p>
                        }
                      />
                    </SecBlock>
                  )
                }
                return renderStandardSection(sec, '0.5em')
              })}
              {qrBlock}
            </div>
          </div>
        </>
      )
    }

    case 'anh-tron':
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className="avatar">{hasPhoto ? <img src={d.photo} alt="" className="photo" /> : <span>{d.initials}</span>}</div>
              <div className="head-info">
                <div className="head-main">
                  <div className="h1">
                    <Ph text={nameHint} value={d.name} />
                  </div>
                  <p className="role">{d.role}</p>
                </div>
                <p className="contact stack">
                  <Contact d={d} sep={false} interactive={interactive} showIcons={showIcons} />
                </p>
              </div>
            </div>
          </ClickZone>
          {order.map((sec) => {
            if (isCustomSectionKey(sec)) {
              const cs = customMap.get(sec)
              if (!cs) return null
              return (
                <ClickZone key={sec} sectionKey={sec} activeSection={activeSection} onSelect={onSelectSection}>
                  <div className="section">
                    <HeadingTitle text={title(sec)} iconKey={sec} customKind={cs.kind} showIcon={showSectionIcons} />
                    <div>
                      <CustomEntries cs={cs} interactive={interactive} />
                    </div>
                  </div>
                </ClickZone>
              )
            }
            if (sec === 'summary' && hasSummary) {
              return (
                <ClickZone key={sec} sectionKey={sec} activeSection={activeSection} onSelect={onSelectSection}>
                  <div className="section">
                    <HeadingTitle text={title('summary')} iconKey="summary" showIcon={showSectionIcons} />
                    <Summary d={d} top="0" interactive={interactive} />
                  </div>
                </ClickZone>
              )
            }
            if (sec === 'jobs' && hasJobs) {
              return (
                <ClickZone key={sec} sectionKey={sec} activeSection={activeSection} onSelect={onSelectSection}>
                  <div className="section">
                    <HeadingTitle text={title('jobs')} iconKey="jobs" showIcon={showSectionIcons} />
                    <div>
                      <Jobs d={d} interactive={interactive} />
                    </div>
                  </div>
                </ClickZone>
              )
            }
            if (sec === 'education' && hasEdu) {
              return (
                <ClickZone key={sec} sectionKey={sec} activeSection={activeSection} onSelect={onSelectSection}>
                  <div className="section">
                    <HeadingTitle text={title('education')} iconKey="education" showIcon={showSectionIcons} />
                    <div>
                      <Education d={d} />
                    </div>
                  </div>
                </ClickZone>
              )
            }
            if (sec === 'extra' && hasExtra) {
              return (
                <ClickZone key={sec} sectionKey={sec} activeSection={activeSection} onSelect={onSelectSection}>
                  <div className="section">
                    <HeadingTitle text={title('extra')} iconKey="extra" showIcon={showSectionIcons} />
                    <Bullets items={d.extra.items} interactive={interactive} />
                  </div>
                </ClickZone>
              )
            }
            if (sec === 'skills' && hasSkills) {
              return (
                <ClickZone key={sec} sectionKey={sec} activeSection={activeSection} onSelect={onSelectSection}>
                  <div className="section">
                    <HeadingTitle text={title('skills')} iconKey="skills" showIcon={showSectionIcons} />
                    <div>
                      <SkillsFormatted
                        skills={d.skills}
                        skillStyle={skillStyle}
                        top="0"
                        fallback={<p className="txt">{d.skills.join(', ')}</p>}
                      />
                    </div>
                  </div>
                </ClickZone>
              )
            }
            if (sec === 'languages' && hasLang) {
              return (
                <ClickZone key={sec} sectionKey={sec} activeSection={activeSection} onSelect={onSelectSection}>
                  <div className="section">
                    <HeadingTitle text={title('languages')} iconKey="languages" showIcon={showSectionIcons} />
                    <div>
                      <Languages d={d} firstTop="0" />
                    </div>
                  </div>
                </ClickZone>
              )
            }
            return null
          })}
          {qrBlock}
        </>
      )

    case 'moc-thoi-gian':
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className="head-main">
                <div className="h1">
                  <Ph text={nameHint} value={d.name} />
                </div>
                <p className="role">{d.role}</p>
              </div>
              <p className="contact">
                <Contact d={d} sep={inlineContactSep} interactive={interactive} showIcons={showIcons} />
              </p>
            </div>
          </ClickZone>
          {order.map((sec) => {
            if (sec === 'jobs') {
              return (
                <SecBlock key={sec} sectionKey={sec} title={title('jobs')} show={hasJobs}>
                  <div className="line">
                    {d.jobs.map((j, i) => {
                      const orgLine = [j.org.trim(), j.location?.trim()].filter(Boolean).join(' · ')
                      return (
                        <div key={j.id ?? i} className="entry">
                          <p className="period">{j.period}</p>
                          <p className="job-title">{j.title}</p>
                          {orgLine && <p className="job-org">{orgLine}</p>}
                          <Bullets items={j.bullets} interactive={interactive} />
                        </div>
                      )
                    })}
                  </div>
                </SecBlock>
              )
            }
            if (sec === 'education') {
              return (
                <SecBlock key={sec} sectionKey={sec} title={title('education')} show={hasEdu}>
                  <div className="line">
                    {d.education.map((e, i) => {
                      const schoolLine = [e.school.trim(), e.location?.trim(), e.gpa?.trim() ? `GPA: ${e.gpa.trim()}` : '']
                        .filter(Boolean)
                        .join(' · ')
                      return (
                        <div key={e.id ?? i} className="entry">
                          <p className="period">{e.period}</p>
                          <p className="job-title">{e.degree}</p>
                          {schoolLine && <p className="job-org">{schoolLine}</p>}
                        </div>
                      )
                    })}
                  </div>
                </SecBlock>
              )
            }
            if (isCustomSectionKey(sec)) {
              const cs = customMap.get(sec)
              if (!cs) return null
              if (cs.kind !== 'interests' && cs.kind !== 'references') {
                return (
                  <SecBlock key={sec} sectionKey={sec} customKind={cs.kind} title={title(sec)} show>
                    <div className="line">
                      {cs.entries.map((en) => {
                        const rawUrl = en.link?.trim() ?? ''
                        const href = rawUrl ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`) : undefined
                        return (
                          <div key={en.id} className="entry">
                            {en.period?.trim() && <p className="period">{en.period}</p>}
                            <p className="job-title">
                              {interactive && href ? (
                                <a href={href} target="_blank" rel="noopener noreferrer">
                                  {en.title} ↗
                                </a>
                              ) : (
                                en.title
                              )}
                            </p>
                            {en.subtitle?.trim() && <p className="job-org">{en.subtitle}</p>}
                            <Bullets items={en.bullets} interactive={interactive} />
                          </div>
                        )
                      })}
                    </div>
                  </SecBlock>
                )
              }
            }
            return renderStandardSection(sec, '0.6em')
          })}
          {qrBlock}
        </>
      )

    case 'toi-gian':
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className="head-main">
                <div className="h1">
                  <Ph text={nameHint} value={d.name} />
                </div>
                <p className="role">{d.role}</p>
              </div>
              <p className="contact">
                <Contact d={d} sep={inlineContactSep} interactive={interactive} showIcons={showIcons} />
              </p>
            </div>
          </ClickZone>
          {order.map((sec) => renderStandardSection(sec, '0.8em'))}
          {qrBlock}
        </>
      )

    case 'con-dau': {
      const { mainOrder, sideOrder } = splitTwoColumns(['education', 'skills', 'languages'])
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className={hasPhoto ? 'seal has-photo' : 'seal'}>
                {hasPhoto ? <img src={d.photo} alt="" className="photo" /> : <span>{d.initials}</span>}
              </div>
              <div className="head-info">
                <div className="head-main">
                  <div className="h1">
                    <Ph text={nameHint} value={d.name} />
                  </div>
                  <p className="role">{d.role}</p>
                </div>
                <p className="contact stack">
                  <Contact d={d} sep={false} interactive={interactive} showIcons={showIcons} />
                </p>
              </div>
            </div>
          </ClickZone>
          <div className="body">
            <div>{mainOrder.map((sec) => renderStandardSection(sec, '0.6em'))}</div>
            <div className="side">
              {sideOrder.map((sec) => {
                if (sec === 'skills') {
                  return (
                    <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
                      <SkillsFormatted
                        skills={d.skills}
                        skillStyle={skillStyle}
                        fallback={
                          <ul>
                            {d.skills.map((s, i) => (
                              <li key={i} className="small" style={{ marginTop: '0.5em' }}>
                                {s}
                              </li>
                            ))}
                          </ul>
                        }
                      />
                    </SecBlock>
                  )
                }
                return renderStandardSection(sec, '0.6em')
              })}
              {qrBlock}
            </div>
          </div>
        </>
      )
    }

    case 'harvard':
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className="head-main">
                <div className="h1">
                  <Ph text={nameHint} value={d.name} />
                </div>
                {d.role.trim() && <p className="role">{d.role}</p>}
              </div>
              <p className="contact">
                <Contact d={d} sep={inlineContactSep} interactive={interactive} showIcons={showIcons} />
              </p>
            </div>
          </ClickZone>
          {order.map((sec) => renderStandardSection(sec, '0.55em'))}
          {qrBlock}
        </>
      )

    case 'cong-nghe': {
      const { mainOrder, sideOrder } = splitTwoColumns(['skills', 'languages'])
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className={hasPhoto ? 'head has-photo' : 'head'}>
              <div className="head-identity">
                {hasPhoto && (
                  <div className="head-photo">
                    <img src={d.photo} alt="" className="photo" />
                  </div>
                )}
                <div className="head-main">
                  <div className="h1">
                    <Ph text={nameHint} value={d.name} />
                  </div>
                  {d.role.trim() && <p className="role">{d.role}</p>}
                </div>
              </div>
              <p className="contact">
                <Contact d={d} sep={false} interactive={interactive} showIcons={showIcons} />
              </p>
            </div>
          </ClickZone>
          <div className="body">
            <div>{mainOrder.map((sec) => renderStandardSection(sec, '0.6em'))}</div>
            <div className="side">
              {sideOrder.map((sec) => {
                if (sec === 'skills') {
                  return (
                    <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
                      <SkillsFormatted
                        skills={d.skills}
                        skillStyle={skillStyle}
                        fallback={
                          <p className="tech-pills">
                            {d.skills.map((s, i) => (
                              <span key={i} className="tag">
                                {s}
                              </span>
                            ))}
                          </p>
                        }
                      />
                    </SecBlock>
                  )
                }
                return renderStandardSection(sec, '0.6em')
              })}
              {qrBlock}
            </div>
          </div>
        </>
      )
    }

    case 'hien-dai': {
      const { mainOrder, sideOrder } = splitTwoColumns(['skills', 'education', 'languages'])
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className={hasPhoto ? 'head has-photo' : 'head'}>
              <div className="head-identity">
                {hasPhoto && (
                  <div className="head-photo">
                    <img src={d.photo} alt="" className="photo" />
                  </div>
                )}
                <div className="head-main">
                  <div className="h1">
                    <Ph text={nameHint} value={d.name} />
                  </div>
                  {d.role.trim() && <p className="role">{d.role}</p>}
                </div>
              </div>
              <p className="contact">
                <Contact d={d} sep={false} interactive={interactive} showIcons={showIcons} />
              </p>
            </div>
          </ClickZone>
          <div className="body">
            <div>{mainOrder.map((sec) => renderStandardSection(sec, '0.6em'))}</div>
            <div className="side">
              {sideOrder.map((sec) => {
                if (sec === 'skills') {
                  return (
                    <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
                      <SkillsFormatted
                        skills={d.skills}
                        skillStyle={skillStyle}
                        fallback={
                          <p className="sk-pills">
                            {d.skills.map((s, i) => (
                              <span key={i} className="tag">
                                {s}
                              </span>
                            ))}
                          </p>
                        }
                      />
                    </SecBlock>
                  )
                }
                return renderStandardSection(sec, '0.6em')
              })}
              {qrBlock}
            </div>
          </div>
        </>
      )
    }

    case 'sang-tao': {
      const { mainOrder, sideOrder } = splitTwoColumns(['skills', 'languages'])
      return (
        <>
          <ClickZone sectionKey="personal" activeSection={activeSection} onSelect={onSelectSection}>
            <div className="head">
              <div className="avatar">{hasPhoto ? <img src={d.photo} alt="" className="photo" /> : <span>{d.initials}</span>}</div>
              <div className="head-info">
                <div className="head-main">
                  <div className="h1">
                    <Ph text={nameHint} value={d.name} />
                  </div>
                  {d.role.trim() && <p className="role">{d.role}</p>}
                </div>
                <p className="contact">
                  <Contact d={d} sep={false} interactive={interactive} showIcons={showIcons} />
                </p>
              </div>
            </div>
          </ClickZone>
          <div className="body">
            <div className="side">
              {sideOrder.map((sec) => {
                if (sec === 'skills') {
                  return (
                    <SecBlock key={sec} sectionKey={sec} title={title('skills')} show={hasSkills}>
                      <SkillsFormatted
                        skills={d.skills}
                        skillStyle={skillStyle}
                        fallback={
                          <p className="sk-pills">
                            {d.skills.map((s, i) => (
                              <span key={i} className="tag">
                                {s}
                              </span>
                            ))}
                          </p>
                        }
                      />
                    </SecBlock>
                  )
                }
                return renderStandardSection(sec, '0.55em')
              })}
              {qrBlock}
            </div>
            <div>{mainOrder.map((sec) => renderStandardSection(sec, '0.65em'))}</div>
          </div>
        </>
      )
    }
  }
}

const FONT_DIVISOR = { compact: 72, normal: 66, relaxed: 60 } as const
const LINE_HEIGHT = { compact: 1.25, normal: 1.38, relaxed: 1.55 } as const
const MARGIN_SCALE = { compact: 0.74, normal: 1, spacious: 1.24 } as const
const SECTION_SCALE = { compact: 0.72, normal: 1, spacious: 1.3 } as const
const SIDE_SCALE = { compact: 0.86, balanced: 1, wide: 1.15 } as const

const FONT_STACK: Record<CvFontFamilyV2, string> = {
  sans: 'var(--font-sans)',
  serif: 'var(--font-serif)',
  jakarta: 'var(--font-jakarta)',
  lora: 'var(--font-lora)',
}

// Width of the dark sidebar in the "cot-xanh" template, in em (see .t-cot-xanh in resume-paper.css).
const SIDEBAR_EM = 22.275

export function printBackdrop(layout: CvLayout, settings?: PaperSettings): string | undefined {
  if (layout !== 'cot-xanh') return undefined
  const sideEm = SIDEBAR_EM * SIDE_SCALE[settings?.columnSplit ?? 'balanced']
  const share = (sideEm / FONT_DIVISOR[settings?.fontSize ?? 'normal']) * 100
  return `linear-gradient(to right, #00060c ${share.toFixed(3)}%, #ffffff ${share.toFixed(3)}%)`
}

export function ResumePaper({
  layout,
  data,
  settings,
  label,
  className = '',
  flow = false,
  activeSection,
  onSelectSection,
}: {
  layout: CvLayout
  data?: ResumeData
  settings?: PaperSettings
  label?: string
  className?: string
  // flow: the sheet grows with its content (editor preview, print). Otherwise it is a clipped single-page thumbnail.
  flow?: boolean
  activeSection?: string
  onSelectSection?: (sectionKey: string) => void
}) {
  const d = clean(data ?? LAYOUT_PERSONA[layout])
  const ratio = PAPER_RATIO[settings?.paperSize === 'letter' ? 'letter' : 'a4']
  const resolvedFont: CvFontFamilyV2 = settings?.fontFamily ?? (layout === 'ke-ngang' || layout === 'harvard' ? 'serif' : 'sans')

  const style: CSSProperties & Record<string, string | number> = {
    fontFamily: FONT_STACK[resolvedFont] ?? FONT_STACK.sans,
    fontSize: `calc(100cqw / ${FONT_DIVISOR[settings?.fontSize ?? 'normal']})`,
    lineHeight: LINE_HEIGHT[settings?.spacing ?? 'normal'],
    '--page-ratio': ratio,
    '--cv-pad-scale': MARGIN_SCALE[settings?.pageMargin ?? 'normal'],
    '--cv-sec-scale': SECTION_SCALE[settings?.sectionSpacing ?? 'normal'],
    '--cv-side-scale': SIDE_SCALE[settings?.columnSplit ?? 'balanced'],
    ...(settings?.accentColor ? { '--cv-accent': settings.accentColor } : {}),
    ...(flow ? {} : { aspectRatio: `1 / ${ratio}` }),
  }

  return (
    <div
      className={`cv-frame ${className}`}
      data-flow={flow || undefined}
      role={flow ? 'region' : 'img'}
      aria-label={label ?? `Mẫu CV ${layout}`}
    >
      <div
        className={`cv t-${layout}`}
        data-heading-style={settings?.headingStyle && settings.headingStyle !== 'default' ? settings.headingStyle : undefined}
        data-heading-case={settings?.headingCase === 'uppercase' ? 'uppercase' : undefined}
        data-header-layout={settings?.headerLayout && settings.headerLayout !== 'template' ? settings.headerLayout : undefined}
        data-photo-shape={settings?.photoShape ?? 'circle'}
        style={style}
      >
        <Sheet
          layout={layout}
          d={d}
          settings={settings}
          interactive={flow}
          activeSection={flow ? activeSection : undefined}
          onSelectSection={flow ? onSelectSection : undefined}
        />
      </div>
    </div>
  )
}
