import type { Metadata } from 'next'
import { LetterDashboard } from '@/components/letter/letter-dashboard'

export const metadata: Metadata = {
  title: 'Thư xin việc',
  description: 'Quản lý và soạn thảo thư xin việc chuyên nghiệp, đồng bộ cùng CV.',
}

export default function CoverLetterPage() {
  return <LetterDashboard />
}
