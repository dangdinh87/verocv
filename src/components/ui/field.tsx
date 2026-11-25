'use client'

import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react'

const CONTROL =
  'mt-1.5 w-full rounded-control border border-rule bg-paper px-3 text-base text-ink placeholder:text-ink-3/80 transition-[border-color] hover:border-ink/30 focus-visible:border-pen focus-visible:outline-2 focus-visible:outline-pen/30 focus-visible:outline-offset-0 aria-invalid:border-seal aria-invalid:focus-visible:outline-seal/30 disabled:opacity-60'

type FieldChrome = { label: string; hint?: ReactNode; className?: string; optional?: boolean }

// 16px text on purpose: smaller inputs make iOS Safari zoom the page on focus.
export function TextField({
  label,
  hint,
  className = '',
  optional,
  ...input
}: FieldChrome & Omit<ComponentPropsWithoutRef<'input'>, 'className'>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-2">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-3">(không bắt buộc)</span>}
      </label>
      <input id={id} type="text" {...input} className={`${CONTROL} h-11`} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-3">
          {hint}
        </p>
      )}
    </div>
  )
}

export function TextAreaField({
  label,
  hint,
  className = '',
  optional,
  ...area
}: FieldChrome & Omit<ComponentPropsWithoutRef<'textarea'>, 'className'>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-2">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-3">(không bắt buộc)</span>}
      </label>
      <textarea id={id} {...area} className={`${CONTROL} py-2.5 leading-relaxed`} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-3">
          {hint}
        </p>
      )}
    </div>
  )
}

export function SelectField({
  label,
  className = '',
  children,
  ...select
}: { label: string; className?: string; children: ReactNode } & Omit<ComponentPropsWithoutRef<'select'>, 'className'>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-semibold text-ink-2">
        {label}
      </label>
      <select id={id} {...select} className={`${CONTROL} h-11`}>
        {children}
      </select>
    </div>
  )
}
