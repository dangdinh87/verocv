import Link from 'next/link'
import { BRAND } from '@/config/brand'

export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden="true">
      {/* Tờ A4 gấp góc, mực bút bi xanh */}
      <path d="M8 2h13.5L30 10.5V24a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z" fill="#2448a8" />
      {/* Góc gấp màu giấy kraft */}
      <path d="M21.5 2v6.5A2 2 0 0 0 23.5 10.5H30L21.5 2Z" fill="#d8c4a0" />
      {/* Fountain-nib V stroke */}
      <path fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.5 15.2 22.8 22 11.5" />
    </svg>
  )
}

export function Logo({ inverted = false, badgeText = 'STUDIO' }: { inverted?: boolean; badgeText?: string | false }) {
  return (
    <Link href="/" className="inline-flex min-w-0 shrink-0 items-center gap-2.5" aria-label={`${BRAND.name}, trang chủ`}>
      <LogoMark />
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span
          className={`whitespace-nowrap text-[1.2rem] font-extrabold tracking-[-0.03em] sm:text-[1.25rem] ${inverted ? 'text-white' : 'text-ink'}`}
        >
          Vero<span className={inverted ? 'text-kraft-deep' : 'text-pen'}>CV</span>
        </span>
        {badgeText !== false && (
          <span
            className={`max-xs:hidden shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-wider ${
              inverted ? 'border border-white/20 bg-white/10 text-kraft-deep' : 'border border-pen/25 bg-pen-wash text-pen'
            }`}
          >
            {badgeText}
          </span>
        )}
      </span>
    </Link>
  )
}
