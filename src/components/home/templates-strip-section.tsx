import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { TemplateCard } from '@/components/template-card'
import { Button } from '@/components/ui/button'
import { Marquee } from '@/components/ui/marquee'
import { SpotlightCard } from '@/components/ui/spotlight-card'
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
            <p className="mt-2 text-base text-ink-2">
              Đổi mẫu bất cứ lúc nào chỉ với 1 chạm mà không mất nội dung đã soạn.
            </p>
          </div>
          <Button href="/mau-cv" variant="secondary" className="shrink-0 gap-1.5 self-start sm:self-auto">
            Xem tất cả {CV_TEMPLATES.length} mẫu
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 xs:grid-cols-2 md:grid-cols-4">
          {CV_TEMPLATES.slice(0, 4).map((t) => (
            <SpotlightCard key={t.slug} className="p-3">
              <TemplateCard t={t} />
            </SpotlightCard>
          ))}
        </div>

        {/* Interactive Mini Template Marquee with smooth edge fade mask */}
        <Marquee
          ariaLabel="Danh sách mẫu CV nổi bật"
          className="mt-8 rounded-sheet border border-rule bg-desk py-3"
        >
          {CV_TEMPLATES.map((t) => (
            <Link
              key={t.slug}
              href={`/mau-cv/${t.slug}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-control border border-rule bg-paper px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-pen hover:text-pen"
            >
              <span className="size-2 rounded-full bg-mint" aria-hidden="true" />
              <span>{t.name}</span>
              <span className="rounded-full bg-desk px-2 py-0.5 text-[0.68rem] font-medium text-ink-3">{t.columns}</span>
            </Link>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
