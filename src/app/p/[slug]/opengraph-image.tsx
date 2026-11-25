import { ImageResponse } from 'next/og'
import { BRAND } from '@/config/brand'
import { getSaasDb } from '@/server/db/store'
import { migrateToV2 } from '@/types/schema'

export const dynamic = 'force-dynamic'
export const alt = 'Hồ sơ CV trực tuyến trên VeroCV'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function PrivacySafeCard({ subtitle }: { subtitle: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: 'linear-gradient(135deg, #0a100f 0%, #0f1f1c 55%, #112b26 100%)',
          color: '#f3f7f5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#0c6a58',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            V
          </div>
          <span style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {BRAND.name}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '860px' }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'rgba(17, 130, 108, 0.28)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              color: '#a7f3d0',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            CV Trực tuyến · Chuẩn ATS
          </span>
          <div style={{ fontSize: '54px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.025em' }}>
            Hồ sơ trực tuyến trên {BRAND.name}
          </div>
          <div style={{ fontSize: '26px', color: '#c5d1cd', lineHeight: 1.4 }}>{subtitle}</div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.14)',
            paddingTop: '24px',
            fontSize: '22px',
            color: '#899b95',
          }}
        >
          <span>{BRAND.domain}</span>
          <span style={{ color: '#34d399', fontWeight: 700 }}>Xuất PDF A4 &amp; Word (.docx)</span>
        </div>
      </div>
    ),
    size,
  )
}

export default async function PublicCvOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const link = await getSaasDb().getPublicLink(slug)

  if (!link || !link.isActive) {
    return PrivacySafeCard({ subtitle: 'Tạo CV chuẩn ATS, tối ưu theo từng JD và chia sẻ Link trực tuyến.' })
  }

  if (link.passcodeHash) {
    return PrivacySafeCard({ subtitle: 'Hồ sơ này đang được bảo vệ bằng mã PIN riêng tư của ứng viên.' })
  }

  const doc = migrateToV2(JSON.parse(link.docSnapshotJson))
  const name = doc.data.name.trim() || doc.title || 'Ứng viên VeroCV'
  const role = doc.data.role.trim() || 'Hồ sơ ứng tuyển chuyên nghiệp'
  const skills = doc.data.skills.map((s) => s.trim()).filter(Boolean).slice(0, 5)
  const jobCount = doc.data.jobs.filter((j) => !j.hidden && (j.title.trim() || j.org.trim())).length
  const location = doc.data.location.trim()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: 'linear-gradient(135deg, #0a100f 0%, #0f1f1c 60%, #112b26 100%)',
          color: '#f3f7f5',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#0c6a58',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              V
            </div>
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {BRAND.name} · Chuẩn ATS
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'rgba(17, 130, 108, 0.28)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              color: '#34d399',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            {jobCount > 0 ? `${jobCount} kinh nghiệm nổi bật` : 'Hồ sơ sẵn sàng phỏng vấn'}
          </div>
        </div>

        {/* Main executive card content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ fontSize: '60px', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', color: '#ffffff' }}>
            {name}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: '#34d399', lineHeight: 1.25 }}>
            {role}
            {location ? ` · ${location}` : ''}
          </div>

          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
              {skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'rgba(17, 130, 108, 0.22)',
                    border: '1px solid rgba(52, 211, 153, 0.28)',
                    fontSize: '21px',
                    fontWeight: 600,
                    color: '#d1fae5',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.14)',
            paddingTop: '22px',
            fontSize: '21px',
            color: '#899b95',
          }}
        >
          <span>{`${BRAND.domain}/p/${slug}`}</span>
          <span style={{ color: '#c5d1cd', fontWeight: 600 }}>Xem CV A4 · Lưu vCard · Tải PDF / Word</span>
        </div>
      </div>
    ),
    size,
  )
}
