'use client'

import { ArrowRight, Briefcase, Camera, Check, MagnifyingGlass, Palette, Sparkle, UserCircle } from '@phosphor-icons/react/dist/ssr'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ROLE_STARTER_KITS, type RoleStarterKit } from '@/components/resume/resume-data'
import { ResumePaper } from '@/components/resume/resume-paper'
import { TemplateCard } from '@/components/template-card'
import { CV_CATEGORIES, CV_TEMPLATES, findCvTemplate, type CvCategory } from '@/data/cv-templates'
import { createCv, saveCv } from '@/lib/cv-repository'

type Filter = 'Tất cả' | CvCategory
type PhotoFilter = 'all' | 'with-photo' | 'no-photo'

const FILTERS: Filter[] = ['Tất cả', ...CV_CATEGORIES]

const PHOTO_FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'with-photo', label: 'Có ảnh' },
  { id: 'no-photo', label: 'Không ảnh' },
]

const PREVIEW_SWATCHES = [
  { name: 'Ngọc lục bảo', value: '#0c6a58' },
  { name: 'Đen tuyền', value: '#0f172a' },
  { name: 'Hải quân', value: '#1e3a8a' },
  { name: 'Nâu đất', value: '#b45309' },
  { name: 'Đỏ mộc', value: '#be123c' },
  { name: 'Chàm', value: '#4338ca' },
] as const

