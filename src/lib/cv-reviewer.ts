import type { ResumeData } from '@/components/resume/resume-data'
import { stripInlineFormatting } from '@/lib/inline-format'

export type CvSubScores = {
  ats: number
  impact: number
  clarity: number
  completeness: number
  formatting: number
}

export type CvLineFixTarget =
  | { kind: 'summary' }
  | { kind: 'job-bullet'; jobIndex: number; bulletIndex: number; jobTitle: string }
  | { kind: 'custom-bullet'; sectionId: string; entryIndex: number; bulletIndex: number; entryTitle: string }
  | { kind: 'skills-add'; suggestedSkills: string[] }
  | { kind: 'field'; field: 'name' | 'role' | 'email' | 'phone' | 'location' | 'link' }

export type CvLineFix = {
  id: string
  severity: 'critical' | 'improvement' | 'polish'
  category: 'ats' | 'impact' | 'clarity' | 'completeness'
  scoreGain: number
  sectionKey: string
  sectionLabel: string
  issueTitle: string
  explanation: string
  currentText: string
  suggestedText?: string
  target: CvLineFixTarget
}

export type CvReviewReport = {
  overallScore: number
  gradeLabel: string
  recruiterVerdict: string
  strengths: string[]
  subScores: CvSubScores
  fixes: CvLineFix[]
}

const ACTION_VERBS_VI = [
  'lập kế hoạch',
  'triển khai',
  'tối ưu',
  'xây dựng',
  'xây lại',
  'chủ động',
  'nâng cao',
  'phát triển',
  'giảm',
  'tăng',
  'chỉ đạo',
  'điều phối',
  'thiết kế',
  'cải tiến',
  'vận hành',
  'nghiên cứu',
  'phân tích',
  'huấn luyện',
  'quản lý',
  'viết',
  'dẫn dắt',
  'hướng dẫn',
  'dựng',
  'thêm',
  'sửa',
  'khoá sổ',
  'đối chiếu',
  'kiểm tra',
  'tổng hợp',
  'tự lập',
  'đàm phán',
  'chốt',
  'tự động hoá',
  'trực tiếp',
  'chuẩn hoá',
  'kiểm soát',
  'lập',
]

const ACTION_VERBS_EN = [
  'built',
  'developed',
  'led',
  'designed',
  'implemented',
  'optimized',
  'increased',
  'reduced',
  'launched',
  'managed',
  'engineered',
  'automated',
  'delivered',
  'created',
  'spearheaded',
  'improved',
  'streamlined',
  'analyzed',
  'coordinated',
  'mentored',
  'architected',
  'drove',
  'established',
  'executed',
  'scaled',
]

const WEAK_OPENING_VI =
  /^(chịu trách nhiệm về việc|chịu trách nhiệm về|chịu trách nhiệm|tham gia vào việc|tham gia vào|tham gia|được giao việc|được giao|làm các công việc|làm công việc|phụ trách chung|phụ trách việc|phụ trách|hỗ trợ các công việc|hỗ trợ việc|thực hiện các công việc|thực hiện việc)\s+/i

const WEAK_OPENING_EN =
  /^(responsible for|helped with|worked on|duties included|assisted in|participated in|tasked with)\s+/i

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HAS_REAL_METRIC = /\d|%|gấp đôi|gấp ba|gấp rưỡi|một nửa|double|triple|half/i
const HAS_TEMPLATE_METRIC = /\[(?:x|y|n|%|\d+)\]/i
const BAD_SPACE_BEFORE_PUNCT = /\s+([,.;!?])/g
const LEADING_BULLET_CHAR = /^[•\-*·]+\s*/
const UNFILLED_PLACEHOLDER = /\[[^\]]+\]/

