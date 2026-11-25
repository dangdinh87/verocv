import type { Metadata } from 'next'
import { CvTemplateGallery } from '@/components/cv-template-gallery'
import { PageIntro } from '@/components/ui/page-intro'
import { CV_TEMPLATES } from '@/data/cv-templates'

export const metadata: Metadata = {
  title: 'Mẫu CV miễn phí chuẩn ATS',
  description:
    '12 mẫu CV khổ A4 chuẩn ATS bằng tiếng Việt và tiếng Anh cùng bộ CV theo ngành nghề. Chọn mẫu rồi điền thông tin, tải PDF không logo.',
}

export default function CvTemplatesPage() {
  return (
    <>
      <PageIntro title={`${CV_TEMPLATES.length} mẫu CV miễn phí chuẩn ATS`}>
        <p>
          Thử trực tiếp màu nhấn và ảnh chân dung mẫu trên cả {CV_TEMPLATES.length} bố cục, hoặc khởi tạo ngay từ bộ mẫu theo ngành nghề. Đổi mẫu bất cứ lúc nào, nội dung giữ nguyên.
        </p>
      </PageIntro>
      <div className="wrap pb-24">
        <CvTemplateGallery />
      </div>
    </>
  )
}
