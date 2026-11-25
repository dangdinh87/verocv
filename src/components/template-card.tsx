import Link from 'next/link'
import { LAYOUT_PERSONA, ResumePaper } from '@/components/resume/resume-paper'
import type { CvTemplate } from '@/data/cv-templates'

export function TemplateCard({
  t,
  className = '',
  previewAccent,
  showSamplePhoto,
}: {
  t: CvTemplate
  className?: string
  previewAccent?: string
  showSamplePhoto?: boolean
}) {
  const persona = LAYOUT_PERSONA[t.layout]
  const data = showSamplePhoto === false ? { ...persona, photo: '' } : persona
  const settings = previewAccent ? { accentColor: previewAccent } : undefined

  return (
    <Link href={`/mau-cv/${t.slug}`} className={`group block ${className}`}>
      <div className="relative overflow-hidden rounded-sheet border border-rule bg-paper transition-[transform,border-color] duration-200 group-hover:-translate-y-1 group-hover:border-pen/60">
        <ResumePaper layout={t.layout} data={data} settings={settings} label={`Mẫu CV ${t.name}`} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-ink/75 via-ink/35 to-transparent px-3 pb-3 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="inline-flex h-8 items-center rounded-full bg-paper px-3.5 text-xs font-semibold text-ink">
            Xem &amp; dùng mẫu →
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="font-semibold text-ink group-hover:text-pen">{t.name}</p>
        <p className="shrink-0 text-xs text-ink-3">{t.columns}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {t.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full border border-rule bg-desk px-2 py-0.5 text-[0.7rem] font-medium text-ink-2">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  )
}
