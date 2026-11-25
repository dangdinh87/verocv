import { Quotes } from '@phosphor-icons/react/dist/ssr'
import { SpotlightCard } from '@/components/ui/spotlight-card'

const STORIES = [
  {
    name: 'Phạm Hoàng Nam',
    role: 'Senior AI & Backend Engineer · TP.HCM',
    template: 'Mẫu Công nghệ & AI',
    avatar: '/images/avatars/hoang-nam.jpg',
    quote:
      'Mình dán JD từ 3 công ty fintech, AI Review chỉ rõ câu mô tả hệ thống Kafka còn thiếu thông số độ trễ. Chỉnh 15 phút xong xuôi là nhận lịch phỏng vấn vòng kỹ thuật ngay.',
  },
  {
    name: 'Lê Thị Trúc Ly',
    role: 'Chuyên viên Kinh doanh B2B (Sales) · TP.HCM',
    template: 'Mẫu Ảnh tròn',
    avatar: '/images/avatars/minh-anh.jpg',
    quote:
      'Gửi Link CV /p/truc-ly kèm ?ref= theo từng doanh nghiệp giúp mình biết chính xác HR bên nào vừa mở xem thành tích doanh số và tải PDF. Cảm giác chủ động chốt lịch phỏng vấn hơn hẳn gửi file đính kèm truyền thống.',
  },
  {
    name: 'Vũ Khánh Linh',
    role: 'Product Manager B2B SaaS · Hà Nội',
    template: 'Mẫu Hiện đại Product',
    avatar: '/images/avatars/khanh-linh.jpg',
    quote:
      'Chức năng dịch song ngữ Việt – Anh và giữ nguyên bố cục 2 cột rất mượt. Mình chỉ cần soạn 1 hồ sơ gốc rồi nhân bản riêng cho từng công ty SaaS mà không lo vỡ trang.',
  },
  {
    name: 'Phạm Thảo Vy',
    role: 'Senior Product Designer · TP.HCM',
    template: 'Mẫu Sáng tạo Studio',
    avatar: '/images/avatars/thao-vy.jpg',
    quote:
      'Là designer nhưng mình vẫn chọn VeroCV vì lưới chữ, khoảng trắng và tỷ lệ em trên khổ A4 rất sạch, xuất PDF lớp chữ chọn được để qua hệ thống ATS của các tập đoàn lớn.',
  },
] as const

export function TestimonialsSection() {
  return (
    <section id="cau-chuyen-ung-vien" aria-labelledby="testimonials-title" className="border-t border-rule py-16 lg:py-20">
      <div className="wrap">
        <div className="max-w-[44rem]">
          <span className="inline-flex items-center rounded-full border border-rule bg-paper px-3 py-1 text-xs font-bold text-pen">
            Ứng viên thực tế nói gì
          </span>
          <h2 id="testimonials-title" className="display mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] text-ink">
            Từ bản nháp rời rạc đến bộ hồ sơ sẵn sàng nhận offer
          </h2>
          <p className="mt-2 text-base text-ink-2">
            Thiết kế tối giản cho mắt HR Việt Nam lẫn quốc tế, kết hợp AI Review và theo dõi lượt xem trực tuyến.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {STORIES.map((story) => (
            <SpotlightCard key={story.name} as="article" className="elevated-card flex flex-col justify-between p-6">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <img
                      src={story.avatar}
                      alt={`Ảnh chân dung ${story.name}`}
                      className="size-12 shrink-0 rounded-full border border-rule object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-ink">{story.name}</h3>
                      <p className="truncate text-xs text-ink-3">{story.role}</p>
                    </div>
                  </div>
                  <Quotes size={22} weight="fill" className="shrink-0 text-pen/35" aria-hidden="true" />
                </div>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-2">“{story.quote}”</p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-rule pt-3.5 text-xs">
                <span className="rounded-full bg-pen-wash px-2.5 py-0.5 font-semibold text-pen">{story.template}</span>
                <span className="font-semibold text-mint">Đã kiểm chứng ATS</span>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}
