'use client'

import { useEffect, useRef } from 'react'

export type PaperSize = 'a4' | 'letter'

const PAPER = {
  a4: { width: '210mm', height: '297mm', cssName: 'A4' },
  letter: { width: '215.9mm', height: '279.4mm', cssName: 'Letter' },
} as const

const PAGE_STYLE_ID = 'hsx-print-page'

// "Nguyễn Đức Anh" -> "Nguyen-Duc-Anh": browsers use document.title as the default PDF file name.
export function fileSafeName(text: string, fallback = 'Ung-vien'): string {
  const ascii = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || fallback
}

/*
  Print setup runs on the browser's own `beforeprint` / `afterprint` events, so the toolbar button,
  Ctrl+P and the browser menu all produce the same file: right paper size, zero page margin, a sensible file name.
*/
export function usePrintSetup(fileName: string, paper: PaperSize, backdrop?: string) {
  const latest = useRef({ fileName, paper, backdrop })
  latest.current = { fileName, paper, backdrop }

  useEffect(() => {
    let previousTitle = ''
    const root = document.documentElement

    const before = () => {
      const { fileName: name, paper: size, backdrop: pageBackground } = latest.current
      const spec = PAPER[size]
      previousTitle = document.title
      document.title = name
      root.style.setProperty('--print-w', spec.width)
      root.style.setProperty('--print-h', spec.height)
      if (pageBackground) root.style.background = pageBackground
      const style = document.createElement('style')
      style.id = PAGE_STYLE_ID
      style.textContent = `@page { size: ${spec.cssName}; margin: 0; }`
      document.head.appendChild(style)
    }

    const after = () => {
      document.title = previousTitle
      root.style.removeProperty('--print-w')
      root.style.removeProperty('--print-h')
      root.style.removeProperty('background')
      document.getElementById(PAGE_STYLE_ID)?.remove()
    }

    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
      after()
    }
  }, [])
}

export const printDocument = () => window.print()
