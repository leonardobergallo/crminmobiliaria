import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'
import { canViewPropiedad } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          }
        },
        inmobiliaria: {
          select: {
            id: true,
            nombre: true,
            email: true,
            whatsapp: true,
            slug: true,
          }
        },
        matches: { include: { busqueda: true } },
      },
    })

    if (!propiedad) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (!canViewPropiedad(currentUser, propiedad)) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta propiedad' },
        { status: 403 }
      )
    }

    return NextResponse.json(propiedad)
  } catch (error) {
    console.error('Error al obtener propiedad:', error)
    return NextResponse.json(
      { error: 'Error al obtener propiedad' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const propiedad = await prisma.propiedad.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(propiedad)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar propiedad' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Obtener propiedad para validar permisos
    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
    })

    if (!propiedad) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // Solo admin puede eliminar, o el agente que la creó (solo si está en BORRADOR)
    const canDelete = currentUser.rol === 'admin' || 
                      (propiedad.usuarioId === currentUser.id && propiedad.estado === 'BORRADOR')

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta propiedad' },
        { status: 403 }
      )
    }

    await prisma.propiedad.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }
    console.error('Error al eliminar propiedad:', error)
    return NextResponse.json(
      { error: 'Error al eliminar propiedad' },
      { status: 500 }
    )
  }
}
