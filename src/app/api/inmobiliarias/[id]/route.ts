import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/inmobiliarias/[id] - Obtener una inmobiliaria
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar acceso
    if (currentUser.rol !== 'superadmin' && currentUser.inmobiliariaId !== id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const inmobiliaria = await prisma.inmobiliaria.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: { id: true, nombre: true, email: true, rol: true, activo: true }
        },
        _count: {
          select: {
            clientes: true,
            propiedades: true,
            operaciones: true,
          }
        }
      }
    })

    if (!inmobiliaria) {
      return NextResponse.json({ error: 'Inmobiliaria no encontrada' }, { status: 404 })
    }

    return NextResponse.json(inmobiliaria)
  } catch (error) {
    console.error('Error obteniendo inmobiliaria:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT /api/inmobiliarias/[id] - Actualizar inmobiliaria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Solo superadmin o admin de esa inmobiliaria puede editar
    if (currentUser.rol !== 'superadmin') {
      if (currentUser.rol !== 'admin' || currentUser.inmobiliariaId !== id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { nombre, logo, whatsapp, email, direccion, colorPrimario, activa } = body

    const inmobiliaria = await prisma.inmobiliaria.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(logo !== undefined && { logo }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(email !== undefined && { email }),
        ...(direccion !== undefined && { direccion }),
        ...(colorPrimario !== undefined && { colorPrimario }),
        ...(activa !== undefined && { activa }),
      }
    })

    return NextResponse.json(inmobiliaria)
  } catch (error) {
    console.error('Error actualizando inmobiliaria:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE /api/inmobiliarias/[id] - Eliminar inmobiliaria (solo superadmin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (currentUser.rol !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params

    // Verificar que existe
    const inmobiliaria = await prisma.inmobiliaria.findUnique({ where: { id } })
    if (!inmobiliaria) {
      return NextResponse.json({ error: 'Inmobiliaria no encontrada' }, { status: 404 })
    }

    // Desactivar en lugar de eliminar (para preservar historial)
    await prisma.inmobiliaria.update({
      where: { id },
      data: { activa: false }
    })

    return NextResponse.json({ message: 'Inmobiliaria desactivada' })
  } catch (error) {
    console.error('Error eliminando inmobiliaria:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
