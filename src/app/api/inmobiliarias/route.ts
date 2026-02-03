import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/inmobiliarias - Listar inmobiliarias
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Superadmin ve todas, otros solo la suya
    let where = {}
    if (currentUser.rol !== 'superadmin') {
      if (currentUser.inmobiliariaId) {
        where = { id: currentUser.inmobiliariaId }
      } else {
        return NextResponse.json([])
      }
    }

    const inmobiliarias = await prisma.inmobiliaria.findMany({
      where,
      include: {
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            propiedades: true,
            operaciones: true,
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json(inmobiliarias)
  } catch (error) {
    console.error('Error obteniendo inmobiliarias:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST /api/inmobiliarias - Crear inmobiliaria (solo superadmin)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (currentUser.rol !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, slug, logo, whatsapp, email, direccion, colorPrimario } = body

    if (!nombre || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
    }

    // Verificar que el slug sea único
    const existente = await prisma.inmobiliaria.findUnique({ where: { slug } })
    if (existente) {
      return NextResponse.json({ error: 'Ya existe una inmobiliaria con ese slug' }, { status: 400 })
    }

    const inmobiliaria = await prisma.inmobiliaria.create({
      data: {
        nombre,
        slug,
        logo,
        whatsapp,
        email,
        direccion,
        colorPrimario,
      }
    })

    return NextResponse.json(inmobiliaria, { status: 201 })
  } catch (error) {
    console.error('Error creando inmobiliaria:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
