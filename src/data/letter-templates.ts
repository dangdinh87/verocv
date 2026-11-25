import type { LetterAccent, LetterLayout } from '@/components/resume/letter-paper'

export type LetterTemplate = {
  slug: string
  name: string
  layout: LetterLayout
  accent: LetterAccent
  blurb: string
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    slug: 'thu-thang',
    name: 'Thư thẳng',
    layout: 'thang',
    accent: 'ink',
    blurb: 'Căn trái, một đường kẻ dưới phần người gửi. Trang trọng, hợp mọi ngành.',
  },
  {
    slug: 'dai-xanh',
    name: 'Dải xanh',
    layout: 'dai-mau',
    accent: 'pen',
    blurb: 'Dải màu xanh ở đầu thư cho tên bạn nổi bật. Hợp CV dùng mẫu Cột xanh hoặc Ảnh tròn.',
  },
  {
    slug: 'dai-kraft',
    name: 'Dải kraft',
    layout: 'dai-mau',
    accent: 'kraft',
    blurb: 'Dải màu giấy kraft ấm áp, đi cùng mẫu CV Bìa kraft.',
  },
  {
    slug: 'can-giua',
    name: 'Căn giữa',
    layout: 'giua',
    accent: 'ink',
    blurb: 'Tên và thông tin liên hệ ở giữa, gọn gàng và cân đối. Hợp mẫu CV Kẻ ngang.',
  },
  { slug: 'le-xanh', name: 'Lề xanh', layout: 'le-trai', accent: 'pen', blurb: 'Một dải xanh chạy dọc mép trái của trang, nhìn là nhớ.' },
  { slug: 'le-kraft', name: 'Lề kraft', layout: 'le-trai', accent: 'kraft', blurb: 'Dải kraft ở mép trái, nhẹ nhàng và thân thiện.' },
]

export const findLetterTemplate = (slug: string) => LETTER_TEMPLATES.find((t) => t.slug === slug)
