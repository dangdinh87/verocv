'use client'

import {
  ArrowRight,
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  Lightning,
  Plus,
  Sparkle,
  Target,
  Warning,
} from '@phosphor-icons/react/dist/ssr'
import { useEffect, useMemo, useState } from 'react'
import type { DeepCvReviewResult } from '@/app/api/ai/review-cv/route'
import { Button } from '@/components/ui/button'
import { evaluateCvReview, type CvLineFix, type CvReviewReport, type CvSubScores } from '@/lib/cv-reviewer'
import { computeInitials } from '@/types/resume'
import { useEditorStore } from '@/store/editor-store'
import type { ResumeDocumentV2 } from '@/types/schema'

type FilterKey = 'all' | 'critical' | 'impact' | 'ats' | 'clarity'

const SUB_SCORE_META: { key: keyof CvSubScores; label: string }[] = [
  { key: 'ats', label: 'Chuẩn ATS' },
  { key: 'impact', label: 'Số liệu & Tác động' },
  { key: 'clarity', label: 'Diễn đạt rõ ràng' },
  { key: 'completeness', label: 'Độ đầy đủ' },
  { key: 'formatting', label: 'Định dạng' },
]

const SEVERITY_STYLES: Record<CvLineFix['severity'], { badge: string; label: string }> = {
  critical: {
    badge: 'border border-seal/30 bg-seal/10 text-seal',
    label: 'Nghiêm trọng',
  },
  improvement: {
    badge: 'border border-pen/30 bg-pen-wash text-pen',
    label: 'Nên cải thiện',
  },
  polish: {
    badge: 'border border-mint/30 bg-mint-wash/70 text-mint',
    label: 'Trau chuốt',
  },
}

function getScoreTone(score: number): { stroke: string; badge: string } {
  if (score >= 85) {
    return {
      stroke: 'text-mint',
      badge: 'border border-mint/30 bg-mint-wash text-mint',
    }
  }
  if (score >= 70) {
    return {
      stroke: 'text-pen',
      badge: 'border border-pen/30 bg-pen-wash text-pen',
    }
  }
  if (score >= 50) {
    return {
      stroke: 'text-pen',
      badge: 'border border-kraft-deep bg-kraft text-pen-dark',
    }
  }
  return {
    stroke: 'text-seal',
    badge: 'border border-seal/30 bg-seal/10 text-seal',
  }
}

function applyFixToDraft(draft: ResumeDocumentV2, fix: CvLineFix, overrideValue?: string): boolean {
  const value = (overrideValue ?? fix.suggestedText ?? '').trim()
  const target = fix.target

  if (target.kind === 'summary') {
    if (!value) return false
    draft.data.summary = value
    return true
  }

  if (target.kind === 'job-bullet') {
    const job = draft.data.jobs[target.jobIndex]
    if (!job || typeof job.bullets[target.bulletIndex] !== 'string' || !value) return false
    job.bullets[target.bulletIndex] = value
    return true
  }

  if (target.kind === 'custom-bullet') {
    const cs = (draft.data.customSections ?? []).find((s) => s.id === target.sectionId)
    const entry = cs?.entries[target.entryIndex]
    if (!entry || typeof entry.bullets[target.bulletIndex] !== 'string' || !value) return false
    entry.bullets[target.bulletIndex] = value
    return true
  }

  if (target.kind === 'skills-add') {
    const skillsToAdd = value
      ? value
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : target.suggestedSkills
    if (skillsToAdd.length === 0) return false
    const existing = new Set(draft.data.skills.map((s) => s.trim().toLowerCase()))
    let added = false
    for (const skill of skillsToAdd) {
      if (!existing.has(skill.toLowerCase())) {
        draft.data.skills.push(skill)
        existing.add(skill.toLowerCase())
        added = true
      }
    }
    return added
  }

  if (target.kind === 'field') {
    if (!value) return false
    draft.data[target.field] = value
    if (target.field === 'name' && !draft.data.initials.trim()) {
      draft.data.initials = computeInitials(value)
    }
    return true
  }

  return false
}

