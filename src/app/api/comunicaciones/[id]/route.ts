import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

// PATCH: Actualizar comunicación
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const comunicacion = await prisma.comunicacion.update({
      where: { id },
      data: {
        ...body,
        fechaSeguimiento: body.fechaSeguimiento 
          ? new Date(body.fechaSeguimiento) 
          : undefined,
      },
      include: { cliente: true },
    })

    return NextResponse.json(comunicacion)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Comunicación no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar comunicación' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar comunicación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.comunicacion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Comunicación no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar comunicación' },
      { status: 500 }
    )
  }
}
