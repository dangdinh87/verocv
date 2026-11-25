import type { ResumeData } from '@/components/resume/resume-data'
import { suggestBulletImprovement, suggestSkillsForRole, suggestSummary, type RewriteMode } from '@/lib/ai-suggestions'
import { stripInlineFormatting } from '@/lib/inline-format'
import { matchResumeAgainstJd } from '@/lib/jd-matcher'
import type { InterviewPrepQuestion } from '@/types/resume'

export type JdTailorOutput = {
  matchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  gapSummary: string
  suggestedSummary: string
  bulletRewrites: {
    jobIndex: number
    bulletIndex: number
    original: string
    improved: string
    reason: string
  }[]
}

export type CoverLetterAiOutput = {
  subject: string
  salutation: string
  paragraphs: string[]
  signOff: string
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'will', 'have', 'work', 'team', 'experience', 'years',
  'required', 'preferred', 'skills', 'ability', 'strong', 'good', 'using', 'based', 'into', 'about', 'more', 'than',
  'của', 'và', 'các', 'cho', 'với', 'trong', 'những', 'được', 'làm', 'việc', 'công', 'kinh', 'nghiệm', 'yêu', 'cầu',
  'ứng', 'viên', 'năng', 'khả', 'tốt', 'biết', 'sử', 'dụng', 'tham', 'gia', 'phát', 'triển', 'vị', 'trí', 'mô', 'tả',
])

