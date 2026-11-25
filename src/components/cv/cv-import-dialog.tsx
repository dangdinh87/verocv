'use client'

import { Check, Warning } from '@phosphor-icons/react/dist/ssr'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { TextAreaField } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { createCvWithData, importCvFromJson, saveCv } from '@/lib/cv-repository'
import { DocxImportError, extractDocxText } from '@/lib/docx-text'
import { extractPdfText, PdfImportError } from '@/lib/pdf-text'
import { parseRawCvText, type ParseResult } from '@/lib/cv-parser'

type Mode = 'text' | 'backup'

const MAX_FILE_BYTES = 5_000_000

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })

function friendlyImportError(err: unknown, accept: 'text' | 'backup'): string {
  if (accept === 'backup') {
    return 'Không đọc được file sao lưu này. Hãy chọn đúng file .json do VeroCV tạo ra.'
  }
  if (err instanceof PdfImportError) {
    if (err.code === 'password') {
      return 'File PDF này đang đặt mật khẩu bảo vệ. Hãy mở khoá file hoặc sao chép văn bản dán vào ô bên dưới.'
    }
    if (err.code === 'no-text') {
      return 'PDF này là bản scan (hình ảnh), không có lớp chữ để đọc trực tiếp. Hãy gõ hoặc dán nội dung vào ô bên dưới.'
    }
    return 'File PDF bị hỏng hoặc không đúng định dạng. Hãy thử một file khác hoặc dán văn bản trực tiếp.'
  }
  if (err instanceof DocxImportError) {
    if (err.code === 'legacy-doc') {
      return 'Đây là file Word .doc đời cũ (nhị phân). Hãy lưu lại dưới dạng .docx hoặc mở file, bấm Ctrl+A rồi sao chép dán vào ô bên dưới.'
    }
    if (err.code === 'no-text') {
      return 'Không tìm thấy chữ trong file Word này (có thể nội dung nằm trong ảnh). Hãy sao chép văn bản và dán vào ô bên dưới.'
    }
    return 'Không đọc được file .docx này. Hãy mở file, sao chép nội dung rồi dán vào ô bên dưới.'
  }
  return 'Không đọc được file này. Hãy thử dán trực tiếp văn bản vào ô bên dưới.'
}

