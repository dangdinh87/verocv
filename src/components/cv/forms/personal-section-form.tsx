'use client'

import { Camera, Eye, EyeSlash, Plus, Trash } from '@phosphor-icons/react/dist/ssr'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { avatarErrorMessage, processAvatarFile } from '@/lib/avatar-image'
import { newId } from '@/lib/cv-repository'
import { useEditorStore } from '@/store/editor-store'
import { computeInitials } from '@/types/resume'

const QUICK_LINK_CHIPS = [
  { label: 'LinkedIn', placeholder: 'linkedin.com/in/username' },
  { label: 'GitHub', placeholder: 'github.com/username' },
  { label: 'Portfolio', placeholder: 'portfolio.example.com' },
  { label: 'Behance', placeholder: 'behance.net/username' },
  { label: 'Website', placeholder: 'yourwebsite.vn' },
] as const

export function PersonalSectionForm() {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)
  const fileInputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!doc) return null
  const d = doc.data
  const currentTemplate = CV_TEMPLATES.find((t) => t.layout === doc.layout)
  const supportsPhoto = currentTemplate?.photo ?? false
  const photoHidden = doc.settings.hiddenSections.includes('photo')

  const set = (field: 'role' | 'location' | 'email' | 'phone' | 'link', description: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateDoc((draft) => {
      draft.data[field] = e.target.value
    }, description)

  const onSelectPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError(null)
    setBusy(true)
    try {
      const dataUrl = await processAvatarFile(file)
      updateDoc((draft) => {
        draft.data.photo = dataUrl
        draft.settings.hiddenSections = draft.settings.hiddenSections.filter((k) => k !== 'photo')
      }, 'Cập nhật ảnh chân dung')
    } catch (err) {
      setPhotoError(avatarErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const toggleHidePhoto = () =>
    updateDoc(
      (draft) => {
        if (photoHidden) {
          draft.settings.hiddenSections = draft.settings.hiddenSections.filter((k) => k !== 'photo')
        } else {
          draft.settings.hiddenSections.push('photo')
        }
      },
      photoHidden ? 'Hiện ảnh chân dung' : 'Ẩn ảnh chân dung',
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-control border border-rule bg-desk p-3.5">
        <div
          className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper font-bold text-ink-2 ${
            photoHidden ? 'opacity-45' : ''
          }`}
        >
          {d.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.photo} alt="Ảnh chân dung trên CV" className="size-full object-cover" />
          ) : (
            <span className="text-lg">{d.initials || <Camera size={22} className="text-ink-3" aria-hidden="true" />}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            Ảnh chân dung <span className="font-normal text-ink-3">(không bắt buộc)</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-3">Ảnh được cắt vuông ngay trên máy bạn, hiển thị ở các mẫu có khung ảnh.</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void onSelectPhoto(e)}
              className="sr-only"
            />
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="gap-1.5">
              <Camera size={15} weight="bold" aria-hidden="true" />
              {busy ? 'Đang xử lý…' : d.photo ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </Button>
            {d.photo && (
              <>
                <Button variant="ghost" size="sm" onClick={toggleHidePhoto} className="gap-1.5 text-ink-2">
                  {photoHidden ? <Eye size={15} aria-hidden="true" /> : <EyeSlash size={15} aria-hidden="true" />}
                  {photoHidden ? 'Hiện ảnh' : 'Ẩn tạm'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoError(null)
                    updateDoc((draft) => {
                      draft.data.photo = ''
                    }, 'Xoá ảnh chân dung')
                  }}
                  className="gap-1.5 text-seal"
                >
                  <Trash size={15} aria-hidden="true" />
                  Gỡ ảnh
                </Button>
              </>
            )}
          </div>
          {photoError && (
            <p role="alert" className="mt-2 text-sm text-seal">
              {photoError}
            </p>
          )}
          {d.photo && !supportsPhoto && (
            <p className="mt-2 text-sm text-ink-2">
              Mẫu <strong>{currentTemplate?.name}</strong> không dùng khung ảnh.{' '}
              <button
                type="button"
                onClick={() =>
                  updateDoc((draft) => {
                    draft.layout = 'anh-tron'
                  }, 'Đổi sang mẫu Ảnh tròn')
                }
                className="cursor-pointer font-semibold text-pen underline underline-offset-2"
              >
                Đổi sang mẫu Ảnh tròn
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Họ và tên"
          name="name"
          autoComplete="name"
          value={d.name}
          onChange={(e) =>
            updateDoc((draft) => {
              draft.data.name = e.target.value
              draft.data.initials = computeInitials(e.target.value)
            }, 'Sửa họ tên')
          }
        />
        <TextField
          label="Vị trí ứng tuyển"
          name="role"
          autoComplete="organization-title"
          value={d.role}
          onChange={set('role', 'Sửa vị trí')}
        />
        <TextField
          label="Địa chỉ (quận, thành phố)"
          name="location"
          autoComplete="address-level2"
          value={d.location}
          onChange={set('location', 'Sửa địa chỉ')}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={d.email}
          onChange={set('email', 'Sửa email')}
        />
        <TextField
          label="Số điện thoại"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={d.phone}
          onChange={set('phone', 'Sửa số điện thoại')}
        />
        <TextField
          label="Liên kết chính"
          name="link"
          autoComplete="url"
          optional
          placeholder="linkedin.com/in/ten-cua-ban"
          value={d.link}
          onChange={set('link', 'Sửa liên kết')}
        />
      </div>

      <div className="space-y-3 border-t border-rule pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink-2">Liên kết bổ sung (GitHub, Portfolio, Behance…)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              updateDoc((draft) => {
                draft.data.links.push({ id: newId('lnk'), label: '', url: '' })
              }, 'Thêm liên kết hồ sơ')
            }
            className="gap-1.5 text-pen"
          >
            <Plus size={14} weight="bold" aria-hidden="true" />
            Thêm tuỳ chọn
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Thêm nhanh liên kết phổ biến">
          {QUICK_LINK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() =>
                updateDoc((draft) => {
                  draft.data.links.push({ id: newId('lnk'), label: chip.label, url: '' })
                }, `Thêm liên kết ${chip.label}`)
              }
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-rule bg-desk px-2.5 text-xs font-semibold text-ink-2 transition-colors hover:border-pen hover:bg-pen-wash hover:text-pen"
            >
              <Plus size={11} weight="bold" aria-hidden="true" />
              {chip.label}
            </button>
          ))}
        </div>
        {d.links.map((item, idx) => (
          <div key={item.id} className="flex items-end gap-2">
            <TextField
              className="w-36 sm:w-44"
              label={`Nhãn ${idx + 1}`}
              optional
              placeholder="Portfolio"
              value={item.label}
              onChange={(e) =>
                updateDoc((draft) => {
                  const target = draft.data.links.find((l) => l.id === item.id)
                  if (target) target.label = e.target.value
                }, 'Sửa nhãn liên kết')
              }
            />
            <TextField
              className="flex-1"
              label="Đường dẫn"
              placeholder="github.com/username"
              value={item.url}
              onChange={(e) =>
                updateDoc((draft) => {
                  const target = draft.data.links.find((l) => l.id === item.id)
                  if (target) target.url = e.target.value
                }, 'Sửa đường dẫn liên kết')
              }
            />
            <button
              type="button"
              onClick={() =>
                updateDoc((draft) => {
                  draft.data.links = draft.data.links.filter((l) => l.id !== item.id)
                }, 'Xoá liên kết')
              }
              aria-label={`Xoá liên kết ${idx + 1}`}
              className="mb-0.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-seal hover:bg-seal/10"
            >
              <Trash size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
