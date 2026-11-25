'use client'

import { DownloadSimple, UploadSimple } from '@phosphor-icons/react/dist/ssr'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { downloadWorkspaceBackup, importWorkspaceFromJson } from '@/lib/workspace-backup'

export function WorkspaceBackupControls({ onRestored }: { onRestored?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const onExport = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await downloadWorkspaceBackup()
      setMessage({ kind: 'ok', text: 'Đã tải file sao lưu toàn bộ hồ sơ (.json) về máy.' })
    } catch {
      setMessage({ kind: 'err', text: 'Không tạo được file sao lưu.' })
    } finally {
      setBusy(false)
    }
  }

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const text = await file.text()
      const res = await importWorkspaceFromJson(text)
      const parts: string[] = []
      if (res.cvs > 0) parts.push(`${res.cvs} CV`)
      if (res.letters > 0) parts.push(`${res.letters} thư xin việc`)
      if (res.applications > 0) parts.push(`${res.applications} vị trí ứng tuyển`)
      setMessage({ kind: 'ok', text: `Đã khôi phục ${parts.join(', ')}.` })
      onRestored?.()
    } catch {
      setMessage({ kind: 'err', text: 'Không đọc được file sao lưu này. Hãy chọn đúng file .json từ VeroCV.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-12 rounded-sheet border border-rule bg-paper p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div>
        <h2 className="text-base font-bold">Chuyển máy hoặc sao lưu an toàn</h2>
        <p className="mt-1 text-sm text-ink-2">
          Gói toàn bộ CV, thư xin việc và bảng theo dõi ứng tuyển thành một file <code>.json</code> để mở lại trên trình duyệt khác.
        </p>
        {message && (
          <p role="status" className={`mt-2 text-sm font-medium ${message.kind === 'err' ? 'text-seal' : 'text-pen'}`}>
            {message.text}
          </p>
        )}
      </div>
      <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
        <input ref={inputRef} type="file" accept=".json,application/json" onChange={(e) => void onImportFile(e)} className="sr-only" />
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void onExport()} className="gap-1.5">
          <DownloadSimple size={15} weight="bold" aria-hidden="true" />
          Sao lưu tất cả
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="gap-1.5">
          <UploadSimple size={15} weight="bold" aria-hidden="true" />
          Khôi phục từ file
        </Button>
      </div>
    </div>
  )
}
