import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="wrap py-20 lg:py-28">
      <div className="mx-auto max-w-[40rem] rounded-sheet border border-rule bg-paper p-8 sm:p-10">
        <span className="inline-flex items-center rounded-full bg-pen-wash px-3 py-1 text-xs font-bold text-pen">
          404 · Đường dẫn không tồn tại
        </span>
        <h1 className="display mt-4 text-[clamp(2rem,4.5vw,3.1rem)] text-ink">Không tìm thấy trang này</h1>
        <p className="mt-4 max-w-[44ch] text-[1.05rem] leading-relaxed text-ink-2">
          Đường dẫn có thể đã đổi hoặc gõ sai. Quay lại trang chủ hoặc xem kho 12 mẫu CV chuẩn ATS.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/" size="lg">
            Về trang chủ
          </Button>
          <Button href="/mau-cv" variant="secondary" size="lg">
            Xem mẫu CV
          </Button>
        </div>
      </div>
    </section>
  )
}
