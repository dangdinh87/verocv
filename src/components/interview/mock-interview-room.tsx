'use client'

import {
  ArrowRight,
  Check,
  CheckCircle,
  Lightbulb,
  Play,
  Sparkle,
  WarningCircle,
} from '@phosphor-icons/react/dist/ssr'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { MockInterviewEvaluation, MockInterviewQuestion } from '@/app/api/ai/mock-interview/route'
import { Button } from '@/components/ui/button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import { ScoreRing } from '@/components/ui/score-ring'
import { listCvs, type CvRecord } from '@/lib/cv-repository'
import { getApplications } from '@/lib/storage'
import { getPersonaData } from '@/types/resume'

const CATEGORY_LABEL: Record<MockInterviewQuestion['category'], { label: string; style: string }> = {
  behavioral: {
    label: 'Hành vi (STAR)',
    style: 'border border-pen/30 bg-pen-wash text-pen',
  },
  technical: {
    label: 'Chuyên môn',
    style: 'border border-mint/30 bg-mint-wash text-mint',
  },
  gap: {
    label: 'Khoảng trống CV–JD',
    style: 'border border-seal/30 bg-seal/10 text-seal',
  },
}

const STAR_ITEMS: { key: keyof MockInterviewEvaluation['starBreakdown']; short: string; label: string }[] = [
  { key: 'situation', short: 'S', label: 'Bối cảnh' },
  { key: 'task', short: 'T', label: 'Nhiệm vụ' },
  { key: 'action', short: 'A', label: 'Hành động' },
  { key: 'result', short: 'R', label: 'Kết quả' },
  { key: 'hasMetrics', short: '#', label: 'Số liệu' },
]

function detectLiveStarChecklist(answer: string): MockInterviewEvaluation['starBreakdown'] {
  const lower = answer.toLowerCase()
  return {
    situation: /\b(khi|lúc|tại|trong dự án|bối cảnh|đội ngũ|khách hàng|công ty|quý|when|at|during|project|team)\b/i.test(lower),
    task: /\b(mục tiêu|nhiệm vụ|vấn đề|bài toán|yêu cầu|chỉ tiêu|cần phải|khó khăn|goal|task|target|challenge|problem)\b/i.test(lower),
    action: /\b(tôi đã|mình đã|trực tiếp|xây dựng|triển khai|tối ưu|phân tích|đề xuất|phối hợp|thiết kế|built|led|implemented|optimized)\b/i.test(
      lower,
    ),
    result: /\b(kết quả|giúp|đạt|tăng|giảm|rút ngắn|tiết kiệm|hoàn thành|cải thiện|result|achieved|increased|reduced|saved|improved)\b/i.test(
      lower,
    ),
    hasMetrics: /\d|%|gấp đôi|gấp ba|gấp rưỡi|double|triple/i.test(answer),
  }
}

