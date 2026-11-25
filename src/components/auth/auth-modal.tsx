'use client'

import { CloudCheck } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Tabs, type TabItem } from '@/components/ui/tabs'

type Mode = 'login' | 'register'

const TABS: TabItem<Mode>[] = [
  { id: 'login', label: 'Đăng nhập' },
  { id: 'register', label: 'Tạo tài khoản' },
]

export function AuthModal({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean
  onClose: () => void
  onAuthenticated: () => Promise<void>
}) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = mode === 'login' ? { email, password } : { name, email, password }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(json.error || 'Không thể xác thực lúc này.')
        return
      }
      await onAuthenticated()
      onClose()
    } catch {
      setError('Lỗi kết nối tới máy chủ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tài khoản VeroCV Cloud"
      description="Đồng bộ CV, Thư xin việc & Kanban lên Cloudflare D1 và mở khoá Link CV Online."
    >
      <Tabs
        label="Đăng nhập hoặc đăng ký"
        tabs={TABS}
        value={mode}
        onChange={(m) => {
          setMode(m)
          setError(null)
        }}
      >
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          {mode === 'register' && (
            <TextField
              label="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lê Thị Trúc Ly"
              required
              data-autofocus={mode === 'register' ? true : undefined}
            />
          )}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@example.com"
            required
            data-autofocus={mode === 'login' ? true : undefined}
          />
          <TextField
            label="Mật khẩu"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            required
          />

          <p className="flex items-start gap-2 rounded-control border border-rule bg-desk px-3.5 py-2.5 text-xs text-ink-2">
            <CloudCheck size={16} weight="bold" className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
            <span>Mọi CV và thẻ Kanban bạn vừa tạo trên trình duyệt này sẽ được tự động gộp an toàn lên đám mây ngay sau khi đăng nhập.</span>
          </p>

          {error && (
            <p role="alert" className="text-sm text-seal">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản & Đồng bộ'}
            </Button>
          </div>
        </form>
      </Tabs>
    </Modal>
  )
}
