// Rule-based & context-aware writing assistant for resume bullet points, summaries, and skills.
// Rule: Never hallucinate exact metrics; placeholder [x] or [y] is used when numbers are needed.
// User must explicitly click "Dùng" to apply suggestions.

export type RewriteMode = 'impact' | 'concise' | 'detailed'

export type AiSuggestionResult = {
  options: string[]
  note?: string
}

const WEAK_PREFIX_VI =
  /^(chịu trách nhiệm về việc|chịu trách nhiệm|tham gia vào việc|tham gia|hỗ trợ việc|hỗ trợ|phụ trách việc|phụ trách|được giao|làm công việc|làm các việc|thực hiện việc|thực hiện)\s+/i
const WEAK_PREFIX_EN = /^(responsible for|helped with|worked on|duties included|assisted in|participated in|tasked with)\s+/i

function cleanActionCore(raw: string, lang: 'vi' | 'en'): string {
  const stripped = raw
    .trim()
    .replace(/^[•\-*·]+\s*/, '')
    .replace(/[.!?]+$/, '')
    .replace(lang === 'en' ? WEAK_PREFIX_EN : WEAK_PREFIX_VI, '')
    .trim()
  if (!stripped) return ''
  return stripped.charAt(0).toLowerCase() + stripped.slice(1)
}

function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export async function suggestBulletImprovement(
  originalText: string,
  jobRole?: string,
  mode: RewriteMode = 'impact',
  lang: 'vi' | 'en' = 'vi',
): Promise<AiSuggestionResult> {
  const core = cleanActionCore(originalText, lang)

  if (lang === 'en') {
    if (!core) {
      return {
        options: [
          'Planned and executed key initiatives, improving overall performance by [x]% quarter-over-quarter.',
          'Streamlined cross-functional workflows, reducing turnaround time from [x] days to [y] days.',
          'Proactively resolved operational bottlenecks, maintaining quality accuracy above [x]%.',
        ],
        note: 'Replace [x] and [y] with your real metrics.',
      }
    }
    if (mode === 'concise') {
      const shortCore = core.split(/[,;—–]|\s+and\s+/i)[0]?.trim() || core
      return {
        options: [
          `Executed ${shortCore}, achieving [x]% of target.`,
          `Streamlined ${shortCore}, saving [x] hours/week.`,
          `Delivered ${shortCore} on schedule across [x] projects.`,
        ],
        note: 'Concise 1-line options to keep your CV scannable.',
      }
    }
    if (mode === 'detailed') {
      return {
        options: [
          `Spearheaded ${core} in collaboration with cross-functional stakeholders, increasing measurable output by [x]% over [y] months.`,
          `Designed and standardized the workflow for ${core}, reducing recurring errors by [x]% and onboarding [y] team members.`,
          `Analyzed performance data around ${core} to prioritize high-impact improvements, delivering results [x]% ahead of schedule.`,
        ],
        note: 'Expanded options showing context, collaboration, and outcome.',
      }
    }
    return {
      options: [
        `Led and executed ${core}, driving a [x]% improvement against quarterly targets.`,
        `Optimized ${core}, saving the team [x] hours per week.`,
        `Collaborated across teams to deliver ${core}, raising quality metrics to [x]%.`,
      ],
      note: 'Fill in [x] with your actual numbers.',
    }
  }

  // Vietnamese modes
  if (!core) {
    if (mode === 'concise') {
      return {
        options: [
          'Triển khai các hạng mục trọng tâm, hoàn thành [x]% mục tiêu quý.',
          'Tối ưu quy trình xử lý, rút ngắn thời gian từ [x] xuống [y] ngày.',
          'Kiểm soát chất lượng đầu ra, giảm tỷ lệ lỗi xuống dưới [x]%.',
        ],
        note: 'Câu ngắn gọn một dòng, đi thẳng vào kết quả.',
      }
    }
    if (mode === 'detailed') {
      return {
        options: [
          'Trực tiếp lập kế hoạch và phối hợp liên phòng ban triển khai dự án trọng điểm, giúp hiệu suất chung tăng [x]% sau [y] tháng.',
          'Rà soát điểm nghẽn trong quy trình vận hành, chuẩn hoá tài liệu hướng dẫn cho [x] thành viên và rút ngắn [y]% thời gian xử lý.',
          'Theo dõi bộ chỉ số hiệu quả hằng tuần để điều chỉnh nguồn lực kịp thời, duy trì tỷ lệ hoàn thành đúng hạn đạt [x]%.',
        ],
        note: 'Nêu đầy đủ bối cảnh phối hợp, cách làm và kết quả.',
      }
    }
    return {
      options: [
        'Lập kế hoạch và triển khai các hạng mục trọng điểm, nâng cao hiệu quả đạt [x]% so với quý trước.',
        'Tối ưu quy trình phối hợp giữa các bộ phận, rút ngắn thời gian xử lý xuống còn [x] ngày.',
        'Chủ động đề xuất giải pháp cải tiến, giúp giảm tỷ lệ lỗi phát sinh xuống dưới [x]%.',
      ],
      note: 'Thay thế [x] bằng số liệu thực tế từ công việc của bạn.',
    }
  }

  if (mode === 'concise') {
    const firstClause = core.split(/[,;—–]|\s+(?:nhằm|giúp|để|qua đó)\s+/i)[0]?.trim() || core
    return {
      options: [
        `${capitalize(firstClause)}, đạt [x]% mục tiêu đề ra.`,
        `Tối ưu ${firstClause}, tiết kiệm [x] giờ mỗi tuần.`,
        `Trực tiếp ${firstClause} đúng hạn cho [x] dự án.`,
      ],
      note: 'Đã lược bỏ từ đệm để ý gọn trên 1–2 dòng.',
    }
  }

  if (mode === 'detailed') {
    const roleHint = jobRole?.trim() ? ` trong vai trò ${jobRole.trim()}` : ''
    const leadVerb = /^lập kế hoạch/i.test(core) ? `Chủ động ${core}` : `Chủ động lập kế hoạch và trực tiếp ${core}`
    return {
      options: [
        `${leadVerb}${roleHint}, phối hợp cùng các bộ phận liên quan giúp kết quả tăng [x]% sau [y] tháng.`,
        `Xây dựng quy trình chuẩn để ${core}, vừa giảm [x]% thời gian thao tác thủ công vừa hỗ trợ [y] thành viên mới nắm việc nhanh hơn.`,
        `Theo dõi số liệu thực tế khi ${core}, kịp thời điều chỉnh phương án để duy trì tỷ lệ hoàn thành đúng hạn ở mức [x]%.`,
      ],
      note: 'Mở rộng thêm cách làm và tác động tới đội ngũ — nhớ thay [x], [y] bằng số thật.',
    }
  }

  return {
    options: [
      `Trực tiếp ${core}, đạt [x]% chỉ tiêu đề ra trong kỳ.`,
      `Chủ động cải tiến cách ${core}, giúp đội ngũ tiết kiệm [x] giờ làm việc mỗi tuần.`,
      `Phối hợp liên phòng ban để ${core}, nâng tỷ lệ hoàn thành đúng hạn lên [x]%.`,
    ],
    note: 'Điền các số trong ngoặc vuông [x] bằng con số thật của bạn.',
  }
}

