import { ResumePaper } from '@/components/resume/resume-paper'

// The one memorable thing on the site: a kraft application folder. The label is "written" in ballpoint,
// the CV rises out of it, and a stamp lands. Pure CSS (see globals.css); static when motion is reduced.
export function HeroFolder() {
  return (
    <div
      className="relative mx-auto aspect-[5/4.3] w-full max-w-[34rem] overflow-hidden"
      role="img"
      aria-label="Minh hoạ: một bìa hồ sơ giấy kraft, bên trong là CV của Nguyễn Minh Anh đã điền xong"
    >
      <div className="absolute left-[4%] top-0 h-[10%] w-[34%] rounded-t-2xl bg-kraft-deep" />
      <div className="absolute inset-x-0 top-[6%] bottom-0 rounded-2xl bg-kraft-deep" />

      <div className="hero-rise absolute inset-x-[10%] top-[5%] overflow-hidden rounded-sheet border border-rule">
        <ResumePaper layout="bia-kraft" label="CV mẫu của Nguyễn Minh Anh" />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[49%] rounded-2xl border-t-[3px] border-kraft-deep bg-kraft" />

      <div className="absolute left-[6%] top-[58%] w-[60%] -rotate-2 rounded-[3px] bg-paper p-[clamp(0.6rem,2.2vw,1rem)]">
        <p className="text-[0.7rem] font-medium text-ink-3">Họ và tên</p>
        <p className="field-line font-hand text-[clamp(1.1rem,4vw,1.55rem)] leading-tight text-pen">
          <span className="hero-write inline-block" style={{ '--d': '0.3s' } as React.CSSProperties}>
            Nguyễn Minh Anh
          </span>
        </p>
        <p className="mt-2.5 text-[0.7rem] font-medium text-ink-3">Vị trí ứng tuyển</p>
        <p className="field-line font-hand text-[clamp(1.1rem,4vw,1.55rem)] leading-tight text-pen">
          <span className="hero-write inline-block" style={{ '--d': '1.05s' } as React.CSSProperties}>
            Chuyên viên Marketing
          </span>
        </p>
      </div>

      <div className="hero-stamp absolute right-[7%] top-[61%] grid size-[clamp(4.6rem,16vw,6.2rem)] -rotate-[14deg] place-items-center rounded-full border-[3px] border-seal text-center text-[clamp(0.7rem,2.3vw,0.9rem)] font-extrabold leading-tight text-seal">
        SẴN
        <br />
        SÀNG
      </div>
    </div>
  )
}
