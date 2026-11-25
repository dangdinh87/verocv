import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { TemplateCard } from '@/components/template-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CV_TEMPLATES } from '@/data/cv-templates'

export function TemplatesStripSection() {
  return (
    <section id="mau-cv" aria-labelledby="templates-title" className="border-t border-rule bg-paper py-16 lg:py-20">
      <div className="wrap">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[42rem]">
            <span className="inline-flex items-center rounded-full bg-mint-wash px-3 py-1 text-xs font-bold text-mint">
              {CV_TEMPLATES.length} mẫu CV chuẩn ATS
            </span>
            <h2 id="templates-title" className="display mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] text-ink">
              Thiết kế sạch sẽ, đọc mượt trên cả máy lọc hồ sơ lẫn mắt HR
            </h2>
            <p className="mt-2 text-base text-ink-2">Đổi mẫu bất cứ lúc nào chỉ với 1 chạm mà không mất nội dung đã soạn.</p>
          </div>
          <Button href="/mau-cv" variant="secondary" className="shrink-0 gap-1.5 self-start sm:self-auto">
            Xem tất cả {CV_TEMPLATES.length} mẫu
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-4">
          {CV_TEMPLATES.slice(0, 4).map((t) => (
            <Card key={t.slug} className="p-3">
              <TemplateCard t={t} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
