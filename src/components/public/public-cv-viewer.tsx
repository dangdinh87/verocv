'use client'

import {
  AddressBook,
  Check,
  Copy,
  EnvelopeSimple,
  FileDoc,
  Lock,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Printer,
  Sparkle,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LogoMark } from '@/components/logo'
import { ResumePaper, printBackdrop } from '@/components/resume/resume-paper'
import { SheetViewport } from '@/components/resume/sheet-viewport'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { BRAND } from '@/config/brand'
import { buildResumeDocx, triggerDocxDownload } from '@/lib/docx-export'
import { fileSafeName, printDocument, usePrintSetup } from '@/lib/print-document'
import type { ResumeDocumentV2 } from '@/types/schema'

type Props = {
  slug: string
  refTag?: string
  initialDoc: ResumeDocumentV2 | null
  initialProtected: boolean
  notFound?: boolean
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, ' ').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

function buildVCardContent(doc: ResumeDocumentV2, publicUrl: string): string {
  const name = (doc.data.name.trim() || doc.title || 'Ung vien').trim()
  const role = doc.data.role.trim()
  const email = doc.data.email.trim()
  const phone = doc.data.phone.trim()

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(name)}`, `N:${escapeVCard(name)};;;;`]
  if (role) lines.push(`TITLE:${escapeVCard(role)}`)
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`)
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`)
  if (publicUrl) lines.push(`URL:${publicUrl}`)
  lines.push(`NOTE:${escapeVCard(`Hồ sơ trực tuyến tạo bằng ${BRAND.name}`)}`)
  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}

export function PublicCvViewer({ slug, refTag, initialDoc, initialProtected, notFound }: Props) {
  const [doc, setDoc] = useState<ResumeDocumentV2 | null>(initialDoc)
  const [isProtected, setIsProtected] = useState(initialProtected)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [copied, setCopied] = useState(false)
  const trackedRef = useRef(false)

  usePrintSetup(
    `CV-${fileSafeName(doc?.data.name ?? slug)}`,
    doc?.settings.paperSize ?? 'a4',
    doc ? printBackdrop(doc.layout, doc.settings) : undefined,
  )

  const recordEvent = async (eventType: 'view' | 'download_pdf' | 'download_docx') => {
    try {
      await fetch(`/api/public-cv/${encodeURIComponent(slug)}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, refTag }),
      })
    } catch {
      // Ignore analytics network errors
    }
  }

  useEffect(() => {
    if (doc && !trackedRef.current) {
      trackedRef.current = true
      void recordEvent('view')
    }
  })

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) return
    setUnlocking(true)
    setPinError(null)
    try {
      const res = await fetch(`/api/public-cv/${encodeURIComponent(slug)}`, {
        headers: { 'x-cv-passcode': pin.trim() },
      })
      const json = (await res.json()) as { doc?: ResumeDocumentV2; error?: string; protected?: boolean }
      if (!res.ok || !json.doc) {
        setPinError(json.error || 'Mã PIN chưa chính xác.')
        return
      }
      setDoc(json.doc)
      setIsProtected(false)
    } catch {
      setPinError('Không thể xác thực lúc này.')
    } finally {
      setUnlocking(false)
    }
  }

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://${BRAND.domain}/p/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard failures
    }
  }

  const handleSaveVCard = () => {
    if (!doc) return
    const url = typeof window !== 'undefined' ? window.location.href : `https://${BRAND.domain}/p/${slug}`
    const vcf = buildVCardContent(doc, url)
    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${fileSafeName(doc.data.name || slug)}.vcf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }

  if (notFound) {
    return (
      <div className="wrap max-w-xl py-20 text-center">
        <h1 className="display text-[2rem]">Không tìm thấy hồ sơ</h1>
        <p className="mt-3 text-ink-2">Liên kết CV này không tồn tại hoặc chủ sở hữu đã tạm ẩn.</p>
        <div className="mt-6">
          <Button href="/">Về trang chủ {BRAND.name}</Button>
        </div>
      </div>
    )
  }

  if (isProtected && !doc) {
    return (
      <div className="wrap max-w-md py-20">
        <div className="rounded-sheet border border-rule bg-paper p-7">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-pen-wash text-pen">
              <Lock size={22} weight="bold" aria-hidden="true" />
            </span>
            <ThemeToggle />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">CV được bảo vệ bằng mã PIN</h1>
          <p className="mt-1.5 text-sm text-ink-2">Nhập mã PIN do ứng viên cung cấp để xem và tải hồ sơ này.</p>
          <form onSubmit={(e) => void unlock(e)} className="mt-5 space-y-4">
            <TextField label="Mã PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" autoFocus />
            {pinError && (
              <p role="alert" className="text-sm text-seal">
                {pinError}
              </p>
            )}
            <Button type="submit" disabled={unlocking || !pin.trim()} className="w-full">
              {unlocking ? 'Đang mở khoá…' : 'Xem hồ sơ'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  if (!doc) return null

  const candidateName = doc.data.name.trim() || doc.title
  const candidateRole = doc.data.role.trim()
  const visibleEmail = doc.data.email.trim()
  const mailtoSubject = encodeURIComponent(`Mời phỏng vấn: ${candidateName}${candidateRole ? ` — ${candidateRole}` : ''}`)
  const mailtoHref = visibleEmail ? `mailto:${visibleEmail}?subject=${mailtoSubject}` : null

  return (
    <div className="print-reset min-h-screen bg-desk pb-16">
      <header className="no-print sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-md">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/" aria-label={`Trang chủ ${BRAND.name}`} className="shrink-0">
              <LogoMark className="size-8" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink sm:text-base">{candidateName}</p>
              <p className="truncate text-xs text-ink-3">
                {candidateRole || 'Hồ sơ trực tuyến'}
                {refTag ? ` · Nguồn: ${refTag}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div
              className="hidden items-center rounded-control border border-rule bg-desk p-0.5 sm:inline-flex"
              role="group"
              aria-label="Thu phóng trang CV"
            >
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(80, z - 10))}
                disabled={zoom <= 80}
                aria-label="Thu nhỏ CV"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] text-ink-2 hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <MagnifyingGlassMinus size={15} weight="bold" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                aria-label="Đặt lại thu phóng 100%"
                className="cursor-pointer px-2 text-xs font-bold tabular-nums text-ink-2 hover:text-ink"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(120, z + 10))}
                disabled={zoom >= 120}
                aria-label="Phóng to CV"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] text-ink-2 hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <MagnifyingGlassPlus size={15} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <ThemeToggle className="size-9" />

            <Button variant="secondary" size="sm" onClick={() => void handleCopyLink()} className="gap-1.5">
              {copied ? (
                <Check size={15} weight="bold" className="text-mint" aria-hidden="true" />
              ) : (
                <Copy size={15} weight="bold" aria-hidden="true" />
              )}
              <span>{copied ? 'Đã chép!' : 'Sao chép Link'}</span>
            </Button>

            <Button variant="secondary" size="sm" onClick={handleSaveVCard} className="gap-1.5">
              <AddressBook size={15} weight="bold" aria-hidden="true" />
              <span className="max-sm:hidden">Lưu danh bạ (.vcf)</span>
              <span className="sm:hidden">.vcf</span>
            </Button>

            {mailtoHref && (
              <a
                href={mailtoHref}
                className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-control border border-mint/40 bg-mint-wash px-3.5 text-sm font-semibold text-mint transition-colors hover:border-mint"
              >
                <EnvelopeSimple size={15} weight="bold" aria-hidden="true" />
                <span>Mời phỏng vấn</span>
              </a>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void recordEvent('download_docx')
                triggerDocxDownload(buildResumeDocx(doc), `CV-${fileSafeName(doc.data.name || slug)}.docx`)
              }}
              className="gap-1.5"
            >
              <FileDoc size={15} weight="bold" aria-hidden="true" />
              <span>Word (.docx)</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                void recordEvent('download_pdf')
                printDocument()
              }}
              className="gap-1.5"
            >
              <Printer size={15} weight="bold" aria-hidden="true" />
              <span>Tải PDF A4</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="print-reset wrap mt-6 max-w-[56rem]">
        <SheetViewport zoom={zoom}>
          <ResumePaper flow layout={doc.layout} data={doc.data} settings={doc.settings} label={`CV của ${candidateName}`} />
        </SheetViewport>
      </div>

      <footer className="no-print wrap mt-8 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-pen hover:text-pen"
        >
          <Sparkle size={14} weight="fill" className="text-pen" aria-hidden="true" />
          <span>Hồ sơ được tạo bằng {BRAND.name} AI Studio</span>
          <span className="font-bold text-pen">Tạo CV miễn phí →</span>
        </Link>
      </footer>
    </div>
  )
}
