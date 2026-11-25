import type { Metadata } from 'next'
import { CvDashboard } from '@/components/cv/cv-dashboard'

export const metadata: Metadata = {
  title: 'CV của bạn',
  description: 'Quản lý danh sách CV của bạn, tạo mới từ mẫu hoặc sao chép và tải PDF chất lượng cao.',
}

export default function CvListPage() {
  return <CvDashboard />
}
