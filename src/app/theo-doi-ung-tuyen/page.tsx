import type { Metadata } from 'next'
import { KanbanTracker } from '@/components/tracker/kanban-tracker'

export const metadata: Metadata = {
  title: 'Theo dõi ứng tuyển',
  description: 'Bảng kanban hút JD từ đường dẫn: gom tin tuyển dụng, CV đã nộp, lịch phỏng vấn và luyện câu hỏi STAR vào một chỗ.',
}

const FAQS = [
  {
    q: 'Theo dõi ứng tuyển có miễn phí không?',
    a: 'Có. Bảng Kanban và tính năng hút JD từ URL sử dụng miễn phí ngay trên trình duyệt, đồng bộ tự động lên Cloud D1 khi bạn đăng nhập tài khoản.',
  },
  { q: 'Mình lưu được bao nhiêu vị trí?', a: 'Không giới hạn số lượng thẻ vị trí trên bảng Kanban.' },
  {
    q: 'Dữ liệu ứng tuyển có ai thấy không?',
    a: 'Chỉ mình bạn thấy. Dữ liệu nằm trong trình duyệt máy bạn và tài khoản đám mây riêng nếu bạn bật đồng bộ.',
  },
]

export default function JobTrackerPage() {
  return (
    <section className="workspace-wrap py-6 lg:py-8">
      <KanbanTracker />

      <details className="smooth-details mt-8 rounded-sheet border border-rule bg-paper px-5 py-3.5 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">
          Hướng dẫn nhanh &amp; Câu hỏi thường gặp về Bảng ứng tuyển
        </summary>
        <div className="mt-3 space-y-3 border-t border-rule pt-3 text-ink-2">
          {FAQS.map((item) => (
            <div key={item.q}>
              <p className="font-semibold text-ink">{item.q}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{item.a}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
