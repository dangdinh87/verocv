'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

type Props = {
  /** Danh sách đã tải xong (cần biết đã chạm giới hạn gói miễn phí chưa). */
  ready: boolean
  onNew: () => void
}

/**
 * Mở hộp thoại "tạo mới" mỗi khi URL có `?new=1` (nút ở thanh bên, ⌘K, checklist), rồi xoá tham số.
 * Phải nghe theo useSearchParams chứ không đọc window.location một lần: bấm link khi đang đứng sẵn ở
 * cùng trang là điều hướng phía client, component không mount lại. Xoá tham số để lần bấm sau vẫn
 * đổi URL và kích hoạt tiếp.
 */
function NewParamListener({ ready, onNew }: Props) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isNew = params.get('new') === '1'
  const onNewRef = useRef(onNew)
  onNewRef.current = onNew

  useEffect(() => {
    if (!ready || !isNew) return
    onNewRef.current()
    router.replace(pathname, { scroll: false })
  }, [ready, isNew, router, pathname])

  return null
}

/** Suspense riêng để useSearchParams không kéo cả trang danh sách về render phía client. */
export function OpenOnNewParam(props: Props) {
  return (
    <Suspense fallback={null}>
      <NewParamListener {...props} />
    </Suspense>
  )
}
