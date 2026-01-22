import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

// GET: Obtener envíos (filtrar por cliente o propiedad)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const propiedadId = searchParams.get('propiedadId')

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (propiedadId) where.propiedadId = propiedadId

    const envios = await prisma.envioPropiedad.findMany({
      where,
      include: {
        cliente: true,
        propiedad: true,
      },
      orderBy: { fechaEnvio: 'desc' },
    })

    return NextResponse.json(envios)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener envíos' },
      { status: 500 }
    )
  }
}

// POST: Registrar nuevo envío de propiedad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      propiedadId,
      urlExterna,
      tituloExterno,
      canal,
      mensaje,
    } = body

    if (!clienteId) {
      return NextResponse.json(
        { error: 'clienteId es requerido' },
        { status: 400 }
      )
    }

    if (!propiedadId && !urlExterna) {
      return NextResponse.json(
        { error: 'Debe especificar propiedadId o urlExterna' },
        { status: 400 }
      )
    }

    // Verificar si ya se envió esta propiedad a este cliente
    if (propiedadId) {
      const existente = await prisma.envioPropiedad.findFirst({
        where: { clienteId, propiedadId },
      })
      if (existente) {
        return NextResponse.json(
          { error: 'Esta propiedad ya fue enviada a este cliente', existente },
          { status: 409 }
        )
      }
    }

    const envio = await prisma.envioPropiedad.create({
      data: {
        clienteId,
        propiedadId: propiedadId || null,
        urlExterna: urlExterna || null,
        tituloExterno: tituloExterno || null,
        canal: canal || 'WHATSAPP',
        mensaje: mensaje || null,
      },
      include: {
        cliente: true,
        propiedad: true,
      },
    })

    return NextResponse.json(envio, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al crear envío' },
      { status: 500 }
    )
  }
}
