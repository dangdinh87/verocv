'use client'

import {
  ArrowRight,
  Briefcase,
  CloudCheck,
  Copy,
  Crown,
  FileDoc,
  PencilSimple,
  Plus,
  Sparkle,
  Trash,
  UploadSimple,
} from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ROLE_STARTER_KITS, type RoleStarterKit } from '@/components/resume/resume-data'
import { ResumePaper } from '@/components/resume/resume-paper'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { TextField } from '@/components/ui/field'
import { BRAND } from '@/config/brand'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { createCv, deleteCv, duplicateCv, listCvs, saveCv, subscribeToCvChanges, type CvRecord } from '@/lib/cv-repository'
import { evaluateCvReview } from '@/lib/cv-reviewer'
import { buildResumeDocx, triggerDocxDownload } from '@/lib/docx-export'
import { fileSafeName } from '@/lib/print-document'
import { WorkspaceBackupControls } from '@/components/workspace-backup-controls'
import { CareerReadinessChecklist } from '@/components/app-shell/career-readiness-checklist'
import { OpenOnNewParam } from '@/components/app-shell/open-on-new-param'
import { migrateToV2 } from '@/types/schema'
import { CvImportDialog } from './cv-import-dialog'

type Dialog = { type: 'create' } | { type: 'import' } | { type: 'rename'; cv: CvRecord } | { type: 'delete'; cv: CvRecord } | null
type CreateTab = 'templates' | 'kits'

const CREATE_TABS: TabItem<CreateTab>[] = [
  { id: 'templates', label: '12 Mẫu CV chuẩn ATS' },
  { id: 'kits', label: 'Bộ CV theo ngành nghề (Role Kits)' },
]

const layoutName = (layout: string) => CV_TEMPLATES.find((t) => t.layout === layout)?.name ?? layout

function scoreTone(score: number): string {
  if (score >= 85) return 'border-mint/35 bg-mint-wash text-mint'
  if (score >= 65) return 'border-pen/35 bg-pen-wash text-pen'
  return 'border-seal/35 bg-seal/10 text-seal'
}

