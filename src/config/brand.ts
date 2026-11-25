// Single place to rename the product, change contact details, or edit prices.
export const BRAND = {
  name: 'VeroCV',
  tagline: 'Nền tảng AI tạo CV, tối ưu JD & theo dõi nhà tuyển dụng',
  domain: 'verocv.vn',
  supportEmail: 'support@verocv.vn',
  legalEntity: 'VeroCV Career Labs',
  year: 2026,
  enforceFreeLimits: false, // Feature flag to toggle free tier limits (1 CV, 1 letter)
} as const

// Placeholder prices (VND). Edit freely: the pricing page and FAQ read from here.
export const PRICES = {
  pass14d: 49000,
  proMonthly: 59000,
  proYearly: 420000,
} as const

export const formatVnd = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`

export const proYearlyPerMonth = Math.round(PRICES.proYearly / 12 / 1000) * 1000
export const proYearlySavingPercent = Math.round((1 - PRICES.proYearly / (PRICES.proMonthly * 12)) * 100)

export const NAV_LINKS = [
  { href: '/mau-cv', label: 'Mẫu CV' },
  { href: '/thu-xin-viec', label: 'Thư xin việc' },
  { href: '/theo-doi-ung-tuyen', label: 'Theo dõi ứng tuyển' },
  { href: '/luyen-phong-van', label: 'Phỏng vấn AI' },
  { href: '/bang-gia', label: 'Bảng giá' },
] as const

export const FOOTER_LINKS = {
  product: [
    { href: '/mau-cv', label: 'Mẫu CV' },
    { href: '/viet-cv-voi-ai', label: 'Viết CV với AI' },
    { href: '/thu-xin-viec', label: 'Thư xin việc' },
    { href: '/mau-thu-xin-viec', label: 'Mẫu thư xin việc' },
    { href: '/theo-doi-ung-tuyen', label: 'Theo dõi ứng tuyển' },
    { href: '/luyen-phong-van', label: 'Phỏng vấn AI' },
  ],
  company: [
    { href: '/ve-chung-toi', label: 'Về chúng tôi' },
    { href: '/bang-gia', label: 'Bảng giá' },
    { href: `mailto:${BRAND.supportEmail}`, label: 'Liên hệ' },
  ],
  legal: [
    { href: '/dieu-khoan', label: 'Điều khoản sử dụng' },
    { href: '/bao-mat', label: 'Chính sách bảo mật' },
    { href: '/thong-tin-phap-ly', label: 'Thông tin pháp lý' },
  ],
} as const
