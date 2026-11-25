'use client'

import { Check, Copy, CopySimple, Plus, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AiReviewPanel } from '@/components/cv/ai-review-panel'
import { Button } from '@/components/ui/button'
import { TextAreaField } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { newId, saveCv } from '@/lib/cv-repository'
import { evaluateCvReview } from '@/lib/cv-reviewer'
import { formatResumeAsAtsText, matchResumeAgainstJd } from '@/lib/jd-matcher'
import type { JdTailorOutput } from '@/server/ai/local-fallback'
import { useEditorStore } from '@/store/editor-store'
import { migrateToV2 } from '@/types/schema'

export type AuditTab = 'audit' | 'jd' | 'ats'

export function QualityAuditModal({
  open,
  initialTab = 'audit',
  onClose,
  onJumpToSection,
}: {
  open: boolean
  initialTab?: AuditTab
  onClose: () => void
  onJumpToSection?: (sectionKey: string) => void
}) {
  const router = useRouter()
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const setActiveTab = useEditorStore((s) => s.setActiveTab)
  const setActiveSection = useEditorStore((s) => s.setActiveSection)

  const [tab, setTab] = useState<AuditTab>(initialTab)
  const [jdText, setJdText] = useState('')
  const [copied, setCopied] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiTailor, setAiTailor] = useState<{ data: JdTailorOutput; provider: string } | null>(null)
  const [applySummary, setApplySummary] = useState(true)
  const [selectedBullets, setSelectedBullets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  if (!doc) return null

  const lang = doc.settings.documentLanguage ?? 'vi'
  const reviewScore = open ? evaluateCvReview(doc.data, lang, doc.settings.hiddenSections).overallScore : 0
  const jdResult = open && tab === 'jd' ? matchResumeAgainstJd(doc.data, jdText) : null
  const atsText = open && tab === 'ats' ? formatResumeAsAtsText(doc.data, lang) : ''

  const tabs: TabItem<AuditTab>[] = [
    { id: 'audit', label: `AI Review & Soát lỗi (${reviewScore}/100)` },
    { id: 'jd', label: 'Đối chiếu & AI Tailor JD' },
    { id: 'ats', label: 'Văn bản ATS' },
  ]

  const addSkill = (skill: string) => {
    updateDoc((draft) => {
      if (!draft.data.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        draft.data.skills.push(skill)
      }
    }, `Thêm kỹ năng ${skill}`)
  }

  const runAiTailor = async () => {
    if (jdText.trim().length < 20) {
      setAiError('Vui lòng dán mô tả công việc đầy đủ (tối thiểu 20 ký tự) để AI phân tích.')
      return
    }
    setAiBusy(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/tailor-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: doc.data, jdText, lang }),
      })
      const json = (await res.json()) as { data?: JdTailorOutput; provider?: string; error?: string }
      if (!res.ok || !json.data) {
        setAiError(json.error || 'Không thể phân tích JD lúc này.')
        return
      }
      setAiTailor({ data: json.data, provider: json.provider ?? 'local-engine' })
      setApplySummary(true)
      const initialSel: Record<string, boolean> = {}
      json.data.bulletRewrites.forEach((b) => {
        initialSel[`${b.jobIndex}-${b.bulletIndex}`] = true
      })
      setSelectedBullets(initialSel)
    } catch {
      setAiError('Lỗi kết nối tới máy chủ AI.')
    } finally {
      setAiBusy(false)
    }
  }

  const applyTailorInPlace = () => {
    if (!aiTailor) return
    updateDoc((draft) => {
      if (applySummary && aiTailor.data.suggestedSummary.trim()) {
        draft.data.summary = aiTailor.data.suggestedSummary
      }
      for (const b of aiTailor.data.bulletRewrites) {
        if (!selectedBullets[`${b.jobIndex}-${b.bulletIndex}`]) continue
        const job = draft.data.jobs[b.jobIndex]
        if (job && typeof job.bullets[b.bulletIndex] === 'string') {
          job.bullets[b.bulletIndex] = b.improved
        }
      }
    }, 'Áp dụng AI tối ưu theo JD')
    onClose()
  }

  const createTailoredVariant = async () => {
    if (!aiTailor) return
    const now = new Date().toISOString()
    const cloned = migrateToV2({
      ...JSON.parse(JSON.stringify(doc)),
      id: newId('cv'),
      title: `${doc.title} (Tailored JD)`,
      isMaster: false,
      parentCvId: doc.id,
      createdAt: now,
      updatedAt: now,
    })
    if (applySummary && aiTailor.data.suggestedSummary.trim()) {
      cloned.data.summary = aiTailor.data.suggestedSummary
    }
    for (const b of aiTailor.data.bulletRewrites) {
      if (!selectedBullets[`${b.jobIndex}-${b.bulletIndex}`]) continue
      const job = cloned.data.jobs[b.jobIndex]
      if (job && typeof job.bullets[b.bulletIndex] === 'string') {
        job.bullets[b.bulletIndex] = b.improved
      }
    }
    await saveCv(cloned)
    onClose()
    router.push(`/cv/${cloned.id}`)
  }

  const copyAts = async () => {
    try {
      await navigator.clipboard.writeText(atsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard failures in restricted environments.
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kiểm tra & AI Tối ưu CV"
      description="Soát lỗi cục bộ và tối ưu ngữ nghĩa theo từng tin tuyển dụng bằng Cloudflare Workers AI."
      size="lg"
    >
      <Tabs label="Công cụ kiểm tra CV" tabs={tabs} value={tab} onChange={setTab}>
        {tab === 'audit' && (
          <AiReviewPanel
            compact
            onJumpToSection={(k) => {
              if (onJumpToSection) onJumpToSection(k)
              else {
                setActiveTab('content')
                setActiveSection(k)
              }
              onClose()
            }}
          />
        )}

        {tab === 'jd' && (
          <div className="space-y-5">
            <TextAreaField
              label="Dán tin tuyển dụng (Job Description)"
              rows={5}
              value={jdText}
              onChange={(e) => {
                setJdText(e.target.value)
                setAiError(null)
              }}
              placeholder="Dán phần Mô tả công việc và Yêu cầu ứng viên vào đây để đối chiếu từ khoá hoặc dùng AI tối ưu CV…"
              hint="Hỗ trợ cả tin tuyển dụng tiếng Việt và tiếng Anh."
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button onClick={() => void runAiTailor()} disabled={aiBusy || jdText.trim().length < 20} className="gap-1.5">
                <Sparkle size={16} weight="fill" aria-hidden="true" />
                {aiBusy ? 'AI đang phân tích JD…' : 'AI Tối ưu CV theo JD này'}
              </Button>
              {aiTailor && (
                <span className="rounded-full border border-rule bg-desk px-3 py-1 text-xs font-semibold text-ink-2">
                  Nguồn: {aiTailor.provider === 'workers-ai' ? 'Cloudflare Workers AI' : 'VeroCV Semantic Engine'}
                </span>
              )}
            </div>

            {aiError && (
              <p role="alert" className="rounded-control border border-seal/40 bg-seal/5 px-4 py-3 text-sm text-seal">
                {aiError}
              </p>
            )}

            {aiTailor && (
              <div className="space-y-4 rounded-sheet border border-pen/35 bg-pen-wash/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-ink">Đánh giá AI cho vị trí này</p>
                  <span className="rounded-full bg-mint-wash px-3 py-1 text-sm font-extrabold tabular-nums text-mint">
                    {aiTailor.data.matchScore}% Phù hợp
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-ink-2">{aiTailor.data.gapSummary}</p>

                {aiTailor.data.missingKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Từ khoá còn thiếu — bấm để thêm nhanh</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {aiTailor.data.missingKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => addSkill(kw)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rule bg-paper px-2.5 py-1 text-xs font-semibold text-ink hover:border-pen hover:text-pen"
                        >
                          <Plus size={12} weight="bold" aria-hidden="true" />
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-rule pt-3">
                  <p className="text-sm font-bold text-ink">Đề xuất viết lại (So sánh Trước / Sau):</p>

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-control border border-rule bg-paper p-3">
                    <input
                      type="checkbox"
                      checked={applySummary}
                      onChange={(e) => setApplySummary(e.target.checked)}
                      className="mt-1 size-4 accent-pen"
                    />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold text-ink">Đoạn Giới thiệu (Summary)</p>
                      <p className="mt-1 text-xs text-ink-3 line-through">{doc.data.summary || '(Đang trống)'}</p>
                      <p className="mt-1 font-medium text-pen">{aiTailor.data.suggestedSummary}</p>
                    </div>
                  </label>

                  {aiTailor.data.bulletRewrites.map((b) => {
                    const key = `${b.jobIndex}-${b.bulletIndex}`
                    return (
                      <label key={key} className="flex cursor-pointer items-start gap-2.5 rounded-control border border-rule bg-paper p-3">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedBullets[key])}
                          onChange={(e) => setSelectedBullets((prev) => ({ ...prev, [key]: e.target.checked }))}
                          className="mt-1 size-4 accent-pen"
                        />
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="text-xs font-semibold text-ink-3">
                            Kinh nghiệm #{b.jobIndex + 1} · Ý {b.bulletIndex + 1} — {b.reason}
                          </p>
                          <p className="mt-1 text-xs text-ink-3 line-through">{b.original}</p>
                          <p className="mt-1 font-medium text-pen">{b.improved}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <Button variant="secondary" size="sm" onClick={() => void createTailoredVariant()} className="gap-1.5">
                    <CopySimple size={15} weight="bold" aria-hidden="true" />
                    Tạo biến thể CV mới
                  </Button>
                  <Button size="sm" onClick={applyTailorInPlace}>
                    Áp dụng vào CV này
                  </Button>
                </div>
              </div>
            )}

            {jdText.trim() && !aiTailor && jdResult && jdResult.totalKeywords > 0 && (
              <div className="space-y-4">
                <div className="rounded-control border border-rule bg-desk p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      Khớp nhanh {jdResult.matched.length}/{jdResult.totalKeywords} từ khoá kỹ năng chuẩn trong JD
                    </p>
                    <span className="font-bold tabular-nums text-pen">{jdResult.matchPercent}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rule">
                    <div className="h-full bg-pen transition-all" style={{ width: `${jdResult.matchPercent}%` }} />
                  </div>
                </div>

                {jdResult.missing.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Còn thiếu trong CV ({jdResult.missing.length}) — bấm để thêm nếu bạn thật sự có kỹ năng này:
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2 p-0">
                      {jdResult.missing.map((kw) => (
                        <li key={kw} className="list-none">
                          <button
                            type="button"
                            onClick={() => addSkill(kw)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rule bg-paper px-3 py-1.5 text-sm font-medium text-ink hover:border-pen hover:text-pen"
                          >
                            <Plus size={13} weight="bold" aria-hidden="true" />
                            {kw}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {jdResult.matched.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-ink-2">Đã xuất hiện trong CV ({jdResult.matched.length}):</p>
                    <ul className="mt-2 flex flex-wrap gap-2 p-0">
                      {jdResult.matched.map((kw) => (
                        <li
                          key={kw}
                          className="inline-flex list-none items-center gap-1 rounded-full border border-rule bg-pen-wash/60 px-3 py-1 text-sm font-medium text-ink"
                        >
                          <Check size={13} weight="bold" className="text-pen" aria-hidden="true" />
                          {kw}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'ats' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink-2">
                Đây là thứ tự văn bản thuần mà hệ thống lọc hồ sơ (ATS) đọc được, cũng dùng để dán nhanh vào biểu mẫu ứng tuyển trực tuyến.
              </p>
              <Button variant="secondary" size="sm" onClick={() => void copyAts()} className="gap-1.5">
                {copied ? <Check size={15} weight="bold" className="text-pen" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                {copied ? 'Đã sao chép' : 'Sao chép văn bản'}
              </Button>
            </div>
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-control border border-rule bg-desk p-4 font-sans text-sm leading-relaxed text-ink">
              {atsText || 'CV đang trống.'}
            </pre>
          </div>
        )}
      </Tabs>
    </Modal>
  )
}
