import type { ResumeData } from '@/components/resume/resume-data'
import { computeInitials } from '@/types/resume'

export type ParseResult = {
  data: ResumeData
  confidence: { name: boolean; email: boolean; phone: boolean; jobs: boolean; education: boolean; skills: boolean }
  warnings: string[]
}

/*
  Reads plain text pasted or extracted from an old CV (.pdf, .docx, .txt) into the editor's fields, on the user's machine.
  It is deliberately conservative: anything it cannot find is left EMPTY (never invented), and the import screen
  shows which fields it is unsure about so the user checks them before the CV is created.
*/

type SectionType = 'summary' | 'jobs' | 'education' | 'skills' | 'languages' | 'extra'

const HEADINGS: { type: SectionType; match: RegExp }[] = [
  {
    type: 'summary',
    match:
      /^(giới thiệu|giới thiệu bản thân|mục tiêu nghề nghiệp|mục tiêu|tóm tắt|tóm tắt chuyên môn|về tôi|about me|summary|professional summary|executive summary|profile|objective|career objective)$/i,
  },
  {
    type: 'jobs',
    match:
      /^(kinh nghiệm làm việc|kinh nghiệm|kinh nghiệm công tác|hoạt động và kinh nghiệm|kinh nghiệm và hoạt động|kinh nghiệm & hoạt động|lịch sử làm việc|quá trình làm việc|experience|work experience|professional experience|employment history|work history|career history)$/i,
  },
  {
    type: 'education',
    match: /^(học vấn|trình độ học vấn|học vấn & bằng cấp|bằng cấp|quá trình học tập|đào tạo|education|academic background)$/i,
  },
  {
    type: 'skills',
    match: /^(kỹ năng|kỹ năng chuyên môn|kỹ năng & công cụ|công nghệ|chuyên môn|kỹ năng mềm|skills|technical skills|core competencies)$/i,
  },
  { type: 'languages', match: /^(ngoại ngữ|ngôn ngữ|trình độ ngoại ngữ|languages|language skills)$/i },
  {
    type: 'extra',
    match:
      /^(chứng chỉ|chứng chỉ và dự án|chứng chỉ & dự án|chứng chỉ \/ dự án|dự án|dự án cá nhân|hoạt động|hoạt động khác|giải thưởng|giải thưởng & hoạt động|thành tích|certifications|projects|projects & certifications|projects and certifications|awards|achievements)$/i,
  },
]

const EN_MONTH = String.raw`(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s*`
const MONTH_YEAR = String.raw`(?:(?:th[áa]ng\s*)?(?:0?[1-9]|1[0-2])\s*[\/.-]\s*|${EN_MONTH})?(?:19|20)\d{2}`
const RANGE = new RegExp(String.raw`${MONTH_YEAR}\s*(?:[-–—]|đến|to)\s*(?:${MONTH_YEAR}|nay|hiện tại|hiện nay|present|current|now)`, 'iu')
const SINGLE_YEAR = /\b(?:19|20)\d{2}\b/
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/
const VN_OR_INTL_PHONE = /(?:\+84|0)(?:[\s.-]?\d){8,10}|\+\d{1,3}(?:[\s.-]?\d){7,12}/
const LINK =
  /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/|github\.com\/|behance\.net\/|dribbble\.com\/|gitlab\.com\/)[^\s,;]+|https?:\/\/[^\s,;]+/i
const BULLET = /^\s*[•\-*·▪●‣–]\s+/
const PLACES =
  /(hà nội|ha noi|hanoi|hồ chí minh|ho chi minh|hcm|sài gòn|đà nẵng|da nang|hải phòng|cần thơ|bình dương|đồng nai|huế|nha trang|quận|huyện|thành phố|tỉnh|việt nam|vietnam|viet nam|remote|singapore)/i
const SCHOOL = /(đại học|trường|học viện|cao đẳng|university|college|institute|academy|polytechnic|thpt|trung cấp)/i

