import Link from 'next/link'
import { LetterPaper } from '@/components/resume/letter-paper'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import type { LetterTemplate } from '@/data/letter-templates'

const LAYOUT_LABEL: Record<LetterTemplate['layout'], string> = {
  thang: 'Thẳng cổ điển',
  'dai-mau': 'Dải màu đầu trang',
  giua: 'Căn giữa trang trọng',
  'le-trai': 'Nhấn lề trái',
}

export function LetterTemplateCard({ t, className = '' }: { t: LetterTemplate; className?: string }) {
  return (
    <Link href={`/mau-thu-xin-viec/${t.slug}`} className={`group block ${className}`}>
      <SpotlightCard className="p-3 transition-[transform,border-color] duration-200 group-hover:-translate-y-1 group-hover:border-pen/60">
        <div className="relative rounded-[8px] border border-rule bg-desk p-3">
          <div className="overflow-hidden rounded-[6px] border border-rule bg-white">
            <LetterPaper layout={t.layout} accent={t.accent} label={`Mẫu thư xin việc ${t.name}`} />
          </div>
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center rounded-b-[6px] bg-gradient-to-t from-ink/75 via-ink/35 to-transparent px-3 pb-3 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="inline-flex h-8 items-center rounded-full bg-paper px-3.5 text-xs font-semibold text-ink">
              Xem &amp; dùng mẫu →
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex items-baseline justify-between gap-2 px-0.5">
          <p className="font-semibold text-ink group-hover:text-pen">{t.name}</p>
          <span className="shrink-0 rounded-full border border-rule bg-desk px-2 py-0.5 text-[0.7rem] font-medium text-ink-2">
            {LAYOUT_LABEL[t.layout]}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 px-0.5 text-xs leading-relaxed text-ink-3">{t.blurb}</p>
      </SpotlightCard>
    </Link>
  )
}
