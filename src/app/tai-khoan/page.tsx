'use client'

import {
  ArrowsClockwise,
  ChartLineUp,
  Check,
  CloudCheck,
  Copy,
  Crown,
  FileText,
  Globe,
  Kanban,
  QrCode,
  Receipt,
  SignOut,
  Sparkle,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { formatVnd } from '@/config/brand'
import { listCvs, subscribeToCvChanges } from '@/lib/cv-repository'
import { APPLICATION_KEY, getApplications, getLetterList, LETTER_KEY, subscribeToStorageKey } from '@/lib/storage'
import type { LinkAnalyticsSummary } from '@/server/db/store'

type PublicLinkItem = {
  slug: string
  resumeId: string
  isActive: boolean
  analytics: LinkAnalyticsSummary
}

type OrderItem = {
  orderCode: string
  planId: string
  amountVnd: number
  status: string
  createdAt: string
  paidAt: string | null
}

type LocalTelemetry = {
  cvCount: number
  letterCount: number
  appCount: number
}

export default function AccountPage() {
  const { user, quota, infra, loading, syncing, lastSyncedAt, openAuthModal, syncNow, logout } = useAuth()
  const [links, setLinks] = useState<PublicLinkItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [localStats, setLocalStats] = useState<LocalTelemetry>({ cvCount: 0, letterCount: 0, appCount: 0 })

  useEffect(() => {
    const refreshLocal = () => {
      void listCvs().then((cvs) => {
        setLocalStats({
          cvCount: cvs.length,
          letterCount: getLetterList().length,
          appCount: getApplications().length,
        })
      })
    }
    refreshLocal()
    const unsubCv = subscribeToCvChanges(refreshLocal)
    const unsubLetter = subscribeToStorageKey(LETTER_KEY, refreshLocal)
    const unsubApp = subscribeToStorageKey(APPLICATION_KEY, refreshLocal)
    return () => {
      unsubCv()
      unsubLetter()
      unsubApp()
    }
  }, [])

  useEffect(() => {
    if (!user) return
    void fetch('/api/public-cv')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { links?: PublicLinkItem[] } | null) => setLinks(j?.links ?? []))
      .catch(() => {})
    void fetch('/api/billing/orders')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { orders?: OrderItem[] } | null) => setOrders(j?.orders ?? []))
      .catch(() => {})
  }, [user])

  const handleCopyUrl = async (slug: string) => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      await navigator.clipboard.writeText(`${origin}/p/${slug}`)
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug((prev) => (prev === slug ? null : prev)), 2000)
    } catch {
      // Ignore clipboard failures in restricted environments.
    }
  }

  if (loading) {
    return (
      <div className="workspace-wrap py-12" role="status">
        <p className="text-ink-3">Đang tải thông tin tài khoản…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="workspace-wrap space-y-6 py-6 lg:py-8">
        {/* Hero CTA Banner */}
        <section className="rounded-sheet border border-rule bg-paper p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[54ch] space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pen/30 bg-pen-wash px-3 py-1 text-xs font-bold text-pen">
                <CloudCheck size={14} weight="fill" aria-hidden="true" />
                Cloudflare D1 Sync &amp; Recruiter Analytics
              </span>
              <h1 className="display text-[clamp(1.65rem,3.2vw,2.2rem)] text-ink">
                Tài khoản, Link CV Online &amp; Thống kê nhà tuyển dụng
              </h1>
              <p className="text-sm leading-relaxed text-ink-2">
                Dữ liệu của bạn hiện đang được lưu an toàn trên trình duyệt này. Đăng nhập miễn phí để đồng bộ xuyên thiết bị lên Cloudflare
                D1, xuất bản Link CV trực tuyến kèm QR và theo dõi lượt nhà tuyển dụng tải hồ sơ.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button size="lg" onClick={openAuthModal}>
                Đăng nhập / Tạo tài khoản đồng bộ ngay
              </Button>
              <Button href="/cv" variant="secondary" size="lg">
                Mở CV Studio
              </Button>
            </div>
          </div>
        </section>

        {/* Live Local Telemetry Summary */}
        <section aria-label="Dữ liệu sẵn sàng đồng bộ trên trình duyệt">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-3">
            Dữ liệu cục bộ trên trình duyệt này (sẵn sàng đồng bộ Cloud D1)
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-sheet border border-rule bg-paper p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-3">Hồ sơ CV</span>
                <FileText size={18} className="text-pen" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-ink">
                <span className="tabular-nums">{localStats.cvCount}</span>
              </p>
              <Link href="/cv" className="mt-1 inline-block text-xs font-semibold text-pen hover:underline">
                Quản lý trong CV Studio →
              </Link>
            </div>

            <div className="rounded-sheet border border-rule bg-paper p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-3">Thư xin việc</span>
                <Receipt size={18} className="text-mint" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-ink">
                <span className="tabular-nums">{localStats.letterCount}</span>
              </p>
              <Link href="/thu-xin-viec" className="mt-1 inline-block text-xs font-semibold text-pen hover:underline">
                Xem danh sách thư →
              </Link>
            </div>

            <div className="rounded-sheet border border-rule bg-paper p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-3">Vị trí Kanban</span>
                <Kanban size={18} className="text-pen" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-ink">
                <span className="tabular-nums">{localStats.appCount}</span>
              </p>
              <Link href="/theo-doi-ung-tuyen" className="mt-1 inline-block text-xs font-semibold text-pen hover:underline">
                Mở bảng ứng tuyển →
              </Link>
            </div>
          </div>
        </section>

        {/* Preview Showcase: Public CV Link + Recruiter Analytics */}
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-sheet border border-rule bg-paper p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint-wash px-2.5 py-0.5 text-xs font-bold text-mint">
                <Globe size={13} weight="bold" aria-hidden="true" />
                Mẫu Public Link &amp; QR
              </span>
              <span className="text-xs font-semibold text-ink-3">verocv.app/p/ten-cua-ban</span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-control border border-rule bg-desk p-4">
              <div className="min-w-0 space-y-1.5">
                <p className="truncate font-mono text-sm font-bold text-pen">/p/ten-cua-ban</p>
                <p className="text-xs text-ink-2">
                  Tuỳ chọn ẩn SĐT/Email, đặt mã PIN bảo mật, cho phép HR lưu danh bạ (.vcf) hoặc tải PDF A4 / Word (.docx).
                </p>
              </div>
              <div className="flex size-14 shrink-0 items-center justify-center rounded-control border border-rule bg-paper text-ink">
                <QrCode size={32} aria-hidden="true" />
              </div>
            </div>
          </section>

          <section className="rounded-sheet border border-rule bg-paper p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                <ChartLineUp size={18} className="text-pen" aria-hidden="true" />
                Thống kê Nhà tuyển dụng xem CV
              </h2>
              <span className="text-xs font-semibold text-ink-3">Thời gian thực</span>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: 'Lượt nhà tuyển dụng mở xem', value: '24 lượt', width: '78%', tone: 'bg-pen' },
                { label: 'Lượt tải xuống PDF A4', value: '9 lượt', width: '48%', tone: 'bg-mint' },
                { label: 'Lượt tải xuống Word (.docx)', value: '4 lượt', width: '28%', tone: 'bg-pen-dark' },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-2">{row.label}</span>
                    <span className="font-bold tabular-nums text-ink">{row.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-rule">
                    <div className={`h-full rounded-full ${row.tone}`} style={{ width: row.width }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
              <span className="text-xs text-ink-3">Đăng nhập để kích hoạt Link CV &amp; bảng thống kê thật.</span>
              <Button size="sm" onClick={openAuthModal}>
                Đăng nhập đồng bộ ngay
              </Button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const aiUsed = quota?.usedToday ?? 0
  const aiLimit = quota?.dailyLimit ?? user.entitlements.dailyAiLimit
  const aiPercent = Math.min(100, Math.round((aiUsed / Math.max(1, aiLimit)) * 100))

  return (
    <div className="workspace-wrap space-y-6 py-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pen-wash px-3 py-1 text-xs font-bold text-pen">
            <Crown size={13} weight="fill" aria-hidden="true" />
            {user.planName}
          </span>
          <h1 className="display mt-2.5 text-[clamp(1.7rem,3.4vw,2.35rem)] text-ink">Xin chào, {user.name}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {user.email} · Trên thiết bị: {localStats.cvCount} CV, {localStats.letterCount} Thư, {localStats.appCount} Ứng tuyển
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => void syncNow()} disabled={syncing} className="gap-1.5">
            <ArrowsClockwise size={17} className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
            {syncing ? 'Đang đồng bộ…' : 'Đồng bộ Cloud ngay'}
          </Button>
          <Button variant="ghost" onClick={() => void logout()} className="gap-1.5 text-seal">
            <SignOut size={17} aria-hidden="true" />
            Đăng xuất
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-sheet border border-rule bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Gói dịch vụ hiện tại</p>
          <p className="mt-2 text-2xl font-extrabold text-ink">{user.planName}</p>
          <p className="mt-1 text-sm text-ink-2">
            {user.planExpiresAt
              ? `Hiệu lực đến ${new Date(user.planExpiresAt).toLocaleDateString('vi-VN')}`
              : 'Đang dùng gói Miễn phí cơ bản'}
          </p>
          <div className="mt-4">
            <Button href="/bang-gia" size="sm" variant={user.plan === 'free' ? 'primary' : 'secondary'}>
              {user.plan === 'free' ? 'Nâng cấp qua VietQR' : 'Gia hạn hoặc đổi gói'}
            </Button>
          </div>
        </section>

        <section className="rounded-sheet border border-rule bg-paper p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-3">
            <Sparkle size={14} weight="fill" className="text-pen" aria-hidden="true" />
            Hạn mức AI Copilot hôm nay
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums text-ink">
            <span className="tabular-nums">{aiUsed}</span> / {aiLimit} lượt
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-rule">
            <div className="h-full bg-pen" style={{ width: `${aiPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-3">Làm mới mỗi ngày lúc 00:00 UTC.</p>
        </section>

        <section className="rounded-sheet border border-rule bg-paper p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Trạng thái hạ tầng Cloudflare</p>
          <p className="mt-2 text-sm font-semibold text-ink">
            Database: <span className="text-pen">{infra?.d1Mode ?? 'local-store'}</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            AI Engine: <span className="text-mint">{infra?.aiMode ?? 'local-engine'}</span>
          </p>
          <p className="mt-2 text-xs text-ink-3">
            {lastSyncedAt
              ? `Đồng bộ gần nhất: ${new Date(lastSyncedAt).toLocaleTimeString('vi-VN')}`
              : 'Tự động đồng bộ khi mở trình duyệt'}
          </p>
        </section>
      </div>

      {/* Enhanced Link Analytics Cards */}
      <section className="rounded-sheet border border-rule bg-paper p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <ChartLineUp size={20} className="text-pen" aria-hidden="true" />
            Link CV Online &amp; Thống kê nhà tuyển dụng ({links.length})
          </h2>
          <Button href="/cv" size="sm" variant="secondary">
            Quản lý từ CV Studio
          </Button>
        </div>

        {links.length === 0 ? (
          <p className="mt-4 text-sm text-ink-3">
            Chưa có Link CV nào được xuất bản. Hãy mở một CV trong Studio rồi bấm nút <strong>Chia sẻ</strong> để tạo link{' '}
            <code>/p/ten-cua-ban</code>.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {links.map((item) => {
              const peak = Math.max(1, item.analytics.totalViews, item.analytics.pdfDownloads, item.analytics.docxDownloads)
              const viewPct = Math.round((item.analytics.totalViews / peak) * 100)
              const pdfPct = Math.round((item.analytics.pdfDownloads / peak) * 100)
              const docxPct = Math.round((item.analytics.docxDownloads / peak) * 100)
              const isCopied = copiedSlug === item.slug

              return (
                <article key={item.slug} className="rounded-control border border-rule bg-desk p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Globe size={17} className="shrink-0 text-pen" aria-hidden="true" />
                      <Link href={`/p/${item.slug}`} className="truncate font-semibold text-pen hover:underline">
                        /p/{item.slug}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          item.isActive ? 'bg-mint-wash text-mint' : 'border border-rule bg-paper text-ink-3'
                        }`}
                      >
                        {item.isActive ? 'Đang bật' : 'Tạm ẩn'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopyUrl(item.slug)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-control border border-rule bg-paper px-2.5 py-1 text-xs font-semibold text-ink hover:border-pen hover:text-pen"
                      >
                        {isCopied ? (
                          <Check size={12} weight="bold" className="text-mint" aria-hidden="true" />
                        ) : (
                          <Copy size={12} aria-hidden="true" />
                        )}
                        {isCopied ? 'Đã chép!' : 'Sao chép URL'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Lượt xem', val: item.analytics.totalViews, pct: viewPct, color: 'bg-pen' },
                      { label: 'Tải PDF', val: item.analytics.pdfDownloads, pct: pdfPct, color: 'bg-mint' },
                      { label: 'Tải Word (.docx)', val: item.analytics.docxDownloads, pct: docxPct, color: 'bg-pen-dark' },
                    ].map((stat) => (
                      <div key={stat.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-2">{stat.label}</span>
                          <span className="font-bold tabular-nums text-ink">{stat.val}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule">
                          <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${stat.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-sheet border border-rule bg-paper p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Receipt size={20} className="text-pen" aria-hidden="true" />
          Lịch sử thanh toán VietQR ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-3">Chưa có giao dịch nâng cấp nào.</p>
        ) : (
          <ul className="mt-4 divide-y divide-rule p-0 text-sm">
            {orders.map((ord) => (
              <li key={ord.orderCode} className="flex list-none flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <span className="font-mono font-bold text-ink">{ord.orderCode}</span>
                  <span className="ml-2 text-ink-3">· Gói {ord.planId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold tabular-nums">{formatVnd(ord.amountVnd)}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      ord.status === 'paid' ? 'bg-mint-wash text-mint' : 'border border-rule bg-desk text-ink-3'
                    }`}
                  >
                    {ord.status === 'paid' ? 'Đã thanh toán' : 'Chờ chuyển khoản'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
