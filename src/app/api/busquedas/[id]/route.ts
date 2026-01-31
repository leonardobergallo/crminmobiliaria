import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'
import { canViewBusqueda } from '@/lib/permissions'

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
    const busqueda = await prisma.busqueda.findUnique({
      where: { id },
      include: {
        cliente: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          }
        },
        matchesPropiedades: { include: { propiedad: true } },
        tareas: true,
      },
    })

    if (!busqueda) {
      return NextResponse.json(
        { error: 'Búsqueda no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (!canViewBusqueda(currentUser, busqueda)) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta búsqueda' },
        { status: 403 }
      )
    }

    return NextResponse.json(busqueda)
  } catch (error) {
    console.error('Error al obtener búsqueda:', error)
    return NextResponse.json(
      { error: 'Error al obtener búsqueda' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const body = await request.json()

    // Obtener búsqueda existente para validar permisos
    const busquedaExistente = await prisma.busqueda.findUnique({
      where: { id },
      include: {
        cliente: true,
      },
    })

    if (!busquedaExistente) {
      return NextResponse.json(
        { error: 'Búsqueda no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos de edición
    const canEdit = currentUser.rol === 'admin' || 
                    busquedaExistente.createdBy === currentUser.id ||
                    busquedaExistente.cliente?.usuarioId === currentUser.id

    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta búsqueda' },
        { status: 403 }
      )
    }

    // Si se intenta cambiar el estado y no es admin, rechazar
    if (body.estado && body.estado !== busquedaExistente.estado && currentUser.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Solo el administrador puede cambiar el estado de la búsqueda' },
        { status: 403 }
      )
    }

    const busqueda = await prisma.busqueda.update({
      where: { id },
      data: {
        ...body,
      },
      include: {
        cliente: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          }
        },
        matchesPropiedades: { include: { propiedad: true } },
      },
    })

    return NextResponse.json(busqueda)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Búsqueda no encontrada' },
        { status: 404 }
      )
    }
    console.error('Error al actualizar búsqueda:', error)
    return NextResponse.json(
      { error: 'Error al actualizar búsqueda' },
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

    // Obtener búsqueda para validar permisos
    const busqueda = await prisma.busqueda.findUnique({
      where: { id },
      include: {
        cliente: true,
      },
    })

    if (!busqueda) {
      return NextResponse.json(
        { error: 'Búsqueda no encontrada' },
        { status: 404 }
      )
    }

    // Solo admin puede eliminar, o el agente que la creó
    const canDelete = currentUser.rol === 'admin' || 
                      busqueda.createdBy === currentUser.id

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta búsqueda' },
        { status: 403 }
      )
    }

    await prisma.busqueda.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Búsqueda no encontrada' },
        { status: 404 }
      )
    }
    console.error('Error al eliminar búsqueda:', error)
    return NextResponse.json(
      { error: 'Error al eliminar búsqueda' },
      { status: 500 }
    )
  }
}
