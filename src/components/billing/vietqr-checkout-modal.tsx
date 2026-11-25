'use client'

import { Check, CheckCircle, Copy, QrCode, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { formatVnd } from '@/config/brand'
import { generateQrMatrix, qrMatrixToSvgString } from '@/lib/qr-svg'

export type PaidPlanId = 'pass_14d' | 'pro_monthly' | 'pro_yearly'

type CheckoutSession = {
  order: {
    orderCode: string
    planId: PaidPlanId
    amountVnd: number
    status: 'pending' | 'paid' | 'expired'
  }
  planName: string
  bank: {
    bankBin: string
    bankShortName: string
    accountNo: string
    accountName: string
  }
  qrEmvString: string
  qrImageUrl: string
}

export function VietQrCheckoutModal({
  open,
  planId,
  onClose,
  onUpgraded,
}: {
  open: boolean
  planId: PaidPlanId | null
  onClose: () => void
  onUpgraded: () => Promise<void>
}) {
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open || !planId) {
      setSession(null)
      setPaid(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
      .then(async (res) => {
        const json = (await res.json()) as CheckoutSession & { error?: string }
        if (cancelled) return
        if (!res.ok || !json.order) {
          setError(json.error || 'Không khởi tạo được đơn thanh toán.')
          return
        }
        setSession(json)
      })
      .catch(() => {
        if (!cancelled) setError('Lỗi kết nối tới cổng thanh toán.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, planId])

  useEffect(() => {
    if (!open || !session || paid) return
    const timer = setInterval(() => {
      void fetch(`/api/billing/orders/${encodeURIComponent(session.order.orderCode)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(async (json: { order?: { status: string } } | null) => {
          if (json?.order?.status === 'paid') {
            setPaid(true)
            await onUpgraded()
            if (typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
              void import('canvas-confetti')
                .then((m) => m.default({ particleCount: 54, spread: 64, origin: { y: 0.7 }, colors: ['#2448a8', '#1f7a4d', '#d8c4a0'] }))
                .catch(() => {})
            }
          }
        })
        .catch(() => {})
    }, 3000)
    return () => clearInterval(timer)
  }, [open, session, paid, onUpgraded])

  const localQrDataUrl = useMemo(() => {
    if (!session?.qrEmvString) return ''
    const svg = qrMatrixToSvgString(generateQrMatrix(session.qrEmvString), 220, '#1c1e22', '#ffffff')
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }, [session?.qrEmvString])

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1800)
    } catch {
      // Ignore clipboard failure
    }
  }

  const sandboxConfirm = async () => {
    if (!session) return
    setConfirming(true)
    try {
      const res = await fetch('/api/billing/sandbox-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: session.order.orderCode }),
      })
      if (res.ok) {
        setPaid(true)
        await onUpgraded()
      }
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={session ? `Thanh toán VietQR · ${session.planName}` : 'Thanh toán nâng cấp gói'}
      description="Quét mã bằng ứng dụng ngân hàng hoặc MoMo bất kỳ. Gói kích hoạt tự động ngay sau khi chuyển khoản."
      size="lg"
    >
      {loading ? (
        <p role="status" className="py-10 text-center text-ink-3">
          Đang tạo mã VietQR…
        </p>
      ) : error ? (
        <p role="alert" className="rounded-control border border-seal/40 bg-seal/5 p-4 text-seal">
          {error}
        </p>
      ) : paid && session ? (
        <div className="space-y-4 rounded-sheet border border-mint/40 bg-mint-wash/40 p-6 text-center">
          <CheckCircle size={40} weight="fill" className="mx-auto text-mint" aria-hidden="true" />
          <h3 className="text-xl font-bold text-ink">Nâng cấp thành công: {session.planName}!</h3>
          <p className="text-sm text-ink-2">
            Đơn hàng <code>{session.order.orderCode}</code> đã được kích hoạt. Toàn bộ quyền lợi AI Copilot &amp; Link CV Online đã sẵn
            sàng.
          </p>
          <Button onClick={onClose}>Tiếp tục sử dụng VeroCV</Button>
        </div>
      ) : (
        session && (
          <div className="grid gap-6 sm:grid-cols-[15rem_1fr]">
            <div className="flex flex-col items-center rounded-sheet border border-rule bg-desk p-4 text-center">
              {localQrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={localQrDataUrl}
                  alt={`Mã VietQR cho đơn ${session.order.orderCode}`}
                  className="size-48 rounded-control border border-rule bg-paper p-2"
                />
              )}
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-pen">
                <QrCode size={14} weight="bold" aria-hidden="true" />
                Napas 24/7 VietQR
              </p>
              <p className="mt-1 text-xs text-ink-3">Hệ thống tự động kiểm tra giao dịch mỗi 3 giây</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-control border border-rule bg-paper p-3.5">
                <p className="text-xs text-ink-3">Ngân hàng thụ hưởng</p>
                <p className="mt-0.5 font-bold text-ink">
                  {session.bank.bankShortName} · {session.bank.accountName}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-control border border-rule bg-paper p-3.5">
                <div>
                  <p className="text-xs text-ink-3">Số tài khoản</p>
                  <p className="mt-0.5 font-bold tabular-nums text-ink">{session.bank.accountNo}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void copyText('acc', session.bank.accountNo)} className="gap-1">
                  {copiedKey === 'acc' ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
                  {copiedKey === 'acc' ? 'Đã chép' : 'Chép'}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-control border border-rule bg-paper p-3.5">
                <div>
                  <p className="text-xs text-ink-3">Số tiền cần chuyển</p>
                  <p className="mt-0.5 text-lg font-extrabold tabular-nums text-pen">{formatVnd(session.order.amountVnd)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void copyText('amt', String(session.order.amountVnd))} className="gap-1">
                  {copiedKey === 'amt' ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
                  {copiedKey === 'amt' ? 'Đã chép' : 'Chép'}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-control border border-pen/40 bg-pen-wash/50 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-pen">Nội dung chuyển khoản (bắt buộc đúng mã)</p>
                  <p className="mt-0.5 font-mono text-base font-extrabold text-ink">{session.order.orderCode}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => void copyText('code', session.order.orderCode)} className="gap-1">
                  {copiedKey === 'code' ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
                  {copiedKey === 'code' ? 'Đã chép' : 'Chép mã'}
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={confirming}
                    onClick={() => void sandboxConfirm()}
                    className="w-full gap-1.5"
                  >
                    <Sparkle size={15} weight="fill" className="text-pen" aria-hidden="true" />
                    {confirming ? 'Đang kích hoạt…' : 'Giả lập nhận Webhook VietQR thành công (Dev)'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </Modal>
  )
}
