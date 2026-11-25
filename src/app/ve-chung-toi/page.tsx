import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = {
  title: 'Về chúng tôi',
  description: `Vì sao có ${BRAND.name}: làm CV bằng tiếng Việt không nên là một buổi tối loay hoay với Word.`,
}

export default function AboutPage() {
  return (
    <article className="wrap max-w-[48rem] pb-24 pt-10 lg:pt-16">
      <span className="inline-flex items-center rounded-full border border-rule bg-paper px-3 py-1 text-xs font-bold text-pen">
        Câu chuyện thương hiệu · {BRAND.name}
      </span>
      <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.6rem)]">Vì sao có {BRAND.name}</h1>

      <div className="mt-8 overflow-hidden rounded-sheet border border-rule bg-paper">
        <img
          src="/images/brand/hero-career-craft.jpg"
          alt="Không gian thiết kế hồ sơ nghề nghiệp tinh gọn của VeroCV Studio"
          className="h-56 w-full object-cover sm:h-72"
        />
      </div>

      <div className="mt-8 space-y-5 text-[1.12rem] leading-[1.75] text-ink-2">
        <p>
          Làm CV không nên mất cả buổi tối. Vậy mà nhiều người vẫn loay hoay với Word: lệch dòng, vỡ dấu tiếng Việt, đổi một chữ là cả trang
          xô lệch. Nhiều công cụ miễn phí thì in logo lên CV, hoặc để bạn làm xong mới đòi trả tiền để tải.
        </p>
        <p>
          {BRAND.name} làm ngược lại. Bạn điền thông tin vào từng ô, chúng tôi lo bố cục, khổ giấy và phông chữ. Bạn tải được PDF đẹp, đúng
          dấu, không kèm điều kiện gì.
        </p>
      </div>

      <section className="mt-12 rounded-sheet border border-rule bg-paper p-6 sm:p-8">
        <h2 className="text-[1.5rem] font-bold">Chúng tôi tin vào ba điều</h2>
        <dl className="mt-5 border-b border-rule">
          {[
            [
              'CV đầu tiên phải miễn phí thật',
              'Không dùng thử, không logo, không bắt nhập thẻ. Bạn chỉ trả tiền khi cần nhiều hơn một bộ hồ sơ.',
            ],
            ['Tiếng Việt là ưu tiên, không phải bản dịch', 'Phông chữ, mẫu, câu gợi ý và cách gọi tên từng mục đều viết cho người Việt.'],
            ['Hồ sơ của bạn là của bạn', 'Xoá được bất cứ lúc nào, không bán thông tin, không in tên chúng tôi lên CV.'],
          ].map(([term, desc]) => (
            <div key={term} className="border-t border-rule py-5">
              <dt className="font-semibold text-ink">{term}</dt>
              <dd className="mt-1 text-ink-2">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <h2 className="mt-14 text-[1.6rem] font-bold">Mô hình bền vững &amp; minh bạch</h2>
      <p className="mt-4 text-[1.12rem] leading-[1.75] text-ink-2">
        Từ gói Pass Săn Việc 14 ngày và gói Pro dành cho ứng viên cần đồng bộ đa thiết bị, hạn mức AI Copilot cao, xuất bản nhiều Link CV
        Online có thống kê lượt nhà tuyển dụng mở xem. Gói miễn phí vẫn luôn đủ để hoàn thiện CV đẹp không dấu mờ.
      </p>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button href="/mau-cv" size="lg">
          Tạo CV miễn phí
        </Button>
        <Button href="/bang-gia" variant="secondary" size="lg">
          Xem bảng giá
        </Button>
      </div>
    </article>
  )
}
