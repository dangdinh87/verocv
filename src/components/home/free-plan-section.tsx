import { CheckCircle } from '@phosphor-icons/react/dist/ssr'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { LETTER_TEMPLATES } from '@/data/letter-templates'

const INCLUDED = [
  [
    'Xuất PDF & Word (.docx) không dấu mờ',
    'Tạo, sửa và xuất file PDF khổ A4/Letter chuẩn chữ ATS hoặc Word (.docx) không giới hạn, không logo quảng cáo.',
  ],
  [
    '8 lượt AI Copilot miễn phí mỗi ngày',
    'Chấm điểm từng dòng, đối chiếu ngữ nghĩa CV với JD, viết lại thành tích và luyện câu hỏi phỏng vấn STAR.',
  ],
  [
    '1 Link CV Online (/p/slug) kèm thống kê',
    'Xuất bản hồ sơ thành trang web cá nhân có mã QR, tuỳ chọn ẩn số điện thoại, khoá PIN và đếm lượt nhà tuyển dụng mở xem.',
  ],
  [
    `Đầy đủ ${CV_TEMPLATES.length} mẫu CV & ${LETTER_TEMPLATES.length} mẫu Thư chuẩn ATS`,
    'Toàn quyền đổi mẫu, kéo thả thứ tự mục, bật/tắt 1–2 cột và chuyển đổi ngôn ngữ tiêu đề Việt ↔ Anh tức thì.',
  ],
  [
    'Nhập nhanh từ file PDF / DOCX cũ',
    'Tải lên CV hiện có để tự động bóc tách thông tin cá nhân, kinh nghiệm, học vấn và kỹ năng vào đúng biểu mẫu.',
  ],
  [
    'Kanban ứng tuyển & Toàn quyền dữ liệu',
    'Quản lý quy trình nộp đơn, dán URL để hút JD tự động, sao lưu file .json hoặc xoá tài khoản bất kỳ lúc nào.',
  ],
]

export function FreePlanSection() {
  return (
    <section id="goi-mien-phi" aria-labelledby="free-plan-title" className="border-t border-rule py-16 lg:py-20">
      <div className="wrap">
        <div className="max-w-[44rem]">
          <span className="inline-flex items-center rounded-full border border-rule bg-paper px-3 py-1 text-xs font-bold text-pen">
            Gói Miễn Phí (0đ mãi mãi)
          </span>
          <h2 id="free-plan-title" className="display mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] text-ink">
            Đủ đầy tính năng cốt lõi ngay từ ngày đầu tiên
          </h2>
          <p className="mt-2 text-base text-ink-2">
            Không bắt nhập thẻ, không chèn watermark lúc xuất file. Chỉ nâng cấp qua VietQR khi bạn cần cường độ săn việc cao.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map(([term, desc]) => (
            <SpotlightCard key={term} className="p-5">
              <h3 className="flex items-start gap-2.5 text-base font-bold leading-snug text-ink">
                <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
                <span>{term}</span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}
