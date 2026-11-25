'use client'

import { ArrowCounterClockwise, ClockCounterClockwise, Plus } from '@phosphor-icons/react/dist/ssr'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { useEditorStore } from '@/store/editor-store'
import { migrateToV2, type ResumeDocumentV2 } from '@/types/schema'

type VersionItem = {
  id: string
  label: string
  createdAt: string
  source: 'cloud' | 'local'
  doc: ResumeDocumentV2
}

const localKey = (cvId: string) => `hsx_cv_versions_${cvId}`

function readLocalVersions(cvId: string): VersionItem[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(cvId)) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalVersions(cvId: string, list: VersionItem[]) {
  try {
    localStorage.setItem(localKey(cvId), JSON.stringify(list.slice(0, 20)))
  } catch {
    // Ignore storage quota errors
  }
}

export function VersionHistoryModal({
  open,
  onClose,
  isAuthenticated,
}: {
  open: boolean
  onClose: () => void
  isAuthenticated: boolean
}) {
  const doc = useEditorStore((s) => s.doc)
  const updateDoc = useEditorStore((s) => s.updateDoc)

  const [label, setLabel] = useState('')
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!doc) return
    const locals = readLocalVersions(doc.id)
    if (!isAuthenticated) {
      setVersions(locals)
      return
    }
    try {
      const res = await fetch(`/api/resumes/${encodeURIComponent(doc.id)}/versions`)
      if (res.ok) {
        const json = (await res.json()) as { versions?: { id: string; label: string; createdAt: string; doc: unknown }[] }
        const clouds: VersionItem[] = (json.versions ?? []).map((v) => ({
          id: v.id,
          label: v.label,
          createdAt: v.createdAt,
          source: 'cloud',
          doc: migrateToV2(v.doc),
        }))
        const seen = new Set(clouds.map((c) => c.id))
        const merged = [...clouds, ...locals.filter((l) => !seen.has(l.id))].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        )
        setVersions(merged)
        return
      }
    } catch {
      // Fallback to local snapshots
    }
    setVersions(locals)
  }, [doc, isAuthenticated])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  if (!doc) return null

  const saveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanLabel = label.trim() || `Bản lưu ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
    setBusy(true)
    try {
      const snapshot: VersionItem = {
        id: `ver_${Date.now()}`,
        label: cleanLabel,
        createdAt: new Date().toISOString(),
        source: 'local',
        doc: JSON.parse(JSON.stringify(doc)),
      }
      const nextLocal = [snapshot, ...readLocalVersions(doc.id)]
      writeLocalVersions(doc.id, nextLocal)

      if (isAuthenticated) {
        await fetch(`/api/resumes/${encodeURIComponent(doc.id)}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: cleanLabel, doc }),
        })
      }
      setLabel('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const restore = (item: VersionItem) => {
    const clean = migrateToV2(item.doc)
    updateDoc((draft) => {
      draft.layout = clean.layout
      draft.settings = clean.settings
      draft.data = clean.data
    }, `Khôi phục mốc "${item.label}"`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lịch sử phiên bản CV"
      description="Lưu các cột mốc trước khi tinh chỉnh cho từng công ty; khôi phục bất cứ lúc nào (có thể Ctrl+Z)."
    >
      <div className="space-y-5">
        <form onSubmit={(e) => void saveSnapshot(e)} className="flex items-end gap-2">
          <TextField
            className="flex-1"
            label="Tên mốc phiên bản mới"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="VD: Trước khi nộp Shopee"
          />
          <Button type="submit" disabled={busy} className="mb-0.5 shrink-0 gap-1.5">
            <Plus size={15} weight="bold" aria-hidden="true" />
            Lưu mốc
          </Button>
        </form>

        {versions.length === 0 ? (
          <div className="rounded-control border border-dashed border-rule p-6 text-center text-sm text-ink-3">
            <ClockCounterClockwise size={24} className="mx-auto mb-2 text-ink-3" aria-hidden="true" />
            Chưa có mốc phiên bản nào được lưu cho CV này.
          </div>
        ) : (
          <ul className="max-h-72 divide-y divide-rule overflow-y-auto rounded-control border border-rule p-0">
            {versions.map((v) => (
              <li key={v.id} className="flex list-none items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{v.label}</p>
                  <p className="text-xs text-ink-3">
                    {new Date(v.createdAt).toLocaleString('vi-VN')} · {v.source === 'cloud' ? 'Cloud D1' : 'Trên máy'}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => restore(v)} className="shrink-0 gap-1.5">
                  <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />
                  Khôi phục
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
