'use client'

import { CheckCircle, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { ScoreRing } from './score-ring'

export type BeforeAfterSample = {
  id: string
  role: string
  section: string
  beforeScore: number
  afterScore: number
  beforeText: string
  afterText: string
  keywords: string[]
  explanation: string
}

const DEFAULT_SAMPLES: BeforeAfterSample[] = [
  {
    id: 'marketing',
    role: 'Product Marketing',
    section: 'Kinh nghiệm #1 · Dòng 1',
    beforeScore: 58,
    afterScore: 94,
    beforeText: 'Chạy quảng cáo chuyển đổi cho sản phẩm mới và tối ưu chi phí hằng tháng.',
    afterText:
      'Lập kế hoạch và tối ưu phễu Paid Acquisition đa kênh, tăng 38% đơn hàng hợp lệ và giảm 24% CPA trong 4 tháng.',
    keywords: ['Paid Acquisition', 'CPA -24%', 'Conversion +38%'],
    explanation: 'Thay động từ chung chung bằng cấu trúc Tác động + Con số đo lường chuẩn ATS.',
  },
  {
    id: 'frontend',
    role: 'Frontend Engineer',
    section: 'Kinh nghiệm #1 · Dòng 2',
    beforeScore: 62,
    afterScore: 95,
    beforeText: 'Làm giao diện web bằng React và Next.js, sửa lỗi hiệu năng cho người dùng.',
    afterText:
      'Tái cấu trúc hệ thống SSR bằng Next.js & TypeScript, rút ngắn LCP từ 3.4s xuống 1.2s (-65%) và nâng điểm Lighthouse lên 98.',
    keywords: ['Next.js', 'TypeScript', 'LCP 1.2s'],
    explanation: 'Gắn đúng từ khoá kỹ thuật trong JD và bổ sung chỉ số Web Vitals cụ thể.',
  },
  {
    id: 'data',
    role: 'Data Analyst',
    section: 'Tóm tắt · Summary',
    beforeScore: 54,
    afterScore: 91,
    beforeText: 'Có kinh nghiệm dùng SQL, Excel để làm báo cáo dữ liệu bán hàng cho công ty.',
    afterText:
      'Chuyên viên Phân tích Dữ liệu 3 năm kinh nghiệm với SQL, dbt và Power BI; tự động hoá 14 dashboard điều hành giúp tiết kiệm 12 giờ/tuần.',
    keywords: ['SQL', 'dbt', 'Power BI'],
    explanation: 'Chuyển từ câu mô tả nhiệm vụ sang năng lực cốt lõi + giá trị tiết kiệm thời gian.',
  },
]

export function BeforeAfterCard({ samples = DEFAULT_SAMPLES }: { samples?: BeforeAfterSample[] }) {
  const [sampleIdx, setSampleIdx] = useState(0)
  const [mode, setMode] = useState<'compare' | 'applied'>('compare')
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({})

  const current = samples[sampleIdx] ?? samples[0]
  const isApplied = mode === 'applied' || Boolean(appliedIds[current.id])
  const activeScore = isApplied ? current.afterScore : current.beforeScore

  const toggleApply = () => {
    setAppliedIds((prev) => ({ ...prev, [current.id]: !prev[current.id] }))
    setMode((prev) => (prev === 'applied' ? 'compare' : 'applied'))
  }

  return (
    <div className="elevated-card overflow-hidden rounded-sheet border border-rule bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-desk px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Chọn ngành nghề mẫu">
          {samples.map((s, idx) => {
            const active = idx === sampleIdx
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSampleIdx(idx)
                  setMode(appliedIds[s.id] ? 'applied' : 'compare')
                }}
                aria-pressed={active}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? 'bg-pen text-white' : 'border border-rule bg-paper text-ink-2 hover:border-pen/40 hover:text-ink'
                }`}
              >
                {s.role}
              </button>
            )
          })}
        </div>

        <span className="whitespace-nowrap rounded-full bg-mint-wash px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-mint">
          {current.beforeScore}% → {current.afterScore}%
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 rounded-control border border-rule bg-desk p-3.5">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-pen">{current.section}</p>
            <p className="mt-1 text-xs font-semibold text-ink">{current.explanation}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {current.keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-control border border-rule bg-paper px-2 py-0.5 text-[0.68rem] font-semibold text-ink-2"
                >
                  <CheckCircle size={11} weight="fill" className="text-mint" aria-hidden="true" />
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <ScoreRing score={activeScore} size={70} strokeWidth={6} label="ATS" />
        </div>

        <div className="mt-3.5 space-y-2.5">
          {!isApplied && (
            <div className="rounded-control border border-seal/30 bg-seal/[0.06] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.7rem] font-bold uppercase tracking-wider text-seal">Trước khi sửa · Thiếu số liệu</span>
                <span className="text-xs font-bold tabular-nums text-seal">{current.beforeScore}/100</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2 line-through decoration-seal/50">{current.beforeText}</p>
            </div>
          )}

          <div
            className={`rounded-control border p-3.5 transition-colors ${
              isApplied ? 'border-mint bg-mint-wash/40' : 'border-pen/40 bg-pen-wash/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider ${isApplied ? 'text-mint' : 'text-pen'}`}>
                <Sparkle size={12} weight="fill" aria-hidden="true" />
                {isApplied ? 'Đã áp dụng vào CV' : 'Đề xuất chuẩn ATS'}
              </span>
              <span className="text-xs font-extrabold tabular-nums text-mint">{current.afterScore}/100</span>
            </div>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">{current.afterText}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3.5">
          <p className="text-xs text-ink-3">Số liệu [x]% luôn để bạn xác nhận trước khi lưu.</p>
          <button
            type="button"
            onClick={toggleApply}
            className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-control px-3.5 text-xs font-semibold transition-colors ${
              isApplied
                ? 'border border-rule bg-desk text-ink hover:border-pen/40'
                : 'bg-pen text-white hover:bg-pen-dark'
            }`}
          >
            <CheckCircle size={15} weight="fill" aria-hidden="true" />
            {isApplied ? 'Xem lại so sánh Trước / Sau' : 'Áp dụng thử gợi ý này'}
          </button>
        </div>
      </div>
    </div>
  )
}
