import { CheckCircle, FilePdf, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { ResumePaper } from '@/components/resume/resume-paper'
import { Card } from '@/components/ui/card'
import { CV_TEMPLATES } from '@/data/cv-templates'

function PickVisual() {
  return (
    <div className="grid grid-cols-3 gap-2" aria-hidden="true">
      {(['ke-ngang', 'cot-xanh', 'bia-kraft'] as const).map((l) => (
        <div key={l} className="overflow-hidden rounded-[4px] border border-rule bg-white">
          <ResumePaper layout={l} />
        </div>
      ))}
    </div>
  )
}

function AiFillVisual() {
  return (
    <div className="rounded-control border border-rule bg-paper p-3.5" aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-pen">
          <Sparkle size={13} weight="fill" />
          AI Review · ATS 94%
        </span>
        <span className="rounded-full bg-mint-wash px-2 py-0.5 text-[0.7rem] font-bold text-mint">+28% khớp JD</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-2">
        Tối ưu chiến dịch tăng <strong className="text-ink">42% chuyển đổi</strong> sau 6 tháng với ngân sách giữ nguyên.
      </p>
    </div>
  )
}

function ExportVisual() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="flex items-center gap-2.5 rounded-control border border-rule bg-paper p-3">
        <FilePdf size={26} weight="duotone" className="shrink-0 text-pen" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-ink">CV-Le-Thi-Truc-Ly.pdf</p>
          <p className="text-[0.72rem] text-ink-3">A4 · Lớp chữ chọn được · Không watermark</p>
        </div>
        <CheckCircle size={20} weight="fill" className="shrink-0 text-mint" />
      </div>
      <div className="flex items-center justify-between rounded-control border border-rule bg-paper px-3 py-2 text-xs">
        <span className="truncate font-semibold text-ink">verocv.vn/p/truc-ly</span>
        <span className="shrink-0 rounded-full bg-pen-wash px-2 py-0.5 text-[0.68rem] font-bold text-pen">Word .docx + Link</span>
      </div>
    </div>
  )
}

const STEPS = [
  {
    num: '01',
    title: 'Chọn mẫu hoặc nhập CV cũ',
    body: `${CV_TEMPLATES.length} mẫu CV chuẩn ATS Việt – Anh. Có thể tải lên file PDF/DOCX có sẵn để tách tự động vào từng mục.`,
    visual: <PickVisual />,
  },
  {
    num: '02',
    title: 'Tối ưu cùng AI Copilot',
    body: 'Soạn định dạng đậm/nghiêng/link ngay trên trình duyệt, dán JD để AI chấm điểm và viết lại câu mở đầu giàu số liệu.',
    visual: <AiFillVisual />,
  },
  {
    num: '03',
    title: 'Xuất PDF, Word hoặc Link Live',
    body: 'Tải PDF A4 & Word (.docx) không dấu mờ, hoặc xuất bản Link CV Online kèm mã QR và đếm lượt nhà tuyển dụng mở xem.',
    visual: <ExportVisual />,
  },
]

export function StepsSection() {
  return (
    <section id="cach-lam" aria-labelledby="steps-title" className="border-t border-rule py-16 lg:py-20">
      <div className="wrap">
        <div className="max-w-[42rem]">
          <span className="inline-flex items-center rounded-full border border-rule bg-paper px-3 py-1 text-xs font-bold text-ink-2">
            Quy trình tinh gọn
          </span>
          <h2 id="steps-title" className="display mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] text-ink">
            Hoàn thiện bộ hồ sơ chuẩn chỉnh trong vài phút
          </h2>
        </div>

        <ol className="mt-10 grid gap-5 p-0 lg:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.num} as="li" className="flex list-none flex-col justify-between p-6">
              <div>
                <span className="inline-flex h-7 items-center rounded-full bg-pen-wash px-2.5 text-xs font-extrabold tabular-nums text-pen">
                  Bước {s.num}
                </span>
                <h3 className="mt-4 text-[1.15rem] font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.body}</p>
              </div>
              <div className="mt-5 rounded-control border border-rule bg-desk p-3">{s.visual}</div>
            </Card>
          ))}
        </ol>
      </div>
    </section>
  )
}
