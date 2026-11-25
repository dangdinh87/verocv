'use client'

import { Check, CheckCircle, FilePdf, QrCode, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { VietQrCheckoutModal, type PaidPlanId } from '@/components/billing/vietqr-checkout-modal'
import { Card } from '@/components/ui/card'
import { PRICES, formatVnd, proYearlyPerMonth, proYearlySavingPercent } from '@/config/brand'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { Button } from './ui/button'

const FREE = [
  ['1 CV & Thư', ' đầy đủ định dạng và xuất PDF / Word (.docx)'],
  ['Không dấu mờ', ' hay logo quảng cáo'],
  [`${CV_TEMPLATES.length} mẫu CV`, ' chuẩn ATS Việt – Anh & mã QR'],
  ['8 lượt AI/ngày', ' đối chiếu JD, gợi ý viết & luyện phỏng vấn'],
  ['1 Link CV Online', ' (/p/slug) kèm thống kê HR xem'],
]

const PASS_14D = [
  ['100 lượt AI/ngày', ' Tailor CV theo JD, Dịch VI↔EN, Soạn Thư'],
  ['10 Link CV Online', ' gắn thẻ ?ref= theo dõi từng nhà tuyển dụng'],
  ['Không tự gia hạn', ' — mua 1 lần dùng tập trung 14 ngày săn việc'],
  ['Đồng bộ Cloud D1', ' & lưu lịch sử phiên bản CV không giới hạn'],
  ['Hút JD từ Link', ' & sinh 8 câu hỏi phỏng vấn STAR trên Kanban'],
]

const PRO = [
  ['200–300 lượt AI/ngày', ' ưu tiên model Cloudflare Workers AI'],
  ['50–100 Link CV Online', ' có bảo vệ mã PIN & ẩn SĐT/Email'],
  ['Quản lý Hồ sơ Gốc', ' & nhân bản không giới hạn biến thể theo JD'],
  ['Đồng bộ đa thiết bị', ' tức thì trên Cloud D1 & lịch sử phiên bản'],
  ['Hỗ trợ ưu tiên', ' qua email cho mọi mẫu hồ sơ'],
]

const TRUST_PILLARS = [
  { Icon: QrCode, title: 'Napas 24/7 VietQR tự động', desc: 'Kích hoạt gói tức thì sau khi chuyển khoản ngân hàng hoặc MoMo.' },
  { Icon: CheckCircle, title: 'Không tự động gia hạn gói 14 ngày', desc: 'Mua một lần duy nhất cho đợt tìm việc, không phát sinh phí ẩn.' },
  {
    Icon: ShieldCheck,
    title: 'Hoàn tiền 7 ngày nếu nâng cấp nhầm',
    desc: 'Gửi mã đơn hàng qua email để được hỗ trợ kiểm tra và hoàn tiền.',
  },
  { Icon: FilePdf, title: 'Xuất PDF & Word không watermark', desc: 'Mọi gói đều giữ trọn bản quyền hồ sơ, không gắn logo quảng cáo.' },
] as const

function Feature({ parts }: { parts: string[] }) {
  return (
    <li className="flex items-start gap-3">
      <Check size={18} weight="bold" className="mt-[0.28rem] shrink-0 text-pen" aria-hidden="true" />
      <span className="text-[0.95rem]">{parts.map((p, i) => (i % 2 === 0 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>))}</span>
    </li>
  )
}

export function PricingPlans() {
  const { user, openAuthModal, refreshMe } = useAuth()
  const [yearly, setYearly] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState<PaidPlanId | null>(null)

  const startCheckout = (plan: PaidPlanId) => {
    if (!user) {
      openAuthModal()
      return
    }
    setCheckoutPlan(plan)
  }

  return (
    <>
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {/* Free Tier */}
        <Card as="section" aria-labelledby="goi-mien-phi" className="flex flex-col p-7 sm:p-8">
          <h2 id="goi-mien-phi" className="text-[1.65rem] font-bold">
            Miễn phí
          </h2>
          <p className="mt-5 flex items-baseline gap-2">
            <span className="text-[2.8rem] font-extrabold leading-none tracking-[-0.03em]">0đ</span>
            <span className="text-base font-semibold text-ink-2">mãi mãi</span>
          </p>
          <p className="mt-2 text-sm text-ink-3">Bắt đầu ngay trên trình duyệt, không cần thẻ.</p>
          <Button href="/cv" variant="secondary" size="lg" className="mt-6 w-full">
            Mở CV Studio miễn phí
          </Button>
          <p className="mt-7 text-sm text-ink-3">Đầy đủ để hoàn thiện hồ sơ chuẩn ATS:</p>
          <ul className="mt-4 space-y-3">
            {FREE.map((f) => (
              <Feature key={f.join('')} parts={f} />
            ))}
          </ul>
        </Card>

        {/* 14-Day Job Hunt Pass */}
        <Card as="section" aria-labelledby="goi-pass-14d" className="flex flex-col p-7 sm:p-8">
          <div className="flex items-center justify-between gap-2">
            <h2 id="goi-pass-14d" className="text-[1.65rem] font-bold">
              Pass Săn Việc
            </h2>
            <span className="rounded-full bg-mint-wash px-2.5 py-0.5 text-xs font-bold text-mint">14 ngày · 1 lần</span>
          </div>
          <p className="mt-5 flex items-baseline gap-2">
            <span className="text-[2.8rem] font-extrabold leading-none tracking-[-0.03em]">{formatVnd(PRICES.pass14d)}</span>
            <span className="text-base font-semibold text-ink-2">trọn gói</span>
          </p>
          <p className="mt-2 text-sm text-ink-3">Không tự động gia hạn. Phù hợp đợt tìm việc cao điểm.</p>
          <Button size="lg" variant="secondary" onClick={() => startCheckout('pass_14d')} className="mt-6 w-full gap-1.5">
            {user?.plan === 'pass_14d' ? 'Gia hạn thêm 14 ngày (VietQR)' : 'Mua gói 14 ngày qua VietQR'}
          </Button>
          <p className="mt-7 text-sm text-ink-3">Mở khoá tăng tốc ứng tuyển:</p>
          <ul className="mt-4 space-y-3">
            {PASS_14D.map((f) => (
              <Feature key={f.join('')} parts={f} />
            ))}
          </ul>
        </Card>

        <div className="flex flex-col">
          <section aria-labelledby="goi-pro" className="flex h-full flex-col rounded-sheet border-2 border-pen bg-paper p-7 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="goi-pro" className="inline-flex items-center gap-1.5 text-[1.65rem] font-bold">
                  Pro
                </h2>
                <span className="rounded-full bg-pen-wash px-2.5 py-0.5 text-[0.7rem] font-bold text-pen">Đề xuất</span>
              </div>
              <div role="group" aria-label="Chu kỳ thanh toán" className="flex gap-1 rounded-full border border-rule bg-desk p-1">
                {[
                  { label: 'Tháng', value: false },
                  { label: 'Năm', value: true },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={yearly === o.value}
                    onClick={() => setYearly(o.value)}
                    className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors ${
                      yearly === o.value ? 'bg-pen-fill text-white' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    <span>{o.label}</span>
                    {o.value && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[0.62rem] font-extrabold tabular-nums ${
                          yearly ? 'bg-white/20 text-white' : 'bg-mint-wash text-mint'
                        }`}
                      >
                        -{proYearlySavingPercent}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-[2.8rem] font-extrabold leading-none tracking-[-0.03em]">
                {formatVnd(yearly ? proYearlyPerMonth : PRICES.proMonthly)}
              </span>
              <span className="text-base font-semibold text-ink-2">mỗi tháng</span>
            </p>
            <p className="mt-2 text-sm text-ink-3" aria-live="polite">
              {yearly
                ? `${formatVnd(PRICES.proYearly)} / năm, tiết kiệm ${proYearlySavingPercent}%.`
                : 'Linh hoạt theo tháng qua chuyển khoản VietQR.'}
            </p>
            <Button size="lg" onClick={() => startCheckout(yearly ? 'pro_yearly' : 'pro_monthly')} className="mt-6 w-full">
              {user?.plan === 'pro_monthly' || user?.plan === 'pro_yearly' ? 'Gia hạn Pro qua VietQR' : 'Nâng cấp Pro qua VietQR'}
            </Button>
            <p className="mt-7 text-sm text-ink-3">Toàn quyền cho ứng viên chuyên nghiệp:</p>
            <ul className="mt-4 space-y-3">
              {PRO.map((f) => (
                <Feature key={f.join('')} parts={f} />
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* 4-Pillar VietQR Trust & Guarantee Strip */}
      <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_PILLARS.map(({ Icon, title, desc }) => (
          <Card key={title} className="p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-control bg-pen-wash text-pen">
                <Icon size={17} weight="bold" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">{desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <VietQrCheckoutModal
        open={checkoutPlan !== null}
        planId={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        onUpgraded={refreshMe}
      />
    </>
  )
}
