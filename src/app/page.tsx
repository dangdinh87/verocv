import { FreePlanSection } from '@/components/home/free-plan-section'
import { HeroShowcase } from '@/components/home/hero-showcase'
import { LiveCustomizerSection } from '@/components/home/live-customizer-section'
import { SaasBentoSection } from '@/components/home/saas-bento-section'
import { StepsSection } from '@/components/home/steps-section'
import { TemplatesStripSection } from '@/components/home/templates-strip-section'
import { Button } from '@/components/ui/button'
import { FaqList } from '@/components/ui/faq-list'
import { FormSection } from '@/components/ui/form-section'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { HOME_FAQS } from '@/data/faqs'

export default function HomePage() {
  return (
    <>
      <div className="relative overflow-hidden">
        <section className="wrap grid items-start gap-10 pb-14 pt-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)] lg:gap-12 lg:pb-20 lg:pt-11">
          <div className="min-w-0 lg:pt-1.5">
            <h1 className="display text-[clamp(2.15rem,4.6vw,3.55rem)] text-ink">
              <span className="block">Tạo CV chuẩn ATS,</span>
              <span className="block text-pen">tối ưu theo từng JD</span>
            </h1>
            <p className="mt-4 max-w-[48ch] text-[1.05rem] leading-relaxed text-ink-2">
              Soạn CV song ngữ Việt – Anh với AI Review từng dòng, xuất PDF &amp; Word (.docx), chia sẻ Link trực tuyến kèm thống kê lượt
              nhà tuyển dụng mở xem. Bắt đầu ngay không cần đăng ký.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/cv" size="lg">
                Mở CV Studio miễn phí
              </Button>
              <Button href="/mau-cv" variant="secondary" size="lg">
                Xem {CV_TEMPLATES.length} mẫu CV
              </Button>
            </div>

            <dl className="mt-7 grid grid-cols-1 gap-4 border-t border-rule pt-6 xs:grid-cols-3">
              <div>
                <dt className="text-xs font-bold text-ink">PDF &amp; Word .docx</dt>
                <dd className="mt-0.5 text-xs text-ink-3">Máy lọc hồ sơ đọc được, không dấu mờ</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-ink">Gợi ý sửa bằng AI</dt>
                <dd className="mt-0.5 text-xs text-ink-3">Chấm điểm, khớp JD, dịch Việt ↔ Anh</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-ink">Link CV trực tuyến</dt>
                <dd className="mt-0.5 text-xs text-ink-3">Biết khi nhà tuyển dụng mở xem</dd>
              </div>
            </dl>
          </div>

          <div className="min-w-0">
            <HeroShowcase />
          </div>
        </section>
      </div>

      <SaasBentoSection />
      <LiveCustomizerSection />
      <StepsSection />
      <TemplatesStripSection />
      <FreePlanSection />

      <FormSection id="hoi-dap" title="Hỏi đáp thường gặp">
        <FaqList items={HOME_FAQS} />
      </FormSection>

      <section className="border-t border-rule bg-pen-wash">
        <div className="wrap flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center lg:py-16">
          <div>
            <h2 className="display text-[clamp(1.75rem,3.6vw,2.5rem)] text-ink">Nâng cấp bộ hồ sơ ứng tuyển ngay hôm nay</h2>
            <p className="mt-2.5 max-w-[48ch] text-ink-2">
              Soạn và xuất bản miễn phí ngay trên trình duyệt, hoặc đăng nhập để đồng bộ giữa các thiết bị và theo dõi lượt nhà tuyển dụng
              mở xem.
            </p>
          </div>
          <Button href="/cv" size="lg" className="shrink-0">
            Bắt đầu miễn phí
          </Button>
        </div>
      </section>
    </>
  )
}
