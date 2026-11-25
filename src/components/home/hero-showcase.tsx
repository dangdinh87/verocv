'use client'

import { ChartLineUp, CheckCircle, Globe, QrCode, Sparkle, Wrench } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useState } from 'react'
import { QUOC_HUY } from '@/components/resume/resume-data'
import { ResumePaper } from '@/components/resume/resume-paper'
import { AnimatedTabs, type AnimatedTabItem } from '@/components/ui/animated-tabs'
import { ScoreRing } from '@/components/ui/score-ring'

type HeroTab = 'ai-review' | 'jd-match' | 'live-link'

const HERO_TABS: AnimatedTabItem<HeroTab>[] = [
  {
    id: 'ai-review',
    label: 'AI Review',
    badge: '96',
    icon: <Wrench size={13} weight="bold" aria-hidden="true" />,
  },
  {
    id: 'jd-match',
    label: 'Khớp JD',
    badge: '94%',
    icon: <Sparkle size={13} weight="fill" aria-hidden="true" />,
  },
  {
    id: 'live-link',
    label: 'Link & QR',
    badge: 'Live',
    icon: <Globe size={13} weight="bold" aria-hidden="true" />,
  },
]

const HERO_PREVIEW_DATA = {
  ...QUOC_HUY,
  photo: '/images/avatars/quoc-huy.jpg',
}

