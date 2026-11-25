import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap cursor-pointer select-none transition-[background-color,border-color,color,transform] duration-[120ms] active:translate-y-px disabled:opacity-50 disabled:pointer-events-none'

const VARIANTS = {
  primary: 'bg-pen text-white hover:bg-pen-dark',
  secondary: 'border border-rule bg-paper text-ink hover:border-ink/30 hover:bg-desk',
  ghost: 'text-ink-2 hover:bg-ink/[0.05] hover:text-ink',
  /** Hành động không hoàn tác được (xoá). */
  danger: 'bg-seal text-white hover:bg-seal/90',
} as const

const SIZES = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-[0.95rem]',
} as const

type CommonProps = {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  className?: string
  children?: ReactNode
}

type ButtonAsButton = CommonProps &
  ComponentPropsWithoutRef<'button'> & {
    href?: undefined
  }

type ButtonAsLink = CommonProps &
  ComponentPropsWithoutRef<typeof Link> & {
    href: string
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const styles = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`

  if (props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink
    return <Link href={href} className={styles} {...rest} />
  }

  const { type = 'button', ...rest } = props as ButtonAsButton
  return <button type={type} className={styles} {...rest} />
}
