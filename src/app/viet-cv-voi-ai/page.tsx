import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import { BeforeAfterCard } from '@/components/ui/before-after-card'
import { BorderBeam } from '@/components/ui/border-beam'
import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/ui/form-section'
import { SpotlightCard } from '@/components/ui/spotlight-card'

export const metadata: Metadata = {
  title: 'AI Career Copilot — Tối ưu CV theo JD & Luyện phỏng vấn',
  description:
    'VeroCV sử dụng Cloudflare Workers AI để chấm điểm từng dòng, đối chiếu JD ngữ nghĩa, viết lại thành tích, dịch CV Việt–Anh, soạn thư xin việc và luyện phỏng vấn STAR.',
}

const FEATURES: [string, string, boolean][] = [
  [
    'AI Review từng dòng theo chuẩn HR',
    'Chấm điểm tổng quan và 5 tiêu chí ATS, Tác động, Diễn đạt, Đầy đủ, Bố cục; chỉ rõ từng câu yếu kèm đề xuất sửa 1 chạm.',
    true,
  ],
  [
    'Tailor CV 1 chạm theo JD',
    'Dán tin tuyển dụng để AI chấm điểm khớp ngữ nghĩa, chỉ ra kỹ năng thiếu và đề xuất viết lại Summary cùng từng gạch đầu dòng sát ngôn ngữ HR.',
    true,
  ],
  [
    'Dịch CV Việt ↔ Anh chuyên ngành',
    'Chuyển toàn bộ hồ sơ sang tiếng Anh hoặc tiếng Việt theo đúng văn phong tuyển dụng quốc tế chỉ với một cú bấm, tạo thành bản sao độc lập.',
    true,
  ],
  [
    'Soạn Thư xin việc theo CV & JD',
    'AI tự kết hợp kinh nghiệm thực tế từ CV của bạn với yêu cầu của vị trí ứng tuyển để tạo thư xin việc trang trọng, hiện đại hoặc súc tích.',
    true,
  ],
  [
    'Luyện phỏng vấn STAR theo từng công ty',
    'Trên mỗi thẻ Kanban ứng tuyển, AI sinh 8 câu hỏi xoáy sâu vào khoảng chênh giữa CV và JD kèm dàn ý trả lời Situation–Task–Action–Result.',
    true,
  ],
  [
    'Soát lỗi & Văn bản chuẩn ATS',
    'Kiểm tra chỗ trống, mở đầu câu bị động, thiếu số liệu đo lường và xem trước thứ tự văn bản thuần mà hệ thống lọc hồ sơ đọc được.',
    true,
  ],
]

export default function AiWriterPage() {
  return (
    <>
      <div className="relative overflow-hidden">
        <div className="hero-grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <section className="wrap grid items-start gap-10 pb-14 pt-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-12 lg:pb-20 lg:pt-11">
          <div className="min-w-0 lg:pt-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-3 py-1 text-xs font-bold text-pen">
              <Sparkle size={13} weight="fill" aria-hidden="true" />
              Cloudflare Workers AI Copilot
            </span>
            <h1 className="display mt-4 text-[clamp(2.15rem,4.5vw,3.45rem)] text-ink">
              <span className="block">Bí chữ khi viết CV?</span>
              <span className="block text-pen">Để AI gợi ý, bạn quyết định</span>
            </h1>
            <p className="mt-4 max-w-[46ch] text-[1.05rem] leading-relaxed text-ink-2">
              Chấm điểm từng dòng, đối chiếu JD ngữ nghĩa, viết lại thành tích chuẩn ATS, dịch song ngữ Việt–Anh và luyện phỏng vấn STAR. Mọi chỉnh sửa chỉ áp dụng khi bạn bấm chọn.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/cv" size="lg">
                Mở CV Studio cùng AI
              </Button>
              <Button href="/luyen-phong-van" variant="secondary" size="lg">
                Vào phòng Phỏng vấn AI
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <BorderBeam durationSec={9}>
              <BeforeAfterCard />
            </BorderBeam>
          </div>
        </section>
      </div>

      <FormSection title="AI Copilot làm được gì cho bạn" hint="Vận hành trên Cloudflare Workers AI, luôn giữ nguyên dữ kiện thật của bạn.">
        <div className="space-y-6">
          <div className="elevated-card overflow-hidden rounded-sheet border border-rule bg-paper">
            <img
              src="/images/brand/ai-copilot-craft.jpg"
              alt="Minh hoạ không gian làm việc cùng VeroCV AI Copilot"
              className="h-52 w-full object-cover sm:h-64"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(([term, desc, ready]) => (
              <SpotlightCard key={term} className="p-5">
                <h3 className="text-base font-bold text-ink">
                  {term}
                  {!ready && <span className="ml-2 rounded-full bg-kraft px-2.5 py-0.5 text-xs font-semibold text-ink">Sắp có</span>}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection title="Nguyên tắc khi dùng AI">
        <ul className="max-w-[60ch] space-y-4 text-ink-2">
          <li>
            <strong className="text-ink">Không tự bịa thành tích.</strong> Chỗ cần số liệu đo lường luôn để mở `[x]%` cho bạn tự điền.
          </li>
          <li>
            <strong className="text-ink">Bạn giữ toàn quyền quyết định.</strong> Gợi ý chỉ đi vào hồ sơ khi bạn bấm Áp dụng.
          </li>
          <li>
            <strong className="text-ink">Riêng tư tuyệt đối.</strong> Nội dung CV và JD của bạn không dùng để huấn luyện mô hình công khai.
          </li>
        </ul>
      </FormSection>
    </>
  )
}
