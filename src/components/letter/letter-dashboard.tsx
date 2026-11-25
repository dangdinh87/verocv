'use client'

import { ArrowRight, CloudCheck, Copy, EnvelopeSimple, FileDoc, PencilSimple, Plus, Trash } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { LetterPaper } from '@/components/resume/letter-paper'
import { Button } from '@/components/ui/button'
import { SelectField, TextField } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { BRAND } from '@/config/brand'
import { LETTER_TEMPLATES } from '@/data/letter-templates'
import { listCvs, subscribeToCvChanges, type CvRecord } from '@/lib/cv-repository'
import { buildLetterDocx, triggerDocxDownload } from '@/lib/docx-export'
import { fileSafeName } from '@/lib/print-document'
import {
  createLetterFromTemplate,
  deleteLetter,
  duplicateLetter,
  getLetterList,
  LETTER_KEY,
  saveLetterDocument,
  subscribeToStorageKey,
} from '@/lib/storage'
import { WorkspaceBackupControls } from '@/components/workspace-backup-controls'
import { OpenOnNewParam } from '@/components/app-shell/open-on-new-param'
import type { LetterDocument } from '@/types/resume'

type Dialog = { type: 'create' } | { type: 'rename'; letter: LetterDocument } | { type: 'delete'; letter: LetterDocument } | null