const clean = (s: string) =>
  s
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
const headingKey = (line: string) =>
  clean(line)
    .replace(/[:：\-–_*#]+$/g, '')
    .replace(/^[#*\-–\s]+/, '')
    .trim()
const stripBullet = (line: string) => line.replace(BULLET, '').trim()
const looksLikeHeading = (line: string) => line.length <= 48 && HEADINGS.some((h) => h.match.test(headingKey(line)))

// "Frontend Developer - Sao Mai" / "Kế toán | Công ty X" / "Kế toán tại Công ty X": [title, organisation].
function splitTitleOrg(text: string): [string, string] {
  const parts = text
    .split(/\s+[-–—|]\s+|\s+tại\s+|\s+at\s+|,\s+(?=[A-ZĐ])/u)
    .map((p) => p.trim())
    .filter(Boolean)
  return [parts[0] ?? '', parts.slice(1).join(' - ')]
}

type Job = ResumeData['jobs'][number]
type Edu = ResumeData['education'][number]

const CONTACT_HEADING = /^(liên hệ|thông tin liên hệ|contact|contact info|contact information)$/i

function inferLinkLabel(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('linkedin.com')) return 'LinkedIn'
  if (lower.includes('github.com')) return 'GitHub'
  if (lower.includes('behance.net')) return 'Behance'
  if (lower.includes('dribbble.com')) return 'Dribbble'
  if (lower.includes('gitlab.com')) return 'GitLab'
  return 'Website'
}

function extractProfileLinks(text: string): { link: string; links: NonNullable<ResumeData['links']> } {
  const stripped = text.replace(new RegExp(EMAIL.source, 'g'), ' ')
  const matches = stripped.match(new RegExp(LINK.source, 'gi')) ?? []
  const seen = new Set<string>()
  const unique: string[] = []
  for (const raw of matches) {
    const cleaned = raw.replace(/[.,;)]+$/, '').trim()
    if (!cleaned) continue
    const normalized = cleaned
      .replace(/^https?:\/\/(www\.)?/i, '')
      .replace(/\/+$/, '')
      .toLowerCase()
    if (seen.has(normalized)) continue
    seen.add(normalized)
    unique.push(cleaned)
  }
  const [primary = '', ...extra] = unique
  return {
    link: primary,
    links: extra.slice(0, 4).map((url, idx) => ({
      id: `lnk_imp_${idx + 1}`,
      label: inferLinkLabel(url),
      url,
    })),
  }
}

function parseJobs(lines: string[]): Job[] {
  const jobs: Job[] = []
  let pending: string[] = []
  let current: Job | null = null

  const flush = () => {
    if (current) jobs.push(current)
    current = null
  }

  for (const raw of lines) {
    const line = clean(raw)
    if (!line) continue
    const range = line.match(RANGE)
    const isBullet = BULLET.test(line)

    if (range && !isBullet && line.length <= 115) {
      flush()
      const remainder = line
        .replace(range[0], '')
        .replace(/[()\[\]|,–—-]+\s*$/g, '')
        .replace(/^[()\[\]|,–—-]+\s*/g, '')
        .trim()
      const headerLines = [...pending, ...(remainder ? [remainder] : [])]
      pending = []
      let [title, org] = splitTitleOrg(headerLines[0] ?? '')
      if (!org && headerLines[1]) org = headerLines[1]
      current = { title, org, period: range[0].replace(/\s+/g, ' ').trim(), bullets: [] }
    } else if (isBullet || current) {
      const job = current as Job | null
      // "Title  2015 – 2016" followed by a short plain line: the company sits on the next line.
      const looksLikeOrg = !!job && !job.org && job.bullets.length === 0 && !isBullet && line.length <= 65 && !/[.;:!?]$/.test(line)
      // Timeline layouts put the dates first: "2015 – 2016" / title / company.
      if (looksLikeOrg && !job.title) [job.title, job.org] = splitTitleOrg(line)
      else if (looksLikeOrg) job.org = line
      else if (job) job.bullets.push(stripBullet(line))
      else pending.push(stripBullet(line))
    } else {
      pending.push(line)
      if (pending.length > 2) pending.shift()
    }
  }
  flush()

  // No dates anywhere: keep what was written as one job to review rather than losing or guessing it.
  if (jobs.length === 0 && pending.length > 0) {
    const [title, org] = splitTitleOrg(pending[0])
    jobs.push({ title, org, period: '', bullets: pending.slice(1) })
  }
  return jobs
}

function parseEducation(lines: string[]): Edu[] {
  const items: Edu[] = []
  let pending: string[] = []

  const push = (texts: string[], period: string) => {
    const degreeFirst = texts.length > 1 && SCHOOL.test(texts[1]) && !SCHOOL.test(texts[0])
    const schoolIdx = texts.findIndex((t) => SCHOOL.test(t))
    const school = schoolIdx >= 0 ? texts[schoolIdx] : (texts[1] ?? '')
    const degree = degreeFirst ? texts[0] : (texts.find((_, i) => i !== schoolIdx) ?? (schoolIdx >= 0 ? '' : (texts[0] ?? '')))
    if (school || degree) items.push({ school, degree, period })
  }

  for (const raw of lines) {
    const line = stripBullet(clean(raw))
    if (!line) continue
    const range = line.match(RANGE) ?? line.match(SINGLE_YEAR)
    if (range) {
      const remainder = line
        .replace(range[0], '')
        .replace(/[()\[\]|,–—-]+\s*$/g, '')
        .replace(/^[()\[\]|,–—-]+\s*/g, '')
        .trim()
      const texts = [...pending, ...(remainder ? remainder.split(/\s+[-–—|]\s+/) : [])]
      push(texts.map((t) => t.trim()).filter(Boolean), range[0])
      pending = []
    } else {
      pending.push(line)
    }
  }
  if (pending.length)
    push(
      pending
        .flatMap((p) => p.split(/\s+[-–—|]\s+/))
        .map((t) => t.trim())
        .filter(Boolean),
      '',
    )

  // "Degree  2010 – 2014" with the school on the next line (or the reverse) arrives as two half-empty items: join them.
  const joined: Edu[] = []
  for (const item of items) {
    const prev = joined[joined.length - 1]
    const completesPrev =
      prev &&
      prev.period &&
      !item.period &&
      ((!prev.school && item.school && !item.degree) || (!prev.degree && item.degree && !item.school))
    if (completesPrev) {
      prev.school = prev.school || item.school
      prev.degree = prev.degree || item.degree
    } else joined.push({ ...item })
  }
  return joined
}

export function parseRawCvText(input: string): ParseResult {
  const lines = input.split(/\r?\n/).map(clean).filter(Boolean)
  const text = lines.join('\n')
  const warnings: string[] = []

  const email = text.match(EMAIL)?.[0] ?? ''
  const phone = text.match(VN_OR_INTL_PHONE)?.[0].trim() ?? ''
  // Remove emails first, otherwise their domains ("gmail.com") would be mistaken for a website.
  const { link, links } = extractProfileLinks(text)

  const isContactLine = (l: string) =>
    !!l && (l.includes('@') || VN_OR_INTL_PHONE.test(l) || LINK.test(l) || (PHONE.test(l) && /^\+?\d/.test(l)))
  const head = lines.slice(0, 10)
  const location = head.find((l) => PLACES.test(l) && l.length <= 70 && !isContactLine(l) && !looksLikeHeading(l)) ?? ''

  let name = ''
  let role = ''
  for (const l of head) {
    if (isContactLine(l) || looksLikeHeading(l) || CONTACT_HEADING.test(l) || l === location) continue
    // Skip 1-3 character avatar monograms ("MA", "QH", "GB") at the top of photo/seal templates.
    if (l.length <= 3 && /^[A-ZĐÀ-Ỹ]{1,3}$/u.test(l)) continue
    const words = l.split(/\s+/)
    if (!name) {
      if (words.length >= 2 && words.length <= 6 && l.length <= 42 && !/\d/.test(l)) name = l
    } else if (!role && l.length <= 65 && !/\d/.test(l)) {
      role = l
      break
    }
  }

  const found: { index: number; type: SectionType }[] = []
  lines.forEach((line, index) => {
    if (line.length > 48) return
    const h = HEADINGS.find((x) => x.match.test(headingKey(line)))
    if (h) found.push({ index, type: h.type })
  })
  const content: Record<SectionType, string[]> = { summary: [], jobs: [], education: [], skills: [], languages: [], extra: [] }
  found.forEach((f, i) => {
    const end = i + 1 < found.length ? found[i + 1].index : lines.length
    content[f.type].push(...lines.slice(f.index + 1, end))
  })

  // In sidebar templates (like "cot-xanh"), the sidebar ends with Languages and the main column starts with Role + Summary
  // without a separate "Giới thiệu" heading right before "Kinh nghiệm". Separate any trailing prose from short language lines.
  const cleanLangLines: string[] = []
  const trailingFromLang: string[] = []
  let hitNonLanguageTail = false
  for (const rawLine of content.languages) {
    const stripped = stripBullet(rawLine)
    if (!stripped) continue
    if (!hitNonLanguageTail && stripped.length <= 55 && !/[.!?]$/.test(stripped)) {
      cleanLangLines.push(stripped)
    } else {
      hitNonLanguageTail = true
      trailingFromLang.push(stripped)
    }
  }
  if (trailingFromLang.length > 0 && content.summary.length === 0) {
    if (!role && trailingFromLang[0].length <= 60 && !/[.!?]$/.test(trailingFromLang[0])) {
      role = trailingFromLang[0]
      content.summary.push(...trailingFromLang.slice(1))
    } else {
      content.summary.push(...trailingFromLang)
    }
  }

  const summary = content.summary.map(stripBullet).slice(0, 5).join(' ')

  const skills = Array.from(
    new Set(
      content.skills
        .flatMap((l) =>
          stripBullet(l)
            .replace(/^[^:]{1,25}:\s*/, '')
            .split(/[,;|•·]/),
        )
        .map((s) => s.trim())
        .filter((s) => s && s.length <= 42),
    ),
  ).slice(0, 24)

  const languages = cleanLangLines.map((l) => {
    const [langName, ...rest] = l.split(/\s*[:–—]\s*|\s+-\s+/)
    return { name: langName.trim(), level: rest.join(' - ').trim() }
  })

  const jobs = parseJobs(content.jobs)
  const education = parseEducation(content.education)
  const extraItems = content.extra.map(stripBullet).filter(Boolean)

  const confidence = {
    name: name.split(/\s+/).length >= 2,
    email: !!email,
    phone: !!phone,
    jobs: jobs.length > 0 && jobs.every((j) => j.title && j.period),
    education: education.length > 0 && education.every((e) => e.school && e.degree),
    skills: skills.length > 0,
  }

  if (!name) warnings.push('Chưa nhận ra họ tên. Bạn hãy điền ở mục Cá nhân.')
  if (!email) warnings.push('Không thấy email trong văn bản.')
  if (!phone) warnings.push('Không thấy số điện thoại trong văn bản.')
  if (found.length === 0)
    warnings.push('Không thấy tiêu đề mục nào (như "Kinh nghiệm", "Học vấn"). Văn bản có thể cần được chia mục thủ công.')
  if (content.jobs.length > 0 && jobs.length === 0) warnings.push('Có mục kinh nghiệm nhưng chưa tách được từng công việc.')
  if (jobs.some((j) => !j.period)) warnings.push('Một số công việc chưa tách được thời gian, hãy kiểm tra lại.')
  if (content.education.length > 0 && education.some((e) => !e.school || !e.degree))
    warnings.push('Một số mục học vấn thiếu tên trường hoặc ngành, hãy kiểm tra lại.')

  const data: ResumeData = {
    name,
    initials: computeInitials(name),
    role,
    location,
    email,
    phone,
    link,
    links,
    summary,
    jobs,
    education,
    skills,
    languages,
    extra: { title: 'Chứng chỉ và dự án', items: extraItems },
  }
  return { data, confidence, warnings }
}
