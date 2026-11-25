import type { ResumeData } from '@/components/resume/resume-data'
import { stripInlineFormatting } from '@/lib/inline-format'

export type JdMatchResult = {
  matched: string[]
  missing: string[]
  matchPercent: number
  totalKeywords: number
}

// Canonical skills & domain keywords across Vietnamese and English job descriptions: [Canonical Label, [aliases...]]
const SKILL_DICTIONARY: [string, string[]][] = [
  // Software & Engineering
  ['JavaScript', ['javascript', 'es6']],
  ['TypeScript', ['typescript']],
  ['React', ['react', 'reactjs', 'react.js']],
  ['Next.js', ['next.js', 'nextjs']],
  ['Vue.js', ['vue', 'vuejs', 'vue.js']],
  ['Angular', ['angular', 'angularjs']],
  ['Node.js', ['node.js', 'nodejs']],
  ['HTML/CSS', ['html', 'css', 'html5', 'css3']],
  ['Tailwind CSS', ['tailwind', 'tailwindcss']],
  ['Python', ['python']],
  ['Java', ['java']],
  ['C# / .NET', ['c#', '.net', 'dotnet', 'asp.net']],
  ['Golang', ['golang']],
  ['PHP / Laravel', ['php', 'laravel']],
  ['Spring Boot', ['spring boot', 'springboot']],
  ['React Native', ['react native']],
  ['Flutter', ['flutter']],
  ['REST API', ['rest api', 'restful', 'restful api']],
  ['GraphQL', ['graphql']],
  ['SQL', ['sql', 'mysql', 'mssql', 't-sql']],
  ['PostgreSQL', ['postgresql', 'postgres']],
  ['MongoDB', ['mongodb', 'nosql']],
  ['Redis', ['redis']],
  ['Docker', ['docker', 'container']],
  ['Kubernetes', ['kubernetes', 'k8s']],
  ['AWS', ['aws', 'amazon web services']],
  ['GCP', ['gcp', 'google cloud']],
  ['Azure', ['azure']],
  ['CI/CD', ['ci/cd', 'github actions', 'gitlab ci', 'jenkins']],
  ['Git', ['git', 'github', 'gitlab']],
  ['Kiểm thử tự động', ['unit test', 'vitest', 'jest', 'playwright', 'cypress', 'automation test', 'kiểm thử tự động']],
  ['Microservices', ['microservices', 'microservice']],

  // Data, BA & AI
  ['Power BI', ['power bi', 'powerbi']],
  ['Tableau', ['tableau']],
  ['Excel', ['excel', 'vlookup', 'pivot table', 'google sheets']],
  ['Phân tích dữ liệu', ['phân tích dữ liệu', 'data analysis', 'data analytics']],
  ['Business Analysis', ['business analyst', 'business analysis', 'phân tích nghiệp vụ', 'brd', 'srs', 'uml', 'bpmn']],
  ['Machine Learning', ['machine learning', 'deep learning', 'học máy']],
  ['LLM / GenAI', ['llm', 'genai', 'generative ai', 'prompt engineering', 'rag']],
  ['ETL / Data Warehouse', ['etl', 'data warehouse', 'bigquery', 'snowflake', 'airflow']],

  // Design & Product
  ['Figma', ['figma']],
  ['UI/UX', ['ui/ux', 'ux/ui', 'user experience', 'user interface', 'thiết kế giao diện']],
  ['Design System', ['design system', 'wireframe', 'prototype', 'prototyping']],
  ['Photoshop / Illustrator', ['photoshop', 'illustrator', 'adobe creative']],
  ['Canva', ['canva']],
  ['Product Management', ['product manager', 'product owner', 'product roadmap', 'user story', 'quản lý sản phẩm']],
  ['Agile / Scrum', ['agile', 'scrum', 'kanban', 'jira']],

  // Marketing, Content & Growth
  ['SEO', ['seo', 'on-page', 'off-page', 'ahrefs', 'semrush', 'search console']],
  ['Google Ads', ['google ads', 'adwords', 'sem', 'ppc']],
  ['Meta Ads', ['meta ads', 'facebook ads', 'quảng cáo facebook', 'quảng cáo meta']],
  ['TikTok Ads', ['tiktok ads', 'tiktok shop', 'quảng cáo tiktok']],
  ['Google Analytics', ['google analytics', 'ga4']],
  ['Content Marketing', ['content marketing', 'viết nội dung', 'copywriting', 'lập kế hoạch nội dung', 'content creator']],
  ['Social Media', ['social media', 'fanpage', 'quản trị kênh']],
  ['Email Marketing', ['email marketing', 'mailchimp', 'klaviyo']],
  ['Thương mại điện tử', ['thương mại điện tử', 'e-commerce', 'ecommerce', 'shopee', 'lazada']],
  ['Trade Marketing', ['trade marketing', 'posm', 'activation']],
  ['PR & Sự kiện', ['tổ chức sự kiện', 'event', 'thông cáo báo chí', 'quan hệ báo chí']],

  // Sales, BD & Customer Service
  ['B2B Sales', ['b2b', 'khách hàng doanh nghiệp']],
  ['B2C Sales', ['b2c', 'bán lẻ']],
  ['CRM', ['crm', 'hubspot', 'salesforce', 'zoho']],
  ['Phát triển kinh doanh', ['phát triển kinh doanh', 'business development', 'mở rộng thị trường', 'tìm kiếm khách hàng']],
  ['Đàm phán & Chốt đơn', ['đàm phán', 'thương lượng', 'negotiation', 'closing']],
  ['Chăm sóc khách hàng', ['chăm sóc khách hàng', 'customer service', 'customer success', 'cskh', 'giải quyết khiếu nại']],
  ['Account Management', ['account management', 'account manager', 'quản lý khách hàng']],

  // Finance, Accounting & Banking
  ['Kế toán tổng hợp', ['kế toán tổng hợp', 'general accountant']],
  ['Báo cáo tài chính', ['báo cáo tài chính', 'financial reporting', 'financial statement']],
  ['Báo cáo thuế', ['báo cáo thuế', 'kê khai thuế', 'thuế gtgt', 'thuế tndn', 'thuế tncn', 'quyết toán thuế']],
  ['MISA', ['misa']],
  ['SAP / ERP', ['sap', 'erp', 'oracle netsuite', 'fast accounting', 'bravo']],
  ['Chuẩn mực VAS / IFRS', ['vas', 'ifrs', 'chuẩn mực kế toán']],
  ['Đối chiếu công nợ', ['đối chiếu công nợ', 'accounts payable', 'accounts receivable', 'công nợ']],
  ['Kiểm soát chi phí', ['kiểm soát chi phí', 'cost control', 'ngân sách', 'budgeting', 'dự báo tài chính']],
  ['Kiểm toán', ['kiểm toán', 'audit', 'internal audit', 'acca', 'cpa', 'cfa']],

  // HR, Admin & Operations
  ['Tuyển dụng', ['tuyển dụng', 'talent acquisition', 'recruitment', 'sourcing']],
  ['C&B', ['c&b', 'compensation', 'lương thưởng', 'bảo hiểm xã hội', 'bhxh', 'chấm công']],
  ['Đánh giá KPI / OKR', ['kpi', 'okr', 'đánh giá hiệu suất', 'performance review']],
  ['Đào tạo & Phát triển', ['l&d', 'đào tạo nội bộ', 'onboarding', 'văn hoá doanh nghiệp']],
  ['Luật Lao động', ['luật lao động', 'hợp đồng lao động', 'quan hệ lao động']],
  ['Logistics & Chuỗi cung ứng', ['logistics', 'supply chain', 'chuỗi cung ứng', 'kho vận', 'quản lý tồn kho']],
  ['Xuất nhập khẩu', ['xuất nhập khẩu', 'hải quan', 'incoterms', 'chứng từ xuất nhập khẩu', 'import/export']],
  ['Mua hàng / Procurement', ['mua hàng', 'thu mua', 'procurement', 'purchasing', 'nhà cung cấp']],
  ['Quản lý dự án', ['quản lý dự án', 'project management', 'pmp', 'tiến độ dự án']],

  // Languages & Soft Skills
  ['Tiếng Anh', ['tiếng anh', 'english']],
  ['IELTS', ['ielts']],
  ['TOEIC', ['toeic']],
  ['Tiếng Nhật / JLPT', ['tiếng nhật', 'japanese', 'jlpt', 'n1', 'n2', 'n3']],
  ['Tiếng Trung / HSK', ['tiếng trung', 'chinese', 'mandarin', 'hsk']],
  ['Tiếng Hàn / TOPIK', ['tiếng hàn', 'korean', 'topik']],
  ['Làm việc nhóm', ['làm việc nhóm', 'teamwork', 'phối hợp liên phòng ban', 'cross-functional']],
  ['Giải quyết vấn đề', ['giải quyết vấn đề', 'problem solving']],
  ['Thuyết trình', ['thuyết trình', 'presentation']],
]

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsTerm(haystackLower: string, termLower: string): boolean {
  // Use non-letter boundaries so terms like "c#", ".net", "c&b", "ci/cd", "ui/ux" match accurately without false substrings.
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(termLower)}(?=$|[^\\p{L}\\p{N}])`, 'iu')
  return pattern.test(haystackLower)
}

function resumeCorpus(data: ResumeData): string {
  return [
    data.role,
    data.summary,
    ...data.skills,
    ...data.languages.filter((l) => !l.hidden).flatMap((l) => [l.name, l.level]),
    ...data.jobs.filter((j) => !j.hidden).flatMap((j) => [j.title, j.org, j.location ?? '', ...j.bullets]),
    ...data.education.filter((e) => !e.hidden).flatMap((e) => [e.degree, e.school, e.gpa ?? '']),
    data.extra.title,
    ...data.extra.items,
    ...(data.customSections ?? [])
      .filter((cs) => !cs.hidden)
      .flatMap((cs) => [cs.title, ...cs.entries.filter((en) => !en.hidden).flatMap((en) => [en.title, en.subtitle ?? '', ...en.bullets])]),
  ]
    .join('\n')
    .toLowerCase()
}

export function matchResumeAgainstJd(data: ResumeData, jdText: string): JdMatchResult {
  const cleanJd = jdText.trim().toLowerCase()
  if (!cleanJd) {
    return { matched: [], missing: [], matchPercent: 0, totalKeywords: 0 }
  }

  const cvText = resumeCorpus(data)
  const matched: string[] = []
  const missing: string[] = []

  for (const [canonical, aliases] of SKILL_DICTIONARY) {
    const inJd = aliases.some((alias) => containsTerm(cleanJd, alias))
    if (!inJd) continue
    const inCv = aliases.some((alias) => containsTerm(cvText, alias))
    if (inCv) matched.push(canonical)
    else missing.push(canonical)
  }

  const totalKeywords = matched.length + missing.length
  const matchPercent = totalKeywords === 0 ? 0 : Math.round((matched.length / totalKeywords) * 100)

  return { matched, missing, matchPercent, totalKeywords }
}

/*
  Formats the CV into clean, linear plain text in the exact order an Applicant Tracking System (ATS) reads it,
  also handy for pasting into company career portals.
*/
export function formatResumeAsAtsText(data: ResumeData, lang: 'vi' | 'en' = 'vi'): string {
  const lines: string[] = []
  const h =
    lang === 'en'
      ? {
          summary: 'SUMMARY',
          jobs: 'EXPERIENCE',
          education: 'EDUCATION',
          extra: (data.extra.title || 'PROJECTS & CERTIFICATIONS').toUpperCase(),
          skills: 'SKILLS',
          languages: 'LANGUAGES',
        }
      : {
          summary: 'GIỚI THIỆU',
          jobs: 'KINH NGHIỆM LÀM VIỆC',
          education: 'HỌC VẤN',
          extra: (data.extra.title || 'CHỨNG CHỈ & DỰ ÁN').toUpperCase(),
          skills: 'KỸ NĂNG',
          languages: 'NGOẠI NGỮ',
        }

  if (data.name.trim()) lines.push(data.name.trim().toUpperCase())
  if (data.role.trim()) lines.push(data.role.trim())
  const contacts = [data.location, data.email, data.phone, data.link].map((c) => c.trim()).filter(Boolean)
  if (contacts.length > 0) lines.push(contacts.join(' | '))

  if (data.summary.trim()) {
    lines.push('', h.summary, stripInlineFormatting(data.summary.trim()))
  }

  const jobs = data.jobs.filter((j) => j.title.trim() || j.org.trim() || j.bullets.some((b) => b.trim()))
  if (jobs.length > 0) {
    lines.push('', h.jobs)
    for (const job of jobs) {
      const titleOrg = [job.title.trim(), job.org.trim()].filter(Boolean).join(' - ')
      const header = [titleOrg, job.period.trim()].filter(Boolean).join(' | ')
      if (header) lines.push(header)
      for (const b of job.bullets.map((s) => stripInlineFormatting(s).trim()).filter(Boolean)) {
        lines.push(`• ${b}`)
      }
    }
  }

  const edu = data.education.filter((e) => e.degree.trim() || e.school.trim())
  if (edu.length > 0) {
    lines.push('', h.education)
    for (const item of edu) {
      const header = [item.degree.trim(), item.school.trim(), item.period.trim()].filter(Boolean).join(' | ')
      if (header) lines.push(header)
    }
  }

  const extraItems = data.extra.items.map((s) => s.trim()).filter(Boolean)
  if (extraItems.length > 0) {
    lines.push('', h.extra)
    for (const item of extraItems) {
      lines.push(`• ${item}`)
    }
  }

  for (const cs of (data.customSections ?? []).filter((c) => !c.hidden)) {
    const visibleEntries = cs.entries.filter(
      (en) => !en.hidden && (en.title.trim() || en.subtitle?.trim() || en.bullets.some((b) => b.trim())),
    )
    if (visibleEntries.length === 0) continue
    lines.push('', cs.title.toUpperCase())
    for (const en of visibleEntries) {
      const head = [en.title.trim(), en.subtitle?.trim(), en.period?.trim()].filter(Boolean).join(' | ')
      if (head) lines.push(head)
      for (const b of en.bullets.map((s) => s.trim()).filter(Boolean)) {
        lines.push(`• ${b}`)
      }
    }
  }

  const skills = data.skills.map((s) => s.trim()).filter(Boolean)
  if (skills.length > 0) {
    lines.push('', h.skills, skills.join(', '))
  }

  const languages = data.languages.filter((l) => l.name.trim())
  if (languages.length > 0) {
    lines.push('', h.languages, languages.map((l) => (l.level.trim() ? `${l.name.trim()}: ${l.level.trim()}` : l.name.trim())).join(' | '))
  }

  return lines.join('\n').trim()
}
