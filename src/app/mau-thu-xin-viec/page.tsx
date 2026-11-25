import type { Metadata } from 'next'
import { LetterTemplateCard } from '@/components/letter-template-card'
import { PageIntro } from '@/components/ui/page-intro'
import { LETTER_TEMPLATES } from '@/data/letter-templates'

export const metadata: Metadata = {
  title: 'Mẫu thư xin việc miễn phí',
  description: 'Mẫu thư xin việc tiếng Việt khổ A4, đi cùng mẫu CV. Điền nội dung rồi tải PDF không logo.',
}

export default function LetterTemplatesPage() {
  return (
    <>
      <PageIntro title={`${LETTER_TEMPLATES.length} mẫu thư xin việc miễn phí`}>
        <p>Chọn kiểu trình bày đồng bộ với CV của bạn, điền nội dung hoặc dùng AI soạn theo JD rồi tải PDF &amp; Word không logo.</p>
      </PageIntro>
      <div className="wrap pb-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {LETTER_TEMPLATES.map((t) => (
            <LetterTemplateCard key={t.slug} t={t} />
          ))}
        </div>
      </div>
    </>
  )
}
