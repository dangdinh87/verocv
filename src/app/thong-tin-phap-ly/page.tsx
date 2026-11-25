import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Thông tin pháp lý' }

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Thông tin pháp lý"
      updated="4/10/2026"
      sections={[
        { title: 'Đơn vị vận hành', body: [`${BRAND.legalEntity}`, 'Địa chỉ: [cập nhật]', 'Mã số doanh nghiệp: [cập nhật]'] },
        { title: 'Liên hệ', body: [`Email: ${BRAND.supportEmail}`] },
        { title: 'Người chịu trách nhiệm nội dung', body: ['[cập nhật]'] },
      ]}
    />
  )
}
