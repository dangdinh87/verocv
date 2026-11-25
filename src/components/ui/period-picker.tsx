'use client'

import { CalendarBlank, Check, X } from '@phosphor-icons/react/dist/ssr'
import { useId, useState } from 'react'

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const YEARS = Array.from({ length: 29 }, (_, idx) => String(2028 - idx)) // 2028..2000

const CONTROL =
  'mt-1.5 h-11 w-full rounded-control border border-rule bg-paper px-3 text-base text-ink placeholder:text-ink-3/80 hover:border-ink/30 focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30 focus-visible:outline-offset-0'

const SELECT_CLS =
  'h-9 w-full rounded-control border border-rule bg-paper px-2 text-sm text-ink hover:border-ink/30 focus-visible:border-pen focus-visible:outline-none disabled:opacity-45'

type ParsedPeriod = {
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  isCurrent: boolean
}

function parseMonthToken(raw: string): { month: string; year: string } {
  const numeric = raw.match(/\b(0?[1-9]|1[0-2])\s*[\/-]\s*((?:19|20)\d{2})\b/)
  if (numeric) {
    return { month: numeric[1].padStart(2, '0'), year: numeric[2] }
  }
  const named = raw.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+((?:19|20)\d{2})\b/i)
  if (named) {
    const idx = EN_MONTHS.findIndex((m) => m.toLowerCase() === named[1].toLowerCase())
    return { month: idx >= 0 ? MONTHS[idx] : '', year: named[2] }
  }
  const yearOnly = raw.match(/\b((?:19|20)\d{2})\b/)
  if (yearOnly) {
    return { month: '', year: yearOnly[1] }
  }
  return { month: '', year: '' }
}

function parsePeriod(value: string): ParsedPeriod {
  const trimmed = value.trim()
  const fallbackYear = String(new Date().getFullYear())
  if (!trimmed) {
    return { startMonth: '', startYear: fallbackYear, endMonth: '', endYear: '', isCurrent: false }
  }
  const isCurrent = /\b(nay|hiện tại|present|current)\b/i.test(trimmed)
  const parts = trimmed.split(/\s*[-–—]\s*/)
  const start = parseMonthToken(parts[0] ?? '')
  const end = parts[1] && !isCurrent ? parseMonthToken(parts[1]) : { month: '', year: '' }
  return {
    startMonth: start.month,
    startYear: start.year || fallbackYear,
    endMonth: end.month,
    endYear: end.year,
    isCurrent,
  }
}

function formatEndpoint(month: string, year: string, language: 'vi' | 'en'): string {
  if (!year) return ''
  if (!month) return year
  if (language === 'en') {
    const idx = MONTHS.indexOf(month as (typeof MONTHS)[number])
    const label = idx >= 0 ? EN_MONTHS[idx] : month
    return `${label} ${year}`
  }
  return `${month}/${year}`
}

function formatPeriodRange(state: ParsedPeriod, language: 'vi' | 'en'): string {
  const start = formatEndpoint(state.startMonth, state.startYear, language)
  if (!start) return ''
  if (state.isCurrent) {
    return `${start} – ${language === 'en' ? 'Present' : 'nay'}`
  }
  const end = formatEndpoint(state.endMonth, state.endYear, language)
  if (!end) return start
  return `${start} – ${end}`
}

export function PeriodPickerField({
  label,
  value,
  onChange,
  placeholder,
  optional,
  language = 'vi',
  className = '',
}: {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  optional?: boolean
  language?: 'vi' | 'en'
  className?: string
}) {
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ParsedPeriod>(() => parsePeriod(value))

  const toggleOpen = () => {
    if (!open) {
      setDraft(parsePeriod(value))
    }
    setOpen((prev) => !prev)
  }

  const updateDraft = (patch: Partial<ParsedPeriod>, autoApply = true) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    if (autoApply) {
      const formatted = formatPeriodRange(next, language)
      if (formatted) onChange(formatted)
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink-2">
          {label}
          {optional && <span className="ml-1 font-normal text-ink-3">(không bắt buộc)</span>}
        </label>
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={open}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
            open ? 'bg-pen-fill text-white' : 'text-pen hover:bg-pen-wash'
          }`}
        >
          <CalendarBlank size={13} weight="bold" aria-hidden="true" />
          <span>Chọn tháng/năm</span>
        </button>
      </div>

      <input
        id={inputId}
        type="text"
        value={value}
        placeholder={placeholder ?? (language === 'en' ? 'Mar 2022 – Present' : '03/2022 – nay')}
        onChange={(e) => onChange(e.target.value)}
        className={CONTROL}
      />

      {open && (
        <div className="mt-2 space-y-3 rounded-control border border-rule bg-desk p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-ink-2">Chọn nhanh mốc thời gian</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng bảng chọn tháng năm"
              className="flex size-6 cursor-pointer items-center justify-center rounded-full text-ink-3 hover:bg-ink/[0.08] hover:text-ink"
            >
              <X size={13} weight="bold" />
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold text-ink-3">Bắt đầu</span>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                <select
                  aria-label="Tháng bắt đầu"
                  value={draft.startMonth}
                  onChange={(e) => updateDraft({ startMonth: e.target.value })}
                  className={SELECT_CLS}
                >
                  <option value="">Chỉ năm</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Năm bắt đầu"
                  value={draft.startYear}
                  onChange={(e) => updateDraft({ startYear: e.target.value })}
                  className={SELECT_CLS}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink-3">Kết thúc</span>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-pen">
                  <input
                    type="checkbox"
                    checked={draft.isCurrent}
                    onChange={(e) => updateDraft({ isCurrent: e.target.checked })}
                    className="size-3.5 accent-pen"
                  />
                  <span>Hiện tại / Nay</span>
                </label>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                <select
                  aria-label="Tháng kết thúc"
                  disabled={draft.isCurrent}
                  value={draft.endMonth}
                  onChange={(e) => updateDraft({ endMonth: e.target.value })}
                  className={SELECT_CLS}
                >
                  <option value="">Chỉ năm</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Năm kết thúc"
                  disabled={draft.isCurrent}
                  value={draft.endYear}
                  onChange={(e) => updateDraft({ endYear: e.target.value })}
                  className={SELECT_CLS}
                >
                  <option value="">Không chọn</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-2">
            <span className="text-xs text-ink-3">
              Kết quả: <strong className="text-ink">{formatPeriodRange(draft, language) || '—'}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                const formatted = formatPeriodRange(draft, language)
                if (formatted) onChange(formatted)
                setOpen(false)
              }}
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-control bg-pen-fill px-2.5 text-xs font-semibold text-white hover:bg-pen-fill/90"
            >
              <Check size={12} weight="bold" aria-hidden="true" />
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
