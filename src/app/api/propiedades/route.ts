import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const localidad = searchParams.get('localidad')
    const aptaCredito = searchParams.get('aptaCredito')
    const usuarioId = searchParams.get('usuarioId')

    const where: any = {}
    if (localidad) where.localidad = localidad
    if (aptaCredito === 'true') where.aptaCredito = true
    if (usuarioId) where.usuarioId = usuarioId

    const propiedades = await prisma.propiedad.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(propiedades)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener propiedades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tipo,
      ubicacion,
      localidad,
      precio,
      moneda,
      descripcion,
      dormitorios,
      ambientes,
      banos,
      superficie,
      whatsapp,
      urlMls,
      fuente,
      aptaCredito,
      usuarioId,
    } = body

    if (!tipo || !ubicacion) {
      return NextResponse.json(
        { error: 'tipo y ubicacion son requeridos' },
        { status: 400 }
      )
    }

    const propiedad = await prisma.propiedad.create({
      data: {
        tipo,
        ubicacion,
        localidad: localidad || null,
        precio: precio || null,
        moneda: moneda || null,
        descripcion: descripcion || null,
        dormitorios: dormitorios || null,
        ambientes: ambientes || null,
        banos: banos || null,
        superficie: superficie || null,
        whatsapp: whatsapp || null,
        urlMls: urlMls || null,
        fuente: fuente || null,
        aptaCredito: aptaCredito || false,
        usuarioId: usuarioId || null,
      },
    })

    return NextResponse.json(propiedad, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear propiedad' },
      { status: 500 }
    )
  }
}
