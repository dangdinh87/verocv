'use client'

import {
  Article,
  Certificate,
  FolderStar,
  Heart,
  IdentificationBadge,
  PlusSquare,
  Trophy,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr'
import type { ComponentType } from 'react'
import type { CustomSectionKind } from '@/components/resume/resume-data'
import { Modal } from '@/components/ui/modal'

export type ContentBlockPreset = {
  kind: CustomSectionKind
  titleVi: string
  titleEn: string
  description: string
  Icon: ComponentType<{ size?: number; weight?: 'regular' | 'bold' | 'fill'; className?: string }>
}

export const CONTENT_PRESETS: ContentBlockPreset[] = [
  {
    kind: 'projects',
    titleVi: 'Dự án tiêu biểu',
    titleEn: 'Projects',
    description: 'Sản phẩm thực tế, đồ án hoặc dự án cá nhân kèm công nghệ và kết quả.',
    Icon: FolderStar,
  },
  {
    kind: 'certificates',
    titleVi: 'Chứng chỉ',
    titleEn: 'Certificates',
    description: 'Chứng chỉ chuyên môn, ngoại ngữ, khoá đào tạo hoặc giấy phép.',
    Icon: Certificate,
  },
  {
    kind: 'awards',
    titleVi: 'Giải thưởng & Thành tích',
    titleEn: 'Awards',
    description: 'Học bổng, danh hiệu nhân viên xuất sắc hoặc giải thưởng cuộc thi.',
    Icon: Trophy,
  },
  {
    kind: 'activities',
    titleVi: 'Hoạt động & Tổ chức',
    titleEn: 'Organizations & Activities',
    description: 'Câu lạc bộ, hoạt động tình nguyện, vai trò điều phối cộng đồng.',
    Icon: UsersThree,
  },
  {
    kind: 'publications',
    titleVi: 'Công trình & Xuất bản',
    titleEn: 'Publications',
    description: 'Bài báo khoa học, sách, blog kỹ thuật hoặc bài diễn thuyết.',
    Icon: Article,
  },
  {
    kind: 'references',
    titleVi: 'Người tham chiếu',
    titleEn: 'References',
    description: 'Quản lý trực tiếp hoặc giảng viên có thể xác nhận năng lực của bạn.',
    Icon: IdentificationBadge,
  },
  {
    kind: 'interests',
    titleVi: 'Sở thích',
    titleEn: 'Interests',
    description: 'Môn thể thao, thói quen đọc sách hoặc mối quan tâm cá nhân.',
    Icon: Heart,
  },
  {
    kind: 'custom',
    titleVi: 'Mục tự đặt tên',
    titleEn: 'Custom Section',
    description: 'Tự đặt tiêu đề và cấu trúc nội dung phù hợp riêng với ngành của bạn.',
    Icon: PlusSquare,
  },
]

export function AddContentModal({
  open,
  lang = 'vi',
  onClose,
  onSelectPreset,
}: {
  open: boolean
  lang?: 'vi' | 'en'
  onClose: () => void
  onSelectPreset: (preset: ContentBlockPreset) => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm mục nội dung vào CV"
      description="Chọn loại thông tin bạn muốn bổ sung. Mọi mục mới đều có thể kéo đổi vị trí hoặc ẩn/hiện tuỳ ý."
      size="lg"
    >
      <ul className="grid gap-3 p-0 sm:grid-cols-2">
        {CONTENT_PRESETS.map((preset) => {
          const Icon = preset.Icon
          return (
            <li key={preset.kind} className="list-none">
              <button
                type="button"
                onClick={() => {
                  onSelectPreset(preset)
                  onClose()
                }}
                className="flex h-full w-full cursor-pointer items-start gap-3.5 rounded-control border border-rule bg-paper p-4 text-left transition-colors hover:border-pen hover:bg-pen-wash/25"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-rule bg-desk text-pen">
                  <Icon size={21} weight="bold" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{lang === 'en' ? preset.titleEn : preset.titleVi}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-ink-2">{preset.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