export function CvImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: (id: string) => void }) {
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  const close = () => {
    setParsed(null)
    setError(null)
    setInfo(null)
    setText('')
    onClose()
  }

  const loadFile = async (file: File | undefined, accept: 'text' | 'backup') => {
    if (!file) return
    setError(null)
    if (file.size > MAX_FILE_BYTES) {
      setError('File quá lớn (trên 5 MB). Hãy chọn file nhỏ hơn.')
      return
    }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || /\.docx$/i.test(file.name)
    const isLegacyDoc = file.type === 'application/msword' || /\.doc$/i.test(file.name)

    try {
      if (accept === 'text' && isPdf) {
        setBusy(true)
        setInfo(null)
        const { text: extracted, pages } = await extractPdfText(await file.arrayBuffer(), {
          workerSrc: new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString(),
        })
        setText(extracted)
        setInfo(`Đã đọc ${pages} trang PDF. Hãy xem nội dung bên dưới, sửa nếu có chỗ đọc sai rồi bấm “Đọc nội dung”.`)
        return
      }
      if (accept === 'text' && isDocx) {
        setBusy(true)
        setInfo(null)
        const { text: extracted } = await extractDocxText(await file.arrayBuffer())
        setText(extracted)
        setInfo('Đã đọc file Word (.docx). Hãy xem nội dung bên dưới, sửa nếu cần rồi bấm “Đọc nội dung”.')
        return
      }
      if (accept === 'text' && isLegacyDoc) {
        throw new DocxImportError('legacy-doc')
      }

      const content = await readFile(file)
      if (accept === 'text') {
        if (/^%PDF|^PK\u0003\u0004/.test(content) || content.includes('\u0000')) {
          setError(
            'Định dạng nhị phân này chưa đọc trực tiếp được. Hãy dùng file .pdf, .docx, .txt hoặc mở file, bấm Ctrl+A sao chép rồi dán vào ô bên dưới.',
          )
          return
        }
        setText(content)
        setInfo('Đã nạp văn bản từ file. Bấm “Đọc nội dung” để tách vào từng mục.')
      } else {
        const doc = importCvFromJson(content)
        setBusy(true)
        await saveCv(doc)
        close()
        onImported(doc.id)
      }
    } catch (err) {
      setError(friendlyImportError(err, accept))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!parsed) return
    setBusy(true)
    const doc = createCvWithData(parsed.data, `CV nhập - ${parsed.data.name || 'chưa có tên'}`)
    await saveCv(doc)
    close()
    onImported(doc.id)
  }

  const rows = parsed
    ? [
        { label: 'Họ tên', ok: parsed.confidence.name, value: parsed.data.name || 'Chưa có' },
        { label: 'Email', ok: parsed.confidence.email, value: parsed.data.email || 'Chưa có' },
        { label: 'Số điện thoại', ok: parsed.confidence.phone, value: parsed.data.phone || 'Chưa có' },
        { label: 'Kinh nghiệm', ok: parsed.confidence.jobs, value: `${parsed.data.jobs.length} công việc` },
        { label: 'Học vấn', ok: parsed.confidence.education, value: `${parsed.data.education.length} mục` },
        { label: 'Kỹ năng', ok: parsed.confidence.skills, value: `${parsed.data.skills.length} kỹ năng` },
      ]
    : []

  return (
    <Modal open={open} onClose={close} title="Nhập CV cũ" description="Xử lý ngay trên máy bạn, nội dung không gửi đi đâu." size="lg">
      {parsed ? (
        <div className="space-y-5">
          <p className="text-ink-2">
            Kiểm tra những gì đã đọc được. Mục nào ghi “Cần kiểm tra” bạn nên xem lại sau khi mở trình soạn. Chỗ không đọc được để trống,
            không tự điền.
          </p>
          <ul className="divide-y divide-rule rounded-control border border-rule p-0">
            {rows.map((r) => (
              <li key={r.label} className="flex list-none items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className="font-semibold">{r.label}</span>
                  <span className="ml-2 text-ink-3">{r.value}</span>
                </span>
                <span className={`flex shrink-0 items-center gap-1 text-sm font-semibold ${r.ok ? 'text-pen' : 'text-ink-3'}`}>
                  {r.ok ? <Check size={15} weight="bold" aria-hidden="true" /> : <Warning size={15} aria-hidden="true" />}
                  {r.ok ? 'Có vẻ đúng' : 'Cần kiểm tra'}
                </span>
              </li>
            ))}
          </ul>
          {parsed.warnings.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-ink-2">
              {parsed.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setParsed(null)}>
              Quay lại
            </Button>
            <Button onClick={() => void confirm()} disabled={busy}>
              Tạo CV và mở trình soạn
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <ChoiceGroup
            legend="Nguồn nhập"
            value={mode}
            onChange={(next) => {
              setMode(next)
              setError(null)
              setInfo(null)
            }}
            options={[
              { value: 'text', label: 'File CV hoặc dán văn bản' },
              { value: 'backup', label: 'File sao lưu (.json)' },
            ]}
          />

          {mode === 'text' ? (
            <>
              <div>
                <label htmlFor="cv-import-text-file" className="text-sm font-semibold text-ink-2">
                  Chọn file PDF, Word (.docx), .txt hoặc .md
                </label>
                <input
                  id="cv-import-text-file"
                  type="file"
                  accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.md,text/plain,text/markdown"
                  onChange={(e) => void loadFile(e.target.files?.[0], 'text')}
                  className="mt-1.5 block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-control file:border file:border-rule file:bg-desk file:px-3 file:py-2 file:font-semibold"
                />
              </div>
              <TextAreaField
                label="Hoặc dán trực tiếp nội dung CV cũ"
                rows={8}
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setError(null)
                }}
                placeholder="Dán toàn bộ chữ trong CV cũ: họ tên, liên hệ, kinh nghiệm, học vấn, kỹ năng…"
                hint="Nếu bạn tải file PDF hoặc .docx ở trên, văn bản sẽ hiện ra ở đây để bạn kiểm tra trước khi tách mục."
              />
            </>
          ) : (
            <div>
              <label htmlFor="cv-import-backup-file" className="text-sm font-semibold text-ink-2">
                Chọn file sao lưu (.json)
              </label>
              <input
                id="cv-import-backup-file"
                type="file"
                accept=".json,application/json"
                onChange={(e) => void loadFile(e.target.files?.[0], 'backup')}
                className="mt-1.5 block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-control file:border file:border-rule file:bg-desk file:px-3 file:py-2 file:font-semibold"
              />
              <p className="mt-2 text-sm text-ink-3">CV được khôi phục thành một bản mới, không ghi đè lên CV đang có.</p>
            </div>
          )}

          {busy && mode === 'text' && (
            <p role="status" className="text-ink-3">
              Đang đọc nội dung file…
            </p>
          )}
          {info && !error && (
            <p role="status" className="rounded-control bg-desk px-4 py-3 text-ink-2">
              {info}
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-control border border-seal/40 px-4 py-3 text-seal">
              {error}
            </p>
          )}

          {mode === 'text' && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Huỷ
              </Button>
              <Button
                onClick={() => {
                  if (!text.trim()) {
                    setError('Hãy chọn file hoặc dán nội dung CV vào ô trên trước.')
                    return
                  }
                  setParsed(parseRawCvText(text))
                }}
              >
                Đọc nội dung
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
