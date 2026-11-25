import { CheckCircle, Minus, Sparkle, XCircle } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'
import { SpotlightCard } from '@/components/ui/spotlight-card'

type CellKind = 'yes' | 'partial' | 'no'

type CompareRow = {
  criteria: string
  wordCanva: { kind: CellKind; text: string }
  flowcv: { kind: CellKind; text: string }
  verocv: { kind: CellKind; text: string }
}

const COMPARE_ROWS: CompareRow[] = [
  {
    criteria: 'Tuỳ biến A4 chuyên sâu (cột, font, lề, tiêu đề, QR)',
    wordCanva: { kind: 'partial', text: 'Canh lề thủ công' },
    flowcv: { kind: 'yes', text: 'Đầy đủ tuỳ chỉnh' },
    verocv: { kind: 'yes', text: 'Đầy đủ + 12 mẫu ATS Việt–Anh' },
  },
  {
    criteria: 'AI Review từng dòng & Áp dụng sửa 1 chạm',
    wordCanva: { kind: 'no', text: 'Không hỗ trợ' },
    flowcv: { kind: 'partial', text: 'Viết lại cơ bản' },
    verocv: { kind: 'yes', text: 'Chấm điểm 5 trục + Gợi ý từng dòng' },
  },
  {
    criteria: 'Đối chiếu JD ngữ nghĩa & Dịch song ngữ VI ↔ EN',
    wordCanva: { kind: 'no', text: 'Không có' },
    flowcv: { kind: 'partial', text: 'Giới hạn gói trả phí' },
    verocv: { kind: 'yes', text: '8 lượt/ngày miễn phí (Workers AI)' },
  },
  {
    criteria: 'Xuất PDF chuẩn ATS & Word (.docx) không watermark',
    wordCanva: { kind: 'partial', text: 'Canva dễ lỗi ATS' },
    flowcv: { kind: 'partial', text: 'Chỉ xuất PDF' },
    verocv: { kind: 'yes', text: 'PDF A4/Letter + Word (.docx) miễn phí' },
  },
  {
    criteria: 'Link CV Online (/p/slug), vCard & Thống kê HR xem',
    wordCanva: { kind: 'no', text: 'Không có' },
    flowcv: { kind: 'partial', text: 'Link cơ bản' },
    verocv: { kind: 'yes', text: 'Đếm lượt HR + Mã PIN + Ẩn SĐT + .vcf' },
  },
  {
    criteria: 'Kanban hút JD từ Link & Phòng luyện phỏng vấn STAR',
    wordCanva: { kind: 'no', text: 'Không có' },
    flowcv: { kind: 'no', text: 'Không có' },
    verocv: { kind: 'yes', text: 'Hút JD + AI Coach chấm câu trả lời' },
  },
  {
    criteria: 'Chi phí nâng cấp cho ứng viên Việt Nam',
    wordCanva: { kind: 'partial', text: '~150.000đ/tháng' },
    flowcv: { kind: 'no', text: '~$19/tháng (cần thẻ quốc tế)' },
    verocv: { kind: 'yes', text: 'Pass 14 ngày chỉ 49.000đ qua VietQR' },
  },
]

function StatusIcon({ kind, accent = false }: { kind: CellKind; accent?: boolean }) {
  if (kind === 'yes') {
    return <CheckCircle size={17} weight="fill" className={`shrink-0 ${accent ? 'text-mint' : 'text-pen'}`} aria-hidden="true" />
  }
  if (kind === 'partial') {
    return <Minus size={17} weight="bold" className="shrink-0 text-ink-3" aria-hidden="true" />
  }
  return <XCircle size={17} weight="fill" className="shrink-0 text-seal/80" aria-hidden="true" />
}

export function FlowCvCompareSection() {
  return (
    <section id="so-sanh-flowcv" aria-labelledby="compare-matrix-title" className="border-t border-rule py-16 lg:py-20">
      <div className="wrap">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[46rem]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pen-wash px-3 py-1 text-xs font-bold text-pen">
              <Sparkle size={13} weight="fill" aria-hidden="true" />
              Tại sao chọn VeroCV?
            </span>
            <h2 id="compare-matrix-title" className="display mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] text-ink">
              Độ tinh xảo ngang chuẩn quốc tế — nhưng thiết kế riêng cho thị trường Việt
            </h2>
            <p className="mt-2.5 text-base text-ink-2">
              Giữ trọn trải nghiệm tuỳ biến A4 sắc nét của các công cụ hàng đầu, bổ sung AI Review từng dòng, xuất Word (.docx), Link CV kèm vCard và luyện phỏng vấn STAR.
            </p>
          </div>
          <Button href="/cv" size="md" className="shrink-0 self-start sm:self-auto">
            Trải nghiệm ngay
          </Button>
        </div>

        {/* Desktop & Tablet Comparison Table */}
        <SpotlightCard className="elevated-card mt-10 hidden overflow-hidden md:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">So sánh VeroCV AI Studio với Word/Canva và công cụ CV quốc tế</caption>
            <thead>
              <tr className="border-b border-rule bg-desk text-ink">
                <th scope="col" className="px-5 py-4 font-bold">
                  Tính năng cốt lõi
                </th>
                <th scope="col" className="w-52 px-4 py-4 font-semibold text-ink-2">
                  Word / Canva
                </th>
                <th scope="col" className="w-56 px-4 py-4 font-semibold text-ink-2">
                  Công cụ CV quốc tế (FlowCV)
                </th>
                <th scope="col" className="w-64 bg-pen-wash/50 px-5 py-4 font-bold text-pen">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" aria-hidden="true" />
                    VeroCV AI Studio
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {COMPARE_ROWS.map((row) => (
                <tr key={row.criteria} className="transition-colors hover:bg-desk/45">
                  <th scope="row" className="px-5 py-4 font-semibold text-ink">
                    {row.criteria}
                  </th>
                  <td className="px-4 py-4 text-ink-3">
                    <span className="inline-flex items-center gap-2">
                      <StatusIcon kind={row.wordCanva.kind} />
                      <span>{row.wordCanva.text}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-ink-2">
                    <span className="inline-flex items-center gap-2">
                      <StatusIcon kind={row.flowcv.kind} />
                      <span>{row.flowcv.text}</span>
                    </span>
                  </td>
                  <td className="bg-pen-wash/25 px-5 py-4 font-semibold text-ink">
                    <span className="inline-flex items-center gap-2">
                      <StatusIcon kind={row.verocv.kind} accent />
                      <span>{row.verocv.text}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SpotlightCard>

        {/* Mobile Cards (<md) */}
        <div className="mt-8 grid gap-3.5 md:hidden">
          {COMPARE_ROWS.map((row) => (
            <SpotlightCard key={row.criteria} className="p-4">
              <h3 className="text-sm font-bold text-ink">{row.criteria}</h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 rounded-control bg-pen-wash/40 px-3 py-2 font-semibold text-ink">
                  <span className="text-pen">VeroCV</span>
                  <span className="inline-flex items-center gap-1.5 text-right">
                    <StatusIcon kind={row.verocv.kind} accent />
                    {row.verocv.text}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 px-1 text-ink-2">
                  <span>FlowCV</span>
                  <span className="inline-flex items-center gap-1.5 text-right">
                    <StatusIcon kind={row.flowcv.kind} />
                    {row.flowcv.text}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 px-1 text-ink-3">
                  <span>Word / Canva</span>
                  <span className="inline-flex items-center gap-1.5 text-right">
                    <StatusIcon kind={row.wordCanva.kind} />
                    {row.wordCanva.text}
                  </span>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}