export function MockInterviewRoom() {
  const searchParams = useSearchParams()
  const appIdParam = searchParams.get('appId')
  const companyParam = searchParams.get('company')
  const roleParam = searchParams.get('role')

  const [cvs, setCvs] = useState<CvRecord[]>([])
  const [selectedCvId, setSelectedCvId] = useState<string>('')
  const [role, setRole] = useState(roleParam ?? '')
  const [company, setCompany] = useState(companyParam ?? '')
  const [jdText, setJdText] = useState('')
  const [initializedFromParams, setInitializedFromParams] = useState(false)

  const [questions, setQuestions] = useState<MockInterviewQuestion[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [evaluations, setEvaluations] = useState<Record<string, MockInterviewEvaluation>>({})
  const [showHint, setShowHint] = useState(true)

  const [startBusy, setStartBusy] = useState(false)
  const [evalBusy, setEvalBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providerLabel, setProviderLabel] = useState<string | null>(null)

  useEffect(() => {
    void listCvs().then((loaded) => {
      setCvs(loaded)
      if (loaded.length > 0) {
        const master = loaded.find((c) => c.isMaster) ?? loaded[0]
        setSelectedCvId((prev) => prev || master.id)
      }
    })
  }, [])

  useEffect(() => {
    if (initializedFromParams) return
    if (appIdParam) {
      const app = getApplications().find((a) => a.id === appIdParam)
      if (app) {
        setCompany(app.company)
        setRole(app.role)
        if (app.jdText) setJdText(app.jdText)
        if (app.linkedCvId) setSelectedCvId(app.linkedCvId)
      }
    }
    setInitializedFromParams(true)
  }, [appIdParam, initializedFromParams])

  const selectedCv = useMemo(() => cvs.find((c) => c.id === selectedCvId) ?? cvs[0] ?? null, [cvs, selectedCvId])
  const effectiveResumeData = useMemo(() => selectedCv?.data ?? getPersonaData('minh-anh'), [selectedCv])
  const lang = selectedCv?.settings.documentLanguage ?? 'vi'

  const currentQuestion = questions[activeIndex] ?? null
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] ?? '') : ''
  const currentEval = currentQuestion ? evaluations[currentQuestion.id] : undefined
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).filter(Boolean).length : 0
  const liveStar = useMemo(() => detectLiveStarChecklist(currentAnswer), [currentAnswer])

  const evaluatedScores = Object.values(evaluations).map((e) => e.score)
  const averageReadiness =
    evaluatedScores.length > 0 ? Math.round(evaluatedScores.reduce((acc, s) => acc + s, 0) / evaluatedScores.length) : 0

  const startSession = async () => {
    setStartBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          resumeData: effectiveResumeData,
          role: role.trim() || effectiveResumeData.role,
          company: company.trim(),
          jdText: jdText.trim(),
          lang,
        }),
      })
      const json = (await res.json()) as {
        data?: { questions?: MockInterviewQuestion[] }
        provider?: string
        error?: string
      }
      if (!res.ok || !json.data?.questions?.length) {
        setError(json.error || 'Không thể khởi tạo buổi phỏng vấn lúc này.')
        return
      }
      setQuestions(json.data.questions)
      setActiveIndex(0)
      setAnswers({})
      setEvaluations({})
      setShowHint(true)
      setProviderLabel(json.provider === 'workers-ai' ? 'Cloudflare Workers AI' : 'VeroCV Semantic Coach')
    } catch {
      setError('Lỗi kết nối tới máy chủ AI.')
    } finally {
      setStartBusy(false)
    }
  }

  const evaluateCurrent = async () => {
    if (!currentQuestion) return
    if (currentAnswer.trim().length < 5) {
      setError('Vui lòng nhập câu trả lời ít nhất 5 ký tự trước khi nhờ AI chấm điểm.')
      return
    }
    setEvalBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          resumeData: effectiveResumeData,
          role: role.trim() || effectiveResumeData.role,
          company: company.trim(),
          jdText: jdText.trim(),
          lang,
          question: currentQuestion.question,
          answer: currentAnswer,
        }),
      })
      const json = (await res.json()) as {
        data?: MockInterviewEvaluation
        provider?: string
        error?: string
      }
      if (!res.ok || !json.data) {
        setError(json.error || 'Không thể chấm điểm câu trả lời lúc này.')
        return
      }
      setEvaluations((prev) => ({ ...prev, [currentQuestion.id]: json.data! }))
      setProviderLabel(json.provider === 'workers-ai' ? 'Cloudflare Workers AI' : 'VeroCV Semantic Coach')
    } catch {
      setError('Lỗi kết nối tới máy chủ AI.')
    } finally {
      setEvalBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Setup Bar */}
      <section className="rounded-sheet border border-rule bg-paper p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Thiết lập buổi phỏng vấn thử</h2>
            <p className="text-sm text-ink-3">
              Chọn CV của bạn và vị trí ứng tuyển để AI Coach mô phỏng 6 câu hỏi sát thực tế nhất.
            </p>
          </div>
          {providerLabel && (
            <span className="rounded-full border border-rule bg-desk px-3 py-1 text-xs font-semibold text-ink-2">
              {providerLabel}
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SelectField
            label="CV tham chiếu"
            value={selectedCvId}
            onChange={(e) => setSelectedCvId(e.target.value)}
          >
            {cvs.length > 0 ? (
              cvs.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.title} {cv.data.role ? `(${cv.data.role})` : ''}
                </option>
              ))
            ) : (
              <option value="">CV mẫu: Nguyễn Minh Anh (Marketing)</option>
            )}
          </SelectField>

          <TextField
            label="Vị trí ứng tuyển"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={effectiveResumeData.role || 'VD: Frontend Developer, Chuyên viên Marketing…'}
          />

          <TextField
            label="Công ty mục tiêu"
            optional
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="VD: Techcombank, VNG, Shopee…"
          />
        </div>

        <div className="mt-4">
          <TextAreaField
            label="Mô tả công việc (JD)"
            optional
            rows={3}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Dán JD vào đây để AI hỏi xoáy đúng kỹ năng còn thiếu giữa CV và yêu cầu tuyển dụng…"
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-control border border-seal/30 bg-seal/10 px-4 py-2.5 text-sm font-medium text-seal">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-3">
            Gợi ý: câu trả lời chuẩn phỏng vấn thường dài 70–140 từ, đủ 4 bước Situation – Task – Action – Result và có số liệu thật.
          </p>
          <Button onClick={() => void startSession()} disabled={startBusy} className="gap-2">
            <Play size={15} weight="fill" aria-hidden="true" />
            {startBusy ? 'AI đang chuẩn bị bộ 6 câu hỏi…' : questions.length > 0 ? 'Bắt đầu phiên mới' : 'Bắt đầu buổi phỏng vấn AI'}
          </Button>
        </div>
      </section>

      {/* Active Studio */}
      {questions.length > 0 && currentQuestion && (
        <section className="space-y-5">
          {/* 6-Question Stepper + Readiness Gauge */}
          <div className="flex flex-col gap-4 rounded-sheet border border-rule bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                  Tiến độ buổi phỏng vấn ({evaluatedScores.length}/{questions.length} câu đã chấm)
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Danh sách câu hỏi phỏng vấn">
                {questions.map((q, idx) => {
                  const active = idx === activeIndex
                  const ev = evaluations[q.id]
                  return (
                    <button
                      key={q.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setActiveIndex(idx)
                        setError(null)
                      }}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-pen bg-pen text-white'
                          : ev
                            ? 'border-mint/40 bg-mint-wash/60 text-ink hover:border-mint'
                            : 'border-rule bg-desk text-ink-2 hover:border-pen/40 hover:text-ink'
                      }`}
                    >
                      <span>Câu {idx + 1}</span>
                      {ev && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                            active ? 'bg-paper/20 text-white' : 'bg-paper text-mint'
                          }`}
                        >
                          {ev.score}đ
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 self-start rounded-control border border-rule bg-desk px-3.5 py-2 sm:self-center">
              <ScoreRing score={averageReadiness} size={64} strokeWidth={5} label="Sẵn sàng" />
              <div className="text-xs">
                <p className="font-bold text-ink">Điểm trung bình</p>
                <p className="mt-0.5 text-ink-3">
                  {evaluatedScores.length === 0
                    ? 'Chưa chấm câu nào'
                    : averageReadiness >= 80
                      ? 'Sẵn sàng vào vòng trong'
                      : averageReadiness >= 60
                        ? 'Khá tốt, trau chuốt thêm'
                        : 'Cần bổ sung STAR & số liệu'}
                </p>
              </div>
            </div>
          </div>

          {/* Two-column Interview & Feedback Workspace */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {/* Left: Question + Answer Input + Live STAR */}
            <div className="space-y-4 rounded-sheet border border-rule bg-paper p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${CATEGORY_LABEL[currentQuestion.category].style}`}>
                  {CATEGORY_LABEL[currentQuestion.category].label}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-pen hover:underline"
                >
                  <Lightbulb size={14} weight="fill" aria-hidden="true" />
                  {showHint ? 'Ẩn gợi ý trả lời' : 'Xem gợi ý trả lời'}
                </button>
              </div>

              <h3 className="font-display text-lg font-bold leading-snug text-ink">
                Câu {activeIndex + 1}. {currentQuestion.question}
              </h3>

              {showHint && (
                <div className="rounded-control border border-pen/25 bg-pen-wash/40 px-3.5 py-2.5 text-xs leading-relaxed text-ink-2">
                  <strong className="text-pen">Gợi ý từ Coach:</strong> {currentQuestion.hint}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="mock-interview-answer" className="text-sm font-semibold text-ink-2">
                    Câu trả lời của bạn
                  </label>
                  <span className="text-xs font-medium tabular-nums text-ink-3">{wordCount} từ</span>
                </div>
                <textarea
                  id="mock-interview-answer"
                  rows={7}
                  value={currentAnswer}
                  onChange={(e) => {
                    const val = e.target.value
                    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }))
                    if (error) setError(null)
                  }}
                  placeholder="Nhập câu trả lời như khi bạn đang trao đổi trực tiếp với nhà tuyển dụng (nên đi theo 4 bước STAR và có con số thực tế)…"
                  className="mt-1.5 w-full rounded-control border border-rule bg-paper px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-3/70 focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30"
                />
              </div>

              {/* Live STAR Structure Checklist */}
              <div className="rounded-control border border-rule bg-desk p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Kiểm tra cấu trúc STAR trực tiếp</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STAR_ITEMS.map((item) => {
                    const hit = liveStar[item.key]
                    return (
                      <span
                        key={item.key}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          hit
                            ? 'border-mint/40 bg-mint-wash text-mint'
                            : 'border-rule bg-paper text-ink-3'
                        }`}
                      >
                        {hit && <Check size={12} weight="bold" aria-hidden="true" />}
                        <span>
                          {item.short} · {item.label}
                        </span>
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Button
                  variant="secondary"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                >
                  Câu trước
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void evaluateCurrent()} disabled={evalBusy} className="gap-1.5">
                    <Sparkle size={15} weight="fill" aria-hidden="true" />
                    {evalBusy ? 'AI đang chấm điểm…' : 'Chấm điểm & Góp ý (AI Coach)'}
                  </Button>
                  {activeIndex < questions.length - 1 && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setActiveIndex((i) => Math.min(questions.length - 1, i + 1))
                        setError(null)
                      }}
                      className="gap-1"
                    >
                      Câu tiếp theo
                      <ArrowRight size={14} weight="bold" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Detailed AI Coach Feedback */}
            <div className="rounded-sheet border border-rule bg-paper p-5">
              {!currentEval ? (
                <div className="flex h-full flex-col justify-center space-y-3 py-6 text-center">
                  <img
                    src="/images/avatars/khanh-linh.jpg"
                    alt="Khánh Linh — AI Hiring Manager & STAR Coach"
                    className="mx-auto size-16 rounded-full border border-rule object-cover"
                  />
                  <div>
                    <h4 className="font-display text-base font-bold text-ink">
                      Khánh Linh · AI Hiring Manager &amp; STAR Coach
                    </h4>
                    <p className="text-xs font-medium text-pen">Đang chờ câu trả lời của bạn</p>
                  </div>
                  <p className="mx-auto max-w-[36ch] text-sm leading-relaxed text-ink-2">
                    Nhập câu trả lời ở khung bên trái rồi bấm <strong>“Chấm điểm &amp; Góp ý”</strong> để nhận phân tích S–T–A–R, câu trả lời mẫu cá nhân hoá từ CV và câu hỏi xoáy tiếp theo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-rule pb-4">
                    <ScoreRing score={currentEval.score} size={72} strokeWidth={6} label="Điểm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <img
                          src="/images/avatars/khanh-linh.jpg"
                          alt="Khánh Linh"
                          className="size-6 rounded-full border border-rule object-cover"
                        />
                        <p className="text-xs font-bold uppercase tracking-wider text-ink-3">
                          Nhận xét từ Khánh Linh (AI Coach)
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{currentEval.verdict}</p>
                    </div>
                  </div>

                  {/* S/T/A/R/Metrics Breakdown */}
                  <div className="flex flex-wrap gap-1.5">
                    {STAR_ITEMS.map((item) => {
                      const ok = currentEval.starBreakdown[item.key]
                      return (
                        <span
                          key={item.key}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                            ok ? 'border-mint/30 bg-mint-wash text-mint' : 'border-seal/30 bg-seal/10 text-seal'
                          }`}
                        >
                          {ok ? <CheckCircle size={12} weight="fill" aria-hidden="true" /> : <WarningCircle size={12} weight="fill" aria-hidden="true" />}
                          {item.short} · {item.label}
                        </span>
                      )
                    })}
                  </div>

                  {/* Strengths */}
                  {currentEval.strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-mint">Điểm mạnh</p>
                      <ul className="space-y-1 p-0 text-sm text-ink-2">
                        {currentEval.strengths.map((s) => (
                          <li key={s} className="flex list-none items-start gap-2">
                            <Check size={14} weight="bold" className="mt-1 shrink-0 text-mint" aria-hidden="true" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {currentEval.gaps.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-seal">Điểm thiếu cần bổ sung</p>
                      <ul className="space-y-1 p-0 text-sm text-ink-2">
                        {currentEval.gaps.map((g) => (
                          <li key={g} className="flex list-none items-start gap-2">
                            <WarningCircle size={14} weight="fill" className="mt-1 shrink-0 text-seal" aria-hidden="true" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improved Answer */}
                  <div className="rounded-control border border-pen/30 bg-pen-wash/40 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-pen">Câu trả lời mẫu nâng cấp (STAR)</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: currentEval.improvedAnswer,
                          }))
                        }
                      >
                        Dùng làm gợi ý
                      </Button>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink">{currentEval.improvedAnswer}</p>
                  </div>

                  {/* Follow-up Question */}
                  <div className="rounded-control border border-rule bg-desk p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Câu hỏi xoáy tiếp theo (Follow-up)</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{currentEval.followUpQuestion}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
