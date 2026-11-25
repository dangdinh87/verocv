import Link from 'next/link'
import { BRAND, FOOTER_LINKS } from '@/config/brand'
import { Logo } from './logo'

const COLUMNS = [
  { title: 'Sản phẩm', links: FOOTER_LINKS.product },
  { title: 'Công ty', links: FOOTER_LINKS.company },
  { title: 'Pháp lý', links: FOOTER_LINKS.legal },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1.2fr_2fr] lg:py-16">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed">
            Nền tảng AI tạo CV, tối ưu theo JD, xuất bản Link trực tuyến và theo dõi hành trình ứng tuyển dành cho người Việt.
          </p>
        </div>
        <nav aria-label="Chân trang" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-[0.95rem]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="underline-offset-4 transition-colors hover:text-white hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/15">
        <p className="wrap py-5 text-sm text-white/65">
          © {BRAND.year} {BRAND.name} ({BRAND.domain}). Tất cả quyền được bảo lưu.
        </p>
      </div>
    </footer>
  )
}
