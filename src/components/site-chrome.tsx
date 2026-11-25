'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { WorkspaceShell } from './app-shell/workspace-shell'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

// The editors and public CV viewer are full-screen tools with their own toolbar.
const EDITOR_ROUTE = /^\/(cv|thu-xin-viec|p)\/[^/]+$/
const WORKSPACE_ROUTE = /^\/(cv|thu-xin-viec|theo-doi-ung-tuyen|luyen-phong-van|tai-khoan)$/

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (EDITOR_ROUTE.test(pathname))
    return (
      <main id="noi-dung-chinh" className="flex-1">
        {children}
      </main>
    )
  if (WORKSPACE_ROUTE.test(pathname)) {
    return <WorkspaceShell>{children}</WorkspaceShell>
  }
  return (
    <>
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-pen-fill focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Chuyển đến nội dung chính
      </a>
      <SiteHeader />
      <main id="noi-dung-chinh" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
