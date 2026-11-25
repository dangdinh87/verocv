import type { ResumeData } from '@/components/resume/resume-data'
import { stripInlineFormatting } from '@/lib/inline-format'
import type { EditorSection } from '@/store/editor-store'

export type QualityIssue = {
  id: string
  type: 'warning' | 'info'
  section: string
  // Editor tab that fixes the issue, so the audit can offer a "go there" button.
  target: EditorSection
  message: string
  suggestion: string
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

const WEAK_OPENINGS =
  /^(chịu trách nhiệm về|tham gia vào|được giao|làm các công việc|phụ trách chung|hỗ trợ các công việc|responsible for|helped with|worked on|duties included|assisted in)\b/i

const PLACEHOLDER = /\[[^\]]*\]/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HAS_NUMBER = /\d|%|gấp đôi|gấp ba|gấp rưỡi|một nửa|double|triple|half/i
const BAD_SPACE_BEFORE_PUNCT = /\s+[,.;!?]/

const stringsOf = (d: ResumeData, hiddenSet: Set<string>): { text: string; section: string; target: EditorSection }[] => [
  { text: d.name, section: 'Thông tin cá nhân', target: 'personal' },
  { text: d.role, section: 'Thông tin cá nhân', target: 'personal' },
  ...(!hiddenSet.has('summary') ? [{ text: d.summary, section: 'Giới thiệu', target: 'summary' as const }] : []),
  ...(!hiddenSet.has('jobs')
    ? d.jobs
        .filter((j) => !j.hidden)
        .flatMap((j) => [j.title, j.org, j.period, ...j.bullets].map((text) => ({ text, section: 'Kinh nghiệm', target: 'jobs' as const })))
    : []),
  ...(!hiddenSet.has('education')
    ? d.education
        .filter((e) => !e.hidden)
        .flatMap((e) => [e.degree, e.school, e.gpa ?? ''].map((text) => ({ text, section: 'Học vấn', target: 'education' as const })))
    : []),
  ...(!hiddenSet.has('skills') ? d.skills.map((text) => ({ text, section: 'Kỹ năng', target: 'skills' as const })) : []),
  ...(!hiddenSet.has('languages')
    ? d.languages
        .filter((l) => !l.hidden)
        .flatMap((l) => [l.name, l.level].map((text) => ({ text, section: 'Ngoại ngữ', target: 'languages' as const })))
    : []),
  ...(!hiddenSet.has('extra')
    ? d.extra.items.map((text) => ({ text, section: d.extra.title || 'Mục phụ', target: 'extra' as const }))
    : []),
  ...(d.customSections ?? [])
    .filter((cs) => !cs.hidden && !hiddenSet.has(cs.id))
    .flatMap((cs) =>
      cs.entries
        .filter((en) => !en.hidden)
        .flatMap((en) =>
          [en.title, en.subtitle ?? '', en.period ?? '', ...en.bullets].map((text) => ({
            text,
            section: cs.title || 'Mục tuỳ chỉnh',
            target: cs.id as EditorSection,
          })),
        ),
    ),
]

