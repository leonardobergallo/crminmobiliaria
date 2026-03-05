import type { Metadata } from 'next'
import LandingPage from '@/app/landing/page'

const DEMO_URL = 'https://crminmobiliaria-neon.vercel.app/demo'

export const metadata: Metadata = {
  title: 'Demo | Inmobiliaria en Equipo',
  description:
    'Demo comercial de Inmobiliaria en Equipo: dashboard, gestion de clientes, busqueda inteligente y seguimiento operativo.',
  alternates: {
    canonical: DEMO_URL,
  },
  openGraph: {
    title: 'Demo Inmobiliaria en Equipo',
    description:
      'Mira la demo de Inmobiliaria en Equipo y recorre el flujo comercial completo.',
    url: DEMO_URL,
    siteName: 'Inmobiliaria en Equipo',
    type: 'website',
    images: [
      {
        url: '/demo/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Demo Inmobiliaria en Equipo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demo Inmobiliaria en Equipo',
    description:
      'Demo comercial lista para compartir por WhatsApp y redes.',
    images: ['/demo/opengraph-image'],
  },
}

export default function DemoPage() {
  return <LandingPage />
}

