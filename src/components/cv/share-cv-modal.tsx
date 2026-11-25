'use client'

import { ChartLineUp, Check, Copy, Globe, Lock, QrCode, Trash } from '@phosphor-icons/react/dist/ssr'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { BRAND } from '@/config/brand'
import { fileSafeName } from '@/lib/print-document'
import type { LinkAnalyticsSummary } from '@/server/db/store'
import { useEditorStore } from '@/store/editor-store'

type PublishedLink = {
  slug: string
  resumeId: string
  hidePhone: boolean
  hideEmail: boolean
  hasPasscode: boolean
  isActive: boolean
  updatedAt: string
  analytics: LinkAnalyticsSummary
}

export function ShareCvModal({
  open,
  onClose,
  isAuthenticated,
  onRequireAuth,
}: {
  open: boolean
  onClose: () => void
  isAuthenticated: boolean
  onRequireAuth?: () => void
}) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)

  const defaultSlug = doc ? fileSafeName(doc.data.name || doc.title || 'ung-vien').toLowerCase().slice(0, 32) : 'my-cv'
  const [slug, setSlug] = useState(defaultSlug)
  const [hidePhone, setHidePhone] = useState(false)
  const [hideEmail, setHideEmail] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [refInput, setRefInput] = useState('')
  const [links, setLinks] = useState<PublishedLink[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const loadLinks = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await fetch('/api/public-cv')
      if (res.ok) {
        const json = (await res.json()) as { links?: PublishedLink[] }
        const list = json.links ?? []
        setLinks(list)
        const matching = doc ? list.find((l) => l.resumeId === doc.id) : undefined
        if (matching) {
          setSlug(matching.slug)
          setHidePhone(matching.hidePhone)
          setHideEmail(matching.hideEmail)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [doc, isAuthenticated])

  useEffect(() => {
    if (open) {
      setError(null)
      if (isAuthenticated) void loadLinks()
    }
  }, [open, isAuthenticated, loadLinks])

  if (!doc) return null

  const currentLink = links.find((l) => l.resumeId === doc.id) ?? links.find((l) => l.slug === slug)
  const origin = typeof window !== 'undefined' ? window.location.origin : `https://${BRAND.domain}`
  const cleanSlug = slug.trim().toLowerCase()
  const baseUrl = `${origin}/p/${cleanSlug}`
  const shareUrl = refInput.trim() ? `${baseUrl}?ref=${encodeURIComponent(refInput.trim())}` : baseUrl

  const publish = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/public-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: cleanSlug,
          resumeId: doc.id,
          doc,
          hidePhone,
          hideEmail,
          passcode: passcode.trim() || undefined,
          isActive: true,
        }),
      })
      const json = (await res.json()) as { link?: PublishedLink; error?: string }
      if (!res.ok || !json.link) {
        setError(json.error || 'Không xuất bản được liên kết CV.')
        return
      }
      setPasscode('')
      await loadLinks()
    } catch {
      setError('Lỗi kết nối tới máy chủ.')
    } finally {
      setSaving(false)
    }
  }

  const removeLink = async (targetSlug: string) => {
    setSaving(true)
    try {
      await fetch(`/api/public-cv/${encodeURIComponent(targetSlug)}`, { method: 'DELETE' })
      await loadLinks()
    } finally {
      setSaving(false)
    }
  }

  const attachQrToCv = () => {
    updateDoc((d) => {
      d.settings.showQrCode = true
      d.settings.qrUrl = `${origin}/p/${cleanSlug}`
    }, 'Gắn mã QR Link CV Online')
    onClose()
  }

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // Ignore clipboard error
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chia sẻ Link CV Online & Thống kê HR"
      description="Xuất bản CV thành trang web chuẩn mobile và theo dõi chính xác lúc nhà tuyển dụng mở xem hoặc tải PDF."
      size="lg"
    >
      {!isAuthenticated ? (
        <div className="rounded-sheet border border-rule bg-desk p-6 text-center">
          <Globe size={32} weight="duotone" className="mx-auto text-pen" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-bold text-ink">Đăng nhập để xuất bản Link CV trực tuyến</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-2">
            Tài khoản giúp bạn sở hữu đường dẫn riêng <code>{BRAND.domain}/p/ten-ban</code>, bảo vệ mã PIN và xem thống kê lượt HR mở hồ sơ.
          </p>
          <div className="mt-5">
            <Button
              onClick={() => {
                onClose()
                onRequireAuth?.()
              }}
            >
              Đăng nhập / Tạo tài khoản miễn phí
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={(e) => void publish(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Đường dẫn riêng (/p/slug)"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="le-thi-truc-ly"
                hint={`Link: ${origin}/p/${cleanSlug || '...'}`}
              />
              <TextField
                label="Mã PIN bảo vệ"
                optional
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={currentLink?.hasPasscode ? 'Đã đặt PIN (nhập để đổi)' : 'Để trống nếu mở công khai'}
              />
            </div>

            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex cursor-pointer items-center gap-2 font-medium text-ink-2">
                <input type="checkbox" checked={hidePhone} onChange={(e) => setHidePhone(e.target.checked)} className="size-4 accent-pen" />
                Ẩn số điện thoại trên bản web
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-medium text-ink-2">
                <input type="checkbox" checked={hideEmail} onChange={(e) => setHideEmail(e.target.checked)} className="size-4 accent-pen" />
                Ẩn email trên bản web
              </label>
            </div>

            {error && <p role="alert" className="text-sm text-seal">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="submit" disabled={saving || cleanSlug.length < 3} className="gap-1.5">
                <Globe size={16} weight="bold" aria-hidden="true" />
                {saving ? 'Đang xuất bản…' : currentLink ? 'Cập nhật bản công khai' : 'Xuất bản Link CV'}
              </Button>
              {currentLink && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={attachQrToCv} className="gap-1.5">
                    <QrCode size={15} weight="bold" aria-hidden="true" />
                    Gắn QR Link này lên CV
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeLink(currentLink.slug)} className="gap-1.5 text-seal">
                    <Trash size={15} aria-hidden="true" />
                    Gỡ link
                  </Button>
                </div>
              )}
            </div>
          </form>

          {loading ? (
            <p className="text-sm text-ink-3">Đang tải thống kê…</p>
          ) : (
            currentLink && (
              <div className="space-y-4 border-t border-rule pt-5">
                <div className="flex flex-wrap items-end gap-2">
                  <TextField
                    className="flex-1"
                    label="Tạo link theo dõi riêng cho từng công ty (?ref=...)"
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    placeholder="VD: Shopee, VNG, FPT..."
                  />
                  <Button variant="secondary" onClick={() => void copyShareUrl()} className="mb-0.5 shrink-0 gap-1.5">
                    {copiedUrl ? <Check size={16} weight="bold" className="text-mint" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    {copiedUrl ? 'Đã chép link' : 'Chép link gửi HR'}
                  </Button>
                </div>
                <p className="break-all rounded-control border border-rule bg-desk px-3 py-2 text-xs font-medium text-ink-2">
                  {currentLink.hasPasscode && <Lock size={12} className="mr-1 inline text-pen" aria-hidden="true" />}
                  {shareUrl}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-control border border-rule bg-paper p-3">
                    <p className="text-xs text-ink-3">Lượt mở xem</p>
                    <p className="mt-1 text-xl font-extrabold tabular-nums text-ink">{currentLink.analytics.totalViews}</p>
                  </div>
                  <div className="rounded-control border border-rule bg-paper p-3">
                    <p className="text-xs text-ink-3">Tải PDF</p>
                    <p className="mt-1 text-xl font-extrabold tabular-nums text-pen">{currentLink.analytics.pdfDownloads}</p>
                  </div>
                  <div className="rounded-control border border-rule bg-paper p-3">
                    <p className="text-xs text-ink-3">Tải Word</p>
                    <p className="mt-1 text-xl font-extrabold tabular-nums text-mint">{currentLink.analytics.docxDownloads}</p>
                  </div>
                </div>

                {currentLink.analytics.byRef.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                      <ChartLineUp size={16} className="text-pen" aria-hidden="true" />
                      Chi tiết theo nguồn nhà tuyển dụng
                    </p>
                    <ul className="mt-2 divide-y divide-rule rounded-control border border-rule p-0 text-sm">
                      {currentLink.analytics.byRef.map((row) => (
                        <li key={row.refTag} className="flex list-none items-center justify-between gap-3 px-3.5 py-2.5">
                          <span className="font-semibold text-ink">{row.refTag}</span>
                          <span className="text-xs text-ink-2 tabular-nums">
                            {row.views} xem · {row.downloads} tải
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </Modal>
  )
}