/*
  Practical checks for a Vietnamese or English CV. It never scores the CV: it lists things worth a second look.
  Everything runs locally; the CV text never leaves the browser.
*/
export function auditCvQuality(data: ResumeData, language: 'vi' | 'en' = 'vi', hiddenSections: readonly string[] = []): QualityIssue[] {
  const issues: QualityIssue[] = []
  const push = (issue: QualityIssue) => issues.push(issue)
  const verbs = language === 'en' ? [...ACTION_VERBS_EN, ...ACTION_VERBS_VI] : [...ACTION_VERBS_VI, ...ACTION_VERBS_EN]
  const hiddenSet = new Set(hiddenSections)

  if (!data.name.trim()) {
    push({
      id: 'no-name',
      type: 'warning',
      section: 'Thông tin cá nhân',
      target: 'personal',
      message: 'Chưa có họ và tên.',
      suggestion: 'Điền họ tên đầy đủ để nhà tuyển dụng nhớ bạn.',
    })
  }

  const email = data.email.trim()
  const phoneDigits = data.phone.replace(/\D/g, '')
  if (!email && !phoneDigits) {
    push({
      id: 'no-contact',
      type: 'warning',
      section: 'Liên hệ',
      target: 'personal',
      message: 'Thiếu cả số điện thoại và email.',
      suggestion: 'Thêm ít nhất một cách để nhà tuyển dụng liên hệ.',
    })
  }
  if (email && !EMAIL.test(email)) {
    push({
      id: 'bad-email',
      type: 'warning',
      section: 'Liên hệ',
      target: 'personal',
      message: `Email "${email}" có vẻ chưa đúng định dạng.`,
      suggestion: 'Kiểm tra lại, ví dụ: ten@example.com.',
    })
  }
  if (phoneDigits && (phoneDigits.length < 9 || phoneDigits.length > 13)) {
    push({
      id: 'bad-phone',
      type: 'info',
      section: 'Liên hệ',
      target: 'personal',
      message: 'Số điện thoại có số chữ số bất thường.',
      suggestion: 'Số di động Việt Nam thường có 10 chữ số.',
    })
  }

  const leftovers = stringsOf(data, hiddenSet).filter((s) => PLACEHOLDER.test(s.text))
  if (leftovers.length > 0) {
    const first = leftovers[0]
    push({
      id: 'placeholders',
      type: 'warning',
      section: first.section,
      target: first.target,
      message: `Còn ${leftovers.length} chỗ trống chưa điền, ví dụ: "${first.text.match(PLACEHOLDER)?.[0]}".`,
      suggestion: 'Thay các phần trong ngoặc vuông bằng thông tin hoặc số liệu thật trước khi gửi CV.',
    })
  }

  if (!hiddenSet.has('summary')) {
    if (!data.summary.trim()) {
      push({
        id: 'no-summary',
        type: 'info',
        section: 'Giới thiệu',
        target: 'summary',
        message: 'Chưa có đoạn giới thiệu.',
        suggestion: 'Một đoạn 2-3 câu giúp nhà tuyển dụng nắm điểm mạnh của bạn ngay từ đầu.',
      })
    } else if (data.summary.length > 380) {
      push({
        id: 'summary-too-long',
        type: 'info',
        section: 'Giới thiệu',
        target: 'summary',
        message: `Đoạn giới thiệu khá dài (${data.summary.length} ký tự).`,
        suggestion: 'Rút còn 2-3 câu để dành chỗ cho kinh nghiệm.',
      })
    }
  }

  const visibleJobs = hiddenSet.has('jobs') ? [] : data.jobs.filter((j) => !j.hidden)
  const visibleEdu = hiddenSet.has('education') ? [] : data.education.filter((e) => !e.hidden)
  const visibleCustom = (data.customSections ?? [])
    .filter((cs) => !cs.hidden && !hiddenSet.has(cs.id))
    .map((cs) => ({ ...cs, entries: cs.entries.filter((en) => !en.hidden) }))

  const hasCustomHistory = visibleCustom.some((cs) =>
    cs.entries.some((en) => en.title.trim() || en.subtitle?.trim() || en.bullets.some((b) => b.trim())),
  )

  if (visibleJobs.length === 0 && visibleEdu.length === 0 && !hasCustomHistory) {
    push({
      id: 'no-history',
      type: 'warning',
      section: 'Kinh nghiệm',
      target: 'jobs',
      message: 'Chưa có kinh nghiệm hay học vấn nào.',
      suggestion: 'Thêm ít nhất một mục. Nếu mới ra trường, bắt đầu bằng học vấn và hoạt động.',
    })
  }

  let bullets = 0
  let withNumber = 0
  let flaggedWeakOpening = false
  let flaggedPunctuation = false

  if (!hiddenSet.has('summary') && BAD_SPACE_BEFORE_PUNCT.test(data.summary)) {
    flaggedPunctuation = true
    push({
      id: 'punctuation-spacing',
      type: 'info',
      section: 'Giới thiệu',
      target: 'summary',
      message: 'Có khoảng trắng thừa trước dấu phẩy hoặc dấu chấm.',
      suggestion: 'Viết sát dấu câu vào từ đứng trước rồi mới cách ra (ví dụ: "kỹ năng, kinh nghiệm.").',
    })
  }

  visibleJobs.forEach((job, jIdx) => {
    if (!job.period.trim()) {
      push({
        id: `no-period-${jIdx}`,
        type: 'info',
        section: 'Kinh nghiệm',
        target: 'jobs',
        message: `Công việc "${job.title || job.org || jIdx + 1}" chưa có thời gian.`,
        suggestion: 'Ghi mốc thời gian, ví dụ 2022 – nay.',
      })
    }
    job.bullets.forEach((raw, bIdx) => {
      const text = stripInlineFormatting(raw).trim()
      if (!text) return
      bullets++
      if (HAS_NUMBER.test(text)) withNumber++

      if (!flaggedPunctuation && BAD_SPACE_BEFORE_PUNCT.test(text)) {
        flaggedPunctuation = true
        push({
          id: 'punctuation-spacing',
          type: 'info',
          section: 'Kinh nghiệm',
          target: 'jobs',
          message: `Ý ${bIdx + 1} của "${job.org || job.title || 'công việc'}" có khoảng trắng thừa trước dấu câu.`,
          suggestion: 'Xoá khoảng trắng trước dấu phẩy/dấu chấm để bản in gọn gàng, chuyên nghiệp.',
        })
      }

      if (!flaggedWeakOpening && WEAK_OPENINGS.test(text)) {
        flaggedWeakOpening = true
        push({
          id: 'weak-opening',
          type: 'info',
          section: 'Kinh nghiệm',
          target: 'jobs',
          message: `Ý ${bIdx + 1} mở đầu bằng cụm từ chung chung ("${text.match(WEAK_OPENINGS)?.[0]}").`,
          suggestion: 'Thay bằng động từ trực tiếp (Xây dựng, Tối ưu, Triển khai, Dẫn dắt…) để làm rõ vai trò của bạn.',
        })
      }

      const startsWithVerb = verbs.some((verb) => text.toLowerCase().startsWith(verb))
      if (!startsWithVerb && text.length < 25) {
        push({
          id: `short-bullet-${jIdx}-${bIdx}`,
          type: 'info',
          section: 'Kinh nghiệm',
          target: 'jobs',
          message: `Ý ${bIdx + 1} của "${job.org || job.title || 'công việc'}" khá ngắn.`,
          suggestion: 'Nêu việc bạn đã làm và kết quả đạt được.',
        })
      }
      if (text.length > 200) {
        push({
          id: `long-bullet-${jIdx}-${bIdx}`,
          type: 'info',
          section: 'Kinh nghiệm',
          target: 'jobs',
          message: `Ý ${bIdx + 1} của "${job.org || job.title || 'công việc'}" khá dài (${text.length} ký tự).`,
          suggestion: 'Tách thành hai ý ngắn hoặc dùng nút Gợi ý viết lại (chế độ Rút gọn) để dễ đọc lướt.',
        })
      }
    })
  })

  visibleCustom.forEach((cs) => {
    cs.entries.forEach((entry) => {
      entry.bullets.forEach((raw, bIdx) => {
        const text = raw.trim()
        if (!text) return
        bullets++
        if (HAS_NUMBER.test(text)) withNumber++

        if (!flaggedPunctuation && BAD_SPACE_BEFORE_PUNCT.test(text)) {
          flaggedPunctuation = true
          push({
            id: 'punctuation-spacing',
            type: 'info',
            section: cs.title || 'Mục tuỳ chỉnh',
            target: cs.id,
            message: `Ý ${bIdx + 1} của "${entry.title || cs.title}" có khoảng trắng thừa trước dấu câu.`,
            suggestion: 'Xoá khoảng trắng trước dấu phẩy/dấu chấm để bản in gọn gàng, chuyên nghiệp.',
          })
        }

        if (!flaggedWeakOpening && WEAK_OPENINGS.test(text)) {
          flaggedWeakOpening = true
          push({
            id: 'weak-opening',
            type: 'info',
            section: cs.title || 'Mục tuỳ chỉnh',
            target: cs.id,
            message: `Ý ${bIdx + 1} mở đầu bằng cụm từ chung chung ("${text.match(WEAK_OPENINGS)?.[0]}").`,
            suggestion: 'Thay bằng động từ trực tiếp (Xây dựng, Tối ưu, Triển khai, Dẫn dắt…) để làm rõ vai trò của bạn.',
          })
        }
      })
    })
  })

  if (bullets > 0 && withNumber === 0) {
    push({
      id: 'no-metrics',
      type: 'warning',
      section: 'Kinh nghiệm',
      target: visibleJobs.length > 0 ? 'jobs' : (visibleCustom[0]?.id ?? 'jobs'),
      message: 'Các mô tả công việc chưa có con số nào (tỷ lệ, doanh thu, thời gian, quy mô).',
      suggestion: 'Thêm số liệu thật vào ít nhất vài ý quan trọng nhất.',
    })
  }

  if (!hiddenSet.has('skills')) {
    if (data.skills.length === 0) {
      push({
        id: 'no-skills',
        type: 'warning',
        section: 'Kỹ năng',
        target: 'skills',
        message: 'Chưa liệt kê kỹ năng.',
        suggestion: 'Thêm 4-8 kỹ năng sát với vị trí ứng tuyển.',
      })
    } else {
      const normalized = data.skills.map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (new Set(normalized).size < normalized.length) {
        push({
          id: 'duplicate-skills',
          type: 'info',
          section: 'Kỹ năng',
          target: 'skills',
          message: 'Có kỹ năng bị lặp lại nhiều lần.',
          suggestion: 'Gộp hoặc xoá bớt thẻ kỹ năng trùng để danh sách gọn hơn.',
        })
      }
      if (data.skills.length > 15) {
        push({
          id: 'too-many-skills',
          type: 'info',
          section: 'Kỹ năng',
          target: 'skills',
          message: `Có ${data.skills.length} kỹ năng, khá nhiều.`,
          suggestion: 'Giữ những kỹ năng quan trọng nhất với vị trí này.',
        })
      }
    }
  }

  return issues
}
