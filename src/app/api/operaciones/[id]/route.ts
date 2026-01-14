import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const operacion = await prisma.operacion.update({
      where: { id },
      data: {
        ...body,
        fechaPagoAprox: body.fechaPagoAprox
          ? new Date(body.fechaPagoAprox)
          : undefined,
      },
      include: { cliente: true },
    })

    return NextResponse.json(operacion)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Operación no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar operación' },
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
    await prisma.operacion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Operación no encontrada' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar operación' },
      { status: 500 }
    )
  }
}
