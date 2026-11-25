import Link from 'next/link'
import type { FaqItem } from '@/components/ui/faq-list'
import { BRAND, PRICES, formatVnd } from '@/config/brand'

const linkCls = 'font-medium text-pen underline underline-offset-4'

export const HOME_FAQS: FaqItem[] = [
  {
    q: `${BRAND.name} là gì?`,
    a: 'Nền tảng AI tạo CV và thư xin việc chuẩn ATS bằng tiếng Việt và tiếng Anh. Bạn có thể chọn mẫu hoặc nhập CV cũ, tối ưu theo từng JD bằng AI Copilot, xuất PDF & Word (.docx), chia sẻ Link CV Online kèm thống kê nhà tuyển dụng mở xem.',
  },
  {
    q: 'Có thật là miễn phí không?',
    a: 'Có. Gói Miễn phí (0đ mãi mãi) cho phép tạo, sửa, xuất PDF & Word (.docx) không giới hạn, không logo, kèm 8 lượt AI Copilot/ngày và 1 Link CV Online (/p/slug). Không bắt nhập thẻ ngân hàng.',
  },
  {
    q: 'Mình có thể đồng bộ CV giữa nhiều máy tính không?',
    a: 'Khi dùng không cần tài khoản, CV lưu tức thì trên trình duyệt hiện tại (kèm sao lưu .json). Khi đăng nhập tài khoản VeroCV, toàn bộ CV, thư xin việc và bảng Kanban tự động đồng bộ lên Cloudflare D1 để bạn mở ở bất kỳ thiết bị nào.',
  },
  {
    q: 'CV làm ở đây có qua được phần mềm lọc hồ sơ (ATS) không?',
    a: 'PDF và Word (.docx) xuất ra đều là lớp chữ thật, có thể chọn và sao chép, với cấu trúc heading rõ ràng. Trong CV Studio có tab "Kiểm tra & JD" giúp bạn xem trước văn bản thuần ATS và đối chiếu độ khớp với tin tuyển dụng.',
  },
  {
    q: 'Mình có thể nhập CV đã làm trước đó không?',
    a: 'Được. Bạn tải lên file PDF hoặc DOCX, hoặc dán nội dung vào. Hệ thống tự động bóc tách vào từng mục (thông tin cá nhân, kinh nghiệm, học vấn, kỹ năng) để bạn chỉnh sửa tiếp.',
  },
  {
    q: 'Có hỗ trợ CV tiếng Anh và dịch song ngữ không?',
    a: 'Có. Bạn có thể chuyển đổi toàn bộ nhãn mục sang tiếng Anh trong tab Thiết kế, chọn khổ giấy A4/Letter, hoặc dùng nút AI Dịch CV Việt ↔ Anh để nhân bản ngay một phiên bản ngôn ngữ mới.',
  },
  {
    q: 'Dữ liệu của mình được xử lý thế nào?',
    a: (
      <>
        Chúng tôi chỉ lưu và xử lý thông tin để phục vụ hồ sơ của riêng bạn, không bán dữ liệu cho bên thứ ba và không gửi cho bên quảng cáo.
        Chi tiết xem ở{' '}
        <Link href="/bao-mat" className={linkCls}>
          chính sách bảo mật
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Mình có thể làm thư xin việc không?',
    a: (
      <>
        Có.{' '}
        <Link href="/thu-xin-viec" className={linkCls}>
          Thư xin việc
        </Link>{' '}
        dùng chung thông tin liên hệ và kiểu trình bày với CV bạn chọn, đồng thời hỗ trợ AI tự soạn nội dung theo CV và JD.
      </>
    ),
  },
]

export const PRICING_FAQS: FaqItem[] = [
  {
    q: `${BRAND.name} có thật sự miễn phí không?`,
    a: 'Có. Gói miễn phí 0đ trọn đời cho phép bạn soạn CV, tải PDF & Word (.docx) không dấu mờ, dùng 12 mẫu ATS, 8 lượt AI/ngày và 1 Link CV Online.',
  },
  {
    q: 'Gói Miễn phí khác gì với Pass Săn Việc 14 ngày và Pro?',
    a: `Gói Miễn phí đủ dùng cho 1 hồ sơ chính với 8 lượt AI/ngày và 1 Link Online. Pass Săn Việc (${formatVnd(PRICES.pass14d)}, dùng 14 ngày không tự gia hạn) tăng lên 100 lượt AI/ngày và 10 Link Online theo dõi từng nhà tuyển dụng. Pro mở rộng lên 200–300 lượt AI/ngày, 50–100 Link Online và đồng bộ Master CV dài hạn.`,
  },
  {
    q: 'Thanh toán bằng cách nào?',
    a: `Quét mã chuyển khoản ngân hàng VietQR (tự động nhận diện mã đơn và kích hoạt gói ngay trên tài khoản). Không cần thẻ Visa/Mastercard quốc tế.`,
  },
  {
    q: 'Gói Pass Săn Việc 14 ngày có tự động gia hạn trừ tiền không?',
    a: 'Không. Pass 14 ngày là gói mua một lần duy nhất dành cho giai đoạn tìm việc tập trung. Hết 14 ngày tài khoản tự quay về gói Miễn phí, không phát sinh phí ẩn.',
  },
  {
    q: 'Điều gì xảy ra khi hết hạn gói Pass hoặc Pro?',
    a: 'Mọi CV, thư xin việc và bảng Kanban bạn đã tạo vẫn được lưu giữ nguyên vẹn. Các bản CV đang mở trên máy hoặc Link Online đầu tiên vẫn hoạt động bình thường.',
  },
  {
    q: 'Có hoàn tiền nếu nâng cấp nhầm không?',
    a: `Nếu có sự cố thanh toán hoặc nâng cấp nhầm gói, hãy gửi email tới ${BRAND.supportEmail} trong vòng 7 ngày kèm mã giao dịch để được hỗ trợ hoàn tiền.`,
  },
]
