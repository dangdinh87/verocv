import { z } from 'zod'
import type { ResumeData } from '@/components/resume/resume-data'
import { evaluateCvReview, getSuggestedSkillsForRole, type CvLineFix, type CvReviewReport } from '@/lib/cv-reviewer'
import { stripInlineFormatting } from '@/lib/inline-format'
import { localTailorCvToJd } from '@/server/ai/local-fallback'
import { AiQuotaExceededError, runAiTask } from '@/server/ai/workers-ai'
import { jsonError, jsonOk } from '@/server/http'
import { ResumeDataSchema } from '@/types/schema'

const ReviewRequestSchema = z.object({
  resumeData: z.unknown(),
  targetRole: z.string().trim().max(200).optional(),
  jdText: z.string().trim().max(20_000).optional(),
  lang: z.enum(['vi', 'en']).default('vi'),
  hiddenSections: z.array(z.string()).optional(),
})

const AiReviewPayloadSchema = z.object({
  recruiterVerdict: z.string().min(10),
  strengths: z.array(z.string()).max(6).default([]),
  suggestedSummary: z.string().optional(),
  bulletRewrites: z
    .array(
      z.object({
        jobIndex: z.number().int().min(0),
        bulletIndex: z.number().int().min(0),
        improved: z.string().min(5),
        reason: z.string().min(3),
      }),
    )
    .default([]),
  missingSkills: z.array(z.string()).max(10).default([]),
})

export type DeepCvReviewResult = CvReviewReport & {
  targetRole?: string
  jdMatchScore?: number
  missingJdKeywords?: string[]
}

function normalizeResumeInput(raw: unknown): ResumeData | null {
  if (!raw || typeof raw !== 'object') return null
  const parsed = ResumeDataSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  const rec = raw as Record<string, unknown>
  return {
    name: typeof rec.name === 'string' ? rec.name : '',
    initials: typeof rec.initials === 'string' ? rec.initials : '',
    photo: typeof rec.photo === 'string' ? rec.photo : '',
    role: typeof rec.role === 'string' ? rec.role : '',
    location: typeof rec.location === 'string' ? rec.location : '',
    email: typeof rec.email === 'string' ? rec.email : '',
    phone: typeof rec.phone === 'string' ? rec.phone : '',
    link: typeof rec.link === 'string' ? rec.link : '',
    summary: typeof rec.summary === 'string' ? rec.summary : '',
    jobs: Array.isArray(rec.jobs) ? (rec.jobs as ResumeData['jobs']) : [],
    education: Array.isArray(rec.education) ? (rec.education as ResumeData['education']) : [],
    skills: Array.isArray(rec.skills) ? rec.skills.filter((s): s is string => typeof s === 'string') : [],
    languages: Array.isArray(rec.languages) ? (rec.languages as ResumeData['languages']) : [],
    extra:
      rec.extra && typeof rec.extra === 'object'
        ? (rec.extra as ResumeData['extra'])
        : { title: 'Chứng chỉ / Dự án', items: [] },
    customSections: Array.isArray(rec.customSections) ? (rec.customSections as ResumeData['customSections']) : [],
  }
}

