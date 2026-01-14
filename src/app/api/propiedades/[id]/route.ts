import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
      include: {
        matches: { include: { busqueda: true } },
      },
    })

    if (!propiedad) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(propiedad)
  } catch (error) {
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
    const { id } = await params
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
    return NextResponse.json(
      { error: 'Error al eliminar propiedad' },
      { status: 500 }
    )
  }
}
