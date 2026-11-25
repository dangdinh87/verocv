'use client'

import { ArrowRight, CaretDown, CaretUp, CheckCircle, Circle } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { listCvs, subscribeToCvChanges, type CvRecord } from '@/lib/cv-repository'
import { evaluateCvReview } from '@/lib/cv-reviewer'
import { APPLICATION_KEY, getApplications, getLetterList, LETTER_KEY, subscribeToStorageKey } from '@/lib/storage'

const STORAGE_KEY = 'verocv_checklist_hidden'

export function CareerReadinessChecklist({
  cvs: providedCvs,
  scoresById,
}: {
  cvs?: CvRecord[] | null
  scoresById?: Map<string, number>
}) {
  const [localCvs, setLocalCvs] = useState<CvRecord[]>([])
  const [letterCount, setLetterCount] = useState(0)
  const [appCount, setAppCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      // Ignore private browsing storage failures
    }
  }, [])

  const syncLocal = useCallback(() => {
    setLetterCount(getLetterList().length)
    setAppCount(getApplications().length)
    if (providedCvs === undefined) {
      void listCvs()
        .then(setLocalCvs)
        .catch(() => {})
    }
  }, [providedCvs])

  useEffect(() => {
    syncLocal()
    const unsubLetters = subscribeToStorageKey(LETTER_KEY, syncLocal)
    const unsubApps = subscribeToStorageKey(APPLICATION_KEY, syncLocal)
    const unsubCvs = providedCvs === undefined ? subscribeToCvChanges(syncLocal) : () => {}
    return () => {
      unsubLetters()
      unsubApps()
      unsubCvs()
    }
  }, [providedCvs, syncLocal])

  const cvs = providedCvs ?? localCvs

  const { bestCvId, bestScore } = useMemo(() => {
    let topId: string | null = null
    let topScore = 0
    for (const cv of cvs) {
      const score =
        scoresById?.get(cv.id) ??
        evaluateCvReview(cv.data, cv.settings.documentLanguage ?? 'vi', cv.settings.hiddenSections).overallScore
      if (score >= topScore) {
        topScore = score
        topId = cv.id
      }
    }
    return { bestCvId: topId, bestScore: topScore }
  }, [cvs, scoresById])

  const steps = useMemo(
    () => [
      {
        id: 'create-cv',
        done: cvs.length > 0,
        title: 'Tạo ít nhất 1 CV chuẩn ATS',
        hint: 'Chọn mẫu hoặc Role Kit phù hợp',
        href: '/cv?new=1',
      },
      {
        id: 'score-80',
        done: bestScore >= 80,
        title: 'Đạt điểm AI Review >= 80/100',
        hint: bestCvId ? `Hiện tại cao nhất: ${bestScore}/100` : 'Chỉnh sửa bằng AI Review từng dòng',
        href: bestCvId ? `/cv/${bestCvId}` : '/cv?new=1',
      },
      {
        id: 'create-letter',
        done: letterCount > 0,
        title: 'Tạo Thư xin việc đồng bộ',
        hint: 'Khớp màu sắc và thông tin từ CV',
        href: '/thu-xin-viec?new=1',
      },
      {
        id: 'track-interview',
        done: appCount > 0,
        title: 'Theo dõi đơn & Luyện phỏng vấn STAR',
        hint: 'Lưu tin tuyển dụng vào bảng Kanban',
        href: '/theo-doi-ung-tuyen',
      },
    ],
    [appCount, bestCvId, bestScore, cvs.length, letterCount],
  )

  const doneCount = steps.filter((s) => s.done).length

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      // Ignore storage failures
    }
  }

  return (
    <section aria-label="Lộ trình hoàn thiện hồ sơ săn việc" className="mt-5 rounded-sheet border border-rule bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <p className="text-sm font-bold text-ink">
            Hoàn thiện bộ hồ sơ săn việc · <span className="tabular-nums text-pen">{doneCount}/4 bước</span>
          </p>
          <div className="flex w-32 items-center gap-1 sm:w-40" aria-hidden="true">
            {steps.map((step) => (
              <span
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-colors ${step.done ? 'bg-mint' : 'bg-rule'}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          className="inline-flex cursor-pointer items-center gap-1 rounded-control px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
        >
          <span>{collapsed ? 'Mở lộ trình' : 'Thu gọn'}</span>
          {collapsed ? <CaretDown size={13} weight="bold" aria-hidden="true" /> : <CaretUp size={13} weight="bold" aria-hidden="true" />}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 gap-2.5 border-t border-rule bg-desk/50 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className={`group flex items-start gap-2.5 rounded-control border p-3 transition-colors ${
                step.done
                  ? 'border-mint/30 bg-mint-wash/40 hover:border-mint'
                  : 'border-rule bg-paper hover:border-pen'
              }`}
            >
              {step.done ? (
                <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
              ) : (
                <Circle size={18} className="mt-0.5 shrink-0 text-ink-3 group-hover:text-pen" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-xs font-bold leading-snug ${step.done ? 'text-ink' : 'text-ink group-hover:text-pen'}`}>
                  {step.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-ink-3">{step.hint}</span>
              </span>
              {!step.done && (
                <ArrowRight size={13} weight="bold" className="mt-1 shrink-0 text-ink-3 group-hover:text-pen" aria-hidden="true" />
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
