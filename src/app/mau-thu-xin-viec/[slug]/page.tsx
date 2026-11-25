import { ArrowLeft, CheckCircle } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LetterTemplateCard } from '@/components/letter-template-card'
import { LetterPaper } from '@/components/resume/letter-paper'
import { Button } from '@/components/ui/button'
import { UseLetterTemplateButton } from '@/components/use-letter-template-button'
import { LETTER_TEMPLATES, findLetterTemplate, type LetterTemplate } from '@/data/letter-templates'

type Props = { params: Promise<{ slug: string }> }

const LAYOUT_LABEL: Record<LetterTemplate['layout'], string> = {
  thang: 'Căn trái chuẩn mực',
  'dai-mau': 'Dải màu nổi bật',
  giua: 'Căn giữa đối xứng',
  'le-trai': 'Dải nhấn mép trái',
}

const ACCENT_LABEL: Record<LetterTemplate['accent'], string> = {
  ink: 'Mực đen tối giản',
  pen: 'Xanh ngọc thương hiệu',
  kraft: 'Giấy Kraft ấm áp',
}

export function generateStaticParams() {
  return LETTER_TEMPLATES.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = findLetterTemplate((await params).slug)
  return { title: t ? `Mẫu thư xin việc ${t.name}` : 'Mẫu thư xin việc' }
}

export default async function LetterTemplateDetailPage({ params }: Props) {
  const t = findLetterTemplate((await params).slug)
  if (!t) notFound()

  const index = LETTER_TEMPLATES.findIndex((x) => x.slug === t.slug)
  const related = Array.from({ length: 3 }, (_, i) => LETTER_TEMPLATES[(index + 1 + i) % LETTER_TEMPLATES.length])

  return (
    <>
      <div className="wrap pt-6">
        <Link href="/mau-thu-xin-viec" className="inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink-2 hover:text-ink">
          <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          Tất cả mẫu thư xin việc
        </Link>
      </div>

      <section className="wrap grid items-start gap-10 pb-20 pt-8 lg:grid-cols-[minmax(0,31rem)_minmax(0,1fr)] lg:gap-16 lg:pt-10">
        <div className="elevated-card rounded-sheet border border-rule bg-desk p-4 sm:p-6">
          <div className="overflow-hidden rounded-[6px] border border-rule bg-white">
            <LetterPaper layout={t.layout} accent={t.accent} label={`Mẫu thư xin việc ${t.name}`} />
          </div>
        </div>

        <div className="lg:pt-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-wash px-3 py-1 text-xs font-semibold text-mint">
              <CheckCircle size={14} weight="fill" aria-hidden="true" />
              Đồng bộ thương hiệu CV
            </span>
            <span className="rounded-full border border-rule bg-paper px-3 py-1 text-xs font-medium text-ink-2">
              {LAYOUT_LABEL[t.layout]}
            </span>
            <span className="rounded-full border border-rule bg-paper px-3 py-1 text-xs font-medium text-ink-2">Khổ A4 &amp; Letter</span>
          </div>

          <h1 className="display text-[clamp(2.2rem,4.5vw,3.4rem)]">Thư xin việc {t.name}</h1>
          <p className="mt-4 max-w-[48ch] text-[1.12rem] text-ink-2">{t.blurb}</p>

          <dl className="mt-8 max-w-md border-b border-rule">
            {[
              ['Khổ giấy', 'A4, chuyển sang Letter được'],
              ['Bố cục', LAYOUT_LABEL[t.layout]],
              ['Màu chủ đạo', ACCENT_LABEL[t.accent]],
              ['Đồng bộ CV', '1 chạm lấy thông tin & màu nhấn từ CV đã lưu'],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-4 border-t border-rule py-3.5">
                <dt className="font-semibold">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-wrap gap-3">
            <UseLetterTemplateButton slug={t.slug} />
            <Button href="/mau-thu-xin-viec" variant="secondary" size="lg">
              Xem mẫu khác
            </Button>
          </div>
          <p className="mt-5 text-sm text-ink-3">Miễn phí, tải PDF &amp; Word không giới hạn, không logo.</p>
        </div>
      </section>

      <section className="wrap border-t border-rule pb-24 pt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[1.5rem] font-bold">Mẫu khác bạn có thể thích</h2>
          <Link href="/mau-thu-xin-viec" className="text-sm font-semibold text-pen hover:underline">
            Xem tất cả {LETTER_TEMPLATES.length} mẫu →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {related.map((r) => (
            <LetterTemplateCard key={r.slug} t={r} />
          ))}
        </div>
      </section>
    </>
  )
}
