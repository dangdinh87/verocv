'use client'

import { ArrowCounterClockwise, Check, Columns, Eye, EyeSlash, Palette, QrCode, Translate } from '@phosphor-icons/react/dist/ssr'
import { useId, useState } from 'react'
import { defaultSectionTitle, ResumePaper } from '@/components/resume/resume-paper'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { TextField } from '@/components/ui/field'
import { arrayMove, SortableList } from '@/components/ui/sortable-list'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { useEditorStore } from '@/store/editor-store'
import { DEFAULT_SECTION_ORDER, isCustomSectionKey, normalizeSectionOrder, type CvColumnSplit, type CvFontFamilyV2, type CvHeaderLayout, type CvHeadingStyle, type CvSkillStyle } from '@/types/schema'

const ACCENT_COLORS = [
  { name: 'Xanh mực VeroCV', value: '#2448a8' },
  { name: 'Ngọc lục bảo', value: '#0c6a58' },
  { name: 'Đen in ấn', value: '#0f172a' },
  { name: 'Xanh ngọc', value: '#0d9488' },
  { name: 'Xanh hải quân', value: '#1e3a8a' },
  { name: 'Tím than', value: '#4338ca' },
  { name: 'Đỏ mộc', value: '#e11d48' },
  { name: 'Nâu đất', value: '#b45309' },
]

const TWO_COLUMN_LAYOUTS = new Set(['cot-xanh', 'bia-kraft', 'thu-gon', 'con-dau', 'cong-nghe', 'hien-dai', 'sang-tao'])
const DEFAULT_SIDE_BY_LAYOUT: Record<string, string[]> = {
  'cot-xanh': ['skills', 'languages'],
  'bia-kraft': ['skills', 'education', 'languages'],
  'thu-gon': ['skills', 'education', 'languages'],
  'con-dau': ['education', 'skills', 'languages'],
  'cong-nghe': ['skills', 'languages'],
  'hien-dai': ['skills', 'education', 'languages'],
  'sang-tao': ['skills', 'languages'],
}

const BUILTIN_LABELS: Record<string, string> = {
  summary: 'Giới thiệu / Mục tiêu',
  jobs: 'Kinh nghiệm làm việc',
  education: 'Học vấn',
  extra: 'Mục phụ (Chứng chỉ / Dự án)',
  skills: 'Kỹ năng',
  languages: 'Ngoại ngữ',
}

