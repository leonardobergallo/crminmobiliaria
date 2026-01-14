import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const busqueda = await prisma.busqueda.findUnique({
      where: { id },
      include: {
        cliente: true,
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

    return NextResponse.json(busqueda)
  } catch (error) {
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
    const { id } = await params
    const body = await request.json()

    const busqueda = await prisma.busqueda.update({
      where: { id },
      data: {
        ...body,
      },
      include: {
        cliente: true,
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
    const { id } = await params
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
    return NextResponse.json(
      { error: 'Error al eliminar búsqueda' },
      { status: 500 }
    )
  }
}
