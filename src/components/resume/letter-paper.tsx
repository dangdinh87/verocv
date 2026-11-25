import type { CSSProperties } from 'react'
import { MINH_ANH } from './resume-data'
import { PAPER_RATIO } from './resume-paper'
import './resume-paper.css'
import './letter-paper.css'

export type LetterLayout = 'thang' | 'dai-mau' | 'giua' | 'le-trai'

export const LETTER_ACCENTS = {
  ink: { acc: '#00060c', on: '#ffffff' },
  pen: { acc: '#2448a8', on: '#ffffff' },
  kraft: { acc: '#d9bf94', on: '#00060c' },
} as const
export type LetterAccent = keyof typeof LETTER_ACCENTS

export type LetterData = {
  senderName: string
  senderRole: string
  senderLocation: string
  senderEmail: string
  senderPhone: string
  recipientTitle: string
  recipientCompany: string
  dateStr: string
  subject: string
  salutation?: string
  paragraphs: string[]
  signOff: string
  signatureText?: string
}

// Sample letter shown on template cards and the marketing pages (fictional person).
export const SAMPLE_LETTER: LetterData = {
  senderName: MINH_ANH.name,
  senderRole: MINH_ANH.role,
  senderLocation: MINH_ANH.location,
  senderEmail: MINH_ANH.email,
  senderPhone: MINH_ANH.phone,
  recipientTitle: 'Bộ phận Tuyển dụng',
  recipientCompany: 'Công ty Cổ phần Thiên Phú',
  dateStr: 'Hà Nội, ngày 12 tháng 3 năm 2026',
  subject: 'V/v: Ứng tuyển vị trí Trưởng nhóm Marketing',
  salutation: 'Kính gửi quý công ty,',
  paragraphs: [
    'Tôi viết thư này để ứng tuyển vị trí Trưởng nhóm Marketing tại Công ty Cổ phần Thiên Phú. Sau hơn 4 năm làm marketing cho ngành bán lẻ và thương mại điện tử, tôi muốn đảm nhận vai trò dẫn dắt một nhóm nhỏ và chịu trách nhiệm về kết quả chung.',
    'Ở vị trí hiện tại, tôi lập kế hoạch và triển khai 12 chiến dịch quảng cáo trả phí, giúp đơn hàng từ quảng cáo tăng 28% sau 9 tháng. Tôi cũng xây dựng bảng theo dõi chi phí mỗi đơn hàng theo tuần để cả đội cùng nhìn một bộ số liệu và kịp điều chỉnh.',
    'Tôi tin kinh nghiệm phối hợp giữa đội nội dung, thiết kế và bán hàng sẽ giúp tôi nhanh chóng hoà nhập với nhóm của quý công ty. Rất mong có cơ hội trao đổi thêm trong buổi phỏng vấn.',
  ],
  signOff: 'Trân trọng,',
}

const Sender = ({ data, interactive = false }: { data: LetterData; interactive?: boolean }) => {
  const email = data.senderEmail.trim()
  const phone = data.senderPhone.trim()
  const validEmail = interactive && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const phoneDigits = phone.replace(/[^\d+]/g, '')
  const validPhone = interactive && phoneDigits.length >= 7

  return (
    <>
      <p className="l-name">{data.senderName || <span className="ph">Họ và tên</span>}</p>
      <p className="l-role">{data.senderRole}</p>
      <p className="l-contact">
        {data.senderLocation}
        {data.senderLocation && (email || phone) && <br />}
        {email && (validEmail ? <a href={`mailto:${email}`}>{email}</a> : email)}
        {email && phone && ' | '}
        {phone && (validPhone ? <a href={`tel:${phoneDigits}`}>{phone}</a> : phone)}
      </p>
    </>
  )
}

const Body = ({ data }: { data: LetterData }) => {
  const greeting = data.salutation === undefined ? 'Kính gửi quý công ty,' : data.salutation.trim()
  return (
    <>
      <p className="l-date">{data.dateStr}</p>
      <p className="l-to">
        {data.recipientTitle && <>Kính gửi: {data.recipientTitle}</>}
        {data.recipientTitle && data.recipientCompany && <br />}
        {data.recipientCompany}
      </p>
      {data.subject && <p className="l-subject">{data.subject}</p>}
      <div className="l-body">
        {greeting && <p>{greeting}</p>}
        {data.paragraphs
          .filter((p) => p.trim())
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </div>
      <div className="l-sign-group">
        <p className="l-close">{data.signOff}</p>
        <p className="l-sign">{data.signatureText?.trim() || data.senderName}</p>
      </div>
    </>
  )
}

// Paints the 4.2em left stripe on every printed page for multi-page "le-trai" cover letters.
export function letterPrintBackdrop(layout: LetterLayout, accent: LetterAccent, customAccentColor?: string): string | undefined {
  if (layout !== 'le-trai') return undefined
  const acc = customAccentColor || (LETTER_ACCENTS[accent] ?? LETTER_ACCENTS.pen).acc
  const share = ((4.2 / 66) * 100).toFixed(3)
  return `linear-gradient(to right, ${acc} ${share}%, #ffffff ${share}%)`
}

export function LetterPaper({
  layout,
  accent,
  customAccentColor,
  fontFamily = 'sans',
  data = SAMPLE_LETTER,
  paperSize = 'a4',
  label,
  className = '',
  flow = false,
}: {
  layout: LetterLayout
  accent: LetterAccent
  customAccentColor?: string
  fontFamily?: 'sans' | 'serif' | 'jakarta' | 'lora'
  data?: LetterData
  paperSize?: 'a4' | 'letter'
  label?: string
  className?: string
  // flow: grows with its content (editor preview, print). Otherwise a clipped one-page thumbnail.
  flow?: boolean
}) {
  const preset = LETTER_ACCENTS[accent] ?? LETTER_ACCENTS.pen
  const acc = customAccentColor || preset.acc
  const on = customAccentColor ? '#ffffff' : preset.on
  const ratio = PAPER_RATIO[paperSize]
  const fontVar =
    fontFamily === 'serif'
      ? 'var(--font-serif)'
      : fontFamily === 'jakarta'
        ? 'var(--font-jakarta)'
        : fontFamily === 'lora'
          ? 'var(--font-lora)'
          : 'var(--font-sans)'
  const style = {
    fontFamily: fontVar,
    '--acc': acc,
    '--on-acc': on,
    '--page-ratio': ratio,
    ...(flow ? {} : { aspectRatio: `1 / ${ratio}` }),
  } as CSSProperties

  return (
    <div
      className={`cv-frame ${className}`}
      data-flow={flow || undefined}
      role={flow ? 'region' : 'img'}
      aria-label={label ?? 'Mẫu thư xin việc'}
    >
      <div className={`cv l l-${layout}`} style={style}>
        {layout === 'dai-mau' ? (
          <>
            <div className="band">
              <Sender data={data} interactive={flow} />
            </div>
            <div className="rest">
              <Body data={data} />
            </div>
          </>
        ) : layout === 'giua' || layout === 'thang' ? (
          <>
            <div className="head">
              <Sender data={data} interactive={flow} />
            </div>
            <Body data={data} />
          </>
        ) : (
          <>
            <Sender data={data} interactive={flow} />
            <Body data={data} />
          </>
        )}
      </div>
    </div>
  )
}