export async function suggestSummary(
  role: string,
  years: string = '[x]',
  mode: RewriteMode = 'impact',
  lang: 'vi' | 'en' = 'vi',
): Promise<AiSuggestionResult> {
  if (lang === 'en') {
    const cleanRole = role.trim() || 'Professional'
    if (mode === 'concise') {
      return {
        options: [
          `${cleanRole} with [x]+ years of experience delivering measurable business outcomes and clean execution.`,
          `Detail-oriented ${cleanRole} focused on operational efficiency, data-backed decisions, and reliable delivery.`,
        ],
        note: 'Short 1–2 sentence summary for a compact single-page CV.',
      }
    }
    return {
      options: [
        `${cleanRole} with [x]+ years of hands-on experience improving workflows, tracking key metrics, and delivering projects on schedule. Known for clear communication and ownership.`,
        `Results-driven ${cleanRole} combining strong domain fundamentals with cross-functional collaboration. Focused on building practical solutions that drive measurable growth.`,
        `Adaptable ${cleanRole} eager to contribute structured problem-solving and consistent execution to help the team hit its goals from day one.`,
      ],
      note: 'Replace [x] with your years of experience.',
    }
  }

  const cleanRole = role.trim() || 'Chuyên viên'
  if (mode === 'concise') {
    return {
      options: [
        `${cleanRole} với [x] năm kinh nghiệm, mạnh về thực thi bám sát số liệu và phối hợp nhóm đúng tiến độ.`,
        `${cleanRole} cẩn trọng, nắm vững nghiệp vụ chuyên môn và ưu tiên giải pháp gọn, đo lường được kết quả.`,
      ],
      note: 'Đoạn tóm tắt ngắn 1–2 câu giúp tiết kiệm diện tích trang.',
    }
  }
  if (mode === 'detailed') {
    return {
      options: [
        `Hơn ${years} năm làm việc trong vai trò ${cleanRole}, quen thuộc từ khâu lập kế hoạch, triển khai thực tế đến đo lường hiệu quả. Có kinh nghiệm phối hợp giữa nhiều bộ phận để tháo gỡ vướng mắc và đưa dự án về đích đúng hạn.`,
        `${cleanRole} định hướng kết quả với nền tảng chuyên môn vững và tư duy cải tiến quy trình. Mong muốn đóng góp kinh nghiệm thực chiến để tối ưu chất lượng đầu ra đạt mục tiêu của đội ngũ.`,
      ],
      note: 'Thay [x] bằng số năm kinh nghiệm thật (hoặc sửa thành sinh viên mới ra trường nếu phù hợp).',
    }
  }

  return {
    options: [
      `Hơn ${years} năm kinh nghiệm trong vai trò ${cleanRole}. Có thế mạnh về tối ưu quy trình, làm việc bám sát số liệu và tinh thần trách nhiệm cao.`,
      `${cleanRole} với khả năng thích ứng nhanh và nắm vững nghiệp vụ chuyên môn. Quen phối hợp liên phòng ban và chủ động xử lý vấn đề phát sinh.`,
      `Tập trung vào chất lượng đầu ra và tiến độ thực thi trong vai trò ${cleanRole}. Mong muốn đóng góp giá trị thiết thực cho đội ngũ ngay từ những tuần đầu.`,
    ],
    note: 'Chọn đoạn phù hợp nhất và thay [x] bằng số năm kinh nghiệm thật của bạn.',
  }
}