export function CvDashboard() {
  const router = useRouter()
  const { user, openAuthModal } = useAuth()
  const [cvs, setCvs] = useState<CvRecord[] | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [createTab, setCreateTab] = useState<CreateTab>('templates')
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')

  const reload = useCallback(async () => setCvs(await listCvs()), [])

  useEffect(() => {
    void reload()
    return subscribeToCvChanges(() => void reload())
  }, [reload])

  const atFreeLimit = BRAND.enforceFreeLimits && (cvs?.length ?? 0) >= 1
  const blockedByLimit = useCallback(() => {
    if (!atFreeLimit) return false
    setNotice('Gói miễn phí lưu 1 CV. Hãy sửa CV hiện có, xoá nó đi, hoặc xem gói Pro ở trang Bảng giá.')
    setDialog(null)
    return true
  }, [atFreeLimit])

  const scoresById = useMemo(() => {
    const map = new Map<string, number>()
    if (!cvs) return map
    for (const cv of cvs) {
      map.set(cv.id, evaluateCvReview(cv.data, cv.settings.documentLanguage ?? 'vi', cv.settings.hiddenSections).overallScore)
    }
    return map
  }, [cvs])

  const avgScore = useMemo(() => {
    if (!cvs || cvs.length === 0) return null
    let total = 0
    for (const cv of cvs) total += scoresById.get(cv.id) ?? 0
    return Math.round(total / cvs.length)
  }, [cvs, scoresById])

  const masterCount = useMemo(() => (cvs ? cvs.filter((c) => c.isMaster).length : 0), [cvs])

  const openCreateModal = (tab: CreateTab = 'templates') => {
    if (blockedByLimit()) return
    setCreateTab(tab)
    setDialog({ type: 'create' })
  }

  const createAndOpen = async (options: Parameters<typeof createCv>[0]) => {
    if (blockedByLimit() || creatingId) return
    setCreatingId(options?.templateSlug ?? 'blank')
    try {
      const doc = createCv(options)
      await saveCv(doc)
      router.push(`/cv/${doc.id}`)
    } finally {
      setCreatingId(null)
    }
  }

  const createFromKit = async (kit: RoleStarterKit) => {
    if (blockedByLimit() || creatingId) return
    setCreatingId(kit.id)
    try {
      const title = `CV ${kit.roleTitle}`
      const doc = createCv({ templateSlug: kit.recommendedLayout, title })
      const populated = migrateToV2({
        ...doc,
        title,
        data: JSON.parse(JSON.stringify(kit.data)),
        settings: {
          ...doc.settings,
          accentColor: kit.accentColor,
          fontFamily: kit.recommendedLayout === 'ke-ngang' || kit.recommendedLayout === 'harvard' ? 'serif' : 'sans',
        },
      })
      await saveCv(populated)
      router.push(`/cv/${populated.id}`)
    } finally {
      setCreatingId(null)
    }
  }

  const onDuplicate = async (id: string) => {
    if (blockedByLimit()) return
    const copy = await duplicateCv(id)
    await reload()
    setNotice(copy ? `Đã nhân bản thành "${copy.title}".` : 'Không nhân bản được CV này.')
  }

  const onDelete = async (cv: CvRecord) => {
    await deleteCv(cv.id)
    setDialog(null)
    await reload()
    setNotice(`Đã xoá "${cv.title}".`)
  }

  const onRename = async (cv: CvRecord) => {
    const title = renameText.trim()
    if (!title) return
    await saveCv({ ...cv, title, updatedAt: new Date().toISOString() })
    setDialog(null)
    await reload()
  }

  const onToggleMaster = async (cv: CvRecord) => {
    await saveCv({ ...cv, isMaster: !cv.isMaster, updatedAt: new Date().toISOString() })
    await reload()
    setNotice(!cv.isMaster ? `Đã đánh dấu "${cv.title}" làm Hồ sơ Gốc (Master CV).` : `Đã bỏ đánh dấu Hồ sơ Gốc cho "${cv.title}".`)
  }

  return (
    <div className="workspace-wrap pb-10 pt-6 lg:pt-8">
      <OpenOnNewParam
        ready={cvs !== null}
        onNew={() => {
          if (blockedByLimit()) return
          setCreateTab('templates')
          setDialog({ type: 'create' })
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="display text-[clamp(1.75rem,3.4vw,2.25rem)] text-ink">CV của bạn</h1>
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
            {user
              ? 'Mọi chỉnh sửa tự lưu trên trình duyệt và đồng bộ lên tài khoản của bạn.'
              : 'Lưu tức thì trên trình duyệt này (kèm xuất file sao lưu .json). Đăng nhập để đồng bộ đa thiết bị và chia sẻ Link CV Online.'}
          </p>
        </div>
        {cvs !== null && cvs.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button variant="secondary" onClick={() => setDialog({ type: 'import' })} className="gap-2">
              <UploadSimple size={17} weight="bold" aria-hidden="true" />
              Nhập CV cũ
            </Button>
            <Button onClick={() => openCreateModal('templates')} className="gap-2">
              <Plus size={17} weight="bold" aria-hidden="true" />
              Tạo CV mới
            </Button>
          </div>
        )}
      </div>

      {/* Số liệu + checklist chỉ có nghĩa khi đã có ít nhất một CV */}
      {cvs !== null && cvs.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-sheet border border-rule bg-paper p-3.5 sm:p-4">
              <p className="text-xs font-semibold text-ink-3">Tổng số CV</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">
                <span className="tabular-nums">{cvs.length}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-3">{BRAND.enforceFreeLimits ? 'Gói Free tối đa 1 CV' : 'Lưu cục bộ + Cloud'}</p>
            </div>
            <div className="rounded-sheet border border-rule bg-paper p-3.5 sm:p-4">
              <p className="text-xs font-semibold text-ink-3">Điểm AI trung bình</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-pen">
                {avgScore !== null ? <span className="tabular-nums">{avgScore}/100</span> : '—'}
              </p>
              <p className="mt-0.5 text-xs text-ink-3">{avgScore !== null ? 'Chấm theo chuẩn ATS' : 'Tạo CV để chấm điểm'}</p>
            </div>
            <div className="rounded-sheet border border-rule bg-paper p-3.5 sm:p-4">
              <p className="text-xs font-semibold text-ink-3">Hồ sơ Gốc (Master)</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-ink">
                <span className="tabular-nums">{masterCount}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-3">Dùng để nhân bản theo JD</p>
            </div>
            <div className="rounded-sheet border border-rule bg-paper p-3.5 sm:p-4">
              <p className="text-xs font-semibold text-ink-3">Đồng bộ Cloud</p>
              <p className="mt-1 text-lg font-bold text-ink">{user ? 'Đang bật' : 'Chỉ trên máy'}</p>
              <p className="mt-0.5 truncate text-xs text-ink-3">{user ? user.email : 'Bấm đăng nhập để sao lưu'}</p>
            </div>
          </div>

          <CareerReadinessChecklist cvs={cvs} scoresById={scoresById} />
        </>
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

      {cvs === null ? (
        <div
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
          role="status"
          aria-label="Đang tải danh sách CV"
        >
          <div className="h-72 animate-pulse rounded-sheet border border-rule bg-paper" />
        </div>
      ) : cvs.length === 0 ? (
        <div className="mt-8 overflow-hidden rounded-sheet border border-rule bg-paper">
          <div className="grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <h2 className="text-2xl font-bold text-ink">Bạn chưa có CV nào</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2 sm:text-base">
                Chọn từ 12 mẫu CV chuẩn ATS, bấm dùng ngay bộ mẫu viết sẵn theo từng ngành nghề, hoặc nhập CV cũ (.pdf / .docx) để AI bóc
                tách tự động.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button onClick={() => openCreateModal('templates')}>Chọn mẫu CV</Button>
                <Button variant="secondary" onClick={() => openCreateModal('kits')} className="gap-1.5">
                  <Briefcase size={16} weight="bold" aria-hidden="true" />
                  Bộ CV theo ngành
                </Button>
                <Button variant="ghost" onClick={() => setDialog({ type: 'import' })}>
                  Nhập CV cũ
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-sheet border border-rule bg-desk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/brand/hero-career-craft.jpg"
                alt="Không gian soạn thảo CV chuyên nghiệp trên VeroCV"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>

          <div className="border-t border-rule bg-desk/50 p-6 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Mở nhanh theo ngành nghề phổ biến (1-click)</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ROLE_STARTER_KITS.slice(0, 4).map((kit) => (
                <button
                  key={kit.id}
                  type="button"
                  disabled={Boolean(creatingId)}
                  onClick={() => void createFromKit(kit)}
                  className="group flex cursor-pointer flex-col justify-between rounded-control border border-rule bg-paper p-3.5 text-left transition-colors hover:border-pen disabled:opacity-60"
                >
                  <div>
                    <span className="inline-block rounded-full bg-pen-wash px-2 py-0.5 text-[11px] font-bold text-pen">{kit.badge}</span>
                    <p className="mt-2 text-sm font-bold text-ink group-hover:text-pen">{kit.roleTitle}</p>
                    <p className="mt-0.5 text-xs text-ink-3">Mẫu {layoutName(kit.recommendedLayout)}</p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pen">
                    {creatingId === kit.id ? 'Đang tạo…' : 'Dùng ngay'}
                    <ArrowRight size={12} weight="bold" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 p-0 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {cvs.map((cv) => {
            const isBlank = !cv.data.name.trim() && !cv.data.summary.trim() && cv.data.jobs.length === 0
            const score = scoresById.get(cv.id) ?? 0
            return (
              <li key={cv.id} className="flex list-none flex-col overflow-hidden rounded-sheet border border-rule bg-paper">
                <Link href={`/cv/${cv.id}`} aria-label={`Mở ${cv.title}`} className="relative block bg-desk p-4">
                  <span
                    className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${scoreTone(score)}`}
                  >
                    <Sparkle size={11} weight="fill" aria-hidden="true" />
                    {score}/100
                  </span>
                  <span
                    className={`mx-auto block max-w-[16rem] overflow-hidden rounded-[4px] border border-rule bg-white ${isBlank ? 'opacity-45' : ''}`}
                  >
                    <ResumePaper layout={cv.layout} data={cv.data} settings={cv.settings} label={`Xem trước ${cv.title}`} />
                  </span>
                  {isBlank && (
                    <span className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 text-center">
                      <span className="inline-block rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink-2">
                        Bản nháp trống · Bấm để điền
                      </span>
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col border-t border-rule p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {cv.isMaster && (
                        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-pen-wash px-2 py-0.5 text-[0.7rem] font-bold text-pen">
                          <Crown size={11} weight="fill" aria-hidden="true" />
                          Hồ sơ Gốc (Master)
                        </span>
                      )}
                      <h2 className="min-w-0 break-words text-[1.05rem] font-bold leading-snug">
                        <Link href={`/cv/${cv.id}`} className="hover:text-pen">
                          {cv.title}
                        </Link>
                      </h2>
                    </div>
                    <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => void onToggleMaster(cv)}
                        aria-label={cv.isMaster ? `Bỏ Hồ sơ Gốc ${cv.title}` : `Đặt ${cv.title} làm Hồ sơ Gốc`}
                        title={cv.isMaster ? 'Bỏ đánh dấu Hồ sơ Gốc' : 'Đánh dấu làm Hồ sơ Gốc (Master CV)'}
                        className={`flex size-9 cursor-pointer items-center justify-center rounded-control hover:bg-ink/[0.06] ${cv.isMaster ? 'text-pen' : 'text-ink-3 hover:text-ink'}`}
                      >
                        <Crown size={17} weight={cv.isMaster ? 'fill' : 'regular'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenameText(cv.title)
                          setDialog({ type: 'rename', cv })
                        }}
                        aria-label={`Đổi tên ${cv.title}`}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                      >
                        <PencilSimple size={17} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-ink-3">
                    {cv.data.name || 'Chưa điền tên'} · Mẫu {layoutName(cv.layout)}
                  </p>
                  <p className="text-sm text-ink-3">Sửa lần cuối {new Date(cv.updatedAt).toLocaleDateString('vi-VN')}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
                    <div className="-ml-2 flex flex-wrap items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => triggerDocxDownload(buildResumeDocx(cv), `CV-${fileSafeName(cv.data.name || cv.title)}.docx`)}
                        aria-label={`Tải Word ${cv.title}`}
                        title="Tải file Word (.docx)"
                        className="gap-1 px-2.5"
                      >
                        <FileDoc size={15} aria-hidden="true" />
                        Word
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void onDuplicate(cv.id)}
                        aria-label={`Nhân bản ${cv.title}`}
                        className="gap-1 px-2.5"
                      >
                        <Copy size={15} aria-hidden="true" />
                        Nhân bản
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ type: 'delete', cv })}
                        aria-label={`Xoá ${cv.title}`}
                        className="gap-1 px-2.5 text-seal"
                      >
                        <Trash size={15} aria-hidden="true" />
                        Xoá
                      </Button>
                    </div>
                    <Button href={`/cv/${cv.id}`} size="sm" className="gap-1">
                      Sửa
                      <ArrowRight size={14} weight="bold" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <WorkspaceBackupControls onRestored={() => void reload()} />

      <Modal
        open={dialog?.type === 'create'}
        onClose={() => setDialog(null)}
        title="Tạo CV mới"
        description="Chọn mẫu bố cục hoặc bộ CV đã viết sẵn nội dung chuẩn theo từng ngành nghề."
        size="lg"
      >
        <Tabs label="Loại khởi tạo CV" tabs={CREATE_TABS} value={createTab} onChange={setCreateTab}>
          {createTab === 'templates' ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-3">Đổi sang mẫu khác sau này vẫn giữ nguyên toàn bộ nội dung.</p>
                <Button variant="secondary" size="sm" disabled={Boolean(creatingId)} onClick={() => void createAndOpen({ blank: true })}>
                  Bắt đầu từ CV trắng
                </Button>
              </div>
              <ul className="grid grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                {CV_TEMPLATES.map((t) => (
                  <li key={t.slug} className="list-none">
                    <button
                      type="button"
                      disabled={Boolean(creatingId)}
                      onClick={() => void createAndOpen({ templateSlug: t.slug })}
                      className="group w-full cursor-pointer rounded-control border border-rule bg-paper p-2 text-left transition-colors hover:border-pen disabled:opacity-60"
                    >
                      <span className="pointer-events-none block overflow-hidden rounded-[3px] border border-rule bg-white">
                        <ResumePaper layout={t.layout} label={`Mẫu ${t.name}`} />
                      </span>
                      <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-pen">{t.name}</span>
                      <span className="block truncate text-xs text-ink-3">{t.columns}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-ink-3">
                Mỗi bộ Role Kit đã điền sẵn bố cục, màu nhấn và các gạch đầu dòng thành tích chuẩn ATS — bạn chỉ cần sửa lại theo kinh
                nghiệm thật của mình.
              </p>
              <ul className="grid grid-cols-1 gap-3 p-0 sm:grid-cols-2 sm:gap-4">
                {ROLE_STARTER_KITS.map((kit) => {
                  const busy = creatingId === kit.id
                  return (
                    <li key={kit.id} className="list-none">
                      <button
                        type="button"
                        disabled={Boolean(creatingId)}
                        onClick={() => void createFromKit(kit)}
                        className="group flex h-full w-full cursor-pointer flex-col justify-between rounded-sheet border border-rule bg-paper p-4 text-left transition-colors hover:border-pen disabled:opacity-60"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-pen-wash px-2.5 py-0.5 text-[11px] font-bold text-pen">
                              <Sparkle size={12} weight="fill" aria-hidden="true" />
                              {kit.badge}
                            </span>
                            <span className="text-xs font-medium text-ink-3">Mẫu {layoutName(kit.recommendedLayout)}</span>
                          </div>
                          <h3 className="mt-2.5 text-base font-bold text-ink group-hover:text-pen">{kit.roleTitle}</h3>
                          <p className="text-xs font-medium text-ink-3">{kit.industry}</p>
                          <p className="mt-2 text-xs leading-relaxed text-ink-2">{kit.description}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-rule pt-2.5 text-xs font-semibold text-pen">
                          <span>{busy ? 'Đang tạo CV…' : 'Dùng bộ mẫu ngành này'}</span>
                          <ArrowRight size={14} weight="bold" aria-hidden="true" />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Tabs>
      </Modal>

      <CvImportDialog open={dialog?.type === 'import'} onClose={() => setDialog(null)} onImported={(id) => router.push(`/cv/${id}`)} />

      <Modal open={dialog?.type === 'rename'} onClose={() => setDialog(null)} title="Đổi tên CV" size="sm">
        {dialog?.type === 'rename' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void onRename(dialog.cv)
            }}
          >
            <TextField label="Tên CV" value={renameText} onChange={(e) => setRenameText(e.target.value)} data-autofocus />
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

      <Modal open={dialog?.type === 'delete'} onClose={() => setDialog(null)} title="Xoá CV này?" size="sm">
        {dialog?.type === 'delete' && (
          <>
            <p className="text-ink-2">
              CV “<strong>{dialog.cv.title}</strong>” sẽ bị xoá khỏi trình duyệt này và không khôi phục được. Hãy tải file sao lưu trước nếu
              bạn còn cần.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialog(null)} data-autofocus>
                Giữ lại
              </Button>
              <button
                type="button"
                onClick={() => void onDelete(dialog.cv)}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-control bg-seal px-5 font-semibold text-white hover:opacity-90"
              >
                Xoá CV
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
