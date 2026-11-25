'use client'

import { ArrowRight, Check, Palette, SlidersHorizontal, UserCircle } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { DUC_ANH, HOANG_NAM, KHANH_LINH, MINH_ANH, QUOC_HUY, THAO_VY, type ResumeData } from '@/components/resume/resume-data'
import { ResumePaper } from '@/components/resume/resume-paper'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CvLayout } from '@/types/schema'

type CustomizerLayoutOption = {
  id: CvLayout
  label: string
  subtitle: string
  persona: ResumeData
  avatar: string
  supportsPhoto: boolean
}

const LAYOUT_OPTIONS: CustomizerLayoutOption[] = [
  {
    id: 'anh-tron',
    label: 'Ảnh tròn',
    subtitle: 'Chân dung nổi bật · 1 cột nhãn trái',
    persona: MINH_ANH,
    avatar: '/images/avatars/minh-anh.jpg',
    supportsPhoto: true,
  },
  {
    id: 'cot-xanh',
    label: 'Cột xanh',
    subtitle: 'Hai cột kinh điển · Sidebar nhấn',
    persona: QUOC_HUY,
    avatar: '/images/avatars/quoc-huy.jpg',
    supportsPhoto: true,
  },
  {
    id: 'sang-tao',
    label: 'Sáng tạo Studio',
    subtitle: 'Dành cho Design & Brand',
    persona: THAO_VY,
    avatar: '/images/avatars/thao-vy.jpg',
    supportsPhoto: true,
  },
  {
    id: 'hien-dai',
    label: 'Hiện đại Product',
    subtitle: 'Hai cột SaaS · Tỉ lệ vàng',
    persona: KHANH_LINH,
    avatar: '/images/avatars/khanh-linh.jpg',
    supportsPhoto: true,
  },
  {
    id: 'harvard',
    label: 'Chuẩn Harvard',
    subtitle: 'Tài chính · Học thuật · ATS 100%',
    persona: DUC_ANH,
    avatar: '/images/avatars/duc-anh.jpg',
    supportsPhoto: false,
  },
  {
    id: 'cong-nghe',
    label: 'Công nghệ & AI',
    subtitle: 'Kỹ sư Phần mềm · Backend / AI',
    persona: HOANG_NAM,
    avatar: '/images/avatars/hoang-nam.jpg',
    supportsPhoto: true,
  },
]

const SIGNATURE_COLORS = [
  { hex: '#0c6a58', name: 'Ngọc lục bảo' },
  { hex: '#0f172a', name: 'Đen tuyền' },
  { hex: '#1e3a8a', name: 'Hải quân' },
  { hex: '#b45309', name: 'Nâu đất' },
  { hex: '#be123c', name: 'Đỏ mộc' },
  { hex: '#4338ca', name: 'Chàm' },
] as const

