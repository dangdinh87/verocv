'use client'

import { LinkSimple, NumberCircleOne, TextB, TextItalic } from '@phosphor-icons/react/dist/ssr'
import { useId, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

const CONTROL =
  'mt-1.5 w-full rounded-control border border-rule bg-paper px-3 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-3/80 hover:border-ink/30 focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30 focus-visible:outline-offset-0 disabled:opacity-60'

type Props = {
  label: string
  hint?: ReactNode
  className?: string
  optional?: boolean
  value: string
  onValueChange: (nextValue: string) => void
} & Omit<ComponentPropsWithoutRef<'textarea'>, 'className' | 'value' | 'onChange'>

export function RichTextAreaField({ label, hint, className = '', optional, value, onValueChange, ...area }: Props) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)

  const wrapSelection = (prefix: string, suffix: string, fallbackText: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const selected = value.slice(start, end) || fallbackText
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end)
    onValueChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursorStart = start + prefix.length
      el.setSelectionRange(cursorStart, cursorStart + selected.length)
    })
  }

  const insertMetric = () => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const snippet = '**[x]%**'
    const next = value.slice(0, start) + snippet + value.slice(end)
    onValueChange(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + 2, start + 5)
    })
  }

  const insertLink = () => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const selected = value.slice(start, end) || 'Xem dự án'
    const next = `${value.slice(0, start)}[${selected}](https://)${value.slice(end)}`
    onValueChange(next)
    requestAnimationFrame(() => {
      el?.focus()
      const urlPos = start + selected.length + 3
      el?.setSelectionRange(urlPos, urlPos + 8)
    })
  }

  const toolBtnCls =
    'inline-flex h-7 cursor-pointer items-center gap-1 rounded-[6px] border border-rule bg-paper px-2 text-xs font-semibold text-ink-2 hover:border-pen hover:text-pen'

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink-2">
          {label}
          {optional && <span className="ml-1 font-normal text-ink-3">(không bắt buộc)</span>}
        </label>
        <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Định dạng nhanh">
          <button
            type="button"
            title="In đậm (Ctrl+B)"
            onClick={() => wrapSelection('**', '**', 'nổi bật')}
            className={toolBtnCls}
          >
            <TextB size={13} weight="bold" aria-hidden="true" />
            <span>Đậm</span>
          </button>
          <button
            type="button"
            title="In nghiêng (Ctrl+I)"
            onClick={() => wrapSelection('*', '*', 'nhấn mạnh')}
            className={toolBtnCls}
          >
            <TextItalic size={13} weight="bold" aria-hidden="true" />
            <span>Nghiêng</span>
          </button>
          <button type="button" title="Chèn số liệu nổi bật" onClick={insertMetric} className={toolBtnCls}>
            <NumberCircleOne size={13} weight="bold" aria-hidden="true" />
            <span>+ Số liệu</span>
          </button>
          <button type="button" title="Chèn liên kết" onClick={insertLink} className={toolBtnCls}>
            <LinkSimple size={13} weight="bold" aria-hidden="true" />
            <span>Link</span>
          </button>
        </div>
      </div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault()
            wrapSelection('**', '**', 'nổi bật')
          } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
            e.preventDefault()
            wrapSelection('*', '*', 'nhấn mạnh')
          }
        }}
        className={CONTROL}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...area}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-3">
          {hint}
        </p>
      )}
    </div>
  )
}
