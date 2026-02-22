import type { Metadata } from 'next'
import LandingPage from '@/app/landing/page'

const DEMO_URL = 'https://crminmobiliaria-neon.vercel.app/demo'

export const metadata: Metadata = {
  title: 'Demo CRM Inmobiliario | Inmobiliar en Equipo',
  description:
    'Demo comercial del CRM inmobiliario: dashboard, gestion de clientes, busqueda inteligente y seguimiento operativo.',
  alternates: {
    canonical: DEMO_URL,
  },
  openGraph: {
    title: 'Demo CRM Inmobiliario',
    description:
      'Mira la demo del CRM inmobiliario y recorre el flujo comercial completo.',
    url: DEMO_URL,
    siteName: 'Inmobiliar en Equipo',
    type: 'website',
    images: [
      {
        url: '/demo/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Demo CRM Inmobiliario',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demo CRM Inmobiliario',
    description:
      'Demo comercial lista para compartir por WhatsApp y redes.',
    images: ['/demo/opengraph-image'],
  },
}

export default function DemoPage() {
  return <LandingPage />
}

