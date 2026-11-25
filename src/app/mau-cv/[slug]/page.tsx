import { ArrowLeft, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ResumePaper } from '@/components/resume/resume-paper'
import { TemplateCard } from '@/components/template-card'
import { Button } from '@/components/ui/button'
import { UseTemplateButton } from '@/components/use-template-button'
import { CV_TEMPLATES, findCvTemplate } from '@/data/cv-templates'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return CV_TEMPLATES.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = findCvTemplate((await params).slug)
  return { title: t ? `Mẫu CV ${t.name}` : 'Mẫu CV' }
}

export default async function CvTemplateDetailPage({ params }: Props) {
  const t = findCvTemplate((await params).slug)
  if (!t) notFound()

  const index = CV_TEMPLATES.findIndex((x) => x.slug === t.slug)
  const related = Array.from({ length: 4 }, (_, i) => CV_TEMPLATES[(index + 1 + i) % CV_TEMPLATES.length])

  return (
    <>
      <div className="wrap pt-6">
        <Link href="/mau-cv" className="inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink-2 hover:text-ink">
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          Tất cả mẫu CV
        </Link>
      </div>

      <section className="wrap grid items-start gap-10 pb-20 pt-8 lg:grid-cols-[minmax(0,31rem)_minmax(0,1fr)] lg:gap-16 lg:pt-10">
        <div className="rounded-sheet border border-rule bg-desk p-4 sm:p-6">
          <div className="overflow-hidden rounded-[6px] border border-rule bg-white">
            <ResumePaper layout={t.layout} label={`Mẫu CV ${t.name}`} />
          </div>
        </div>

        <div className="lg:pt-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-wash px-3 py-1 text-xs font-semibold text-mint">
              <CheckCircle size={14} weight="fill" aria-hidden="true" />
              Chuẩn ATS
            </span>
            <span className="rounded-full border border-rule bg-paper px-3 py-1 text-xs font-medium text-ink-2">{t.columns}</span>
            <span className="rounded-full border border-rule bg-paper px-3 py-1 text-xs font-medium text-ink-2">
              {t.photo ? 'Hỗ trợ ảnh chân dung' : 'Thuần văn bản'}
            </span>
          </div>

          <h1 className="display text-[clamp(2.2rem,4.5vw,3.4rem)]">Mẫu CV {t.name}</h1>
          <p className="mt-4 max-w-[48ch] text-[1.12rem] text-ink-2">{t.blurb}</p>

          <dl className="mt-8 max-w-md border-b border-rule">
            {[
              ['Khổ giấy', 'A4, chuyển sang Letter được'],
              ['Bố cục', t.columns],
              ['Ảnh chân dung', t.photo ? 'Có chỗ cho ảnh' : 'Không dùng ảnh'],
              ['Phù hợp', t.tags.join(', ')],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-4 border-t border-rule py-3.5">
                <dt className="font-semibold">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-wrap gap-3">
            <UseTemplateButton slug={t.slug} />
            <Button href="/mau-cv" variant="secondary" size="lg">
              Xem mẫu khác
            </Button>
          </div>
          <p className="mt-5 text-sm text-ink-3">Miễn phí, tải PDF &amp; Word không giới hạn, không logo.</p>
        </div>
      </section>

      <section className="wrap border-t border-rule pb-24 pt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[1.5rem] font-bold">Mẫu khác bạn có thể thích</h2>
          <Link href="/mau-cv" className="text-sm font-semibold text-pen hover:underline">
            Xem tất cả {CV_TEMPLATES.length} mẫu →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {related.map((r) => (
            <TemplateCard key={r.slug} t={r} />
          ))}
        </div>
      </section>
    </>
  )
}
