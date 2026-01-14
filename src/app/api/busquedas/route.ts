import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const estado = searchParams.get('estado')
    const usuarioId = searchParams.get('usuarioId')

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (estado) where.estado = estado
    if (usuarioId) {
      where.cliente = { usuarioId }
    }

    const busquedas = await prisma.busqueda.findMany({
      where,
      include: {
        cliente: true,
        matchesPropiedades: { include: { propiedad: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(busquedas)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener búsquedas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      origen,
      presupuestoTexto,
      presupuestoValor,
      moneda,
      tipoPropiedad,
      ubicacionPreferida,
      dormitoriosMin,
      cochera,
      finalidad,
      observaciones,
      planillaRef,
    } = body

    if (!clienteId || !origen) {
      return NextResponse.json(
        { error: 'clienteId y origen son requeridos' },
        { status: 400 }
      )
    }

    const busqueda = await prisma.busqueda.create({
      data: {
        clienteId,
        origen,
        presupuestoTexto: presupuestoTexto || null,
        presupuestoValor: presupuestoValor || null,
        moneda: moneda || null,
        tipoPropiedad: tipoPropiedad || null,
        ubicacionPreferida: ubicacionPreferida || null,
        dormitoriosMin: dormitoriosMin || null,
        cochera: cochera || null,
        finalidad: finalidad || null,
        observaciones: observaciones || null,
        planillaRef: planillaRef || null,
      },
      include: { cliente: true },
    })

    return NextResponse.json(busqueda, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear búsqueda' },
      { status: 500 }
    )
  }
}