export function LetterDashboard() {
  const router = useRouter()
  const { user, openAuthModal } = useAuth()
  const [letters, setLetters] = useState<LetterDocument[] | null>(null)
  const [cvs, setCvs] = useState<CvRecord[]>([])
  const [dialog, setDialog] = useState<Dialog>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sourceCvId, setSourceCvId] = useState('')
  const [renameText, setRenameText] = useState('')

  const reload = useCallback(() => setLetters(getLetterList()), [])

  useEffect(() => {
    reload()
    const loadCvs = () =>
      void listCvs().then((list) => {
        setCvs(list)
        setSourceCvId((current) => current || list[0]?.id || '')
      })
    loadCvs()
    const unsubLetters = subscribeToStorageKey(LETTER_KEY, reload)
    const unsubCvs = subscribeToCvChanges(loadCvs)
    return () => {
      unsubLetters()
      unsubCvs()
    }
  }, [reload])

  const atFreeLimit = BRAND.enforceFreeLimits && (letters?.length ?? 0) >= 1
  const blockedByLimit = useCallback(() => {
    if (!atFreeLimit) return false
    setNotice('Gói miễn phí lưu 1 thư xin việc. Hãy sửa thư hiện có, xoá nó đi, hoặc xem gói Pro ở trang Bảng giá.')
    setDialog(null)
    return true
  }, [atFreeLimit])

  const create = (slug: string) => {
    if (blockedByLimit()) return
    const doc = createLetterFromTemplate(
      slug,
      undefined,
      cvs.find((c) => c.id === sourceCvId),
    )
    saveLetterDocument(doc)
    router.push(`/thu-xin-viec/${doc.id}`)
  }

  const onDuplicate = (id: string) => {
    if (blockedByLimit()) return
    const copy = duplicateLetter(id)
    reload()
    setNotice(copy ? `Đã nhân bản thành "${copy.title}".` : 'Không nhân bản được thư này.')
  }

  const withCompanyCount = useMemo(
    () => (letters ? letters.filter((l) => l.recipientCompany.trim() && !/^\[.*\]$/.test(l.recipientCompany.trim())).length : 0),
    [letters],
  )

  return (
    <div className="workspace-wrap pb-10 pt-6 lg:pt-8">
      <OpenOnNewParam
        ready={letters !== null}
        onNew={() => {
          if (!blockedByLimit()) setDialog({ type: 'create' })
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="display text-[clamp(1.75rem,3.4vw,2.25rem)] text-ink">Thư xin việc của bạn</h1>
            {user ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-wash px-2.5 py-0.5 text-xs font-bold text-mint">
                <CloudCheck size={14} weight="fill" aria-hidden="true" />
                Đã đồng bộ Cloud · {user.email}
              </span>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rule bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink-2 hover:border-pen hover:text-pen"
              >
                <CloudCheck size={14} className="text-pen" aria-hidden="true" />
                Chế độ cục bộ · Đăng nhập để đồng bộ Cloud
              </button>
            )}
          </div>
          <p className="mt-1.5 max-w-[58ch] text-sm text-ink-2">
            Thông tin người gửi tự lấy từ CV bạn chọn. Hỗ trợ AI soạn theo CV + JD và đồng bộ đa thiết bị khi đăng nhập.
          </p>
        </div>
        <Button
          onClick={() => (blockedByLimit() ? undefined : setDialog({ type: 'create' }))}
          className="shrink-0 gap-2 self-start sm:self-auto"
        >
          <Plus size={17} weight="bold" aria-hidden="true" />
          Viết thư mới
        </Button>
      </div>

      {/* 3-card SaaS KPI Strip */}
      {letters !== null && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-sheet border border-rule bg-paper p-3.5 sm:p-4">
            <p className="text-xs font-semibold text-ink-3">Tổng số thư</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">
              <span className="tabular-nums">{letters.length}</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-3">{BRAND.enforceFreeLimits ? 'Gói Free tối đa 1 thư' : 'Lưu cục bộ + Cloud'}</p>
          </div>
          <div className="rounded-sheet border border-rule bg-paper p-3.5 sm:p-4">
            <p className="text-xs font-semibold text-ink-3">Đã gắn công ty nhận</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-pen">
              <span className="tabular-nums">{withCompanyCount}</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-3">Sẵn sàng xuất PDF &amp; Word</p>
          </div>
          <div className="rounded-sheet border border-rule bg-paper p-3.5 sm:p-4">
            <p className="text-xs font-semibold text-ink-3">Trạng thái lưu trữ</p>
            <p className="mt-1 text-lg font-bold text-ink">{user ? 'Đồng bộ D1' : 'Chỉ trên máy'}</p>
            <p className="mt-0.5 truncate text-xs text-ink-3">{user ? user.email : 'Đăng nhập để sao lưu đa thiết bị'}</p>
          </div>
        </div>
      )}

      {notice && (
        <p
          role="status"
          className="mt-6 flex items-start justify-between gap-4 rounded-control border border-rule bg-paper px-4 py-3 text-ink-2"
        >
          <span>
            {notice}{' '}
            {atFreeLimit && (
              <Link href="/bang-gia" className="font-semibold text-pen underline underline-offset-2">
                Xem bảng giá
              </Link>
            )}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 cursor-pointer font-semibold text-ink-3 hover:text-ink">
            Ẩn
          </button>
        </p>
      )}

      {letters === null ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3" role="status" aria-label="Đang tải danh sách thư">
          <div className="h-72 animate-pulse rounded-sheet border border-rule bg-paper" />
        </div>
      ) : letters.length === 0 ? (
        <div className="mt-8 overflow-hidden rounded-sheet border border-rule bg-paper">
          <div className="grid items-start gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pen-wash px-3 py-1 text-xs font-bold text-pen">
                <EnvelopeSimple size={14} weight="fill" aria-hidden="true" />
                Thư xin việc đồng bộ cùng CV
              </span>
              <h2 className="text-2xl font-bold text-ink">Bạn chưa có thư xin việc nào</h2>
              <p className="text-sm leading-relaxed text-ink-2">
                Chọn 1 trong 6 bố cục bên cạnh để bắt đầu ngay. Thông tin liên hệ, cỡ giấy và màu nhấn sẽ tự động lấy từ CV bạn chọn.
              </p>
              {cvs.length > 0 && (
                <SelectField label="Lấy thông tin người gửi từ CV" value={sourceCvId} onChange={(e) => setSourceCvId(e.target.value)}>
                  <option value="">Không dùng CV nào</option>
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </SelectField>
              )}
              <div className="pt-1">
                <Button onClick={() => setDialog({ type: 'create' })} className="gap-2">
                  <Plus size={16} weight="bold" aria-hidden="true" />
                  Chọn mẫu &amp; Viết thư ngay
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-3">Khởi tạo nhanh 1-click từ 6 mẫu thư</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {LETTER_TEMPLATES.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => create(t.slug)}
                    className="group flex cursor-pointer flex-col rounded-control border border-rule bg-desk p-2 text-left transition-colors hover:border-pen"
                  >
                    <span className="pointer-events-none block overflow-hidden rounded-[3px] border border-rule bg-white">
                      <LetterPaper layout={t.layout} accent={t.accent} label={t.name} />
                    </span>
                    <span className="mt-2 block truncate text-xs font-bold text-ink group-hover:text-pen">{t.name}</span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-pen">
                      Dùng mẫu
                      <ArrowRight size={10} weight="bold" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 p-0 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {letters.map((l) => (
            <li key={l.id} className="flex list-none flex-col overflow-hidden rounded-sheet border border-rule bg-paper">
              <Link href={`/thu-xin-viec/${l.id}`} aria-label={`Mở ${l.title}`} className="block bg-desk p-4">
                <span className="mx-auto block max-w-[16rem] overflow-hidden rounded-[4px] border border-rule bg-white">
                  <LetterPaper
                    layout={l.layout}
                    accent={l.accent}
                    customAccentColor={l.customAccentColor}
                    fontFamily={l.fontFamily}
                    data={l}
                    paperSize={l.paperSize}
                    label={`Xem trước ${l.title}`}
                  />
                </span>
              </Link>
              <div className="flex flex-1 flex-col border-t border-rule p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 break-words text-[1.05rem] font-bold leading-snug">
                    <Link href={`/thu-xin-viec/${l.id}`} className="hover:text-pen">
                      {l.title}
                    </Link>
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameText(l.title)
                      setDialog({ type: 'rename', letter: l })
                    }}
                    aria-label={`Đổi tên ${l.title}`}
                    className="-mr-1.5 -mt-1 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                  >
                    <PencilSimple size={17} />
                  </button>
                </div>
                <p className="mt-1 text-sm text-ink-3">Gửi tới {l.recipientCompany || 'chưa chọn công ty'}</p>
                <p className="text-sm text-ink-3">Sửa lần cuối {new Date(l.updatedAt).toLocaleDateString('vi-VN')}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
                  <div className="-ml-2 flex flex-wrap items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerDocxDownload(buildLetterDocx(l), `Thu-xin-viec-${fileSafeName(l.senderName || l.title)}.docx`)}
                      aria-label={`Tải Word ${l.title}`}
                      className="gap-1 px-2.5"
                    >
                      <FileDoc size={15} aria-hidden="true" />
                      Word
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicate(l.id)}
                      aria-label={`Nhân bản ${l.title}`}
                      className="gap-1 px-2.5"
                    >
                      <Copy size={15} aria-hidden="true" />
                      Nhân bản
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ type: 'delete', letter: l })}
                      aria-label={`Xoá ${l.title}`}
                      className="gap-1 px-2.5 text-seal"
                    >
                      <Trash size={15} aria-hidden="true" />
                      Xoá
                    </Button>
                  </div>
                  <Button href={`/thu-xin-viec/${l.id}`} size="sm" className="gap-1">
                    Sửa
                    <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <WorkspaceBackupControls onRestored={reload} />

      <Modal
        open={dialog?.type === 'create'}
        onClose={() => setDialog(null)}
        title="Chọn kiểu trình bày"
        description="Bạn có thể đổi kiểu và màu sau."
        size="lg"
      >
        {cvs.length > 0 ? (
          <SelectField
            label="Lấy thông tin người gửi từ CV"
            value={sourceCvId}
            onChange={(e) => setSourceCvId(e.target.value)}
            className="mb-5 max-w-sm"
          >
            <option value="">Không dùng CV nào</option>
            {cvs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </SelectField>
        ) : (
          <p className="mb-5 rounded-control bg-desk px-4 py-3 text-ink-2">
            Bạn chưa có CV nào, nên thông tin người gửi sẽ để trống để bạn tự điền.{' '}
            <Link href="/cv" className="font-semibold text-pen underline underline-offset-2">
              Tạo CV
            </Link>
          </p>
        )}
        <ul className="grid grid-cols-2 gap-4 p-0 sm:grid-cols-3">
          {LETTER_TEMPLATES.map((t) => (
            <li key={t.slug} className="list-none">
              <button
                type="button"
                onClick={() => create(t.slug)}
                className="group w-full cursor-pointer rounded-control border border-rule p-2 text-left hover:border-pen"
              >
                <span className="pointer-events-none block overflow-hidden rounded-[3px] border border-rule bg-white">
                  <LetterPaper layout={t.layout} accent={t.accent} label={t.name} />
                </span>
                <span className="mt-2 block text-sm font-semibold group-hover:text-pen">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={dialog?.type === 'rename'} onClose={() => setDialog(null)} title="Đổi tên thư" size="sm">
        {dialog?.type === 'rename' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const title = renameText.trim()
              if (!title) return
              saveLetterDocument({ ...dialog.letter, title })
              setDialog(null)
              reload()
            }}
          >
            <TextField label="Tên thư" value={renameText} onChange={(e) => setRenameText(e.target.value)} data-autofocus />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={!renameText.trim()}>
                Lưu tên
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={dialog?.type === 'delete'} onClose={() => setDialog(null)} title="Xoá thư này?" size="sm">
        {dialog?.type === 'delete' && (
          <>
            <p className="text-ink-2">
              Thư “<strong>{dialog.letter.title}</strong>” sẽ bị xoá khỏi trình duyệt này và không khôi phục được.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialog(null)} data-autofocus>
                Giữ lại
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deleteLetter(dialog.letter.id)
                  setDialog(null)
                  reload()
                  setNotice(`Đã xoá "${dialog.letter.title}".`)
                }}
              >
                Xoá thư
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
