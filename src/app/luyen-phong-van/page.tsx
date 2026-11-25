import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MockInterviewRoom } from '@/components/interview/mock-interview-room'

export const metadata: Metadata = {
  title: 'Luyện phỏng vấn AI (STAR Coach)',
  description:
    'Phòng luyện phỏng vấn thử với AI Coach: mô phỏng 6 câu hỏi sát CV và JD, chấm điểm STAR theo thời gian thực, gợi ý câu trả lời mẫu và câu hỏi xoáy.',
}

const TIPS = [
  ['Situation (Bối cảnh)', 'Mở đầu bằng 1–2 câu nêu rõ công ty, quy mô dự án hoặc tình huống thực tế lúc đó.'],
  ['Task (Nhiệm vụ)', 'Chốt mục tiêu cụ thể bạn được giao hoặc điểm nghẽn mà cá nhân bạn cần giải quyết.'],
  ['Action (Hành động)', 'Dùng động từ chủ động ("Tôi đã trực tiếp…") để tách rõ đóng góp cá nhân và công cụ sử dụng.'],
  [
    'Result (Kết quả & Số liệu)',
    'Khép lại bằng con số thật: tăng/giảm bao nhiêu %, tiết kiệm bao nhiêu giờ hoặc phục vụ bao nhiêu người dùng.',
  ],
]

export default function MockInterviewPage() {
  return (
    <section className="workspace-wrap py-6 lg:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="display text-[clamp(1.7rem,3.4vw,2.35rem)] text-ink">Luyện phỏng vấn AI theo CV &amp; JD</h1>
          <p className="mt-1 max-w-[54ch] text-sm leading-relaxed text-ink-2">
            Nhập vai phỏng vấn 1-1: nhận bộ 6 câu hỏi hành vi, chuyên môn và khoảng trống CV–JD, kiểm tra cấu trúc STAR trực tiếp và chấm
            điểm kèm câu trả lời mẫu nâng cấp.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="rounded-sheet border border-rule bg-paper p-6 text-sm text-ink-3">Đang khởi tạo phòng luyện phỏng vấn AI…</div>
          }
        >
          <MockInterviewRoom />
        </Suspense>
      </div>

      <details className="smooth-details mt-8 rounded-sheet border border-rule bg-paper px-5 py-3.5 text-sm">
        <summary className="cursor-pointer font-semibold text-ink">Công thức trả lời STAR ghi điểm cao với nhà tuyển dụng</summary>
        <div className="mt-3 grid gap-3 border-t border-rule pt-3 sm:grid-cols-2">
          {TIPS.map(([term, desc]) => (
            <div key={term}>
              <p className="font-semibold text-ink">{term}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{desc}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