function mergeEnrichedReview(
  base: CvReviewReport,
  data: ResumeData,
  enrichment: z.infer<typeof AiReviewPayloadSchema>,
  meta: { targetRole?: string; jdMatchScore?: number; missingJdKeywords?: string[] },
): DeepCvReviewResult {
  const nextFixes: CvLineFix[] = [...base.fixes]

  // Merge AI summary rewrite if provided and different from current summary
  if (enrichment.suggestedSummary?.trim()) {
    const cleanSuggested = enrichment.suggestedSummary.trim()
    const currentClean = stripInlineFormatting(data.summary ?? '').trim()
    if (cleanSuggested !== currentClean) {
      const idx = nextFixes.findIndex((f) => f.target.kind === 'summary')
      if (idx >= 0) {
        nextFixes[idx] = {
          ...nextFixes[idx],
          suggestedText: cleanSuggested,
          explanation: `${nextFixes[idx].explanation} (Đã cá nhân hoá theo mục tiêu${meta.targetRole ? ` ${meta.targetRole}` : ''}.)`,
        }
      } else {
        nextFixes.unshift({
          id: 'ai-fix-summary',
          severity: 'improvement',
          category: 'impact',
          scoreGain: 5,
          sectionKey: 'summary',
          sectionLabel: 'Giới thiệu bản thân (AI)',
          issueTitle: 'Tối ưu đoạn giới thiệu sắc nét hơn theo vị trí mục tiêu',
          explanation: 'Viết lại câu mở đầu nhấn mạnh kinh nghiệm cốt lõi và từ khoá trọng tâm.',
          currentText: data.summary || '(Đang trống)',
          suggestedText: cleanSuggested,
          target: { kind: 'summary' },
        })
      }
    }
  }

  // Merge AI bullet rewrites onto exact jobIndex + bulletIndex
  for (const rw of enrichment.bulletRewrites) {
    const job = data.jobs[rw.jobIndex]
    const currentBullet = job?.bullets?.[rw.bulletIndex]
    if (!job || typeof currentBullet !== 'string' || !rw.improved.trim()) continue
    if (rw.improved.trim() === currentBullet.trim()) continue

    const existingIdx = nextFixes.findIndex(
      (f) => f.target.kind === 'job-bullet' && f.target.jobIndex === rw.jobIndex && f.target.bulletIndex === rw.bulletIndex,
    )
    if (existingIdx >= 0) {
      nextFixes[existingIdx] = {
        ...nextFixes[existingIdx],
        explanation: rw.reason,
        suggestedText: rw.improved.trim(),
      }
    } else {
      const jobTitle = job.title.trim() || job.org.trim() || `Công việc #${rw.jobIndex + 1}`
      nextFixes.push({
        id: `ai-fix-job-${rw.jobIndex}-bullet-${rw.bulletIndex}`,
        severity: 'improvement',
        category: 'impact',
        scoreGain: 4,
        sectionKey: 'jobs',
        sectionLabel: `Kinh nghiệm #${rw.jobIndex + 1} (${jobTitle}) · Dòng ${rw.bulletIndex + 1}`,
        issueTitle: 'Gợi ý nâng cấp diễn đạt theo góc nhìn Nhà tuyển dụng',
        explanation: rw.reason,
        currentText: currentBullet,
        suggestedText: rw.improved.trim(),
        target: { kind: 'job-bullet', jobIndex: rw.jobIndex, bulletIndex: rw.bulletIndex, jobTitle },
      })
    }
  }

  // Merge missing skills if any
  const existingLower = new Set(data.skills.map((s) => s.trim().toLowerCase()))
  const newSkills = enrichment.missingSkills.map((s) => s.trim()).filter((s) => s && !existingLower.has(s.toLowerCase()))
  if (newSkills.length > 0) {
    const existingSkillFixIdx = nextFixes.findIndex((f) => f.target.kind === 'skills-add')
    const mergedSkills = Array.from(
      new Set([
        ...(existingSkillFixIdx >= 0 && nextFixes[existingSkillFixIdx].target.kind === 'skills-add'
          ? nextFixes[existingSkillFixIdx].target.suggestedSkills
          : []),
        ...newSkills,
      ]),
    ).slice(0, 8)

    if (existingSkillFixIdx >= 0) {
      nextFixes[existingSkillFixIdx] = {
        ...nextFixes[existingSkillFixIdx],
        suggestedText: mergedSkills.join(', '),
        target: { kind: 'skills-add', suggestedSkills: mergedSkills },
      }
    } else {
      nextFixes.push({
        id: 'ai-fix-skills-add',
        severity: 'improvement',
        category: 'ats',
        scoreGain: 5,
        sectionKey: 'skills',
        sectionLabel: 'Kỹ năng chuyên môn (ATS)',
        issueTitle: `Bổ sung ${mergedSkills.length} kỹ năng còn thiếu theo vị trí mục tiêu`,
        explanation: 'Thêm các từ khoá chuyên môn bạn thực sự nắm vững để tăng tỷ lệ vượt bộ lọc ATS.',
        currentText: data.skills.join(', ') || '(Chưa có kỹ năng)',
        suggestedText: mergedSkills.join(', '),
        target: { kind: 'skills-add', suggestedSkills: mergedSkills },
      })
    }
  }

  return {
    ...base,
    recruiterVerdict: enrichment.recruiterVerdict,
    strengths: enrichment.strengths.length > 0 ? enrichment.strengths : base.strengths,
    fixes: nextFixes,
    ...meta,
  }
}

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonError('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const parsed = ReviewRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Yêu cầu chấm điểm CV không hợp lệ.', 400)
  }

  const resumeData = normalizeResumeInput(parsed.data.resumeData)
  if (!resumeData) {
    return jsonError('Dữ liệu CV không hợp lệ.', 400)
  }

  const { targetRole, jdText, lang, hiddenSections } = parsed.data
  const effectiveRole = targetRole || resumeData.role
  const baseReport = evaluateCvReview(resumeData, lang, hiddenSections ?? [])

  try {
    const result = await runAiTask<DeepCvReviewResult>({
      req,
      feature: 'review-cv',
      systemPrompt:
        'You are a senior Vietnamese/English HR recruiter and ATS specialist. Review the candidate CV line-by-line against the targetRole and optional jdText. Return strictly valid JSON with keys: recruiterVerdict (string, 2-3 crisp sentences in requested lang), strengths (string[], 2-4 concise items), suggestedSummary (string, optional improved summary), bulletRewrites ({jobIndex:number, bulletIndex:number, improved:string, reason:string}[]), missingSkills (string[]). Never invent fake metrics; use [x]% placeholders if numbers are missing.',
      userPrompt: JSON.stringify({
        lang,
        targetRole: effectiveRole,
        jdText: jdText ?? '',
        currentScore: baseReport.overallScore,
        resumeData,
      }),
      validate: (obj) => {
        const res = AiReviewPayloadSchema.safeParse(obj)
        if (!res.success) return null
        const jdResult = jdText && jdText.length >= 20 ? localTailorCvToJd(resumeData, jdText, lang) : null
        return mergeEnrichedReview(baseReport, resumeData, res.data, {
          targetRole: effectiveRole || undefined,
          jdMatchScore: jdResult?.matchScore,
          missingJdKeywords: jdResult?.missingKeywords.slice(0, 6),
        })
      },
      fallback: () => {
        const hasJd = Boolean(jdText && jdText.length >= 20)
        const jdResult = hasJd ? localTailorCvToJd(resumeData, jdText!, lang) : null

        const existingLower = new Set(resumeData.skills.map((s) => s.trim().toLowerCase()))
        const roleMissingSkills = effectiveRole
          ? getSuggestedSkillsForRole(effectiveRole, lang).filter((s) => !existingLower.has(s.toLowerCase()))
          : []
        const combinedMissing = Array.from(
          new Set([...(jdResult?.missingKeywords ?? []), ...roleMissingSkills]),
        ).slice(0, 6)

        const verdict = jdResult
          ? `${baseReport.recruiterVerdict} Đối chiếu nhanh với JD${effectiveRole ? ` (${effectiveRole})` : ''}: mức khớp từ khoá đạt ${jdResult.matchScore}%.`
          : effectiveRole && effectiveRole !== resumeData.role
            ? `${baseReport.recruiterVerdict} Đã điều chỉnh gợi ý theo vị trí mục tiêu "${effectiveRole}".`
            : baseReport.recruiterVerdict

        const fallbackPayload: z.infer<typeof AiReviewPayloadSchema> = {
          recruiterVerdict: verdict,
          strengths: baseReport.strengths,
          suggestedSummary: jdResult?.suggestedSummary,
          bulletRewrites: (jdResult?.bulletRewrites ?? []).map((b) => ({
            jobIndex: b.jobIndex,
            bulletIndex: b.bulletIndex,
            improved: b.improved,
            reason: b.reason,
          })),
          missingSkills: combinedMissing,
        }

        return mergeEnrichedReview(baseReport, resumeData, fallbackPayload, {
          targetRole: effectiveRole || undefined,
          jdMatchScore: jdResult?.matchScore,
          missingJdKeywords: jdResult?.missingKeywords.slice(0, 6),
        })
      },
    })

    return jsonOk(result)
  } catch (err) {
    if (err instanceof AiQuotaExceededError) {
      return jsonError(err.message, 429, { limit: err.limit })
    }
    return jsonError('Không thể phân tích và chấm điểm CV lúc này.', 500)
  }
}