export function AiReviewPanel({
  onJumpToSection,
  compact = false,
}: {
  onJumpToSection?: (sectionKey: string) => void
  compact?: boolean
}): React.JSX.Element {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const setActiveTab = useEditorStore((s) => s.setActiveTab)
  const setActiveSection = useEditorStore((s) => s.setActiveSection)

  const [filter, setFilter] = useState<FilterKey>('all')
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({})
  const [aiOpen, setAiOpen] = useState(false)
  const [targetRole, setTargetRole] = useState('')
  const [jdText, setJdText] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{
    data: DeepCvReviewResult
    provider: string
    baselineSnapshot: { summary: string; jobBullets: Record<string, string>; skillsCount: number }
  } | null>(null)

  const lang = doc?.settings.documentLanguage ?? 'vi'
  const baseReport = useMemo<CvReviewReport | null>(() => {
    if (!doc) return null
    return evaluateCvReview(doc.data, lang, doc.settings.hiddenSections)
  }, [doc, lang])

  const effectiveReport = useMemo<
    (CvReviewReport & { jdMatchScore?: number; provider?: string }) | null
  >(() => {
    if (!baseReport || !doc) return null
    if (!aiResult) return baseReport

    // Keep live subScores and overallScore reactive to every edit, while merging AI verdict & untouched AI rewrites
    const mergedFixes: CvLineFix[] = baseReport.fixes.map((fix) => {
      const aiMatch = aiResult.data.fixes.find(
        (af) =>
          af.target.kind === fix.target.kind &&
          (af.target.kind === 'summary' ||
            af.target.kind === 'skills-add' ||
            (af.target.kind === 'job-bullet' &&
              fix.target.kind === 'job-bullet' &&
              af.target.jobIndex === fix.target.jobIndex &&
              af.target.bulletIndex === fix.target.bulletIndex)),
      )
      if (!aiMatch?.suggestedText) return fix
      return {
        ...fix,
        explanation: aiMatch.explanation,
        suggestedText: aiMatch.suggestedText,
        target: aiMatch.target,
      }
    })

    // Add AI-specific fixes (e.g. semantic bullet/summary rewrites on lines without deterministic errors) if not yet applied
    for (const af of aiResult.data.fixes) {
      if (!af.id.startsWith('ai-fix-')) continue
      if (af.target.kind === 'summary') {
        if (doc.data.summary.trim() === (af.suggestedText ?? '').trim()) continue
        if (!mergedFixes.some((f) => f.target.kind === 'summary')) mergedFixes.unshift(af)
      } else if (af.target.kind === 'job-bullet') {
        const current = doc.data.jobs[af.target.jobIndex]?.bullets?.[af.target.bulletIndex]
        if (typeof current !== 'string' || current.trim() === (af.suggestedText ?? '').trim()) continue
        const exists = mergedFixes.some(
          (f) =>
            f.target.kind === 'job-bullet' &&
            af.target.kind === 'job-bullet' &&
            f.target.jobIndex === af.target.jobIndex &&
            f.target.bulletIndex === af.target.bulletIndex,
        )
        if (!exists) mergedFixes.push(af)
      } else if (af.target.kind === 'skills-add') {
        const existingLower = new Set(doc.data.skills.map((s) => s.trim().toLowerCase()))
        const remaining = af.target.suggestedSkills.filter((s) => !existingLower.has(s.toLowerCase()))
        if (remaining.length === 0) continue
        if (!mergedFixes.some((f) => f.target.kind === 'skills-add')) {
          mergedFixes.push({
            ...af,
            suggestedText: remaining.join(', '),
            target: { kind: 'skills-add', suggestedSkills: remaining },
          })
        }
      }
    }

    return {
      ...baseReport,
      recruiterVerdict: aiResult.data.recruiterVerdict,
      strengths: aiResult.data.strengths.length > 0 ? aiResult.data.strengths : baseReport.strengths,
      fixes: mergedFixes,
      jdMatchScore: aiResult.data.jdMatchScore,
      provider: aiResult.provider,
    }
  }, [baseReport, doc, aiResult])

  // Smooth animated score counter
  const targetScore = effectiveReport?.overallScore ?? 0
  const [displayScore, setDisplayScore] = useState(targetScore)

  useEffect(() => {
    if (displayScore === targetScore) return
    const diff = targetScore - displayScore
    const step = diff > 0 ? Math.max(1, Math.ceil(diff / 8)) : Math.min(-1, Math.floor(diff / 8))
    const timer = setTimeout(() => {
      setDisplayScore((prev) => {
        const next = prev + step
        if ((step > 0 && next >= targetScore) || (step < 0 && next <= targetScore)) return targetScore
        return next
      })
    }, 24)
    return () => clearTimeout(timer)
  }, [displayScore, targetScore])

  if (!doc || !effectiveReport) {
    return <div className="rounded-sheet border border-rule bg-paper p-5 text-sm text-ink-3">Chưa có dữ liệu CV để chấm điểm.</div>
  }

  const tone = getScoreTone(effectiveReport.overallScore)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (circumference * Math.max(0, Math.min(100, displayScore))) / 100

  const counts = {
    all: effectiveReport.fixes.length,
    critical: effectiveReport.fixes.filter((f) => f.severity === 'critical').length,
    impact: effectiveReport.fixes.filter((f) => f.category === 'impact').length,
    ats: effectiveReport.fixes.filter((f) => f.category === 'ats').length,
    clarity: effectiveReport.fixes.filter((f) => f.category === 'clarity').length,
  }

  const filteredFixes = effectiveReport.fixes.filter((fix) => {
    if (filter === 'all') return true
    if (filter === 'critical') return fix.severity === 'critical'
    return fix.category === filter
  })

  const quickApplyCandidates = filteredFixes.filter(
    (fix) => fix.target.kind === 'skills-add' || Boolean((draftEdits[fix.id] ?? fix.suggestedText)?.trim()),
  )

  const handleJump = (sectionKey: string) => {
    if (onJumpToSection) {
      onJumpToSection(sectionKey)
      return
    }
    setActiveTab('content')
    setActiveSection(sectionKey)
  }

  const handleApplyFix = (fix: CvLineFix) => {
    const edited = draftEdits[fix.id] ?? fix.suggestedText ?? ''
    updateDoc((draft) => {
      applyFixToDraft(draft, fix, edited)
    }, `Áp dụng gợi ý AI Review: ${fix.issueTitle}`)
  }

  const handleApplyAll = () => {
    if (quickApplyCandidates.length === 0) return
    updateDoc((draft) => {
      for (const fix of quickApplyCandidates) {
        applyFixToDraft(draft, fix, draftEdits[fix.id] ?? fix.suggestedText)
      }
    }, `Áp dụng nhanh ${quickApplyCandidates.length} gợi ý AI Review`)
  }

  const runDeepAiReview = async () => {
    setAiBusy(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/review-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: doc.data,
          targetRole: targetRole.trim() || doc.data.role,
          jdText: jdText.trim() || undefined,
          lang,
          hiddenSections: doc.settings.hiddenSections,
        }),
      })
      const json = (await res.json()) as { data?: DeepCvReviewResult; provider?: string; error?: string }
      if (!res.ok || !json.data) {
        setAiError(json.error || 'Không thể chạy AI chấm điểm chuyên sâu lúc này.')
        return
      }
      setAiResult({
        data: json.data,
        provider: json.provider ?? 'local-engine',
        baselineSnapshot: {
          summary: doc.data.summary,
          jobBullets: Object.fromEntries(
            doc.data.jobs.flatMap((j, ji) => j.bullets.map((b, bi) => [`${ji}-${bi}`, b])),
          ),
          skillsCount: doc.data.skills.length,
        },
      })
    } catch {
      setAiError('Không thể kết nối tới máy chủ AI. Vui lòng thử lại sau.')
    } finally {
      setAiBusy(false)
    }
  }

  const filterPills: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'critical', label: 'Nghiêm trọng', count: counts.critical },
    { key: 'impact', label: 'Số liệu & Tác động', count: counts.impact },
    { key: 'ats', label: 'ATS', count: counts.ats },
    { key: 'clarity', label: 'Diễn đạt', count: counts.clarity },
  ]

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {/* Top Score Header */}
      <section className={`rounded-sheet border border-rule bg-paper ${compact ? 'p-4' : 'p-5'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* SVG Circular Gauge */}
          <div className="relative flex size-24 shrink-0 items-center justify-center self-start sm:self-center">
            <svg className="size-24 -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
              <circle cx="44" cy="44" r={radius} fill="none" strokeWidth="7" className="stroke-rule" />
              <circle
                cx="44"
                cy="44"
                r={radius}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`stroke-current transition-[stroke-dashoffset] duration-300 ${tone.stroke}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-2xl font-extrabold leading-none tabular-nums text-ink">{displayScore}</span>
              <span className="mt-0.5 text-[11px] font-semibold text-ink-3">/100</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${tone.badge}`}>
                {effectiveReport.gradeLabel}
              </span>
              {effectiveReport.jdMatchScore !== undefined && (
                <span className="inline-flex items-center gap-1 rounded-full border border-pen/30 bg-pen-wash px-2.5 py-0.5 text-xs font-bold text-pen">
                  <Target size={12} weight="bold" aria-hidden="true" />
                  Khớp JD {effectiveReport.jdMatchScore}%
                </span>
              )}
              {effectiveReport.provider && (
                <span className="rounded-full border border-rule bg-desk px-2.5 py-0.5 text-[11px] font-semibold text-ink-3">
                  {effectiveReport.provider === 'workers-ai' ? 'Cloudflare Workers AI' : 'VeroCV Semantic Engine'}
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Đánh giá 6 giây từ Nhà tuyển dụng</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{effectiveReport.recruiterVerdict}</p>
            </div>
          </div>
        </div>

        {/* Strengths Pills */}
        {effectiveReport.strengths.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-rule pt-3">
            {effectiveReport.strengths.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full border border-mint/30 bg-mint-wash/60 px-2.5 py-1 text-xs font-medium text-ink"
              >
                <CheckCircle size={13} weight="fill" className="shrink-0 text-mint" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        )}

        {/* 5 Horizontal Sub-score Progress Bars */}
        <div className="mt-4 grid gap-2.5 border-t border-rule pt-4 sm:grid-cols-2">
          {SUB_SCORE_META.map(({ key, label }) => {
            const val = effectiveReport.subScores[key]
            const barColor = val >= 80 ? 'bg-mint' : val >= 55 ? 'bg-pen' : 'bg-seal'
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-2">{label}</span>
                  <span className="font-bold tabular-nums text-ink">{val}/100</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule">
                  <div className={`h-full rounded-full transition-[width] duration-300 ${barColor}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Optional AI Deep Review Trigger */}
      <section className="rounded-sheet border border-pen/30 bg-pen-wash/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2 text-left text-sm font-bold text-ink"
          >
            <Sparkle size={16} weight="fill" className="shrink-0 text-pen" aria-hidden="true" />
            <span>Chấm &amp; Viết lại chuyên sâu theo vị trí / JD</span>
            {aiOpen ? <CaretUp size={14} weight="bold" aria-hidden="true" /> : <CaretDown size={14} weight="bold" aria-hidden="true" />}
          </button>

          {!aiOpen && (
            <Button size="sm" variant="secondary" onClick={() => setAiOpen(true)} className="gap-1.5">
              <Sparkle size={14} weight="fill" className="text-pen" aria-hidden="true" />
              Mở AI chuyên sâu
            </Button>
          )}
        </div>

        {aiOpen && (
          <div className="mt-3 space-y-3 border-t border-pen/20 pt-3">
            <div>
              <label htmlFor="ai-review-target-role" className="text-xs font-semibold text-ink-2">
                Vị trí mục tiêu
              </label>
              <input
                id="ai-review-target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={doc.data.role || 'Ví dụ: Senior Frontend Developer, Chuyên viên Marketing…'}
                className="mt-1 h-10 w-full rounded-control border border-rule bg-paper px-3 text-sm text-ink placeholder:text-ink-3/70 focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30"
              />
            </div>

            <div>
              <label htmlFor="ai-review-jd" className="text-xs font-semibold text-ink-2">
                Mô tả công việc / JD <span className="font-normal text-ink-3">(không bắt buộc)</span>
              </label>
              <textarea
                id="ai-review-jd"
                rows={3}
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value)
                  setAiError(null)
                }}
                placeholder="Dán JD vào đây để AI đối chiếu từ khoá và viết lại từng dòng khớp yêu cầu tuyển dụng…"
                className="mt-1 w-full rounded-control border border-rule bg-paper px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-3/70 focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30"
              />
            </div>

            {aiError && (
              <p role="alert" className="rounded-control border border-seal/30 bg-seal/10 px-3 py-2 text-xs font-medium text-seal">
                {aiError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-3">AI không bịa số liệu thật — các vị trí cần điền sẽ dùng [x]% để bạn tự sửa.</p>
              <Button size="sm" onClick={() => void runDeepAiReview()} disabled={aiBusy} className="gap-1.5">
                <Sparkle size={14} weight="fill" aria-hidden="true" />
                {aiBusy ? 'AI đang chấm & viết lại…' : 'AI Chấm & Sửa chuyên sâu'}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Filter Pills + Quick Apply All */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Lọc gợi ý sửa CV">
          {filterPills.map((pill) => {
            const active = filter === pill.key
            return (
              <button
                key={pill.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(pill.key)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-pen bg-pen text-white'
                    : 'border-rule bg-paper text-ink-2 hover:border-pen/40 hover:text-ink'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active ? 'bg-paper/20 text-white' : 'bg-desk text-ink-3'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            )
          })}
        </div>

        {quickApplyCandidates.length > 0 && (
          <Button size="sm" variant="secondary" onClick={handleApplyAll} className="gap-1.5">
            <Lightning size={14} weight="fill" className="text-pen" aria-hidden="true" />
            Áp dụng nhanh tất cả gợi ý ({quickApplyCandidates.length})
          </Button>
        )}
      </div>

      {/* Line-by-Line Fix Cards */}
      {filteredFixes.length === 0 ? (
        <div className="flex items-start gap-3 rounded-sheet border border-mint/30 bg-mint-wash/40 p-4">
          <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-ink">
              {effectiveReport.fixes.length === 0
                ? 'Tuyệt vời! Không phát hiện lỗi hay điểm yếu nào.'
                : 'Không có mục nào trong bộ lọc này.'}
            </p>
            <p className="mt-0.5 text-xs text-ink-2">
              {effectiveReport.fixes.length === 0
                ? 'CV của bạn đã đạt chuẩn ATS và số liệu rõ ràng. Bạn có thể xuất PDF hoặc chia sẻ link ngay.'
                : 'Chuyển sang tab "Tất cả" để xem các gợi ý tinh chỉnh còn lại.'}
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3 p-0">
          {filteredFixes.map((fix) => {
            const sev = SEVERITY_STYLES[fix.severity]
            const draftValue = draftEdits[fix.id] ?? fix.suggestedText ?? ''
            const canApply =
              fix.target.kind === 'skills-add'
                ? Boolean(draftValue.trim() || fix.target.suggestedSkills.length > 0)
                : Boolean(draftValue.trim())

            return (
              <li key={fix.id} className="list-none rounded-sheet border border-rule bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${sev.badge}`}>
                      {fix.severity === 'critical' && <Warning size={11} weight="fill" aria-hidden="true" />}
                      {sev.label}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-mint/30 bg-mint-wash/60 px-2 py-0.5 text-[11px] font-bold tabular-nums text-mint">
                      +{fix.scoreGain} điểm
                    </span>
                  </div>
                  <span className="text-xs font-medium text-ink-3">{fix.sectionLabel}</span>
                </div>

                <h4 className="mt-2 font-display text-sm font-bold text-ink">{fix.issueTitle}</h4>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">{fix.explanation}</p>

                {/* Before Box */}
                <div className="mt-3 rounded-control border border-rule bg-desk px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Hiện tại</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-2">
                    {fix.currentText ? fix.currentText : <span className="italic text-ink-3">(Chưa có nội dung)</span>}
                  </p>
                </div>

                {/* Editable After Box */}
                <div className="mt-2.5 rounded-control border border-pen/30 bg-pen-wash/40 px-3 py-2.5">
                  <label htmlFor={`fix-edit-${fix.id}`} className="block text-[11px] font-bold uppercase tracking-wider text-pen">
                    {fix.target.kind === 'field' && !fix.suggestedText
                      ? 'Nhập thông tin bổ sung ngay tại đây'
                      : 'Đề xuất sửa — có thể gõ lại số liệu thật'}
                  </label>

                  {fix.target.kind === 'skills-add' && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {fix.target.suggestedSkills.map((skill) => {
                        const activeList = draftValue
                          .split(/[,;\n]/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                        const selected = activeList.some((s) => s.toLowerCase() === skill.toLowerCase())
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? activeList.filter((s) => s.toLowerCase() !== skill.toLowerCase())
                                : [...activeList, skill]
                              setDraftEdits((prev) => ({ ...prev, [fix.id]: next.join(', ') }))
                            }}
                            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                              selected
                                ? 'border-pen bg-pen text-white'
                                : 'border-rule bg-paper text-ink-2 hover:border-pen/40'
                            }`}
                          >
                            {selected ? <Check size={11} weight="bold" aria-hidden="true" /> : <Plus size={11} weight="bold" aria-hidden="true" />}
                            {skill}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {fix.target.kind === 'field' ? (
                    <input
                      id={`fix-edit-${fix.id}`}
                      type="text"
                      value={draftValue}
                      onChange={(e) => setDraftEdits((prev) => ({ ...prev, [fix.id]: e.target.value }))}
                      placeholder={`Nhập ${fix.sectionLabel.split('·').pop()?.trim().toLowerCase() || 'nội dung'}…`}
                      className="mt-1.5 h-9 w-full rounded-control border border-rule bg-paper px-2.5 text-xs text-ink focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30"
                    />
                  ) : (
                    <textarea
                      id={`fix-edit-${fix.id}`}
                      rows={fix.target.kind === 'summary' ? 3 : 2}
                      value={draftValue}
                      onChange={(e) => setDraftEdits((prev) => ({ ...prev, [fix.id]: e.target.value }))}
                      className="mt-1.5 w-full rounded-control border border-rule bg-paper px-2.5 py-1.5 text-xs leading-relaxed text-ink focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30"
                    />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleJump(fix.sectionKey)} className="gap-1 text-xs">
                    Đi tới mục
                    <ArrowRight size={13} weight="bold" aria-hidden="true" />
                  </Button>
                  <Button size="sm" disabled={!canApply} onClick={() => handleApplyFix(fix)} className="gap-1 text-xs">
                    <Check size={13} weight="bold" aria-hidden="true" />
                    Áp dụng sửa
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
