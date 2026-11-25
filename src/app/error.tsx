'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="wrap py-20 lg:py-28">
      <div className="elevated-card mx-auto max-w-[40rem] rounded-sheet border border-rule bg-paper p-8 sm:p-10">
        <span className="inline-flex items-center rounded-full bg-seal/10 px-3 py-1 text-xs font-bold text-seal">Sự cố tạm thời</span>
        <h1 className="display mt-4 text-[clamp(2rem,4.5vw,3.1rem)] text-ink">Đã có lỗi xảy ra</h1>
        <p className="mt-4 max-w-[48ch] text-[1.05rem] leading-relaxed text-ink-2">
          Trình duyệt không thể xử lý tác vụ này. Bạn có thể thử tải lại hoặc quay về danh sách CV để tiếp tục công việc.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => (retry ?? reset)?.()} size="lg">
            Thử lại
          </Button>
          <Button href="/cv" variant="secondary" size="lg">
            Về danh sách CV
          </Button>
        </div>
      </div>
    </section>
  )
}