export function DesignSettingsForm({ onTranslateCv }: { onTranslateCv?: (targetLang: 'vi' | 'en') => Promise<void> }) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const colorPickerId = useId()
  const [translating, setTranslating] = useState(false)
  const [translateMsg, setTranslateMsg] = useState<string | null>(null)
  if (!doc) return null
  const s = doc.settings
  const customMap = new Map(doc.data.customSections.map((cs) => [cs.id, cs]))
  const customIds = doc.data.customSections.map((cs) => cs.id)
  const order = normalizeSectionOrder(s.sectionOrder, customIds)
  const hiddenSet = new Set(s.hiddenSections)
  const isPresetColor = ACCENT_COLORS.some((c) => c.value === s.accentColor.toLowerCase())
  const isTwoCol = TWO_COLUMN_LAYOUTS.has(doc.layout)
  const activeSideList =
    s.sideSections && s.sideSections.length > 0 ? s.sideSections : (DEFAULT_SIDE_BY_LAYOUT[doc.layout] ?? ['skills', 'languages'])
  const sideSet = new Set(activeSideList)

  const toggleColumnSide = (key: string) => {
    updateDoc((d) => {
      const base =
        d.settings.sideSections && d.settings.sideSections.length > 0
          ? [...d.settings.sideSections]
          : [...(DEFAULT_SIDE_BY_LAYOUT[d.layout] ?? ['skills', 'languages'])]
      if (base.includes(key)) {
        d.settings.sideSections = base.filter((k) => k !== key)
      } else {
        d.settings.sideSections = [...base, key]
      }
    }, 'Chuyển cột hiển thị mục')
  }

  const runTranslate = async () => {
    if (!onTranslateCv) return
    const nextLang = (s.documentLanguage ?? 'vi') === 'vi' ? 'en' : 'vi'
    setTranslating(true)
    setTranslateMsg(null)
    try {
      await onTranslateCv(nextLang)
      setTranslateMsg(`Đã tạo bản sao CV bằng ${nextLang === 'en' ? 'tiếng Anh' : 'tiếng Việt'}!`)
    } catch {
      setTranslateMsg('Không dịch được CV lúc này, vui lòng thử lại.')
    } finally {
      setTranslating(false)
    }
  }

  const defaultOrderWithCustom = [...DEFAULT_SECTION_ORDER, ...customIds]
  const hasCustomOrderOrTitles =
    order.some((k, idx) => k !== defaultOrderWithCustom[idx]) ||
    Object.values(s.sectionTitles ?? {}).some((v) => v.trim().length > 0) ||
    s.hiddenSections.length > 0

  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="text-base font-bold">Mẫu bố cục</legend>
        <p className="mt-1 text-sm text-ink-3">Đổi mẫu bất cứ lúc nào, toàn bộ nội dung đều được giữ nguyên.</p>
        <div role="radiogroup" aria-label="Mẫu CV" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CV_TEMPLATES.map((t) => {
            const active = doc.layout === t.layout
            return (
              <button
                key={t.slug}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  updateDoc((d) => {
                    d.layout = t.layout
                  }, `Đổi mẫu sang ${t.name}`)
                }
                className={`cursor-pointer rounded-control border p-2 text-left transition-colors ${active ? 'border-pen outline-2 outline-pen' : 'border-rule hover:border-ink/40'}`}
              >
                <span className="pointer-events-none block overflow-hidden rounded-[3px] border border-rule">
                  <ResumePaper layout={t.layout} data={doc.data} settings={{ ...s, paperSize: 'a4' }} label={t.name} />
                </span>
                <span className="mt-2 flex items-center gap-1 text-sm font-semibold">
                  {active && <Check size={14} weight="bold" className="text-pen" aria-hidden="true" />}
                  {t.name}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="border-t border-rule pt-6">
        <legend className="text-sm font-semibold text-ink-2">Màu nhấn & thương hiệu cá nhân</legend>
        <div role="radiogroup" aria-label="Màu nhấn" className="mt-2.5 flex flex-wrap items-center gap-2.5">
          {ACCENT_COLORS.map((c) => {
            const active = s.accentColor.toLowerCase() === c.value
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={c.name}
                title={c.name}
                onClick={() =>
                  updateDoc((d) => {
                    d.settings.accentColor = c.value
                  }, 'Đổi màu nhấn')
                }
                style={{ backgroundColor: c.value }}
                className={`flex size-9 cursor-pointer items-center justify-center rounded-full text-white ${active ? 'outline-2 outline-offset-2 outline-ink' : ''}`}
              >
                {active && <Check size={15} weight="bold" aria-hidden="true" />}
              </button>
            )
          })}

          <label
            htmlFor={colorPickerId}
            className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${
              !isPresetColor ? 'border-ink bg-desk text-ink' : 'border-rule bg-paper text-ink-2 hover:border-ink/40'
            }`}
          >
            <Palette size={16} aria-hidden="true" />
            <span>Màu tuỳ chọn</span>
            <span className="size-4 rounded-full border border-rule" style={{ backgroundColor: s.accentColor }} aria-hidden="true" />
            <input
              id={colorPickerId}
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(s.accentColor) ? s.accentColor : '#2448a8'}
              onChange={(e) =>
                updateDoc((d) => {
                  d.settings.accentColor = e.target.value
                }, 'Chọn màu tuỳ chỉnh')
              }
              className="sr-only"
            />
          </label>
        </div>
      </fieldset>

      <div className="space-y-5 border-t border-rule pt-6">
        <h3 className="text-base font-bold">Chữ viết & Ngôn ngữ</h3>
        <ChoiceGroup
          legend="Ngôn ngữ tiêu đề mục"
          value={s.documentLanguage ?? 'vi'}
          options={[
            { value: 'vi', label: 'Tiếng Việt' },
            { value: 'en', label: 'English' },
          ]}
          onChange={(documentLanguage) =>
            updateDoc((d) => {
              d.settings.documentLanguage = documentLanguage
            }, 'Đổi ngôn ngữ tiêu đề CV')
          }
        />
        {onTranslateCv && (
          <div className="rounded-control border border-rule bg-desk p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink">AI Dịch toàn bộ CV (Việt ↔ Anh)</p>
                <p className="text-xs text-ink-3">Tạo bản sao mới dịch chuẩn văn phong tuyển dụng, giữ nguyên bản gốc.</p>
              </div>
              <Button variant="secondary" size="sm" disabled={translating} onClick={() => void runTranslate()} className="gap-1.5">
                <Translate size={15} weight="bold" aria-hidden="true" />
                {translating ? 'Đang dịch…' : (s.documentLanguage ?? 'vi') === 'vi' ? 'Dịch sang English' : 'Dịch sang Tiếng Việt'}
              </Button>
            </div>
            {translateMsg && <p className="mt-2 text-xs font-semibold text-pen">{translateMsg}</p>}
          </div>
        )}
        <ChoiceGroup<CvFontFamilyV2>
          legend="Phông chữ"
          value={s.fontFamily}
          options={[
            { value: 'sans', label: 'Be Vietnam Pro' },
            { value: 'jakarta', label: 'Plus Jakarta Sans' },
            { value: 'serif', label: 'Source Serif 4' },
            { value: 'lora', label: 'Lora (Cổ điển)' },
          ]}
          onChange={(fontFamily) =>
            updateDoc((d) => {
              d.settings.fontFamily = fontFamily
            }, 'Đổi phông chữ')
          }
        />
        <ChoiceGroup
          legend="Cỡ chữ"
          value={s.fontSize}
          options={[
            { value: 'compact', label: 'Nhỏ' },
            { value: 'normal', label: 'Vừa' },
            { value: 'relaxed', label: 'Lớn' },
          ]}
          onChange={(fontSize) =>
            updateDoc((d) => {
              d.settings.fontSize = fontSize
            }, 'Đổi cỡ chữ')
          }
        />
      </div>

      <div className="space-y-5 border-t border-rule pt-6">
        <div>
          <h3 className="text-base font-bold">Khoảng cách & Khổ giấy</h3>
          <p className="mt-0.5 text-sm text-ink-3">Tinh chỉnh lề và khoảng cách mục để CV vừa gọn trên 1 trang.</p>
        </div>
        <ChoiceGroup
          legend="Căn lề trang"
          value={s.pageMargin ?? 'normal'}
          options={[
            { value: 'compact', label: 'Hẹp' },
            { value: 'normal', label: 'Chuẩn' },
            { value: 'spacious', label: 'Rộng' },
          ]}
          onChange={(pageMargin) =>
            updateDoc((d) => {
              d.settings.pageMargin = pageMargin
            }, 'Đổi căn lề trang')
          }
        />
        <ChoiceGroup
          legend="Khoảng cách giữa các mục"
          value={s.sectionSpacing ?? 'normal'}
          options={[
            { value: 'compact', label: 'Khít' },
            { value: 'normal', label: 'Chuẩn' },
            { value: 'spacious', label: 'Thoáng' },
          ]}
          onChange={(sectionSpacing) =>
            updateDoc((d) => {
              d.settings.sectionSpacing = sectionSpacing
            }, 'Đổi khoảng cách mục')
          }
        />
        <ChoiceGroup
          legend="Giãn dòng văn bản"
          value={s.spacing}
          options={[
            { value: 'compact', label: 'Gọn' },
            { value: 'normal', label: 'Chuẩn' },
            { value: 'relaxed', label: 'Thoáng' },
          ]}
          onChange={(spacing) =>
            updateDoc((d) => {
              d.settings.spacing = spacing
            }, 'Đổi khoảng cách dòng')
          }
        />
        <ChoiceGroup
          legend="Khổ giấy"
          value={s.paperSize}
          options={[
            { value: 'a4', label: 'A4 (210 × 297 mm)' },
            { value: 'letter', label: 'US Letter' },
          ]}
          onChange={(paperSize) =>
            updateDoc((d) => {
              d.settings.paperSize = paperSize
            }, 'Đổi khổ giấy')
          }
        />
        {isTwoCol && (
          <ChoiceGroup<CvColumnSplit>
            legend="Độ rộng cột phụ (2 cột)"
            value={s.columnSplit ?? 'balanced'}
            options={[
              { value: 'compact', label: 'Gọn (30%)' },
              { value: 'balanced', label: 'Cân bằng (35%)' },
              { value: 'wide', label: 'Rộng (40%)' },
            ]}
            onChange={(columnSplit) =>
              updateDoc((d) => {
                d.settings.columnSplit = columnSplit
              }, 'Đổi tỷ lệ 2 cột')
            }
          />
        )}
      </div>

      <div className="space-y-4 border-t border-rule pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <QrCode size={18} weight="bold" className="text-pen" aria-hidden="true" />
            <h3 className="text-base font-bold">Mã QR trên CV</h3>
          </div>
          <Button
            variant={s.showQrCode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() =>
              updateDoc((d) => {
                d.settings.showQrCode = !d.settings.showQrCode
                if (d.settings.showQrCode && !d.settings.qrUrl.trim()) {
                  d.settings.qrUrl = d.data.link.trim() || 'https://verocv.vn'
                }
              }, 'Bật/tắt mã QR trên CV')
            }
          >
            {s.showQrCode ? 'Đang hiện mã QR' : 'Thêm mã QR'}
          </Button>
        </div>
        {s.showQrCode && (
          <TextField
            label="Đường dẫn của mã QR"
            value={s.qrUrl ?? ''}
            placeholder="https://verocv.vn/p/ten-cua-ban"
            hint="Nhà tuyển dụng quét mã QR trên bản in PDF để mở thẳng Link CV Online hoặc Portfolio của bạn."
            onChange={(e) =>
              updateDoc((d) => {
                d.settings.qrUrl = e.target.value
              }, 'Sửa đường dẫn mã QR')
            }
          />
        )}
      </div>

      <div className="space-y-5 border-t border-rule pt-6">
        <h3 className="text-base font-bold">Kiểu trình bày chi tiết</h3>
        <ChoiceGroup<CvHeaderLayout>
          legend="Bố cục phần đầu trang (Header)"
          value={s.headerLayout ?? 'template'}
          options={[
            { value: 'template', label: 'Theo mẫu' },
            { value: 'left', label: 'Căn trái' },
            { value: 'center', label: 'Căn giữa' },
            { value: 'split', label: 'Tách 2 bên' },
          ]}
          onChange={(headerLayout) =>
            updateDoc((d) => {
              d.settings.headerLayout = headerLayout
            }, 'Đổi bố cục phần đầu trang')
          }
        />
        <ChoiceGroup
          legend="Biểu tượng tiêu đề mục"
          value={s.showSectionIcons ? 'show' : 'hide'}
          options={[
            { value: 'hide', label: 'Tắt' },
            { value: 'show', label: 'Hiện icon mục' },
          ]}
          onChange={(val) =>
            updateDoc((d) => {
              d.settings.showSectionIcons = val === 'show'
            }, 'Bật/tắt biểu tượng tiêu đề mục')
          }
        />
        <ChoiceGroup<CvHeadingStyle>
          legend="Kiểu tiêu đề mục"
          value={s.headingStyle ?? 'default'}
          options={[
            { value: 'default', label: 'Theo mẫu' },
            { value: 'underline', label: 'Gạch chân' },
            { value: 'shaded', label: 'Nền màu nhạt' },
            { value: 'left-accent', label: 'Vạch trái' },
            { value: 'minimal', label: 'Tối giản' },
          ]}
          onChange={(headingStyle) =>
            updateDoc((d) => {
              d.settings.headingStyle = headingStyle
            }, 'Đổi kiểu tiêu đề mục')
          }
        />
        <ChoiceGroup
          legend="Chữ hoa tiêu đề mục"
          value={s.headingCase ?? 'normal'}
          options={[
            { value: 'normal', label: 'Bình thường' },
            { value: 'uppercase', label: 'IN HOA' },
          ]}
          onChange={(headingCase) =>
            updateDoc((d) => {
              d.settings.headingCase = headingCase
            }, 'Đổi kiểu chữ hoa tiêu đề')
          }
        />
        <ChoiceGroup<CvSkillStyle>
          legend="Kiểu hiển thị Kỹ năng"
          value={s.skillStyle ?? 'template'}
          options={[
            { value: 'template', label: 'Theo mẫu' },
            { value: 'pills', label: 'Thẻ bo tròn' },
            { value: 'comma', label: 'Dấu phẩy' },
            { value: 'bullets', label: 'Danh sách chấm' },
            { value: 'grid', label: 'Lưới 2 cột' },
          ]}
          onChange={(skillStyle) =>
            updateDoc((d) => {
              d.settings.skillStyle = skillStyle
            }, 'Đổi kiểu hiển thị kỹ năng')
          }
        />
        <ChoiceGroup
          legend="Biểu tượng thông tin liên hệ"
          value={s.showContactIcons ? 'show' : 'hide'}
          options={[
            { value: 'hide', label: 'Chỉ hiện chữ' },
            { value: 'show', label: 'Kèm biểu tượng (Icon)' },
          ]}
          onChange={(val) =>
            updateDoc((d) => {
              d.settings.showContactIcons = val === 'show'
            }, 'Bật/tắt biểu tượng liên hệ')
          }
        />
        <ChoiceGroup
          legend="Khung ảnh chân dung"
          value={s.photoShape ?? 'circle'}
          options={[
            { value: 'circle', label: 'Tròn' },
            { value: 'rounded', label: 'Bo góc' },
            { value: 'square', label: 'Vuông' },
          ]}
          onChange={(photoShape) =>
            updateDoc((d) => {
              d.settings.photoShape = photoShape
            }, 'Đổi khung ảnh chân dung')
          }
        />
      </div>

      <fieldset className="border-t border-rule pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-base font-bold">Thứ tự, Ẩn/Hiện & Tên các mục</legend>
          {hasCustomOrderOrTitles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                updateDoc((d) => {
                  d.settings.sectionOrder = [...DEFAULT_SECTION_ORDER, ...d.data.customSections.map((c) => c.id)]
                  d.settings.sectionTitles = {}
                  d.settings.hiddenSections = []
                }, 'Đặt lại thứ tự và tên mục')
              }
              className="gap-1.5 text-pen"
            >
              <ArrowCounterClockwise size={15} aria-hidden="true" />
              Đặt lại mặc định
            </Button>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-3">
          Kéo chấm dọc để đổi vị trí, bấm biểu tượng mắt để ẩn/hiện mục trên CV, hoặc gõ tiêu đề mới.
        </p>
        <div className="mt-3">
          <SortableList
            items={order.map((id) => ({ id }))}
            kind="mục CV"
            onReorder={(from, to) =>
              updateDoc((d) => {
                d.settings.sectionOrder = arrayMove(order, from, to)
              }, 'Đổi thứ tự mục CV')
            }
            renderItem={(item, _idx, handle) => {
              const key = item.id
              const customSec = isCustomSectionKey(key) ? customMap.get(key) : undefined
              const desc = customSec ? `Mục bổ sung (${customSec.title})` : (BUILTIN_LABELS[key] ?? key)
              const fallback = defaultSectionTitle(key, doc.layout, s.documentLanguage ?? 'vi', doc.data.extra.title, customSec?.title)
              const customValue = customSec ? customSec.title : (s.sectionTitles?.[key] ?? '')
              const isHidden = hiddenSet.has(key)

              return (
                <div className={`flex items-center gap-2 rounded-control border border-rule bg-paper p-2 ${isHidden ? 'opacity-60' : ''}`}>
                  {handle}
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`sec-title-${key}`} className="block text-xs font-medium text-ink-3">
                      {desc}
                    </label>
                    <input
                      id={`sec-title-${key}`}
                      type="text"
                      value={customValue}
                      placeholder={fallback}
                      onChange={(e) =>
                        updateDoc((d) => {
                          if (customSec) {
                            const target = d.data.customSections.find((c) => c.id === key)
                            if (target) target.title = e.target.value
                            return
                          }
                          if (!d.settings.sectionTitles) d.settings.sectionTitles = {}
                          if (e.target.value.trim()) {
                            d.settings.sectionTitles[key] = e.target.value
                          } else {
                            delete d.settings.sectionTitles[key]
                          }
                        }, `Đổi tên mục ${desc}`)
                      }
                      className="mt-0.5 h-9 w-full rounded-control border border-rule bg-desk px-2.5 text-base text-ink placeholder:text-ink-3/75 focus-visible:border-pen focus-visible:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleColumnSide(key)}
                    disabled={!isTwoCol}
                    title={isTwoCol ? 'Đổi giữa cột chính và cột phụ' : 'Chỉ dùng cho mẫu 2 cột'}
                    className={`hidden h-8 shrink-0 items-center gap-1 rounded-control border px-2 text-xs font-semibold sm:inline-flex ${
                      isTwoCol
                        ? sideSet.has(key)
                          ? 'cursor-pointer border-pen/40 bg-pen-wash text-pen'
                          : 'cursor-pointer border-rule bg-desk text-ink-2 hover:border-pen'
                        : 'cursor-not-allowed border-rule bg-desk text-ink-3 opacity-45'
                    }`}
                  >
                    <Columns size={13} aria-hidden="true" />
                    {sideSet.has(key) ? 'Cột phụ' : 'Cột chính'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateDoc(
                        (d) => {
                          if (d.settings.hiddenSections.includes(key)) {
                            d.settings.hiddenSections = d.settings.hiddenSections.filter((x) => x !== key)
                          } else {
                            d.settings.hiddenSections.push(key)
                          }
                        },
                        isHidden ? `Hiện mục ${desc}` : `Ẩn mục ${desc}`,
                      )
                    }
                    aria-label={isHidden ? `Hiện mục ${desc}` : `Ẩn mục ${desc}`}
                    title={isHidden ? 'Hiện lại trên CV' : 'Ẩn tạm trên CV'}
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                  >
                    {isHidden ? <EyeSlash size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              )
            }}
          />
        </div>
      </fieldset>
    </div>
  )
}
