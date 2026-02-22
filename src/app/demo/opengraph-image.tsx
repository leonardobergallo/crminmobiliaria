import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background:
            'linear-gradient(135deg, rgb(14,116,217) 0%, rgb(37,99,235) 55%, rgb(15,23,42) 100%)',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          padding: 56,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            width: 220,
            height: 220,
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 18,
                background: 'white',
                color: 'rgb(14,116,217)',
                fontWeight: 800,
                fontSize: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              IE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 22, opacity: 0.88 }}>Inmobiliar en Equipo</div>
              <div style={{ fontSize: 16, opacity: 0.78 }}>CRM Inmobiliario</div>
            </div>
          </div>

          <div style={{ marginTop: 52, fontSize: 68, fontWeight: 800, lineHeight: 1.02 }}>
            Demo Comercial
          </div>
          <div style={{ marginTop: 14, fontSize: 32, opacity: 0.92 }}>
            Dashboard + Busqueda inteligente + Gestion de cliente
          </div>

          <div
            style={{
              marginTop: 40,
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.12)',
              padding: '12px 18px',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            crminmobiliaria-neon.vercel.app/demo
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

