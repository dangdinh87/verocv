import { Check, Minus } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import { PricingPlans } from '@/components/pricing-plans'
import { FaqList } from '@/components/ui/faq-list'
import { FormSection } from '@/components/ui/form-section'
import { PRICES, formatVnd, proYearlyPerMonth } from '@/config/brand'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { PRICING_FAQS } from '@/data/faqs'
import { LETTER_TEMPLATES } from '@/data/letter-templates'

export const metadata: Metadata = {
  title: 'Bảng giá',
  description:
    'Bắt đầu miễn phí với đầy đủ PDF, Word (.docx), 8 lượt AI/ngày và 1 Link Online. Nâng cấp Pass 14 ngày hoặc Pro qua VietQR khi cần tăng tốc săn việc.',
}

type Cell = boolean | string
const ROWS: [string, Cell, Cell, Cell][] = [
  ['Số lượng CV & Thư xin việc', 'Không giới hạn cục bộ · 1 bản Cloud', 'Không giới hạn', 'Không giới hạn + Master CV'],
  [`Tất cả ${CV_TEMPLATES.length} mẫu CV & ${LETTER_TEMPLATES.length} mẫu Thư chuẩn ATS`, true, true, true],
  ['Xuất PDF A4/Letter & Word (.docx) không dấu mờ', true, true, true],
  ['Chèn mã QR động dẫn tới hồ sơ Online', true, true, true],
  ['Hạn mức AI Copilot mỗi ngày', '8 lượt / ngày', '100 lượt / ngày', '200–300 lượt / ngày'],
  ['Tailor CV theo JD & Dịch CV Việt ↔ Anh', true, true, true],
  ['Link CV Online (/p/slug) & Thống kê HR mở xem', '1 link', '10 link (+ ?ref=)', '50–100 link (+ ?ref=)'],
  ['Khoá mã PIN & Ẩn SĐT/Email trên Link Online', true, true, true],
  ['Bảng Kanban, Hút JD từ URL & Phỏng vấn STAR', true, true, true],
  ['Đồng bộ Cloud D1 đa thiết bị & Lịch sử phiên bản', 'Cơ bản', 'Đầy đủ (14 ngày)', 'Đầy đủ + Ưu tiên'],
]

function CellView({ v, accent = false }: { v: Cell; accent?: boolean }) {
  if (v === true) return <Check size={18} weight="bold" className={accent ? 'text-pen' : 'text-mint'} aria-label="Có" />
  if (v === false) return <Minus size={18} className="text-ink-3" aria-label="Không có" />
  return <span className={accent ? 'font-semibold text-ink' : 'text-ink-2'}>{v}</span>
}

export default function PricingPage() {
  return (
    <>
      <div className="relative overflow-hidden">
        <header className="wrap pb-10 pt-10 lg:pb-12 lg:pt-14">
          <h1 className="display text-[clamp(2.1rem,4.6vw,3.4rem)] text-ink">
            <span className="block">Bắt đầu miễn phí.</span>
            <span className="block text-ink-2">Nâng cấp đúng đợt săn việc.</span>
          </h1>
          <p className="mt-3 max-w-[54ch] text-base text-ink-2">
            Gói Miễn phí đã có sẵn PDF, Word (.docx), Kanban và 8 lượt AI/ngày. Chỉ chọn Pass 14 ngày hoặc Pro khi bạn cần gửi hàng loạt CV
            tối ưu theo từng JD.
          </p>
        </header>
      </div>

      <div className="wrap pb-14">
        <PricingPlans />
      </div>

      <section aria-labelledby="compare-heading" className="border-t border-rule py-14 lg:py-18">
        <div className="wrap">
          <h2 id="compare-heading" className="display text-[clamp(1.6rem,3vw,2.1rem)] text-ink">
            So sánh chi tiết các gói
          </h2>
          <p className="mt-2 text-sm text-ink-2">Mọi gói đều không gắn logo VeroCV lên CV của bạn khi xuất PDF hoặc Word (.docx).</p>

          <div className="mt-8 overflow-x-auto rounded-sheet border border-rule bg-paper">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">So sánh gói Miễn phí, Pass Săn Việc 14 ngày và Pro</caption>
              <thead>
                <tr className="border-b border-rule bg-desk text-ink">
                  <th scope="col" className="px-5 py-4 font-bold">
                    Tính năng
                  </th>
                  <th scope="col" className="w-48 px-4 py-4 font-bold">
                    Miễn phí <span className="block text-xs font-medium text-ink-3">0đ mãi mãi</span>
                  </th>
                  <th scope="col" className="w-48 px-4 py-4 font-bold">
                    Pass 14 ngày <span className="block text-xs font-medium text-mint">{formatVnd(PRICES.pass14d)} · 1 lần</span>
                  </th>
                  <th scope="col" className="w-52 bg-pen-wash/50 px-5 py-4 font-bold text-pen">
                    Pro <span className="block text-xs font-medium text-ink-2">Từ {formatVnd(proYearlyPerMonth)}/tháng</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {ROWS.map(([name, free, pass14d, pro]) => (
                  <tr key={name} className="hover:bg-desk/40">
                    <th scope="row" className="px-5 py-4 font-semibold text-ink">
                      {name}
                    </th>
                    <td className="px-4 py-4">
                      <CellView v={free} />
                    </td>
                    <td className="px-4 py-4">
                      <CellView v={pass14d} />
                    </td>
                    <td className="bg-pen-wash/25 px-5 py-4">
                      <CellView v={pro} accent />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FormSection title="Hỏi đáp về giá">
        <FaqList items={PRICING_FAQS} />
      </FormSection>
    </>
  )
}
