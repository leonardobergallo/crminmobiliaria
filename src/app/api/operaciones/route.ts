import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const usuarioId = searchParams.get('usuarioId')

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (usuarioId) where.usuarioId = usuarioId

    const operaciones = await prisma.operacion.findMany({
      where,
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(operaciones)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener operaciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nro,
      clienteId,
      descripcion,
      precioReal,
      comisionTotal,
      totalComisionEquipo,
      comisionEquipoUnaPunta,
      comisionLeoDosPuntas,
      comisionLeoUnaPunta,
      fechaPagoAprox,
      observaciones,
    } = body

    if (!descripcion) {
      return NextResponse.json(
        { error: 'descripcion es requerida' },
        { status: 400 }
      )
    }

    const operacion = await prisma.operacion.create({
      data: {
        nro: nro || null,
        clienteId: clienteId || null,
        descripcion,
        precioReal: precioReal || null,
        comisionTotal: comisionTotal || null,
        totalComisionEquipo: totalComisionEquipo || null,
        comisionEquipoUnaPunta: comisionEquipoUnaPunta || null,
        comisionLeoDosPuntas: comisionLeoDosPuntas || null,
        comisionLeoUnaPunta: comisionLeoUnaPunta || null,
        fechaPagoAprox: fechaPagoAprox ? new Date(fechaPagoAprox) : null,
        observaciones: observaciones || null,
      },
      include: { cliente: true },
    })

    return NextResponse.json(operacion, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear operación' },
      { status: 500 }
    )
  }
}
