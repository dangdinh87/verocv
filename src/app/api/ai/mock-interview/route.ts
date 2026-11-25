import { z } from 'zod'
import type { ResumeData } from '@/components/resume/resume-data'
import { stripInlineFormatting } from '@/lib/inline-format'
import { extractDynamicKeywords, localTailorCvToJd } from '@/server/ai/local-fallback'
import { AiQuotaExceededError, runAiTask } from '@/server/ai/workers-ai'
import { jsonError, jsonOk } from '@/server/http'

export type MockInterviewCategory = 'behavioral' | 'technical' | 'gap'

export type MockInterviewQuestion = {
  id: string
  category: MockInterviewCategory
  question: string
  hint: string
}

export type MockInterviewStartOutput = {
  questions: MockInterviewQuestion[]
}

export type MockInterviewStarBreakdown = {
  situation: boolean
  task: boolean
  action: boolean
  result: boolean
  hasMetrics: boolean
}

export type MockInterviewEvaluation = {
  score: number
  verdict: string
  starBreakdown: MockInterviewStarBreakdown
  strengths: string[]
  gaps: string[]
  improvedAnswer: string
  followUpQuestion: string
}

const MockInterviewRequestSchema = z.object({
  action: z.enum(['start', 'evaluate']),
  resumeData: z.unknown().optional(),
  role: z.string().trim().max(200).default(''),
  company: z.string().trim().max(200).default(''),
  jdText: z.string().trim().max(20_000).default(''),
  lang: z.enum(['vi', 'en']).default('vi'),
  question: z.string().trim().max(2000).optional(),
  answer: z.string().trim().max(10_000).optional(),
})

const StartOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        category: z.enum(['behavioral', 'technical', 'gap']),
        question: z.string().min(8),
        hint: z.string().min(5),
      }),
    )
    .min(4)
    .max(8),
})

const EvaluateOutputSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.string().min(8),
  starBreakdown: z.object({
    situation: z.boolean(),
    task: z.boolean(),
    action: z.boolean(),
    result: z.boolean(),
    hasMetrics: z.boolean(),
  }),
  strengths: z.array(z.string()).min(1).max(6),
  gaps: z.array(z.string()).max(6),
  improvedAnswer: z.string().min(20),
  followUpQuestion: z.string().min(8),
})

