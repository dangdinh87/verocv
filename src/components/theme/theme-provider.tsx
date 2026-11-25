'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'verocv_theme'

type ThemeContextValue = {
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? getSystemTheme() : mode
}

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // Ignore storage access failures in private browsing contexts
  }
  return 'system'
}

function applyResolvedTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const initial = readStoredTheme()
    const resolved = resolveMode(initial)
    setThemeState(initial)
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemChange = () => {
      if (theme !== 'system') return
      const next = media.matches ? 'dark' : 'light'
      setResolvedTheme(next)
      applyResolvedTheme(next)
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const nextMode = readStoredTheme()
      const nextResolved = resolveMode(nextMode)
      setThemeState(nextMode)
      setResolvedTheme(nextResolved)
      applyResolvedTheme(nextResolved)
    }

    media.addEventListener('change', handleSystemChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      media.removeEventListener('change', handleSystemChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
    const resolved = resolveMode(next)
    setResolvedTheme(resolved)
    applyResolvedTheme(resolved)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore storage write failures
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const currentResolved =
      typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : resolvedTheme
    setTheme(currentResolved === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme phải được gọi bên trong ThemeProvider')
  }
  return ctx
}