const ROLE_SKILL_BUCKETS: { match: RegExp; vi: string[]; en: string[] }[] = [
  {
    match: /backend|devops|system|hệ thống|cloud|platform/i,
    vi: ['Node.js', 'PostgreSQL', 'REST API', 'Docker', 'Redis', 'CI/CD', 'Git', 'Linux'],
    en: ['Node.js', 'PostgreSQL', 'REST API', 'Docker', 'Redis', 'CI/CD', 'Git', 'Linux'],
  },
  {
    match: /frontend|web|lập trình|developer|fullstack|software|engineer/i,
    vi: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST API', 'Git', 'HTML/CSS', 'Kiểm thử tự động'],
    en: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST API', 'Git', 'HTML/CSS', 'Automated Testing'],
  },
  {
    match: /data|dữ liệu|business analyst|\bba\b|phân tích|analytics/i,
    vi: ['SQL', 'Power BI', 'Excel nâng cao', 'Python', 'Phân tích dữ liệu', 'Trực quan hoá số liệu', 'Viết tài liệu BRD/SRS'],
    en: ['SQL', 'Power BI', 'Advanced Excel', 'Python', 'Data Analysis', 'Data Visualization', 'BRD/SRS'],
  },
  {
    match: /ui|ux|thiết kế|design|product designer/i,
    vi: ['Figma', 'UI/UX', 'Design System', 'Wireframe & Prototype', 'Nghiên cứu người dùng', 'Responsive Design'],
    en: ['Figma', 'UI/UX', 'Design System', 'Wireframe & Prototype', 'User Research', 'Responsive Design'],
  },
  {
    match: /marketing|quảng cáo|content|seo|truyền thông|digital|growth/i,
    vi: ['Lập kế hoạch chiến dịch', 'Meta Ads', 'Google Ads', 'Google Analytics 4', 'SEO', 'Viết nội dung', 'Phân tích số liệu'],
    en: ['Campaign Planning', 'Meta Ads', 'Google Ads', 'Google Analytics 4', 'SEO', 'Content Strategy', 'Data Reporting'],
  },
  {
    match: /sale|kinh doanh|bán hàng|\bbd\b|account/i,
    vi: ['Tìm kiếm khách hàng', 'Đàm phán & Chốt đơn', 'Quản lý CRM', 'Chăm sóc khách hàng', 'Phát triển thị trường', 'Báo cáo doanh số'],
    en: ['Lead Generation', 'Negotiation & Closing', 'CRM Management', 'Account Management', 'Market Expansion', 'Sales Forecasting'],
  },
  {
    match: /kế toán|tài chính|kiểm toán|ngân hàng|accountant|finance/i,
    vi: ['MISA', 'Excel nâng cao', 'Báo cáo tài chính', 'Báo cáo thuế', 'Đối chiếu công nợ', 'Chuẩn mực VAS'],
    en: ['Accounting Software', 'Advanced Excel', 'Financial Reporting', 'Tax Compliance', 'Reconciliation', 'Financial Analysis'],
  },
  {
    match: /nhân sự|\bhr\b|tuyển dụng|c&b|hành chính/i,
    vi: ['Tuyển dụng ứng viên', 'Quản lý C&B & BHXH', 'Đánh giá KPI', 'Đào tạo hội nhập', 'Luật Lao động', 'Truyền thông nội bộ'],
    en: ['Talent Acquisition', 'Compensation & Benefits', 'KPI Evaluation', 'Onboarding', 'Labor Compliance', 'HR Operations'],
  },
]