export function extractDynamicKeywords(jdText: string): string[] {
  const found = new Set<string>()
  // Capitalized tech terms / acronyms (e.g., Next.js, Kubernetes, OKR, B2B, GA4, TypeScript, PowerBI, SAP)
  const techMatches = jdText.match(/\b[A-Z][A-Za-z0-9.+#/-]{1,22}\b/g) ?? []
  for (const m of techMatches) {
    const clean = m.replace(/[.,;:!?]+$/, '')
    if (clean.length >= 2 && !STOP_WORDS.has(clean.toLowerCase())) {
      found.add(clean)
    }
  }
  return Array.from(found).slice(0, 18)
}

function resumeFlatText(data: ResumeData): string {
  return [
    data.role,
    stripInlineFormatting(data.summary),
    ...data.skills,
    ...data.jobs.filter((j) => !j.hidden).flatMap((j) => [j.title, j.org, ...j.bullets.map(stripInlineFormatting)]),
    ...data.education.filter((e) => !e.hidden).flatMap((e) => [e.degree, e.school]),
    ...data.extra.items.map(stripInlineFormatting),
  ]
    .join('\n')
    .toLowerCase()
}

export function localTailorCvToJd(data: ResumeData, jdText: string, lang: 'vi' | 'en' = 'vi'): JdTailorOutput {
  const dictResult = matchResumeAgainstJd(data, jdText)
  const cvLower = resumeFlatText(data)
  const dynamic = extractDynamicKeywords(jdText)

  const matchedSet = new Set(dictResult.matched)
  const missingSet = new Set(dictResult.missing)

  for (const kw of dynamic) {
    const lower = kw.toLowerCase()
    if (Array.from(matchedSet).some((m) => m.toLowerCase() === lower) || Array.from(missingSet).some((m) => m.toLowerCase() === lower)) {
      continue
    }
    if (cvLower.includes(lower)) matchedSet.add(kw)
    else if (missingSet.size < 12) missingSet.add(kw)
  }

  const matchedKeywords = Array.from(matchedSet)
  const missingKeywords = Array.from(missingSet)
  const total = matchedKeywords.length + missingKeywords.length
  const matchScore = total === 0 ? 50 : Math.round((matchedKeywords.length / total) * 100)

  const topMissing = missingKeywords.slice(0, 3)
  const roleLabel = data.role.trim() || (lang === 'en' ? 'Specialist' : 'Chuyên viên')

  const gapSummary =
    lang === 'en'
      ? topMissing.length > 0
        ? `Your CV matches ${matchScore}% of key JD terms. Consider highlighting ${topMissing.join(', ')} in your summary or experience bullets if you have hands-on experience.`
        : `Strong alignment (${matchScore}%). Keep metrics bolded and concise for fast recruiter scanning.`
      : topMissing.length > 0
        ? `CV hiện khớp ${matchScore}% từ khoá trọng tâm của JD. Nếu bạn có kinh nghiệm thực tế với ${topMissing.join(', ')}, hãy bổ sung vào phần Giới thiệu hoặc mô tả công việc.`
        : `Hồ sơ khớp tốt (${matchScore}%) với mô tả công việc. Nên in đậm các con số kết quả để nhà tuyển dụng quét nhanh trong 6 giây.`

  const suggestedSummary =
    lang === 'en'
      ? `${roleLabel} with **[x]+ years** of proven execution${matchedKeywords.length > 0 ? ` across ${matchedKeywords.slice(0, 4).join(', ')}` : ''}. Focused on measurable outcomes${topMissing.length > 0 ? ` and ready to contribute on ${topMissing.slice(0, 2).join(' & ')}` : ''}.`
      : `${roleLabel} với **[x] năm** kinh nghiệm thực chiến${matchedKeywords.length > 0 ? ` về ${matchedKeywords.slice(0, 4).join(', ')}` : ''}. Tập trung tối ưu hiệu quả đo lường bằng số liệu${topMissing.length > 0 ? `, sẵn sàng đảm nhận các hạng mục liên quan đến ${topMissing.slice(0, 2).join(', ')}` : ''}.`

  const bulletRewrites: JdTailorOutput['bulletRewrites'] = []
  data.jobs.forEach((job, jobIndex) => {
    if (job.hidden) return
    job.bullets.forEach((bullet, bulletIndex) => {
      const clean = stripInlineFormatting(bullet).trim()
      if (!clean || bulletRewrites.length >= 4) return
      const focusKw = topMissing[bulletRewrites.length % Math.max(1, topMissing.length)]
      const hasNumber = /\d|%/.test(clean)
      const improved =
        lang === 'en'
          ? `${clean.replace(/[.!?]+$/, '')}${focusKw ? ` utilizing ${focusKw}` : ''}${hasNumber ? '' : ', delivering **[x]%** measurable improvement'}.`
          : `${clean.replace(/[.!?]+$/, '')}${focusKw ? ` (ứng dụng ${focusKw})` : ''}${hasNumber ? '' : ', đạt hiệu quả tăng **[x]%**'}.`
      if (improved !== clean) {
        bulletRewrites.push({
          jobIndex,
          bulletIndex,
          original: bullet,
          improved,
          reason:
            lang === 'en'
              ? focusKw
                ? `Integrates JD keyword "${focusKw}" and emphasizes measurable impact.`
                : 'Sharpens impact and highlights outcome.'
              : focusKw
                ? `Bổ sung ngữ cảnh từ khoá "${focusKw}" trong JD và nhấn mạnh kết quả.`
                : 'Làm rõ động từ hành động và làm nổi bật con số kết quả.',
        })
      }
    })
  })

  return {
    matchScore,
    matchedKeywords,
    missingKeywords,
    gapSummary,
    suggestedSummary,
    bulletRewrites,
  }
}

export async function localRewriteOptions(params: {
  kind: 'bullet' | 'summary' | 'skills'
  text: string
  role?: string
  mode?: RewriteMode
  lang?: 'vi' | 'en'
}): Promise<{ options: string[]; note?: string }> {
  const lang = params.lang ?? 'vi'
  const mode = params.mode ?? 'impact'
  if (params.kind === 'skills') {
    const options = await suggestSkillsForRole(params.role ?? '', lang)
    return { options, note: lang === 'en' ? 'Select skills you genuinely possess.' : 'Chỉ chọn những kỹ năng bạn thật sự sử dụng thành thạo.' }
  }
  if (params.kind === 'summary') {
    return suggestSummary(params.role ?? '', '[x]', mode, lang)
  }
  return suggestBulletImprovement(params.text, params.role, mode, lang)
}

const VI_TO_EN_PHRASES: [RegExp, string][] = [
  [/Chuyên viên Marketing/gi, 'Marketing Specialist'],
  [/Trưởng nhóm Marketing/gi, 'Marketing Team Lead'],
  [/Lập trình viên Frontend/gi, 'Frontend Developer'],
  [/Lập trình viên Backend/gi, 'Backend Developer'],
  [/Kế toán tổng hợp/gi, 'General Accountant'],
  [/Nhân viên Content/gi, 'Content Executive'],
  [/Thực tập sinh/gi, 'Intern'],
  [/Tiếng Việt/gi, 'Vietnamese'],
  [/Tiếng Anh/gi, 'English'],
  [/Bản ngữ/gi, 'Native'],
  [/Giao tiếp tốt/gi, 'Professional Working Proficiency'],
  [/Đọc tài liệu kỹ thuật tốt/gi, 'Technical Reading Proficiency'],
  [/Cử nhân/gi, 'Bachelor of'],
  [/Kỹ sư/gi, 'Bachelor of Engineering in'],
  [/Đại học/gi, 'University of'],
  [/Chứng chỉ/gi, 'Certifications'],
  [/Dự án cá nhân/gi, 'Personal Projects'],
  [/Hoạt động khác/gi, 'Activities'],
  [/ – nay\b/gi, ' – Present'],
]

const EN_TO_VI_PHRASES: [RegExp, string][] = [
  [/Marketing Specialist/gi, 'Chuyên viên Marketing'],
  [/Frontend Developer/gi, 'Lập trình viên Frontend'],
  [/Backend Developer/gi, 'Lập trình viên Backend'],
  [/General Accountant/gi, 'Kế toán tổng hợp'],
  [/Vietnamese/gi, 'Tiếng Việt'],
  [/English/gi, 'Tiếng Anh'],
  [/Native/gi, 'Bản ngữ'],
  [/ – Present\b/gi, ' – nay'],
  [/Certifications/gi, 'Chứng chỉ'],
  [/Personal Projects/gi, 'Dự án cá nhân'],
]

function applyPhraseMap(text: string, pairs: [RegExp, string][]): string {
  let out = text
  for (const [re, rep] of pairs) out = out.replace(re, rep)
  return out
}

export function localTranslateResume(data: ResumeData, targetLang: 'vi' | 'en'): ResumeData {
  const pairs = targetLang === 'en' ? VI_TO_EN_PHRASES : EN_TO_VI_PHRASES
  const tr = (s: string) => applyPhraseMap(s, pairs)
  return {
    ...data,
    role: tr(data.role),
    summary: tr(data.summary),
    jobs: data.jobs.map((j) => ({
      ...j,
      title: tr(j.title),
      period: tr(j.period),
      bullets: j.bullets.map(tr),
    })),
    education: data.education.map((e) => ({
      ...e,
      school: tr(e.school),
      degree: tr(e.degree),
      period: tr(e.period),
    })),
    skills: data.skills.map(tr),
    languages: data.languages.map((l) => ({
      ...l,
      name: tr(l.name),
      level: tr(l.level),
    })),
    extra: {
      title: tr(data.extra.title),
      items: data.extra.items.map(tr),
    },
    customSections: (data.customSections ?? []).map((cs) => ({
      ...cs,
      title: tr(cs.title),
      entries: cs.entries.map((en) => ({
        ...en,
        title: tr(en.title),
        subtitle: en.subtitle ? tr(en.subtitle) : '',
        period: en.period ? tr(en.period) : '',
        bullets: en.bullets.map(tr),
      })),
    })),
  }
}

export function localGenerateCoverLetter(params: {
  resumeData?: ResumeData
  company: string
  role: string
  jdText: string
  tone: 'formal' | 'modern' | 'concise'
  lang: 'vi' | 'en'
}): CoverLetterAiOutput {
  const company = params.company.trim() || (params.lang === 'en' ? 'your company' : 'Quý công ty')
  const role = params.role.trim() || params.resumeData?.role?.trim() || (params.lang === 'en' ? 'the open position' : 'vị trí ứng tuyển')
  const topSkills = (params.resumeData?.skills ?? []).slice(0, 4).join(', ')
  const firstJob = params.resumeData?.jobs.find((j) => !j.hidden && (j.title || j.org))
  const firstAchievement = firstJob?.bullets[0] ? stripInlineFormatting(firstJob.bullets[0]) : ''
  const jdKws = extractDynamicKeywords(params.jdText).slice(0, 3).join(', ')

  if (params.lang === 'en') {
    return {
      subject: `Application for ${role} — ${params.resumeData?.name || 'Candidate'}`,
      salutation: `Dear Hiring Team at ${company},`,
      paragraphs: [
        `I am writing to express my strong interest in the ${role} position at ${company}. With practical background${topSkills ? ` in ${topSkills}` : ''}, I am excited to contribute measurable impact to your team.`,
        firstAchievement
          ? `In my role${firstJob?.org ? ` at ${firstJob.org}` : ''}, I ${firstAchievement.charAt(0).toLowerCase() + firstAchievement.slice(1)}${jdKws ? ` — experience that aligns directly with your focus on ${jdKws}.` : '.'}`
          : `Throughout my career, I have focused on structured execution, cross-functional collaboration, and delivering measurable outcomes${jdKws ? ` across ${jdKws}` : ''}.`,
        params.tone === 'concise'
          ? `Thank you for your time and consideration. I welcome the opportunity to discuss how I can add immediate value to ${company}.`
          : `I admire ${company}'s direction and would welcome an interview to share how my hands-on experience can help your team hit upcoming milestones.`,
      ],
      signOff: 'Sincerely,',
    }
  }

  return {
    subject: `V/v: Ứng tuyển vị trí ${role} tại ${company}`,
    salutation: `Kính gửi Anh/Chị Bộ phận Tuyển dụng ${company},`,
    paragraphs: [
      `Tôi viết thư này để ứng tuyển vào vị trí ${role} tại ${company}. Qua tìm hiểu yêu cầu công việc${jdKws ? ` (đặc biệt ở mảng ${jdKws})` : ''}, tôi nhận thấy nền tảng chuyên môn${topSkills ? ` về ${topSkills}` : ''} của mình hoàn toàn phù hợp để đồng hành cùng đội ngũ.`,
      firstAchievement
        ? `Trong thời gian làm việc${firstJob?.org ? ` tại ${firstJob.org}` : ''}, tôi đã trực tiếp ${firstAchievement.charAt(0).toLowerCase() + firstAchievement.slice(1)} Tôi luôn chú trọng làm việc bám sát số liệu, giữ kỷ luật tiến độ và phối hợp nhịp nhàng giữa các bộ phận.`
        : `Trong quá trình làm việc thực tế, tôi luôn ưu tiên giải pháp gọn, đo lường được hiệu quả đầu ra và chủ động phối hợp liên phòng ban để đưa dự án về đích đúng hạn.`,
      params.tone === 'concise'
        ? `Cảm ơn Anh/Chị đã xem xét hồ sơ. Rất mong có cơ hội trao đổi thêm trong buổi phỏng vấn.`
        : `Tôi tin sự chủ động và kinh nghiệm thực chiến của mình sẽ đóng góp thiết thực cho ${company} ngay từ những tuần đầu. Rất mong nhận được lịch hẹn phỏng vấn từ Anh/Chị.`,
    ],
    signOff: 'Trân trọng,',
  }
}

export function localInterviewPrep(params: {
  resumeData?: ResumeData
  jdText: string
  company: string
  role: string
  lang: 'vi' | 'en'
}): InterviewPrepQuestion[] {
  const company = params.company.trim() || (params.lang === 'en' ? 'this company' : 'công ty')
  const role = params.role.trim() || params.resumeData?.role?.trim() || (params.lang === 'en' ? 'this role' : 'vị trí này')
  const skills = (params.resumeData?.skills ?? []).slice(0, 3)
  const jdKws = extractDynamicKeywords(params.jdText).slice(0, 3)
  const focusTopic = jdKws[0] || skills[0] || role

  if (params.lang === 'en') {
    return [
      {
        question: `Why are you interested in the ${role} role at ${company} right now?`,
        hint: 'Connect your career trajectory, 1-2 strengths from your CV, and a concrete problem this company is solving.',
      },
      {
        question: `Tell me about a time you delivered measurable impact using ${focusTopic}.`,
        hint: 'Use STAR: Situation (context), Task (your ownership), Action (how you executed), Result (exact metric).',
      },
      {
        question: `What was the toughest trade-off or bottleneck you resolved in your most recent role?`,
        hint: 'Show analytical thinking, stakeholder alignment, and lessons learned.',
      },
      {
        question: `How do you prioritize when multiple urgent requests arrive at the same time?`,
        hint: 'Mention impact vs effort criteria and proactive communication with stakeholders.',
      },
      {
        question: `Walk us through a project on your CV where the initial outcome fell short — how did you course-correct?`,
        hint: 'Focus on root-cause ownership and the measurable turnaround afterward.',
      },
      {
        question: `What would your first 30–60–90 days look like as ${role} at ${company}?`,
        hint: '30d: learn systems & metrics; 60d: ship quick wins; 90d: scale core initiatives.',
      },
      {
        question: `How do you collaborate across teams with conflicting priorities?`,
        hint: 'Highlight shared goals, transparent data, and calm negotiation.',
      },
      {
        question: `What questions do you have for us about the ${role} team?`,
        hint: 'Ask about 6-month success metrics, team bottlenecks, and growth expectations.',
      },
    ]
  }

  return [
    {
      question: `Vì sao bạn chọn ứng tuyển vị trí ${role} tại ${company} ở thời điểm này?`,
      hint: 'Kết nối định hướng nghề nghiệp của bạn + 1–2 thế mạnh trên CV với bài toán thực tế của công ty.',
    },
    {
      question: `Hãy kể một dự án bạn trực tiếp áp dụng ${focusTopic} để tạo ra kết quả đo lường được.`,
      hint: 'Trả lời theo STAR: Bối cảnh (S) → Nhiệm vụ (T) → Hành động cụ thể của bạn (A) → Con số kết quả (R).',
    },
    {
      question: `Trong công việc gần nhất, điểm nghẽn khó nhất bạn từng xử lý là gì và bạn đã tháo gỡ ra sao?`,
      hint: 'Nhấn mạnh cách bạn phân tích nguyên nhân gốc, phối hợp với người liên quan và bài học rút ra.',
    },
    {
      question: `Khi cùng lúc có nhiều đầu việc gấp, bạn sắp xếp thứ tự ưu tiên theo tiêu chí nào?`,
      hint: 'Nêu rõ cách đánh giá mức độ tác động, deadline và báo cáo sớm với quản lý/đội ngũ.',
    },
    {
      question: `Có kinh nghiệm nào trong JD (${jdKws.join(', ') || role}) mà bạn chưa làm nhiều, và bạn bù đắp thế nào?`,
      hint: 'Thừa nhận trung thực khoảng trống nhưng dẫn chứng khả năng học nhanh qua một kỹ năng tương đồng đã làm tốt.',
    },
    {
      question: `Nếu nhận việc, kế hoạch 30–60–90 ngày đầu của bạn cho vị trí ${role} là gì?`,
      hint: '30 ngày đầu: nắm quy trình & số liệu; 60 ngày: tối ưu điểm nghẽn nhỏ; 90 ngày: dẫn dắt mục tiêu chính.',
    },
    {
      question: `Kể lại một lần bạn bất đồng quan điểm chuyên môn với đồng nghiệp hoặc bộ phận khác.`,
      hint: 'Tập trung vào cách lắng nghe, dùng số liệu khách quan thay vì cảm tính để đi đến thống nhất.',
    },
    {
      question: `Bạn muốn hỏi thêm điều gì về đội ngũ và kỳ vọng cho vị trí ${role}?`,
      hint: 'Hỏi về chỉ số đánh giá thành công sau 6 tháng đầu và thách thức lớn nhất hiện tại của nhóm.',
    },
  ]
}
