import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Điều khoản sử dụng' }

export default function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản sử dụng"
      updated="4/10/2026"
      sections={[
        {
          title: 'Phạm vi',
          body: [`Khi dùng ${BRAND.name}, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.`],
        },
        {
          title: 'Tài khoản',
          body: [
            'Bạn chịu trách nhiệm về thông tin đăng nhập của mình và về nội dung bạn nhập vào CV, thư xin việc. Hãy cung cấp thông tin trung thực.',
          ],
        },
        {
          title: 'Nội dung của bạn',
          body: [
            'Bạn giữ toàn bộ quyền với nội dung mình tạo ra. Chúng tôi chỉ xử lý nội dung đó để cung cấp dịch vụ cho bạn: lưu, đồng bộ Cloud (nếu đăng nhập), xuất bản Link Online và xuất PDF / Word (.docx).',
          ],
        },
        {
          title: 'Gói miễn phí, Pass Săn Việc và gói Pro',
          body: [
            'Gói miễn phí dùng không giới hạn thời gian với các quyền lợi nêu ở trang Bảng giá. Pass Săn Việc 14 ngày thanh toán một lần qua VietQR và không tự động gia hạn.',
            'Gói Pro mở rộng hạn mức AI Copilot và số lượng Link CV Online theo chu kỳ tháng hoặc năm. Khi hết hạn hoặc hạ gói, dữ liệu CV và thư xin việc của bạn vẫn được giữ nguyên.',
          ],
        },
        {
          title: 'Sử dụng hợp lệ',
          body: ['Không dùng dịch vụ để đăng nội dung vi phạm pháp luật, gây hại cho người khác hoặc làm gián đoạn hệ thống.'],
        },
        {
          title: 'Giới hạn trách nhiệm',
          body: ['Dịch vụ được cung cấp như hiện có. Chúng tôi không đảm bảo CV của bạn sẽ giúp bạn nhận được việc làm.'],
        },
        {
          title: 'Thay đổi điều khoản',
          body: ['Khi điều khoản thay đổi, chúng tôi sẽ thông báo trên trang này và qua email nếu thay đổi quan trọng.'],
        },
        { title: 'Liên hệ', body: [`Mọi thắc mắc xin gửi về ${BRAND.supportEmail}.`] },
      ]}
    />
  )
}
