'use client'

import { useEffect } from 'react'
import { BRAND } from '@/config/brand'

export default function GlobalError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string }
  retry?: () => void
  reset?: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f6f5f0',
          color: '#111917',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
        }}
      >
        <main
          style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e0d8',
            borderRadius: '12px',
            padding: '36px',
            boxShadow: '0 1px 2px rgba(17, 25, 23, 0.04), 0 14px 36px -14px rgba(12, 106, 88, 0.11)',
          }}
        >
          <title>{`Đã có lỗi xảy ra | ${BRAND.name}`}</title>
          <h1 style={{ margin: 0, fontSize: '28px', lineHeight: 1.15 }}>Đã có sự cố ngoài ý muốn</h1>
          <p style={{ marginTop: '14px', color: '#374440', lineHeight: 1.6 }}>
            Ứng dụng gặp lỗi khi hiển thị trang này. Dữ liệu hồ sơ lưu trên trình duyệt của bạn vẫn an toàn.
          </p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => (retry ?? reset)?.()}
              style={{
                height: '44px',
                padding: '0 20px',
                borderRadius: '8px',
                border: 0,
                background: '#0c6a58',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
            <a
              href="/cv"
              style={{
                height: '44px',
                padding: '0 20px',
                borderRadius: '8px',
                border: '1px solid #e2e0d8',
                background: '#f6f5f0',
                color: '#111917',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              Về danh sách CV
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
