import { Sparkle } from '@phosphor-icons/react/dist/ssr'

/**
 * Avatar của người phỏng vấn ảo. Cố ý KHÔNG dùng ảnh chân dung người thật: người dùng phải biết
 * ngay đây là AI chấm điểm, không phải một nhà tuyển dụng có thật.
 */
export function AiCoachAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = { sm: 'size-6', md: 'size-12', lg: 'size-16' }[size]
  const icon = { sm: 12, md: 20, lg: 26 }[size]
  return (
    <span className={`grid shrink-0 place-items-center rounded-full border border-pen/25 bg-pen-wash text-pen ${box}`} aria-hidden="true">
      <Sparkle size={icon} weight="fill" />
    </span>
  )
}