export function getSuggestedSkillsForRole(role: string, lang: 'vi' | 'en' = 'vi'): string[] {
  const cleanRole = role.trim()
  for (const bucket of ROLE_SKILL_BUCKETS) {
    if (bucket.match.test(cleanRole)) {
      return lang === 'en' ? bucket.en : bucket.vi
    }
  }
  return lang === 'en'
    ? ['Communication', 'Problem Solving', 'Project Coordination', 'Data Analysis', 'Time Management', 'Teamwork']
    : ['Lập kế hoạch công việc', 'Phân tích số liệu', 'Giao tiếp & Phối hợp nhóm', 'Quản lý tiến độ', 'Giải quyết vấn đề', 'Excel / Google Sheets']
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function cleanPunctuation(text: string): string {
  return text
    .replace(LEADING_BULLET_CHAR, '')
    .replace(BAD_SPACE_BEFORE_PUNCT, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function lowerFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function endsWithMetric(text: string): boolean {
  return HAS_REAL_METRIC.test(text) || HAS_TEMPLATE_METRIC.test(text)
}

function buildRewrittenBullet(
  rawText: string,
  lang: 'vi' | 'en',
  options: { hasWeakOpening: boolean; missingMetric: boolean; tooLong: boolean; tooShort: boolean; hasBadPunct: boolean },
): string {
  let cleaned = cleanPunctuation(stripInlineFormatting(rawText))
  const withoutTrail = cleaned.replace(/[.!?]+$/, '').trim()

  if (options.hasWeakOpening) {
    const stripped = withoutTrail.replace(WEAK_OPENING_VI, '').replace(WEAK_OPENING_EN, '').trim()
    const core = lowerFirst(stripped || withoutTrail)
    if (lang === 'en') {
      const verb = 'Executed'
      const body = options.missingMetric ? `${verb} ${core}, driving a [x]% measurable improvement` : `${verb} ${core}`
      return `${body}.`
    }
    const verb = 'Trực tiếp triển khai'
    const body = options.missingMetric ? `${verb} ${core}, đạt [x]% mục tiêu đề ra` : `${verb} ${core}`
    return `${body}.`
  }

  if (options.tooLong) {
    const firstPart = withoutTrail.split(/[;—–]|\.\s+/)[0]?.trim() || withoutTrail.slice(0, 140).trim()
    const base = capitalizeFirst(firstPart.replace(/[,]+$/, ''))
    if (options.missingMetric) {
      return lang === 'en' ? `${base}, improving efficiency by [x]%.` : `${base}, nâng cao hiệu quả đạt [x]%.`
    }
    return `${base}.`
  }

  if (options.tooShort) {
    const core = lowerFirst(withoutTrail)
    if (lang === 'en') {
      return options.missingMetric
        ? `Delivered ${core}, contributing to a [x]% improvement in team output.`
        : `Delivered ${core} across key operational milestones.`
    }
    return options.missingMetric
      ? `Trực tiếp ${core}, giúp cải thiện [x]% hiệu quả thực thi của đội ngũ.`
      : `Trực tiếp ${core}, đảm bảo tiến độ và chất lượng đầu ra.`
  }

  if (options.missingMetric) {
    const base = capitalizeFirst(withoutTrail)
    return lang === 'en'
      ? `${base}, achieving a [x]% improvement in key results.`
      : `${base}, giúp tăng hiệu quả đạt [x]% so với mục tiêu.`
  }

  if (options.hasBadPunct) {
    return `${capitalizeFirst(withoutTrail)}.`
  }

  return cleaned
}

function buildSuggestedSummary(data: ResumeData, lang: 'vi' | 'en'): string {
  const role = data.role.trim() || (lang === 'en' ? 'Specialist' : 'Chuyên viên')
  const topSkills = data.skills.map((s) => s.trim()).filter(Boolean).slice(0, 3)
  const skillClause =
    topSkills.length > 0
      ? lang === 'en'
        ? ` with hands-on strengths in ${topSkills.join(', ')}`
        : ` với thế mạnh về ${topSkills.join(', ')}`
      : ''

  if (lang === 'en') {
    return `${role} with [x]+ years of experience${skillClause}. Focused on measurable execution, cross-functional collaboration, and delivering projects on schedule.`
  }
  return `${role} có [x] năm kinh nghiệm thực chiến${skillClause}. Quen làm việc bám sát số liệu, tối ưu quy trình và phối hợp liên phòng ban để hoàn thành mục tiêu đúng hạn.`
}

type BulletContext = {
  raw: string
  plain: string
  sectionKey: string
  sectionLabel: string
  target: CvLineFixTarget
}

export function evaluateCvReview(
  data: ResumeData,
  language: 'vi' | 'en' = 'vi',
  hiddenSections: readonly string[] = [],
): CvReviewReport {
  const hiddenSet = new Set(hiddenSections)
  const verbs = language === 'en' ? [...ACTION_VERBS_EN, ...ACTION_VERBS_VI] : [...ACTION_VERBS_VI, ...ACTION_VERBS_EN]
  const fixes: CvLineFix[] = []

  const name = (data.name ?? '').trim()
  const role = (data.role ?? '').trim()
  const email = (data.email ?? '').trim()
  const phone = (data.phone ?? '').trim()
  const phoneDigits = phone.replace(/\D/g, '')
  const location = (data.location ?? '').trim()
  const link = (data.link ?? '').trim()
  const hasLinks = Boolean(link || (data.links ?? []).some((l) => l.url.trim()))

  const summaryVisible = !hiddenSet.has('summary')
  const summaryRaw = data.summary ?? ''
  const summaryPlain = cleanPunctuation(stripInlineFormatting(summaryRaw))

  const visibleJobs = hiddenSet.has('jobs')
    ? []
    : (data.jobs ?? []).map((job, jobIndex) => ({ job, jobIndex })).filter(({ job }) => !job.hidden)

  const visibleEdu = hiddenSet.has('education') ? [] : (data.education ?? []).filter((e) => !e.hidden)
  const visibleSkills = hiddenSet.has('skills') ? [] : (data.skills ?? []).map((s) => s.trim()).filter(Boolean)
  const visibleLangs = hiddenSet.has('languages') ? [] : (data.languages ?? []).filter((l) => !l.hidden && l.name.trim())
  const visibleExtra = hiddenSet.has('extra') ? [] : (data.extra?.items ?? []).map((i) => i.trim()).filter(Boolean)

  const visibleCustom = (data.customSections ?? [])
    .filter((cs) => !cs.hidden && !hiddenSet.has(cs.id))
    .map((cs) => ({
      ...cs,
      entries: cs.entries.map((entry, entryIndex) => ({ entry, entryIndex })).filter(({ entry }) => !entry.hidden),
    }))

  const hasCustomHistory = visibleCustom.some((cs) =>
    cs.entries.some(({ entry }) => entry.title.trim() || entry.subtitle?.trim() || entry.bullets.some((b) => b.trim())),
  )

  // 1. Personal & Contact checks
  if (!name) {
    fixes.push({
      id: 'fix-missing-name',
      severity: 'critical',
      category: 'completeness',
      scoreGain: 8,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Họ và tên',
      issueTitle: 'Chưa điền họ và tên ứng viên',
      explanation: 'Nhà tuyển dụng và hệ thống ATS cần nhận diện chính xác họ tên ở đầu CV.',
      currentText: '',
      target: { kind: 'field', field: 'name' },
    })
  }

  if (!role) {
    fixes.push({
      id: 'fix-missing-role',
      severity: 'critical',
      category: 'ats',
      scoreGain: 8,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Vị trí ứng tuyển',
      issueTitle: 'Thiếu tiêu đề vị trí ứng tuyển',
      explanation: 'Tiêu đề vị trí giúp nhà tuyển dụng định vị hồ sơ trong 3 giây đầu và tăng điểm khớp từ khoá ATS.',
      currentText: '',
      target: { kind: 'field', field: 'role' },
    })
  }

  if (!email) {
    fixes.push({
      id: 'fix-missing-email',
      severity: 'critical',
      category: 'completeness',
      scoreGain: 7,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Email',
      issueTitle: 'Chưa có địa chỉ email liên hệ',
      explanation: 'Email chuyên nghiệp là kênh liên hệ chính để nhận thư mời phỏng vấn.',
      currentText: '',
      target: { kind: 'field', field: 'email' },
    })
  } else if (!EMAIL_RE.test(email)) {
    fixes.push({
      id: 'fix-invalid-email',
      severity: 'critical',
      category: 'ats',
      scoreGain: 5,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Email',
      issueTitle: 'Email chưa đúng định dạng chuẩn',
      explanation: 'Hệ thống ATS có thể bỏ sót thông tin liên hệ nếu email sai cú pháp.',
      currentText: email,
      suggestedText: email.replace(/\s+/g, ''),
      target: { kind: 'field', field: 'email' },
    })
  }

  if (!phoneDigits) {
    fixes.push({
      id: 'fix-missing-phone',
      severity: 'improvement',
      category: 'completeness',
      scoreGain: 5,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Số điện thoại',
      issueTitle: 'Chưa có số điện thoại liên hệ',
      explanation: 'Bổ sung số điện thoại để bộ phận nhân sự gọi trao đổi nhanh khi hồ sơ đạt yêu cầu.',
      currentText: '',
      target: { kind: 'field', field: 'phone' },
    })
  } else if (phoneDigits.length < 9 || phoneDigits.length > 13) {
    fixes.push({
      id: 'fix-invalid-phone',
      severity: 'polish',
      category: 'completeness',
      scoreGain: 3,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Số điện thoại',
      issueTitle: 'Số điện thoại có độ dài bất thường',
      explanation: 'Số điện thoại di động tại Việt Nam thường gồm 10 chữ số (ví dụ: 0901 234 567).',
      currentText: phone,
      target: { kind: 'field', field: 'phone' },
    })
  }

  if (!location) {
    fixes.push({
      id: 'fix-missing-location',
      severity: 'polish',
      category: 'completeness',
      scoreGain: 2,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Địa điểm',
      issueTitle: 'Nên ghi rõ thành phố hoặc khu vực làm việc',
      explanation: 'Nhà tuyển dụng thường lọc ứng viên theo khu vực (VD: Quận 1, TP. HCM hoặc Cầu Giấy, Hà Nội).',
      currentText: '',
      target: { kind: 'field', field: 'location' },
    })
  }

  if (!hasLinks) {
    fixes.push({
      id: 'fix-missing-link',
      severity: 'polish',
      category: 'completeness',
      scoreGain: 2,
      sectionKey: 'personal',
      sectionLabel: 'Thông tin cá nhân · Liên kết',
      issueTitle: 'Thiếu liên kết LinkedIn / GitHub / Portfolio',
      explanation: 'Một đường dẫn hồ sơ nghề nghiệp uy tín giúp tăng độ tin cậy trước khi mời phỏng vấn.',
      currentText: '',
      target: { kind: 'field', field: 'link' },
    })
  }

  // 2. Summary checks
  if (summaryVisible) {
    const trimmedSummary = summaryRaw.trim()
    const hasBadPunct = BAD_SPACE_BEFORE_PUNCT.test(trimmedSummary)
    const hasPlaceholder = UNFILLED_PLACEHOLDER.test(trimmedSummary)

    if (!trimmedSummary) {
      fixes.push({
        id: 'fix-summary-empty',
        severity: 'critical',
        category: 'completeness',
        scoreGain: 9,
        sectionKey: 'summary',
        sectionLabel: 'Giới thiệu bản thân',
        issueTitle: 'Chưa có đoạn tóm tắt chuyên môn (Summary)',
        explanation: 'Đoạn giới thiệu 2–3 câu ở đầu CV giúp nhà tuyển dụng nắm ngay số năm kinh nghiệm và thế mạnh cốt lõi.',
        currentText: '(Đang trống)',
        suggestedText: buildSuggestedSummary(data, language),
        target: { kind: 'summary' },
      })
    } else if (trimmedSummary.length < 55) {
      fixes.push({
        id: 'fix-summary-short',
        severity: 'improvement',
        category: 'clarity',
        scoreGain: 6,
        sectionKey: 'summary',
        sectionLabel: 'Giới thiệu bản thân',
        issueTitle: 'Đoạn giới thiệu còn quá ngắn',
        explanation: 'Nên nêu rõ số năm kinh nghiệm, 2–3 kỹ năng mũi nhọn và định hướng đóng góp cụ thể.',
        currentText: trimmedSummary,
        suggestedText: buildSuggestedSummary(data, language),
        target: { kind: 'summary' },
      })
    } else if (trimmedSummary.length > 360) {
      const concise = trimmedSummary.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').trim()
      fixes.push({
        id: 'fix-summary-long',
        severity: 'improvement',
        category: 'clarity',
        scoreGain: 5,
        sectionKey: 'summary',
        sectionLabel: 'Giới thiệu bản thân',
        issueTitle: `Đoạn giới thiệu hơi dài (${trimmedSummary.length} ký tự)`,
        explanation: 'Rút gọn còn 2–3 câu súc tích dưới 320 ký tự để người đọc quét nhanh trong 6 giây.',
        currentText: trimmedSummary,
        suggestedText: cleanPunctuation(concise.length >= 45 ? concise : buildSuggestedSummary(data, language)),
        target: { kind: 'summary' },
      })
    } else if (hasBadPunct) {
      fixes.push({
        id: 'fix-summary-punct',
        severity: 'polish',
        category: 'clarity',
        scoreGain: 3,
        sectionKey: 'summary',
        sectionLabel: 'Giới thiệu bản thân',
        issueTitle: 'Có khoảng trắng thừa trước dấu câu',
        explanation: 'Viết sát dấu phẩy và dấu chấm vào chữ đứng trước giúp bố cục văn bản chuyên nghiệp hơn.',
        currentText: trimmedSummary,
        suggestedText: cleanPunctuation(trimmedSummary),
        target: { kind: 'summary' },
      })
    } else if (hasPlaceholder) {
      fixes.push({
        id: 'fix-summary-placeholder',
        severity: 'polish',
        category: 'ats',
        scoreGain: 3,
        sectionKey: 'summary',
        sectionLabel: 'Giới thiệu bản thân',
        issueTitle: 'Còn ký hiệu giữ chỗ […] trong đoạn giới thiệu',
        explanation: 'Hãy thay thế các giá trị trong ngoặc vuông bằng số năm hoặc số liệu thật của bạn.',
        currentText: trimmedSummary,
        suggestedText: trimmedSummary.replace(/\[x\]/gi, '2'),
        target: { kind: 'summary' },
      })
    }
  }

  // 3. Collect bullets across Jobs & CustomSections and produce at most 1 cohesive fix per bullet
  const allBullets: BulletContext[] = []

  for (const { job, jobIndex } of visibleJobs) {
    const jobLabel = job.title.trim() || job.org.trim() || `Công việc #${jobIndex + 1}`
    job.bullets.forEach((raw, bulletIndex) => {
      const plain = stripInlineFormatting(raw).trim()
      if (!plain) return
      allBullets.push({
        raw,
        plain,
        sectionKey: 'jobs',
        sectionLabel: `Kinh nghiệm #${jobIndex + 1} (${jobLabel}) · Dòng ${bulletIndex + 1}`,
        target: { kind: 'job-bullet', jobIndex, bulletIndex, jobTitle: jobLabel },
      })
    })
  }

  for (const cs of visibleCustom) {
    for (const { entry, entryIndex } of cs.entries) {
      const entryLabel = entry.title.trim() || cs.title || `Mục #${entryIndex + 1}`
      entry.bullets.forEach((raw, bulletIndex) => {
        const plain = stripInlineFormatting(raw).trim()
        if (!plain) return
        allBullets.push({
          raw,
          plain,
          sectionKey: cs.id,
          sectionLabel: `${cs.title} · ${entryLabel} · Dòng ${bulletIndex + 1}`,
          target: { kind: 'custom-bullet', sectionId: cs.id, entryIndex, bulletIndex, entryTitle: entryLabel },
        })
      })
    }
  }

  let bulletsWithRealMetric = 0
  let bulletsWithTemplateMetric = 0
  let bulletsWithActionVerb = 0
  let weakOpeningCount = 0
  let idealLengthBullets = 0
  let badPunctCount = 0
  let leadingSymbolCount = 0
  let placeholderCount = 0

  if (summaryRaw.trim() && BAD_SPACE_BEFORE_PUNCT.test(summaryRaw)) badPunctCount++
  if (summaryRaw.trim() && UNFILLED_PLACEHOLDER.test(summaryRaw)) placeholderCount++

  const anyRealMetricsInJobs = allBullets.some((b) => HAS_REAL_METRIC.test(b.plain))

  allBullets.forEach((ctx, idx) => {
    const plain = ctx.plain
    const lower = plain.toLowerCase()
    const hasRealMetric = HAS_REAL_METRIC.test(plain)
    const hasTemplateMetric = !hasRealMetric && HAS_TEMPLATE_METRIC.test(plain)
    const hasWeakOpening = WEAK_OPENING_VI.test(plain) || WEAK_OPENING_EN.test(plain)
    const startsWithVerb = !hasWeakOpening && verbs.some((v) => lower.startsWith(v))
    const hasBadPunct = BAD_SPACE_BEFORE_PUNCT.test(plain)
    const hasLeadingBullet = LEADING_BULLET_CHAR.test(plain)
    const tooShort = plain.length < 25
    const tooLong = plain.length > 190
    const hasPlaceholder = UNFILLED_PLACEHOLDER.test(plain)

    if (hasRealMetric) bulletsWithRealMetric++
    if (hasTemplateMetric) bulletsWithTemplateMetric++
    if (startsWithVerb) bulletsWithActionVerb++
    if (hasWeakOpening) weakOpeningCount++
    if (plain.length >= 30 && plain.length <= 175) idealLengthBullets++
    if (hasBadPunct) badPunctCount++
    if (hasLeadingBullet) leadingSymbolCount++
    if (hasPlaceholder) placeholderCount++

    const missingMetric = !hasRealMetric && !hasTemplateMetric

    if (hasWeakOpening) {
      fixes.push({
        id: `fix-bullet-weak-${idx}`,
        severity: 'critical',
        category: 'impact',
        scoreGain: missingMetric ? 9 : 6,
        sectionKey: ctx.sectionKey,
        sectionLabel: ctx.sectionLabel,
        issueTitle: 'Mở đầu bị động, chưa làm rõ đóng góp trực tiếp',
        explanation:
          'Tránh các cụm mở đầu chung chung như "Chịu trách nhiệm...", "Tham gia...". Hãy mở bằng động từ hành động trực tiếp và kết quả đo được.',
        currentText: ctx.raw,
        suggestedText: buildRewrittenBullet(ctx.raw, language, {
          hasWeakOpening: true,
          missingMetric,
          tooLong,
          tooShort,
          hasBadPunct,
        }),
        target: ctx.target,
      })
      return
    }

    if (tooShort) {
      fixes.push({
        id: `fix-bullet-short-${idx}`,
        severity: 'improvement',
        category: 'clarity',
        scoreGain: 5,
        sectionKey: ctx.sectionKey,
        sectionLabel: ctx.sectionLabel,
        issueTitle: 'Mô tả còn ngắn, thiếu ngữ cảnh & kết quả',
        explanation: 'Một dòng kinh nghiệm thuyết phục nên nêu rõ bạn làm gì, bằng công cụ nào và tạo ra tác động gì.',
        currentText: ctx.raw,
        suggestedText: buildRewrittenBullet(ctx.raw, language, {
          hasWeakOpening: false,
          missingMetric,
          tooLong: false,
          tooShort: true,
          hasBadPunct,
        }),
        target: ctx.target,
      })
      return
    }

    if (tooLong) {
      fixes.push({
        id: `fix-bullet-long-${idx}`,
        severity: 'improvement',
        category: 'clarity',
        scoreGain: 4,
        sectionKey: ctx.sectionKey,
        sectionLabel: ctx.sectionLabel,
        issueTitle: `Mô tả hơi dài (${plain.length} ký tự), khó đọc lướt`,
        explanation: 'Rút gọn xuống 1–2 dòng (dưới 175 ký tự) để nhà tuyển dụng dễ nắm trọng tâm trong 6 giây.',
        currentText: ctx.raw,
        suggestedText: buildRewrittenBullet(ctx.raw, language, {
          hasWeakOpening: false,
          missingMetric,
          tooLong: true,
          tooShort: false,
          hasBadPunct,
        }),
        target: ctx.target,
      })
      return
    }

    if (hasBadPunct || hasLeadingBullet) {
      fixes.push({
        id: `fix-bullet-punct-${idx}`,
        severity: 'polish',
        category: 'clarity',
        scoreGain: 3,
        sectionKey: ctx.sectionKey,
        sectionLabel: ctx.sectionLabel,
        issueTitle: hasLeadingBullet ? 'Có ký tự gạch đầu dòng trùng lặp trong nội dung' : 'Có khoảng trắng thừa trước dấu câu',
        explanation: 'Chuẩn hoá dấu câu và xoá ký tự đầu dòng thừa vì mẫu CV đã tự căn dấu chấm đầu dòng.',
        currentText: ctx.raw,
        suggestedText: buildRewrittenBullet(ctx.raw, language, {
          hasWeakOpening: false,
          missingMetric: false,
          tooLong: false,
          tooShort: false,
          hasBadPunct: true,
        }),
        target: ctx.target,
      })
      return
    }

    if (missingMetric) {
      // If CV already has zero real metrics across all bullets, flag first two unquantified bullets more strongly
      const isHighImpactGap = !anyRealMetricsInJobs
      fixes.push({
        id: `fix-bullet-metric-${idx}`,
        severity: isHighImpactGap ? 'improvement' : 'polish',
        category: 'impact',
        scoreGain: isHighImpactGap ? 6 : 3,
        sectionKey: ctx.sectionKey,
        sectionLabel: ctx.sectionLabel,
        issueTitle: 'Chưa có con số định lượng kết quả',
        explanation: 'Bổ sung tỷ lệ %, thời gian tiết kiệm hoặc quy mô xử lý giúp tăng độ tin cậy với nhà tuyển dụng.',
        currentText: ctx.raw,
        suggestedText: buildRewrittenBullet(ctx.raw, language, {
          hasWeakOpening: false,
          missingMetric: true,
          tooLong: false,
          tooShort: false,
          hasBadPunct: false,
        }),
        target: ctx.target,
      })
    } else if (hasTemplateMetric) {
      fixes.push({
        id: `fix-bullet-placeholder-${idx}`,
        severity: 'polish',
        category: 'ats',
        scoreGain: 2,
        sectionKey: ctx.sectionKey,
        sectionLabel: ctx.sectionLabel,
        issueTitle: 'Cần thay số liệu mẫu [x] bằng con số thực tế',
        explanation: 'Nhấn trực tiếp vào ô bên dưới để điền con số thật từ công việc của bạn trước khi xuất PDF.',
        currentText: ctx.raw,
        suggestedText: ctx.raw.replace(/\[x\]/gi, '20').replace(/\[y\]/gi, '3'),
        target: ctx.target,
      })
    }
  })

  // 4. Skills recommendations
  if (!hiddenSet.has('skills')) {
    const existingLower = new Set(visibleSkills.map((s) => s.toLowerCase()))
    const roleSuggestions = getSuggestedSkillsForRole(role, language).filter((s) => !existingLower.has(s.toLowerCase()))
    const missingCount = Math.max(0, 6 - visibleSkills.length)

    if (visibleSkills.length === 0) {
      const pick = roleSuggestions.slice(0, 6)
      fixes.push({
        id: 'fix-skills-empty',
        severity: 'critical',
        category: 'ats',
        scoreGain: 10,
        sectionKey: 'skills',
        sectionLabel: 'Kỹ năng chuyên môn',
        issueTitle: 'Chưa liệt kê danh sách kỹ năng',
        explanation: 'Hệ thống ATS quét trực tiếp mục Kỹ năng để chấm mức độ phù hợp. Nên có 5–8 kỹ năng sát vị trí.',
        currentText: '(Chưa có kỹ năng nào)',
        suggestedText: pick.join(', '),
        target: { kind: 'skills-add', suggestedSkills: pick },
      })
    } else if (visibleSkills.length < 4 && roleSuggestions.length > 0) {
      const pick = roleSuggestions.slice(0, Math.min(4, missingCount))
      fixes.push({
        id: 'fix-skills-few',
        severity: 'improvement',
        category: 'ats',
        scoreGain: 5,
        sectionKey: 'skills',
        sectionLabel: 'Kỹ năng chuyên môn',
        issueTitle: `Danh sách kỹ năng còn mỏng (${visibleSkills.length} mục)`,
        explanation: 'Bổ sung thêm công cụ và kỹ năng chuyên ngành sát vị trí để tăng tỷ lệ vượt vòng lọc ATS.',
        currentText: visibleSkills.join(', '),
        suggestedText: pick.join(', '),
        target: { kind: 'skills-add', suggestedSkills: pick },
      })
    }
  }

  // 5. Sub-scores calculation (each 0-100)
  const hasGpa = visibleEdu.some((e) => Boolean(e.gpa?.trim()))
  const completenessRaw =
    5 +
    (name ? 11 : 0) +
    (role ? 10 : 0) +
    (email ? (EMAIL_RE.test(email) ? 10 : 5) : 0) +
    (phoneDigits.length >= 9 ? 8 : phoneDigits.length > 0 ? 4 : 0) +
    (location ? 5 : 0) +
    (hasLinks ? 5 : 0) +
    (summaryVisible ? (summaryPlain.length >= 50 ? 13 : summaryPlain.length > 0 ? 7 : 0) : 10) +
    (visibleJobs.length > 0 ? 13 + (visibleJobs.length >= 2 ? 4 : 0) : hasCustomHistory ? 12 : 0) +
    (visibleEdu.length > 0 ? 9 + (hasGpa ? 2 : 0) : 0) +
    (hiddenSet.has('skills') ? 8 : visibleSkills.length >= 7 ? 10 : visibleSkills.length >= 5 ? 8 : visibleSkills.length > 0 ? 4 : 0) +
    (visibleLangs.length > 0 ? 3 : 0) +
    (visibleExtra.length > 0 || visibleCustom.length > 0 ? 3 : 0)
  const completeness = clampScore(completenessRaw)

  const jobsWithFullMeta = visibleJobs.filter(({ job }) => job.title.trim() && job.org.trim() && job.period.trim()).length
  const jobMetaRatio = visibleJobs.length > 0 ? jobsWithFullMeta / visibleJobs.length : 0
  const normalizedSkills = visibleSkills.map((s) => s.toLowerCase())
  const hasDupSkills = new Set(normalizedSkills).size < normalizedSkills.length
  const skillAtsPoints = hiddenSet.has('skills')
    ? 16
    : visibleSkills.length === 0
      ? 0
      : visibleSkills.length <= 3
        ? 10
        : visibleSkills.length <= 6
          ? 18
          : visibleSkills.length <= 14
            ? 23
            : 17

  const atsRaw =
    14 +
    (role ? 13 : 0) +
    (email && EMAIL_RE.test(email) ? 7 : 0) +
    (phoneDigits.length >= 9 ? 5 : 0) +
    (summaryPlain.length >= 40 ? 11 : summaryPlain.length > 0 ? 6 : 0) +
    (visibleJobs.length > 0 ? Math.round(10 + 8 * jobMetaRatio) : hasCustomHistory ? 12 : 0) +
    (visibleEdu.length > 0 ? 8 : 0) +
    skillAtsPoints +
    (visibleSkills.length >= 3 && (visibleJobs.length > 0 || summaryPlain.length > 0) ? 4 : 0) -
    (hasDupSkills ? 5 : 0) -
    Math.min(6, placeholderCount * 2)
  const ats = clampScore(atsRaw)

  let impactRaw = 12
  if (allBullets.length === 0) {
    impactRaw = summaryPlain.length >= 60 ? 26 : 14
  } else {
    const effectiveMetrics = bulletsWithRealMetric + bulletsWithTemplateMetric * 0.65
    const metricRatio = Math.min(1, effectiveMetrics / allBullets.length)
    const metricScore = Math.min(48, Math.round(Math.pow(metricRatio, 0.75) * 48))
    const verbScore = Math.min(32, Math.round((bulletsWithActionVerb / allBullets.length) * 32))
    const extraHasMetric = visibleExtra.some((item) => HAS_REAL_METRIC.test(item))
    const extraBonus = extraHasMetric ? 8 : visibleExtra.length > 0 ? 4 : 0
    const weakPenalty = Math.min(24, weakOpeningCount * 8)
    impactRaw = 10 + metricScore + verbScore + extraBonus - weakPenalty
  }
  const impact = clampScore(impactRaw)

  let clarityRaw = 18
  if (summaryPlain.length >= 55 && summaryPlain.length <= 340) clarityRaw += 26
  else if (summaryPlain.length > 0) clarityRaw += 14
  if (allBullets.length > 0) {
    const idealRatio = idealLengthBullets / allBullets.length
    clarityRaw += Math.round(idealRatio * 36)
    clarityRaw -= Math.min(18, allBullets.filter((b) => b.plain.length < 25).length * 6)
    clarityRaw -= Math.min(18, allBullets.filter((b) => b.plain.length > 190).length * 6)
  } else if (visibleJobs.length > 0 || visibleEdu.length > 0) {
    clarityRaw += 10
  }
  if (summaryPlain.length >= 40 && !WEAK_OPENING_VI.test(summaryPlain) && !WEAK_OPENING_EN.test(summaryPlain)) {
    clarityRaw += 15
  } else if (summaryPlain.length > 0) {
    clarityRaw += 8
  }
  const clarity = clampScore(clarityRaw)

  const hasAnyContent = Boolean(name || role || email || phone || summaryPlain || visibleJobs.length || visibleEdu.length || visibleSkills.length)
  const eduCompleteRatio =
    visibleEdu.length > 0 ? visibleEdu.filter((e) => e.school.trim() && e.degree.trim()).length / visibleEdu.length : 0
  const formattingRaw =
    (hasAnyContent ? 40 : 34) +
    (email && EMAIL_RE.test(email) ? 14 : 0) +
    (phoneDigits.length >= 9 && phoneDigits.length <= 13 ? 10 : 0) +
    (visibleJobs.length > 0 ? Math.round(12 * jobMetaRatio) : 0) +
    (visibleEdu.length > 0 ? Math.round(8 * eduCompleteRatio) : 0) +
    (visibleSkills.length >= 3 && !hasDupSkills && visibleSkills.length <= 14 ? 12 : visibleSkills.length > 0 ? 6 : 0) -
    Math.min(24, badPunctCount * 10) -
    Math.min(12, leadingSymbolCount * 6) -
    Math.min(9, placeholderCount * 3)
  const formatting = clampScore(formattingRaw)

  const overallScore = clampScore(
    impact * 0.28 + ats * 0.22 + completeness * 0.22 + clarity * 0.16 + formatting * 0.12,
  )

  const gradeLabel =
    language === 'en'
      ? overallScore >= 85
        ? 'Interview Ready'
        : overallScore >= 70
          ? 'Strong Draft'
          : overallScore >= 50
            ? 'Needs Improvement'
            : 'Incomplete Draft'
      : overallScore >= 85
        ? 'Chuẩn phỏng vấn'
        : overallScore >= 70
          ? 'Khá tốt'
          : overallScore >= 50
            ? 'Cần cải thiện'
            : 'Cần bổ sung gấp'

  const strengths: string[] = []
  if (name && email && EMAIL_RE.test(email) && phoneDigits.length >= 9) {
    strengths.push('Thông tin liên hệ đầy đủ, đúng chuẩn ATS')
  }
  if (bulletsWithRealMetric >= 2) {
    strengths.push(`${bulletsWithRealMetric}/${allBullets.length} mô tả công việc có số liệu định lượng rõ ràng`)
  }
  if (allBullets.length > 0 && bulletsWithActionVerb >= Math.ceil(allBullets.length * 0.7)) {
    strengths.push('Mở đầu ý bằng động từ hành động mạnh, dứt khoát')
  }
  if (summaryPlain.length >= 55 && summaryPlain.length <= 340) {
    strengths.push('Đoạn giới thiệu súc tích, dễ nắm bắt trong 6 giây')
  }
  if (visibleSkills.length >= 5 && !hasDupSkills) {
    strengths.push(`Bộ ${visibleSkills.length} kỹ năng chuyên môn gọn gàng, hỗ trợ lọc từ khoá`)
  }
  if (strengths.length === 0) {
    strengths.push('Bố cục CV cơ bản sẵn sàng để bổ sung nội dung chi tiết')
  }

  const criticalCount = fixes.filter((f) => f.severity === 'critical').length
  const recruiterVerdict =
    overallScore >= 85
      ? `Hồ sơ ${role || 'ứng viên'} rất sắc nét: thông tin rõ ràng, kinh nghiệm nổi bật bằng ${bulletsWithRealMetric} con số thực tế và từ khoá kỹ năng chuẩn ATS. Có thể tự tin gửi ứng tuyển ngay.`
      : overallScore >= 70
        ? `CV ${role || 'của bạn'} đã có khung sườn tốt và dễ đọc. Chỉ cần bổ sung thêm số liệu kết quả ở vài dòng kinh nghiệm và tinh chỉnh ${fixes.length} điểm nhỏ để chạm mốc 85+ chuẩn phỏng vấn.`
        : criticalCount > 0
          ? `Trong 6 giây lướt đầu tiên, nhà tuyển dụng đang thiếu điểm neo quan trọng (${criticalCount} mục nghiêm trọng cần bổ sung). Hãy áp dụng nhanh các gợi ý bên dưới để làm rõ giá trị của bạn.`
          : `CV đã có thông tin nền tảng nhưng cách diễn đạt còn chung chung và thiếu số liệu chứng minh tác động. Nâng cấp từng dòng theo gợi ý sẽ giúp hồ sơ nổi bật hơn rõ rệt.`

  // Sort fixes by severity (critical -> improvement -> polish) then scoreGain desc
  const severityOrder = { critical: 0, improvement: 1, polish: 2 }
  fixes.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.scoreGain - a.scoreGain)

  return {
    overallScore,
    gradeLabel,
    recruiterVerdict,
    strengths,
    subScores: { ats, impact, clarity, completeness, formatting },
    fixes,
  }
}
