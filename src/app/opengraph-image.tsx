import { ImageResponse } from 'next/og'

export const alt = 'VeroCV - AI Resume Studio, ATS Matcher & Live Recruiter Analytics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#f6f5f0',
        padding: '64px 76px',
        color: '#1c1e22',
        borderBottom: '12px solid #2448a8',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg width="52" height="52" viewBox="0 0 32 32">
            <path d="M8 2h13.5L30 10.5V24a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z" fill="#2448a8" />
            <path d="M21.5 2v6.5A2 2 0 0 0 23.5 10.5H30L21.5 2Z" fill="#dfd1b8" />
            <path
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.5 12.5 15.2 22.8 22 11.5"
            />
            <circle cx="15.2" cy="14" r="1.4" fill="#8fa9f0" />
          </svg>
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Vero<span style={{ color: '#2448a8' }}>CV</span>
          </span>
        </div>

        <div
          style={{
            marginTop: '34px',
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>AI Resume Studio.</span>
          <span style={{ color: '#2448a8' }}>Built to Get Hired.</span>
        </div>

        <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
          {['AI JD Tailor', 'PDF & DOCX Export', 'Live Link Analytics'].map((badge) => (
            <div
              key={badge}
              style={{
                display: 'flex',
                padding: '10px 18px',
                borderRadius: '999px',
                border: '2px solid #e3dccf',
                background: '#ffffff',
                fontSize: 20,
                fontWeight: 600,
                color: '#374440',
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          width: '410px',
          height: '470px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '2px solid #e3dccf',
            borderRadius: '16px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            height: '390px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '180px', height: '18px', background: '#1c1e22', borderRadius: '4px' }} />
              <div style={{ marginTop: '10px', width: '120px', height: '10px', background: '#2448a8', borderRadius: '4px' }} />
            </div>
            <div
              style={{
                background: '#daf5ed',
                color: '#0e8a6d',
                padding: '8px 14px',
                borderRadius: '999px',
                fontSize: 18,
                fontWeight: 800,
                display: 'flex',
              }}
            >
              94% ATS Match
            </div>
          </div>
          <div style={{ marginTop: '24px', width: '100%', height: '2px', background: '#e3dccf', display: 'flex' }} />
          <div style={{ marginTop: '20px', width: '92%', height: '11px', background: '#c8c3b8', borderRadius: '4px', display: 'flex' }} />
          <div style={{ marginTop: '12px', width: '80%', height: '11px', background: '#c8c3b8', borderRadius: '4px', display: 'flex' }} />
          <div style={{ marginTop: '12px', width: '86%', height: '11px', background: '#c8c3b8', borderRadius: '4px', display: 'flex' }} />
          <div style={{ marginTop: '28px', width: '40%', height: '12px', background: '#2448a8', borderRadius: '4px', display: 'flex' }} />
          <div style={{ marginTop: '12px', width: '90%', height: '10px', background: '#e3dccf', borderRadius: '4px', display: 'flex' }} />
          <div style={{ marginTop: '10px', width: '75%', height: '10px', background: '#e3dccf', borderRadius: '4px', display: 'flex' }} />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '-22px',
            background: '#1c1e22',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #2448a8',
          }}
        >
          <span style={{ fontSize: 14, color: '#8fa9f0', fontWeight: 700 }}>LIVE ANALYTICS · verocv.vn/p/quoc-huy</span>
          <span style={{ fontSize: 18, fontWeight: 600, marginTop: '4px' }}>HR vừa mở xem &amp; tải PDF</span>
        </div>
      </div>
    </div>,
    { ...size },
  )
}