function buildLocalQuestions(params: {
  resumeData?: ResumeData
  role: string
  company: string
  jdText: string
  lang: 'vi' | 'en'
}): MockInterviewQuestion[] {
  const { resumeData, lang } = params
  const role = params.role.trim() || resumeData?.role?.trim() || (lang === 'en' ? 'this role' : 'vị trí này')
  const company = params.company.trim() || (lang === 'en' ? 'the company' : 'quý công ty')
  const skills = (resumeData?.skills ?? []).map((s) => s.trim()).filter(Boolean)
  const firstJob = resumeData?.jobs?.find((j) => !j.hidden && (j.title || j.org))
  const firstBullet = firstJob?.bullets?.[0] ? stripInlineFormatting(firstJob.bullets[0]).trim() : ''
  const jdTailor =
    resumeData && params.jdText.trim().length >= 20 ? localTailorCvToJd(resumeData, params.jdText, lang) : null
  const jdKeywords = jdTailor
    ? [...jdTailor.matchedKeywords, ...jdTailor.missingKeywords]
    : extractDynamicKeywords(params.jdText)
  const gapSkill = jdTailor?.missingKeywords[0] || jdKeywords[0] || skills[1] || role
  const coreSkill = skills[0] || jdKeywords[0] || role

  if (lang === 'en') {
    return [
      {
        id: 'q-1',
        category: 'behavioral',
        question: `Why are you applying for ${role} at ${company}, and how does your past experience prepare you for it?`,
        hint: 'Connect your strongest achievement on your CV with the specific challenges of this role.',
      },
      {
        id: 'q-2',
        category: 'technical',
        question: `Walk me through a concrete project where you applied ${coreSkill} to solve a tough bottleneck.`,
        hint: 'Use STAR: explain the bottleneck, your exact technical/operational decision, and the measured result.',
      },
      {
        id: 'q-3',
        category: 'behavioral',
        question: firstBullet
          ? `On your CV, you wrote: "${firstBullet}". What was your personal ownership vs. the team's?`
          : `Tell me about a time you had to align multiple stakeholders under a tight deadline.`,
        hint: 'Clarify what YOU directly initiated, trade-offs you made, and the final metric.',
      },
      {
        id: 'q-4',
        category: 'technical',
        question: `How do you measure success and prevent recurring quality issues in ${role} work?`,
        hint: 'Name concrete KPIs, checkpoints, or monitoring habits you use weekly.',
      },
      {
        id: 'q-5',
        category: 'gap',
        question: `This role requires hands-on capability with ${gapSkill}. How quickly can you ramp up or bridge any gap here?`,
        hint: 'Acknowledge honestly and give proof of a closely related skill you mastered fast.',
      },
      {
        id: 'q-6',
        category: 'behavioral',
        question: `Tell me about a mistake or missed target in your previous role and what system you changed afterward.`,
        hint: 'Focus on ownership, root-cause fix, and measurable improvement afterward.',
      },
    ]
  }

  return [
    {
      id: 'q-1',
      category: 'behavioral',
      question: `Vì sao bạn muốn đảm nhận vị trí ${role} tại ${company} ở giai đoạn này, và kinh nghiệm nào trên CV giúp bạn tự tin nhất?`,
      hint: 'Kết nối 1–2 thành tích có số liệu trên CV với bài toán thực tế của công ty thay vì trả lời chung chung.',
    },
    {
      id: 'q-2',
      category: 'technical',
      question: `Hãy phân tích một dự án thực tế bạn trực tiếp sử dụng ${coreSkill} để xử lý điểm nghẽn phức tạp nhất.`,
      hint: 'Trả lời theo STAR: Bối cảnh lỗi/nghẽn (S) → Mục tiêu (T) → Cách bạn xử lý (A) → Con số cải thiện (R).',
    },
    {
      id: 'q-3',
      category: 'behavioral',
      question: firstBullet
        ? `Trong CV bạn có nêu: "${firstBullet}". Phần nào do bạn trực tiếp làm và quyết định khó nhất lúc đó là gì?`
        : `Kể lại một lần bạn phải điều phối nhiều bên liên quan dưới áp lực deadline gấp.`,
      hint: 'Làm rõ đóng góp cá nhân ("Tôi đã...") thay vì nói "nhóm em", nêu rõ lý do chọn giải pháp và kết quả.',
    },
    {
      id: 'q-4',
      category: 'technical',
      question: `Ở vai trò ${role}, bạn theo dõi những chỉ số (KPI) nào để chứng minh hiệu quả công việc và tránh lặp lại sai sót?`,
      hint: 'Đưa ra 2–3 chỉ số đo lường cụ thể và quy trình kiểm tra chéo bạn áp dụng hằng tuần.',
    },
    {
      id: 'q-5',
      category: 'gap',
      question: `Yêu cầu công việc có đề cập đến ${gapSkill}. Nếu chưa từng làm sâu ở quy mô lớn, bạn chứng minh khả năng bắt nhịp nhanh như thế nào?`,
      hint: 'Thừa nhận trung thực khoảng trống nếu có, sau đó dẫn chứng một công cụ/nghiệp vụ tương đồng bạn đã tự học và tạo kết quả thật.',
    },
    {
      id: 'q-6',
      category: 'behavioral',
      question: `Hãy chia sẻ một tình huống dự án chưa đạt kỳ vọng ban đầu — bạn đã nhận trách nhiệm và xoay chuyển kết quả ra sao?`,
      hint: 'Tránh đổ lỗi hoàn cảnh; tập trung vào bài học hệ thống và kết quả đo lường sau khi điều chỉnh.',
    },
  ]
}

