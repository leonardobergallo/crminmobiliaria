import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

// PATCH: Actualizar respuesta del envío
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { respuesta, mensaje } = body

    const envio = await prisma.envioPropiedad.update({
      where: { id },
      data: {
        ...(respuesta && { respuesta }),
        ...(mensaje && { mensaje }),
      },
      include: {
        cliente: true,
        propiedad: true,
      },
    })

    return NextResponse.json(envio)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Envío no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar envío' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar registro de envío
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.envioPropiedad.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Envío no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar envío' },
      { status: 500 }
    )
  }
}
