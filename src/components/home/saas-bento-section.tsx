import { Briefcase, CheckCircle, FileDoc, Globe, QrCode, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { SpotlightCard } from '@/components/ui/spotlight-card'

export function SaasBentoSection() {
  return (
    <section id="tinh-nang-saas" aria-labelledby="bento-title" className="border-t border-rule bg-paper py-16 lg:py-20">
      <div className="wrap">
        <div className="max-w-[44rem]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pen-wash px-3 py-1 text-xs font-bold text-pen">
            Bộ công cụ SaaS toàn diện
          </span>
          <h2 id="bento-title" className="display mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] text-ink">
            Không chỉ là trình vẽ CV — mà là trợ lý đi cùng bạn đến khi nhận offer
          </h2>
          <p className="mt-3 text-base text-ink-2">
            Từ lúc chắt lọc kinh nghiệm đầu tiên, đối chiếu JD bằng AI đến khi nhà tuyển dụng bấm mở Link CV và hẹn phỏng vấn.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {/* Card 1: Wide (7 cols) */}
          <SpotlightCard as="article" className="elevated-card flex flex-col justify-between bg-desk/60 p-6 lg:col-span-7">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-control border border-rule bg-paper text-pen">
                  <Sparkle size={20} weight="fill" aria-hidden="true" />
                </span>
                <span className="whitespace-nowrap rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink-2">
                  Cloudflare Workers AI
                </span>
              </div>
              <h3 className="mt-5 text-[1.15rem] font-bold leading-snug text-ink">
                1 chạm chấm điểm từng dòng, tối ưu theo JD &amp; Dịch Việt ↔ Anh
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">
                Dán mô tả công việc để AI phân tích điểm khớp ngữ nghĩa, gợi ý viết lại thành tích chuẩn ATS theo đúng ngôn ngữ HR hoặc dịch toàn bộ CV sang tiếng Anh.
              </p>
            </div>

            <div className="mt-5 grid gap-3 rounded-control border border-rule bg-paper p-3.5 sm:grid-cols-[5.5rem_1fr] sm:items-center">
              <div className="overflow-hidden rounded-[6px] border border-rule bg-desk">
                <img
                  src="/images/brand/ai-copilot-craft.jpg"
                  alt="Minh hoạ trợ lý AI Copilot phân tích và viết lại thành tích CV"
                  className="h-16 w-full object-cover"
                />
              </div>
              <div className="min-w-0 space-y-2" aria-hidden="true">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-pen">
                  <span>Điểm ATS &amp; JD Match</span>
                  <span className="rounded-full bg-mint-wash px-2 py-0.5 text-[0.68rem] font-extrabold tabular-nums text-mint">
                    64% → 94%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-desk">
                  <div className="h-full w-[94%] rounded-full bg-mint" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Số liệu thật', 'VI ↔ EN'].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-control border border-rule bg-desk px-2 py-0.5 text-[0.68rem] font-semibold text-ink-2"
                    >
                      <CheckCircle size={11} weight="fill" className="text-mint" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 2: Narrow (5 cols) */}
          <SpotlightCard as="article" className="elevated-card flex flex-col justify-between bg-desk/60 p-6 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-control border border-rule bg-paper text-pen">
                  <FileDoc size={20} weight="fill" aria-hidden="true" />
                </span>
                <span className="whitespace-nowrap rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink-2">
                  PDF + Word (.docx) + QR
                </span>
              </div>
              <h3 className="mt-5 text-[1.15rem] font-bold leading-snug text-ink">
                Xuất PDF sắc nét, Word (.docx) &amp; chèn mã QR động
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">
                Tải xuống PDF khổ A4/Letter giữ nguyên lớp chữ ATS không watermark, hoặc xuất file Word .docx theo yêu cầu doanh nghiệp.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-control border border-rule bg-paper p-3" aria-hidden="true">
              <span className="rounded-control bg-pen-wash px-2.5 py-1 text-xs font-bold text-pen">PDF A4 / Letter</span>
              <span className="rounded-control border border-rule bg-desk px-2.5 py-1 text-xs font-semibold text-ink-2">Word .docx</span>
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-mint">
                <QrCode size={16} weight="duotone" />
                QR Live
              </span>
            </div>
          </SpotlightCard>

          {/* Card 3: Narrow (5 cols) */}
          <SpotlightCard as="article" className="elevated-card flex flex-col justify-between bg-desk/60 p-6 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-control border border-rule bg-paper text-pen">
                  <Globe size={20} weight="fill" aria-hidden="true" />
                </span>
                <span className="whitespace-nowrap rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink-2">
                  Live Link &amp; Analytics
                </span>
              </div>
              <h3 className="mt-5 text-[1.15rem] font-bold leading-snug text-ink">
                Link CV Online riêng &amp; Biết ngay khi HR mở xem
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">
                Xuất bản hồ sơ thành trang web cá nhân verocv.vn/p/ten-ban có tuỳ chọn ẩn SĐT, khoá mã PIN, lưu vCard và gắn ?ref= theo từng công ty.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 rounded-control border border-rule bg-paper px-3 py-2.5 text-xs" aria-hidden="true">
              <span className="truncate font-semibold text-ink">verocv.vn/p/truc-ly?ref=fpt</span>
              <span className="shrink-0 rounded-full bg-mint-wash px-2 py-0.5 text-[0.68rem] font-extrabold tabular-nums text-mint">
                18 lượt xem
              </span>
            </div>
          </SpotlightCard>

          {/* Card 4: Wide (7 cols) */}
          <SpotlightCard as="article" className="elevated-card flex flex-col justify-between bg-desk/60 p-6 lg:col-span-7">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-control border border-rule bg-paper text-pen">
                  <Briefcase size={20} weight="fill" aria-hidden="true" />
                </span>
                <span className="whitespace-nowrap rounded-full border border-rule bg-paper px-3 py-1 text-xs font-semibold text-ink-2">
                  Job Clipper &amp; STAR Prep
                </span>
              </div>
              <h3 className="mt-5 text-[1.15rem] font-bold leading-snug text-ink">
                Kanban hút JD từ link &amp; Luyện phỏng vấn thực chiến STAR
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">
                Dán link tin tuyển dụng để tự động trích xuất vị trí, mức lương, lưu bản chụp JD và vào phòng luyện phỏng vấn AI Coach chấm điểm STAR sát hồ sơ của bạn.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-control border border-rule bg-paper p-3 text-xs" aria-hidden="true">
              <div className="rounded-control border border-rule bg-desk px-2.5 py-2">
                <p className="text-[0.66rem] font-bold uppercase text-ink-3">Đã lưu</p>
                <p className="mt-0.5 truncate font-semibold text-ink">Product Designer</p>
              </div>
              <div className="rounded-control border border-pen/30 bg-pen-wash/40 px-2.5 py-2">
                <p className="text-[0.66rem] font-bold uppercase text-pen">Đã nộp</p>
                <p className="mt-0.5 truncate font-semibold text-ink">Frontend Lead</p>
              </div>
              <div className="rounded-control border border-mint/40 bg-mint-wash/40 px-2.5 py-2">
                <p className="text-[0.66rem] font-bold uppercase text-mint">Phỏng vấn</p>
                <p className="mt-0.5 truncate font-semibold text-ink">AI Coach STAR</p>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  )
}