function buildLocalEvaluation(params: {
  resumeData?: ResumeData
  role: string
  company: string
  question: string
  answer: string
  lang: 'vi' | 'en'
}): MockInterviewEvaluation {
  const { resumeData, answer, question, lang } = params
  const lower = answer.toLowerCase()
  const words = answer.trim().split(/\s+/).filter(Boolean).length

  const situation =
    /\b(khi|lúc|tại|trong dự án|bối cảnh|đội ngũ|khách hàng|công ty|quý|năm|when|at|during|project|team|context)\b/i.test(lower) ||
    Boolean(resumeData?.jobs?.some((j) => j.org && lower.includes(j.org.toLowerCase())))
  const task =
    /\b(mục tiêu|nhiệm vụ|vấn đề|bài toán|yêu cầu|chỉ tiêu|cần phải|khó khăn|goal|task|target|challenge|problem|needed)\b/i.test(lower)
  const action =
    /\b(tôi đã|mình đã|trực tiếp|xây dựng|triển khai|tối ưu|phân tích|đề xuất|phối hợp|thiết kế|kiểm tra|sử dụng|built|led|designed|implemented|optimized|analyzed)\b/i.test(
      lower,
    )
  const result =
    /\b(kết quả|giúp|đạt được|đạt|tăng|giảm|rút ngắn|tiết kiệm|hoàn thành|cải thiện|result|achieved|increased|reduced|saved|improved)\b/i.test(
      lower,
    )
  const hasMetrics = /\d|%|gấp đôi|gấp ba|gấp rưỡi|double|triple/i.test(answer)

  const wordScore = Math.min(18, Math.round((words / 65) * 18))
  const rawScore =
    20 +
    wordScore +
    (situation ? 12 : 0) +
    (task ? 10 : 0) +
    (action ? 16 : 0) +
    (result ? 12 : 0) +
    (hasMetrics ? 12 : 0)
  const score = Math.max(20, Math.min(98, rawScore))

  const strengths: string[] = []
  const gaps: string[] = []

  if (lang === 'en') {
    if (situation) strengths.push('Clear context and setting so the interviewer can follow the story.')
    else gaps.push('Missing Situation: briefly anchor when/where this happened and the project scale.')
    if (task) strengths.push('Stated the specific goal or problem you needed to solve.')
    else gaps.push('Missing Task: clarify the exact target or constraint you owned.')
    if (action) strengths.push('Used concrete first-person action verbs showing personal ownership.')
    else gaps.push('Missing Action: highlight step-by-step decisions YOU made rather than general team effort.')
    if (result) strengths.push('Connected your actions to a tangible outcome.')
    else gaps.push('Missing Result: always close with the business/team impact.')
    if (hasMetrics) strengths.push('Included concrete numbers/metrics, boosting credibility.')
    else gaps.push('No quantifiable metrics yet — add %, time saved, user scale, or revenue impact.')
    if (words < 35) gaps.push('Answer is quite brief; aim for 70–130 words (~45–60 seconds spoken).')
    if (strengths.length === 0) strengths.push('Direct opening addressing the prompt.')
  } else {
    if (situation) strengths.push('Có nêu bối cảnh công việc/dự án giúp người nghe dễ hình dung.')
    else gaps.push('Thiếu Bối cảnh (S): mở đầu bằng 1 câu nêu rõ thời điểm, công ty hoặc quy mô dự án.')
    if (task) strengths.push('Làm rõ được mục tiêu hoặc vấn đề cần giải quyết.')
    else gaps.push('Thiếu Nhiệm vụ (T): nêu rõ chỉ tiêu hoặc điểm nghẽn mà cá nhân bạn phải xử lý.')
    if (action) strengths.push('Thể hiện rõ hành động trực tiếp của bản thân bằng động từ chủ động.')
    else gaps.push('Thiếu Hành động (A): tách bạch rõ "Tôi đã làm gì" (công cụ, quy trình, cách phối hợp).')
    if (result) strengths.push('Có câu chốt về kết quả đầu ra sau khi thực hiện.')
    else gaps.push('Thiếu Kết quả (R): luôn khép lại câu trả lời bằng tác động cuối cùng mang lại cho đội ngũ/khách hàng.')
    if (hasMetrics) strengths.push('Đã đưa số liệu định lượng cụ thể, tạo độ tin cậy cao với nhà tuyển dụng.')
    else gaps.push('Chưa có con số định lượng: bổ sung tỷ lệ %, thời gian rút ngắn hoặc quy mô xử lý.')
    if (words < 35) gaps.push('Câu trả lời còn hơi ngắn; nên triển khai khoảng 70–140 từ (nói trong 45–60 giây).')
    if (strengths.length === 0) strengths.push('Đi thẳng vào trọng tâm câu hỏi.')
  }

  const firstJob = resumeData?.jobs?.find((j) => !j.hidden && (j.title || j.org))
  const realOrg = firstJob?.org?.trim() || (params.company ? `dự án trước đây` : 'công ty gần nhất')
  const realRole = firstJob?.title?.trim() || params.role || resumeData?.role || (lang === 'en' ? 'Specialist' : 'Chuyên viên')
  const realBullet = firstJob?.bullets?.[0] ? stripInlineFormatting(firstJob.bullets[0]).trim() : ''
  const topSkills = (resumeData?.skills ?? []).slice(0, 3).join(', ')

  const improvedAnswer =
    lang === 'en'
      ? `In my role as ${realRole} at ${realOrg}, we faced a bottleneck around ${params.role || 'delivery speed and quality'}. My goal was to resolve the root cause while keeping cross-functional milestones on track. I directly ${realBullet ? realBullet.charAt(0).toLowerCase() + realBullet.slice(1).replace(/[.!?]+$/, '') : `analyzed the workflow${topSkills ? ` using ${topSkills}` : ''} and standardized execution`}. As a result, we improved measurable efficiency by [x]% and reduced turnaround time by [y] days.`
      : `Trong thời gian đảm nhận vai trò ${realRole} tại ${realOrg}, đội ngũ gặp bài toán cần tối ưu tiến độ và chất lượng đầu ra. Nhiệm vụ của tôi là tìm nguyên nhân gốc và chuẩn hoá quy trình phối hợp để kịp mục tiêu quý. Tôi đã trực tiếp ${realBullet ? realBullet.charAt(0).toLowerCase() + realBullet.slice(1).replace(/[.!?]+$/, '') : `phân tích số liệu${topSkills ? `, áp dụng ${topSkills}` : ''} và triển khai phương án cải tiến từng bước`}. Kết quả là hiệu suất tăng [x]% và rút ngắn thời gian xử lý xuống còn [y] ngày.`

  const verdict =
    lang === 'en'
      ? score >= 80
        ? 'Strong, structured STAR answer with credible evidence.'
        : score >= 60
          ? 'Solid foundation, but sharpening the missing STAR elements and metrics will make it stand out.'
          : 'Too general right now — structure your story with Situation, Task, Action, and quantified Result.'
      : score >= 80
        ? 'Câu trả lời mạch lạc, đúng khung STAR và có dẫn chứng thuyết phục.'
        : score >= 60
          ? 'Ý chính ổn, nhưng cần bổ sung phần STAR còn thiếu và con số kết quả để ghi điểm tối đa.'
          : 'Câu trả lời còn chung chung — hãy dựng lại theo khung STAR (Bối cảnh → Nhiệm vụ → Hành động → Số liệu kết quả).'

  const followUpQuestion =
    lang === 'en'
      ? !hasMetrics
        ? 'What exact metric or KPI proved that your solution actually worked?'
        : 'If you had to redo that project from scratch today, what trade-off would you change first?'
      : !hasMetrics
        ? `Cụ thể chỉ số trước và sau khi bạn xử lý vấn đề ở câu "${question.slice(0, 60)}..." thay đổi bao nhiêu %?`
        : 'Nếu gặp lại bài toán đó ở quy mô gấp đôi hiện tại, bạn sẽ thay đổi quyết định nào đầu tiên?'

  return {
    score,
    verdict,
    starBreakdown: { situation, task, action, result, hasMetrics },
    strengths,
    gaps,
    improvedAnswer,
    followUpQuestion,
  }
}

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const parsed = MockInterviewRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Yêu cầu luyện phỏng vấn không hợp lệ.', 400)
  }

  const { action, role, company, jdText, lang, question, answer } = parsed.data
  const resumeData = parsed.data.resumeData as ResumeData | undefined

  if (action === 'evaluate') {
    if (!question || question.length < 5) {
      return jsonError('Thiếu nội dung câu hỏi để chấm điểm.', 400)
    }
    if (!answer || answer.length < 5) {
      return jsonError('Vui lòng nhập câu trả lời ít nhất 5 ký tự để AI chấm điểm.', 400)
    }
  }

  try {
    if (action === 'start') {
      const result = await runAiTask<MockInterviewStartOutput>({
        req,
        feature: 'mock-interview-start',
        systemPrompt:
          'You are an expert Vietnamese/English interview coach. Return strictly valid JSON: { "questions": [{ "id": "q-1", "category": "behavioral"|"technical"|"gap", "question": string, "hint": string }] } with exactly 6 tailored interview questions mixing behavioral, technical, and CV-vs-JD gap probes.',
        userPrompt: JSON.stringify({ lang, role, company, jdText, resumeData }),
        validate: (obj) => {
          const res = StartOutputSchema.safeParse(obj)
          return res.success ? { questions: res.data.questions.slice(0, 6) } : null
        },
        fallback: () => ({
          questions: buildLocalQuestions({ resumeData, role, company, jdText, lang }),
        }),
      })
      return jsonOk(result)
    }

    const result = await runAiTask<MockInterviewEvaluation>({
      req,
      feature: 'mock-interview-evaluate',
      systemPrompt:
        'You are a strict yet constructive STAR interview coach. Evaluate the candidate answer against the question and CV context. Return strictly valid JSON: { "score": 0-100, "verdict": string, "starBreakdown": { "situation": boolean, "task": boolean, "action": boolean, "result": boolean, "hasMetrics": boolean }, "strengths": string[], "gaps": string[], "improvedAnswer": string, "followUpQuestion": string }. Never invent fake numbers; use [x]% placeholders if metrics are missing.',
      userPrompt: JSON.stringify({ lang, role, company, jdText, question, answer, resumeData }),
      validate: (obj) => {
        const res = EvaluateOutputSchema.safeParse(obj)
        return res.success ? res.data : null
      },
      fallback: () =>
        buildLocalEvaluation({
          resumeData,
          role,
          company,
          question: question ?? '',
          answer: answer ?? '',
          lang,
        }),
    })

    return jsonOk(result)
  } catch (err) {
    if (err instanceof AiQuotaExceededError) {
      return jsonError(err.message, 429, { limit: err.limit })
    }
    return jsonError('Không thể xử lý phòng luyện phỏng vấn AI lúc này.', 500)
  }
}