// Filter = filled pill (state toggle). Content navigation elsewhere on the site uses underline tabs.
export function CvTemplateGallery() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('Tất cả')
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('all')
  const [query, setQuery] = useState('')
  const [previewAccent, setPreviewAccent] = useState<string>('#0c6a58')
  const [showSamplePhoto, setShowSamplePhoto] = useState<boolean>(true)
  const [creatingKitId, setCreatingKitId] = useState<string | null>(null)

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CV_TEMPLATES.filter((t) => {
      if (filter !== 'Tất cả' && !t.tags.includes(filter)) return false
      if (photoFilter === 'with-photo' && !t.photo) return false
      if (photoFilter === 'no-photo' && t.photo) return false
      if (!q) return true
      const haystack = `${t.name} ${t.blurb} ${t.columns} ${t.tags.join(' ')}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [filter, photoFilter, query])

  const handleUseKit = async (kit: RoleStarterKit) => {
    if (creatingKitId) return
    setCreatingKitId(kit.id)
    try {
      const title = `CV ${kit.roleTitle}`
      const doc = createCv({
        templateSlug: kit.recommendedLayout,
        title,
      })
      const nextDoc = {
        ...doc,
        title,
        data: JSON.parse(JSON.stringify(kit.data)),
        settings: {
          ...doc.settings,
          accentColor: kit.accentColor,
          fontFamily: kit.recommendedLayout === 'ke-ngang' || kit.recommendedLayout === 'harvard' ? ('serif' as const) : ('sans' as const),
        },
      }
      await saveCv(nextDoc)
      router.push(`/cv/${doc.id}`)
    } catch {
      setCreatingKitId(null)
    }
  }

  return (
    <div className="space-y-16">
      <section aria-label="Thư viện mẫu CV">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mẫu theo tên hoặc ngành nghề (VD: Harvard, AI, Product)..."
              aria-label="Tìm mẫu CV"
              className="h-10 w-full rounded-control border border-rule bg-paper pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-pen focus:outline-none"
            />
          </div>

          <div role="group" aria-label="Lọc theo ảnh chân dung" className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper p-1">
            <Camera size={15} className="ml-2 text-ink-3" aria-hidden="true" />
            {PHOTO_FILTERS.map((pf) => {
              const active = pf.id === photoFilter
              return (
                <button
                  key={pf.id}
                  type="button"
                  onClick={() => setPhotoFilter(pf.id)}
                  aria-pressed={active}
                  className={`h-8 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                    active ? 'bg-ink text-white' : 'text-ink-2 hover:bg-ink/[0.06]'
                  }`}
                >
                  {pf.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-sheet border border-rule bg-paper p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2">
              <Palette size={15} className="text-pen" aria-hidden="true" />
              Màu nhấn xem trước:
            </span>
            <div role="radiogroup" aria-label="Chọn màu nhấn xem trước" className="flex flex-wrap items-center gap-2">
              {PREVIEW_SWATCHES.map((sw) => {
                const active = previewAccent === sw.value
                return (
                  <button
                    key={sw.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={sw.name}
                    title={sw.name}
                    onClick={() => setPreviewAccent(sw.value)}
                    style={{ backgroundColor: sw.value }}
                    className={`flex size-7 cursor-pointer items-center justify-center rounded-full text-white transition-transform hover:scale-105 ${
                      active ? 'outline-2 outline-offset-2 outline-ink' : ''
                    }`}
                  >
                    {active && <Check size={13} weight="bold" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showSamplePhoto}
            onClick={() => setShowSamplePhoto((v) => !v)}
            className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
              showSamplePhoto ? 'border-pen bg-pen-wash text-pen-dark' : 'border-rule bg-desk text-ink-2 hover:border-ink/30'
            }`}
          >
            <UserCircle size={16} weight={showSamplePhoto ? 'fill' : 'regular'} aria-hidden="true" />
            Hiện ảnh chân dung mẫu
            <span
              aria-hidden="true"
              className={`rounded-full px-1.5 py-0.5 text-[0.68rem] font-bold ${
                showSamplePhoto ? 'bg-pen text-white' : 'bg-rule text-ink-2'
              }`}
            >
              {showSamplePhoto ? 'BẬT' : 'TẮT'}
            </span>
          </button>
        </div>

        <div role="group" aria-label="Lọc theo kiểu mẫu" className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = f === filter
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                  active ? 'bg-pen text-white' : 'border border-rule bg-paper text-ink-2 hover:border-ink/30 hover:bg-ink/[0.04]'
                }`}
              >
                {f}
              </button>
            )
          })}
        </div>

        <p className="mt-5 text-sm text-ink-3" aria-live="polite">
          Hiển thị {shown.length} / {CV_TEMPLATES.length} mẫu CV chuẩn ATS
        </p>

        {shown.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((t) => (
              <TemplateCard key={t.slug} t={t} previewAccent={previewAccent} showSamplePhoto={showSamplePhoto} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-sheet border border-rule bg-paper px-6 py-10 text-center">
            <p className="font-semibold text-ink">Không tìm thấy mẫu CV phù hợp với bộ lọc hiện tại.</p>
            <p className="mt-1 text-sm text-ink-3">Thử xoá từ khoá hoặc chọn lại danh mục “Tất cả”.</p>
            <button
              type="button"
              onClick={() => {
                setFilter('Tất cả')
                setPhotoFilter('all')
                setQuery('')
              }}
              className="mt-4 inline-flex h-9 items-center rounded-control border border-rule bg-desk px-4 text-sm font-semibold text-ink hover:border-ink/40"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="role-kits-heading" className="border-t border-rule pt-14">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-wash px-3 py-1 text-xs font-semibold text-mint">
              <Sparkle size={14} weight="fill" aria-hidden="true" />
              Khởi tạo nhanh trong 1 chạm
            </span>
            <h2 id="role-kits-heading" className="display mt-3 text-[clamp(1.65rem,3vw,2.25rem)]">
              Bộ CV theo ngành nghề (Role Starter Kits)
            </h2>
            <p className="mt-2 max-w-[60ch] text-[1.02rem] text-ink-2">
              Chọn đúng vị trí bạn đang ứng tuyển để nhận ngay CV đã điền sẵn bố cục, từ khoá ngành nghề và gạch đầu dòng có số liệu mẫu.
            </p>
          </div>
          <p className="text-sm font-medium text-ink-3">{ROLE_STARTER_KITS.length} bộ mẫu chuyên ngành</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_STARTER_KITS.map((kit) => {
            const tpl = findCvTemplate(kit.recommendedLayout)
            const isCreating = creatingKitId === kit.id
            const kitData = showSamplePhoto ? kit.data : { ...kit.data, photo: '' }
            return (
              <article
                key={kit.id}
                className="flex flex-col overflow-hidden rounded-sheet border border-rule bg-paper transition-colors hover:border-ink/30"
              >
                <div className="relative border-b border-rule bg-desk p-4">
                  <div className="mx-auto max-w-[11.5rem] overflow-hidden rounded-[6px] border border-rule bg-paper">
                    <ResumePaper
                      layout={kit.recommendedLayout}
                      data={kitData}
                      settings={{
                        accentColor: kit.accentColor,
                        fontFamily: kit.recommendedLayout === 'ke-ngang' || kit.recommendedLayout === 'harvard' ? 'serif' : 'sans',
                      }}
                      label={`Xem trước bộ CV ${kit.roleTitle}`}
                    />
                  </div>
                  <span className="absolute left-3 top-3 rounded-full border border-rule bg-paper px-2.5 py-0.5 text-[0.72rem] font-bold text-ink">
                    {kit.badge}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
                    <Briefcase size={14} aria-hidden="true" />
                    <span>{kit.industry}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-ink">{kit.roleTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-2">{kit.description}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-rule pt-3 text-xs text-ink-3">
                    <span>Mẫu gợi ý:</span>
                    <span className="font-semibold text-ink">{tpl?.name ?? kit.recommendedLayout}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUseKit(kit)}
                    disabled={creatingKitId !== null}
                    className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-control bg-pen px-4 text-sm font-semibold text-white transition-colors hover:bg-pen-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreating ? 'Đang tạo CV...' : 'Dùng bộ mẫu ngành này'}
                    {!isCreating && <ArrowRight size={15} weight="bold" aria-hidden="true" />}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
