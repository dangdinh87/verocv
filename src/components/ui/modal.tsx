'use client'

import { X } from '@phosphor-icons/react/dist/ssr'
import { useEffect, useId, useRef, type ReactNode } from 'react'

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' } as const

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: keyof typeof SIZES
  children: ReactNode
}

// Native <dialog>: the browser gives us the focus trap, Esc to close, inert background and focus restore.
function ModalDialog({ onClose, title, description, size = 'md', children }: Omit<ModalProps, 'open'>) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }
    // showModal() focuses the first control (the close button); inputs that should take focus opt in with data-autofocus.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previousOverflow
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClose={(e) => {
        if (!e.currentTarget.open) onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={`m-auto max-h-[88dvh] w-[calc(100%-2rem)] ${SIZES[size]} overflow-hidden rounded-sheet border border-rule bg-paper p-0 text-ink backdrop:bg-ink/40`}
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-ink-3">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </dialog>
  )
}

export function Modal(props: ModalProps) {
  if (!props.open) return null
  const { open: _open, ...rest } = props
  return <ModalDialog {...rest} />
}