export function HeroShowcase() {
  const [tab, setTab] = useState<HeroTab>('ai-review')
  const [fixedLine, setFixedLine] = useState(false)

  return (
    <div className="mx-auto w-full max-w-[35rem]">
      <div
        id="hero-showcase"
        role="region"
        aria-label="Minh hoạ VeroCV Studio: AI Review từng dòng, đối chiếu JD 94/100 và Link CV trực tuyến"
        className="overflow-hidden rounded-sheet border border-rule bg-paper"
      >
        {/* Top Studio Browser Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-rule bg-desk px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-ink/15" />
              <span className="size-2.5 rounded-full bg-ink/15" />
              <span className="size-2.5 rounded-full bg-ink/15" />
            </div>
            <span className="truncate rounded-control border border-rule bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-2">
              verocv.vn/studio/quoc-huy
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-pen-wash px-2.5 py-0.5 text-[0.7rem] font-bold text-pen">Đã lưu</span>
        </div>

        {/* Interactive Feature Tabs */}
        <div className="border-b border-rule bg-paper px-3.5 py-2.5">
          <AnimatedTabs
            items={HERO_TABS}
            value={tab}
            onChange={setTab}
            ariaLabel="Tính năng VeroCV Studio"
            className="w-full justify-between sm:w-auto"
          />
        </div>

        {/* Interactive Telemetry Panel (Zero Overlaps) */}
        <div className="border-b border-rule bg-paper p-3.5 sm:p-4">
          {tab === 'ai-review' && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-pen-wash px-2 py-0.5 text-[0.68rem] font-bold text-pen">Kinh nghiệm #1 · Dòng 1</span>
                  <span className="text-[0.72rem] font-semibold text-ink-3">
                    {fixedLine ? 'Đã áp dụng vào bản nháp' : 'Phát hiện thiếu số liệu (+12 điểm)'}
                  </span>
                </div>

                {!fixedLine ? (
                  <p className="rounded-control border border-seal/25 bg-seal/[0.05] px-2.5 py-1.5 text-xs text-ink-2 line-through decoration-seal/50">
                    Xây lại trang thanh toán bằng React và cải thiện tốc độ tải.
                  </p>
                ) : null}

                <div className="rounded-control border border-mint/40 bg-mint-wash/35 px-2.5 py-2 text-xs font-medium leading-relaxed text-ink">
                  Tái kiến trúc luồng thanh toán với React &amp; TypeScript, rút ngắn thời gian tải từ{' '}
                  <strong className="text-mint">4,1s xuống 1,8s (-56%)</strong>.
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[0.7rem] text-ink-3">1 chạm áp dụng · Hỗ trợ Hoàn tác</span>
                  <button
                    type="button"
                    onClick={() => setFixedLine((v) => !v)}
                    className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-control px-2.5 text-[0.72rem] font-semibold transition-colors ${
                      fixedLine ? 'border border-rule bg-desk text-ink' : 'bg-pen-fill text-white hover:bg-pen-fill/90'
                    }`}
                  >
                    <CheckCircle size={13} weight="fill" aria-hidden="true" />
                    {fixedLine ? 'Hoàn tác thử' : 'Áp dụng sửa'}
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-rule pt-2.5 sm:flex-col sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <ScoreRing score={fixedLine ? 96 : 84} size={68} strokeWidth={6} label="CV" />
                <span className="text-[0.68rem] font-bold text-mint">{fixedLine ? 'Chuẩn phỏng vấn' : 'Khá tốt'}</span>
              </div>
            </div>
          )}

          {tab === 'jd-match' && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-pen">
                    <Sparkle size={13} weight="fill" aria-hidden="true" />
                    Khớp ngữ nghĩa JD · Senior Frontend
                  </span>
                  <span className="whitespace-nowrap rounded-full bg-mint-wash px-2 py-0.5 text-[0.7rem] font-extrabold tabular-nums text-mint">
                    94/100 · Đạt
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-desk" aria-hidden="true">
                  <div className="h-full w-[94%] rounded-full bg-mint" />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {['TypeScript', 'Next.js', 'React', 'Vitest'].map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-control border border-rule bg-desk px-2 py-0.5 text-[0.68rem] font-semibold text-ink-2"
                    >
                      <CheckCircle size={11} weight="fill" className="shrink-0 text-mint" aria-hidden="true" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden sm:block sm:border-l sm:border-rule sm:pl-4">
                <ScoreRing score={94} size={68} strokeWidth={6} label="JD" />
              </div>
            </div>
          )}

          {tab === 'live-link' && (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-ink">
                    <Globe size={14} weight="bold" className="shrink-0 text-pen" aria-hidden="true" />
                    <span className="truncate">verocv.vn/p/quoc-huy?ref=techcorp</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-mint-wash px-2 py-0.5 text-[0.68rem] font-bold text-mint">Live</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <ChartLineUp size={15} weight="bold" className="shrink-0 text-mint" aria-hidden="true" />
                  <span className="truncate">HR TechCorp vừa mở xem · 2 phút trước</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[0.7rem] text-ink-3">
                  <span className="rounded-control border border-rule bg-desk px-2 py-0.5 font-semibold text-ink-2">12 lượt xem</span>
                  <span className="rounded-control border border-rule bg-desk px-2 py-0.5 font-semibold text-ink-2">4 tải PDF</span>
                  <span className="rounded-control border border-rule bg-desk px-2 py-0.5 font-semibold text-ink-2">Lưu vCard</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-control border border-rule bg-desk p-2.5 sm:flex-col">
                <QrCode size={36} weight="duotone" className="shrink-0 text-ink" aria-hidden="true" />
                <span className="text-[0.65rem] font-semibold text-ink-2">Mã QR động</span>
              </div>
            </div>
          )}
        </div>

        {/* Framed A4 Document Canvas with real portrait (Paper always stays crisp white) */}
        <div className="relative bg-desk p-3 sm:p-4">
          <div className="relative mx-auto max-h-[19.5rem] max-w-[23.5rem] overflow-hidden rounded-[6px] border border-rule bg-white sm:max-h-[21rem]">
            <ResumePaper
              layout="anh-tron"
              data={HERO_PREVIEW_DATA}
              settings={{ accentColor: '#0c6a58' }}
              label="CV mẫu Ảnh tròn trên VeroCV"
            />
          </div>
          <div className="hero-paper-fade pointer-events-none absolute inset-x-0 bottom-0 h-20" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
            <Link
              href="/cv"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper/95 px-3.5 py-1.5 text-xs font-semibold text-ink backdrop-blur-sm transition-colors hover:border-pen hover:text-pen"
            >
              Mở trọn khổ A4 trong CV Studio →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