export function LiveCustomizerSection() {
  const [layout, setLayout] = useState<CvLayout>('anh-tron')
  const [accentColor, setAccentColor] = useState<string>('#0c6a58')
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans')
  const [showPhoto, setShowPhoto] = useState(true)

  const currentOption = LAYOUT_OPTIONS.find((o) => o.id === layout) ?? LAYOUT_OPTIONS[0]
  const previewData: ResumeData = {
    ...currentOption.persona,
    photo: showPhoto ? currentOption.avatar : '',
  }

  return (
    <section id="tuy-chinh-truc-tiep" aria-labelledby="customizer-title" className="border-t border-rule bg-paper py-16 lg:py-20">
      <div className="wrap">
        <div className="max-w-[46rem]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pen-wash px-3 py-1 text-xs font-bold text-pen">
            <SlidersHorizontal size={13} weight="bold" aria-hidden="true" />
            Thử tuỳ biến trực tiếp
          </span>
          <h2 id="customizer-title" className="display mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] text-ink">
            Đổi bố cục, màu sắc, phông chữ và ảnh chân dung trong 1 giây
          </h2>
          <p className="mt-2.5 text-base text-ink-2">
            Nội dung luôn giữ nguyên khi bạn chuyển đổi giữa các mẫu chuẩn ATS — không bao giờ bị xô lệch trang như Word.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
          {/* Left Interactive Controls */}
          <Card className="space-y-6 bg-desk/55 p-5 sm:p-6 lg:sticky lg:top-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-3">1. Chọn bố cục mẫu</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2" role="group" aria-label="Chọn mẫu CV">
                {LAYOUT_OPTIONS.map((opt) => {
                  const active = opt.id === layout
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLayout(opt.id)}
                      className={`cursor-pointer rounded-control border px-3 py-2.5 text-left transition-colors ${
                        active ? 'border-pen bg-pen-wash text-ink' : 'border-rule bg-paper text-ink-2 hover:border-pen/40 hover:text-ink'
                      }`}
                    >
                      <span className={`block text-xs font-bold ${active ? 'text-pen' : 'text-ink'}`}>{opt.label}</span>
                      <span className="mt-0.5 block truncate text-[0.68rem] text-ink-3">{opt.subtitle}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-3">
                <Palette size={14} weight="bold" aria-hidden="true" />
                2. Màu nhấn thương hiệu
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5" role="group" aria-label="Chọn màu nhấn">
                {SIGNATURE_COLORS.map((c) => {
                  const active = accentColor === c.hex
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAccentColor(c.hex)}
                      aria-label={`Màu ${c.name}`}
                      aria-pressed={active}
                      title={c.name}
                      className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-2 transition-transform ${
                        active ? 'scale-110 border-ink' : 'border-rule hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {active && <Check size={15} weight="bold" className="text-white" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-3">3. Kiểu chữ &amp; Ảnh chân dung</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2" role="group" aria-label="Chọn kiểu chữ">
                {[
                  { id: 'sans' as const, label: 'Không chân (Sans)' },
                  { id: 'serif' as const, label: 'Có chân (Serif)' },
                ].map((f) => {
                  const active = fontFamily === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFontFamily(f.id)}
                      className={`h-9 cursor-pointer rounded-control border px-3 text-xs font-semibold transition-colors ${
                        active ? 'border-pen bg-pen text-white' : 'border-rule bg-paper text-ink-2 hover:border-pen/40 hover:text-ink'
                      }`}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-control border border-rule bg-paper px-3.5 py-2.5">
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <UserCircle size={16} weight="duotone" className="shrink-0 text-pen" aria-hidden="true" />
                    Hiển thị ảnh chân dung
                  </span>
                  {!currentOption.supportsPhoto && (
                    <span className="mt-0.5 block text-[0.68rem] text-ink-3">Mẫu Chuẩn Harvard ưu tiên tối giản không ảnh</span>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showPhoto}
                  aria-label="Bật tắt ảnh chân dung trên CV"
                  onClick={() => setShowPhoto((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                    showPhoto ? 'border-pen bg-pen' : 'border-rule bg-desk'
                  }`}
                >
                  <span
                    className={`inline-block size-4 rounded-full bg-white transition-transform ${
                      showPhoto ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="border-t border-rule pt-4">
              <Button href={`/mau-cv/${layout}`} size="lg" className="w-full justify-between">
                <span>Tạo CV với kiểu này</span>
                <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </Button>
            </div>
          </Card>

          {/* Right Live A4 Preview */}
          <div className="overflow-hidden rounded-sheet border border-rule bg-desk p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
              <span className="font-bold text-ink">
                Mẫu: {currentOption.label} · {currentOption.persona.name}
              </span>
              <span className="rounded-full border border-rule bg-paper px-2.5 py-0.5 font-semibold text-pen">
                A4 Chuẩn ATS · {fontFamily === 'sans' ? 'Be Vietnam Pro' : 'Source Serif 4'}
              </span>
            </div>
            <div className="mx-auto max-w-[33rem] overflow-hidden rounded-[6px] border border-rule bg-white">
              <ResumePaper
                layout={layout}
                data={previewData}
                settings={{ accentColor, fontFamily }}
                label={`Xem trước trực tiếp mẫu ${currentOption.label}`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
