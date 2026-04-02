import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware that protects destructive actions from demo users.
 * Demo accounts can read everything but cannot create, update or delete data.
 * Works at the edge without Prisma — decodes the JWT payload directly.
 */

const DEMO_EMAILS = ['demo@inmobiliar.com', 'demo@misfinanzas.com']

// Routes where write operations are always allowed (even for demo)
const WRITE_ALLOWED_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/landing-consultas', // public contact form
  '/api/parsear-busqueda', // read-only parsing tool
  '/api/busqueda-avanzada', // read-only search (uses POST for complex body)
  '/api/export-properties', // read-only export
]

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { method, nextUrl } = request
  const pathname = nextUrl.pathname

  // Only intercept write methods on API routes
  if (!pathname.startsWith('/api')) return NextResponse.next()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return NextResponse.next()

  // Allow whitelisted routes
  if (WRITE_ALLOWED_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next()

  // Read JWT from cookie
  const token = request.cookies.get('auth-token')?.value
  if (!token) return NextResponse.next() // No token → let API route handle 401

  const payload = decodeJwtPayload(token)
  if (!payload) return NextResponse.next()

  const email = String(payload.email || '').toLowerCase()

  if (DEMO_EMAILS.includes(email)) {
    return NextResponse.json(
      {
        error:
          'Cuenta demo: esta acción no está disponible. Creá tu cuenta para usar todas las funciones.',
        isDemo: true,
      },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
