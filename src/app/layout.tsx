import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Lora, Patrick_Hand, Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google'
import { AuthProvider } from '@/components/auth/auth-provider'
import { SiteChrome } from '@/components/site-chrome'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { BRAND } from '@/config/brand'
import './globals.css'

const beVietnam = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
})
const patrickHand = Patrick_Hand({
  subsets: ['vietnamese', 'latin'],
  weight: '400',
  variable: '--font-patrick-hand',
  display: 'swap',
})
const sourceSerif = Source_Serif_4({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
})
const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta-sans',
  display: 'swap',
})
const loraSerif = Lora({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-lora-serif',
  display: 'swap',
})

const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('verocv_theme');var d=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=d?'dark':'light';document.documentElement.setAttribute('data-theme',r);document.documentElement.style.colorScheme=r;}catch(e){}})();`

export const metadata: Metadata = {
  metadataBase: new URL(`https://${BRAND.domain}`),
  title: { default: `${BRAND.name}: ${BRAND.tagline}`, template: `%s | ${BRAND.name}` },
  description:
    'Nền tảng AI tạo CV chuẩn ATS, tối ưu theo từng JD, xuất PDF & Word (.docx), chia sẻ Link CV trực tuyến kèm thống kê nhà tuyển dụng mở xem.',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: BRAND.name,
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${beVietnam.variable} ${patrickHand.variable} ${sourceSerif.variable} ${jakartaSans.variable} ${loraSerif.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
