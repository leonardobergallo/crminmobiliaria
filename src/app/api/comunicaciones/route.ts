import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

// GET: Obtener comunicaciones (filtrar por cliente)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const tipo = searchParams.get('tipo')
    const requiereSeguimiento = searchParams.get('requiereSeguimiento')

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (tipo) where.tipo = tipo
    if (requiereSeguimiento === 'true') where.requiereSeguimiento = true

    const comunicaciones = await prisma.comunicacion.findMany({
      where,
      include: {
        cliente: true,
      },
      orderBy: { fecha: 'desc' },
    })

    return NextResponse.json(comunicaciones)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener comunicaciones' },
      { status: 500 }
    )
  }
}

// POST: Registrar nueva comunicación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      tipo,
      direccion,
      resumen,
      detalle,
      resultado,
      requiereSeguimiento,
      fechaSeguimiento,
    } = body

    if (!clienteId || !resumen) {
      return NextResponse.json(
        { error: 'clienteId y resumen son requeridos' },
        { status: 400 }
      )
    }

    const comunicacion = await prisma.comunicacion.create({
      data: {
        clienteId,
        tipo: tipo || 'WHATSAPP',
        direccion: direccion || 'SALIENTE',
        resumen,
        detalle: detalle || null,
        resultado: resultado || null,
        requiereSeguimiento: requiereSeguimiento || false,
        fechaSeguimiento: fechaSeguimiento ? new Date(fechaSeguimiento) : null,
      },
      include: {
        cliente: true,
      },
    })

    return NextResponse.json(comunicacion, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al crear comunicación' },
      { status: 500 }
    )
  }
}
