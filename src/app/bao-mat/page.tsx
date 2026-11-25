import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Chính sách bảo mật' }

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Chính sách bảo mật"
      updated="4/10/2026"
      sections={[
        {
          title: 'Chúng tôi thu thập gì',
          body: [
            'Thông tin tài khoản (email, tên), nội dung bạn nhập vào CV và thư xin việc, và dữ liệu kỹ thuật cơ bản như loại trình duyệt để dịch vụ chạy ổn định.',
          ],
        },
        {
          title: 'Chúng tôi dùng thông tin để làm gì',
          body: ['Để dựng, lưu và xuất CV của bạn, để xử lý thanh toán gói Pro và để hỗ trợ khi bạn liên hệ.'],
        },
        {
          title: 'Chúng tôi không làm gì',
          body: ['Chúng tôi không bán thông tin cá nhân của bạn, không chia sẻ nội dung CV với nhà tuyển dụng hay bên quảng cáo.'],
        },
        {
          title: 'Gợi ý bằng AI',
          body: ['Khi bạn dùng gợi ý AI, đoạn văn bạn chọn gửi đi được xử lý để tạo gợi ý và không được dùng để huấn luyện mô hình.'],
        },
        {
          title: 'Thời gian lưu trữ',
          body: ['Dữ liệu được lưu cho đến khi bạn xoá tài khoản. Sau khi xoá, dữ liệu bị xoá khỏi hệ thống trong vòng 30 ngày.'],
        },
        {
          title: 'Quyền của bạn',
          body: ['Bạn có quyền xem, sửa, tải về và xoá dữ liệu của mình bất cứ lúc nào trong phần tài khoản.'],
        },
        {
          title: 'Cookie',
          body: ['Chúng tôi chỉ dùng cookie cần thiết cho đăng nhập và ghi nhớ lựa chọn của bạn, không dùng cookie theo dõi quảng cáo.'],
        },
        { title: 'Liên hệ', body: [`Câu hỏi về dữ liệu cá nhân xin gửi về ${BRAND.supportEmail}.`] },
      ]}
    />
  )
}