export async function suggestSkillsForRole(role: string, lang: 'vi' | 'en' = 'vi'): Promise<string[]> {
  await new Promise((r) => setTimeout(r, 150))
  const lower = role.toLowerCase()

  if (lower.includes('backend') || lower.includes('devops') || lower.includes('system') || lower.includes('hệ thống')) {
    return ['Node.js', 'PostgreSQL', 'REST API', 'Docker', 'Redis', 'CI/CD', 'Git', 'Linux']
  }
  if (
    lower.includes('frontend') ||
    lower.includes('web') ||
    lower.includes('lập trình') ||
    lower.includes('developer') ||
    lower.includes('fullstack')
  ) {
    return ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST API', 'Git', 'HTML/CSS', 'Kiểm thử tự động']
  }
  if (
    lower.includes('data') ||
    lower.includes('dữ liệu') ||
    lower.includes('ba') ||
    lower.includes('business analyst') ||
    lower.includes('phân tích')
  ) {
    return ['SQL', 'Power BI', 'Excel nâng cao', 'Python', 'Phân tích dữ liệu', 'Trực quan hoá số liệu', 'Viết tài liệu BRD/SRS', 'Jira']
  }
  if (lower.includes('ui') || lower.includes('ux') || lower.includes('thiết kế') || lower.includes('design')) {
    return [
      'Figma',
      'UI/UX',
      'Design System',
      'Wireframe & Prototype',
      'Nghiên cứu người dùng',
      'Photoshop / Illustrator',
      'Responsive Design',
    ]
  }
  if (
    lower.includes('marketing') ||
    lower.includes('quảng cáo') ||
    lower.includes('content') ||
    lower.includes('seo') ||
    lower.includes('truyền thông')
  ) {
    return ['Meta Ads', 'Google Ads', 'Google Analytics 4', 'Lập kế hoạch nội dung', 'SEO', 'Phân tích số liệu chiến dịch', 'Canva / Figma']
  }
  if (
    lower.includes('sale') ||
    lower.includes('kinh doanh') ||
    lower.includes('bán hàng') ||
    lower.includes('bd') ||
    lower.includes('account')
  ) {
    return [
      'Tìm kiếm khách hàng',
      'Đàm phán & Chốt đơn',
      'Quản lý CRM',
      'Chăm sóc khách hàng',
      'Thuyết trình giải pháp',
      'Phát triển thị trường',
      'Lập báo cáo doanh số',
    ]
  }
  if (
    lower.includes('kế toán') ||
    lower.includes('tài chính') ||
    lower.includes('kiểm toán') ||
    lower.includes('ngân hàng') ||
    lower.includes('accountant')
  ) {
    return [
      'Phần mềm MISA',
      'Excel nâng cao (Vlookup, Pivot)',
      'Báo cáo thuế',
      'Báo cáo tài chính',
      'Đối chiếu công nợ',
      'Chuẩn mực VAS',
      'Kiểm soát chi phí',
    ]
  }
  if (
    lower.includes('nhân sự') ||
    lower.includes('hr') ||
    lower.includes('tuyển dụng') ||
    lower.includes('c&b') ||
    lower.includes('hành chính')
  ) {
    return [
      'Tuyển dụng ứng viên',
      'Quản lý C&B & BHXH',
      'Đánh giá KPI',
      'Đào tạo hội nhập',
      'Luật Lao động',
      'Truyền thông nội bộ',
      'Soạn thảo văn bản',
    ]
  }
  if (
    lower.includes('vận hành') ||
    lower.includes('logistics') ||
    lower.includes('xuất nhập khẩu') ||
    lower.includes('kho') ||
    lower.includes('mua hàng') ||
    lower.includes('supply')
  ) {
    return [
      'Điều phối vận hành',
      'Quản lý tồn kho',
      'Chứng từ xuất nhập khẩu',
      'Làm việc với nhà cung cấp',
      'Kiểm soát tiến độ',
      'Excel / ERP',
      'Tối ưu chi phí',
    ]
  }
  if (lower.includes('chăm sóc khách hàng') || lower.includes('cskh') || lower.includes('support') || lower.includes('customer')) {
    return [
      'Tư vấn & Giải đáp khách hàng',
      'Xử lý khiếu nại',
      'Sử dụng phần mềm CRM',
      'Giao tiếp qua điện thoại & chat',
      'Quản lý thời gian phản hồi',
      'Làm việc nhóm',
    ]
  }
  if (
    lower.includes('giáo viên') ||
    lower.includes('giảng dạy') ||
    lower.includes('trợ giảng') ||
    lower.includes('đào tạo') ||
    lower.includes('teacher')
  ) {
    return [
      'Soạn giáo án',
      'Quản lý lớp học',
      'Đánh giá năng lực học viên',
      'Thuyết trình & Truyền đạt',
      'Tổ chức hoạt động tương tác',
      'Tin học văn phòng',
    ]
  }
  if (lower.includes('sinh viên') || lower.includes('thực tập') || lower.includes('intern') || lower.includes('fresher')) {
    return [
      'Excel / Google Sheets',
      'Tìm kiếm & Tổng hợp thông tin',
      'Thuyết trình',
      'Làm việc nhóm',
      'Chủ động học hỏi',
      'Quản lý thời gian',
    ]
  }

  return lang === 'en'
    ? ['Communication', 'Problem Solving', 'Project Coordination', 'Data Analysis', 'Time Management', 'Teamwork']
    : ['Giao tiếp rõ ràng', 'Giải quyết vấn đề', 'Quản lý thời gian', 'Phối hợp nhóm', 'Tin học văn phòng', 'Tổng hợp báo cáo']
}

export async function fetchAiRewrite(params: {
  kind: 'bullet' | 'summary' | 'skills'
  text: string
  role?: string
  mode?: RewriteMode
  lang?: 'vi' | 'en'
}): Promise<AiSuggestionResult> {
  try {
    const res = await fetch('/api/ai/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.ok) {
      const json = (await res.json()) as { data?: AiSuggestionResult }
      if (json.data?.options?.length) return json.data
    }
  } catch {
    // Fallback to local helper
  }
  if (params.kind === 'skills') {
    const options = await suggestSkillsForRole(params.role ?? '', params.lang ?? 'vi')
    return { options, note: 'Chỉ chọn những kỹ năng bạn thật sự sử dụng thành thạo.' }
  }
  if (params.kind === 'summary') {
    return suggestSummary(params.role ?? '', '[x]', params.mode ?? 'impact', params.lang ?? 'vi')
  }
  return suggestBulletImprovement(params.text, params.role, params.mode ?? 'impact', params.lang ?? 'vi')
}
