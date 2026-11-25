import type { CvLayout } from '@/components/resume/resume-paper'

export const CV_CATEGORIES = [
  'Đơn giản',
  'Hiện đại',
  'Công nghệ',
  'Kinh doanh & Tài chính',
  'Thiết kế',
  'Sáng tạo',
  'Có ảnh',
  'Gọn',
  'Đi làm lần đầu',
] as const
export type CvCategory = (typeof CV_CATEGORIES)[number]

export type CvTemplate = {
  slug: string
  name: string
  layout: CvLayout
  tags: CvCategory[]
  blurb: string
  columns: string
  photo: boolean
}

export const CV_TEMPLATES: CvTemplate[] = [
  {
    slug: 'ke-ngang',
    name: 'Kẻ ngang',
    layout: 'ke-ngang',
    tags: ['Đơn giản', 'Kinh doanh & Tài chính'],
    blurb: 'Một cột, chữ có chân, các mục ngăn bằng đường kẻ. Hợp ngành kế toán, ngân hàng, hành chính.',
    columns: 'Một cột',
    photo: false,
  },
  {
    slug: 'cot-xanh',
    name: 'Cột xanh',
    layout: 'cot-xanh',
    tags: ['Hiện đại', 'Có ảnh', 'Công nghệ'],
    blurb: 'Cột bên trái màu xanh đậm chứa liên hệ và kỹ năng, phần chính bên phải dành cho kinh nghiệm.',
    columns: 'Hai cột',
    photo: true,
  },
  {
    slug: 'bia-kraft',
    name: 'Bìa kraft',
    layout: 'bia-kraft',
    tags: ['Sáng tạo', 'Hiện đại'],
    blurb: 'Dải đầu trang màu giấy kraft làm tên bạn nổi bật ngay từ cái nhìn đầu tiên.',
    columns: 'Hai cột',
    photo: false,
  },
  {
    slug: 'thu-gon',
    name: 'Thu gọn',
    layout: 'thu-gon',
    tags: ['Gọn', 'Hiện đại', 'Công nghệ'],
    blurb: 'Chữ nhỏ, bố cục dày. Dành cho người có nhiều kinh nghiệm nhưng muốn CV vẫn vừa một trang.',
    columns: 'Hai cột',
    photo: false,
  },
  {
    slug: 'anh-tron',
    name: 'Ảnh tròn',
    layout: 'anh-tron',
    tags: ['Có ảnh', 'Hiện đại'],
    blurb: 'Ảnh chân dung tròn ở đầu trang, tên mục nằm ở cột trái để mắt đọc nhanh theo chiều dọc.',
    columns: 'Một cột có cột nhãn',
    photo: true,
  },
  {
    slug: 'moc-thoi-gian',
    name: 'Mốc thời gian',
    layout: 'moc-thoi-gian',
    tags: ['Hiện đại', 'Sáng tạo'],
    blurb: 'Kinh nghiệm và học vấn xếp theo trục thời gian, dễ thấy con đường bạn đã đi.',
    columns: 'Một cột',
    photo: false,
  },
  {
    slug: 'toi-gian',
    name: 'Tối giản',
    layout: 'toi-gian',
    tags: ['Đơn giản', 'Đi làm lần đầu'],
    blurb: 'Nhiều khoảng trắng, tên viết nét mảnh. Hợp khi bạn chưa có nhiều gì để nói và muốn gọn.',
    columns: 'Một cột',
    photo: false,
  },
  {
    slug: 'con-dau',
    name: 'Con dấu',
    layout: 'con-dau',
    tags: ['Đi làm lần đầu', 'Sáng tạo', 'Có ảnh'],
    blurb: 'Chữ cái đầu của bạn đóng dấu đỏ ở đầu trang. Hợp sinh viên mới ra trường và hồ sơ thực tập.',
    columns: 'Hai cột',
    photo: true,
  },
  {
    slug: 'harvard',
    name: 'Chuẩn Harvard',
    layout: 'harvard',
    tags: ['Đơn giản', 'Kinh doanh & Tài chính', 'Gọn'],
    blurb: 'Bố cục 1 cột chuẩn Harvard với đường kẻ mảnh trên-dưới, tiêu đề in hoa sắc nét cho tài chính, tư vấn, luật.',
    columns: 'Một cột',
    photo: false,
  },
  {
    slug: 'cong-nghe',
    name: 'Công nghệ & AI',
    layout: 'cong-nghe',
    tags: ['Hiện đại', 'Công nghệ', 'Có ảnh'],
    blurb: 'Header tối thanh lịch kết hợp ảnh chân dung tuỳ chọn và thẻ tech stack gọn gàng cho Kỹ sư Phần mềm và AI.',
    columns: 'Hai cột',
    photo: true,
  },
  {
    slug: 'hien-dai',
    name: 'Hiện đại Product',
    layout: 'hien-dai',
    tags: ['Hiện đại', 'Công nghệ', 'Kinh doanh & Tài chính', 'Có ảnh'],
    blurb: 'Thanh tiêu đề accent đậm chất SaaS kết hợp ảnh chân dung tuỳ chọn giúp quét nhanh thành tích trong 6 giây.',
    columns: 'Hai cột',
    photo: true,
  },
  {
    slug: 'sang-tao',
    name: 'Sáng tạo Studio',
    layout: 'sang-tao',
    tags: ['Sáng tạo', 'Thiết kế', 'Có ảnh'],
    blurb: 'Khung ảnh chân dung nổi bật cùng nhịp chữ trang nhã, lý tưởng cho UI/UX Designer, Creative và Marketing.',
    columns: 'Hai cột',
    photo: true,
  },
]

export const findCvTemplate = (slug: string) => CV_TEMPLATES.find((t) => t.slug === slug)
