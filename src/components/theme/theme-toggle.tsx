'use client'

import { Moon, Sun } from '@phosphor-icons/react/dist/ssr'
import { useEffect, useState } from 'react'
import { useTheme } from './theme-provider'

export function ThemeToggle({ className = '', showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const label = isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={mounted ? isDark : undefined}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border border-rule bg-paper text-ink-2 transition-colors hover:border-pen/50 hover:bg-ink/[0.04] hover:text-ink ${
        showLabel ? 'h-10 px-3 text-sm font-medium' : 'size-10'
      } ${className}`}
    >
      <span className="theme-toggle-moon items-center justify-center" aria-hidden="true">
        <Moon size={18} weight="bold" />
      </span>
      <span className="theme-toggle-sun items-center justify-center text-mint" aria-hidden="true">
        <Sun size={18} weight="bold" />
      </span>
      {showLabel && (
        <span>
          <span className="theme-toggle-moon">Giao diện tối</span>
          <span className="theme-toggle-sun">Giao diện sáng</span>
        </span>
      )}
    </button>
  )
}
