import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const usuarioId = searchParams.get('usuarioId')

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (usuarioId) where.usuarioId = usuarioId

    // Filtrar por inmobiliaria
    if (currentUser.rol !== 'SUPERADMIN' && currentUser.inmobiliariaId) {
      where.inmobiliariaId = currentUser.inmobiliariaId
    }

    // Si es agente, solo ver sus propias operaciones
    if (currentUser.rol === 'AGENTE') {
      where.usuarioId = currentUser.id
    }

    const operaciones = await prisma.operacion.findMany({
      where,
      include: { 
        cliente: true,
        usuario: { select: { nombre: true } }
      },
      orderBy: { fechaOperacion: 'desc' },
    })

    return NextResponse.json(operaciones)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener operaciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      descripcion,
      direccion,
      precioVenta,
      tipoPunta,
      porcentajeComision,
      comisionBruta,
      porcentajeAgente,
      comisionAgente,
      clienteId,
      observaciones,
    } = body

    if (!descripcion) {
      return NextResponse.json(
        { error: 'descripcion es requerida' },
        { status: 400 }
      )
    }

    // Obtener el próximo número de operación para esta inmobiliaria
    const lastOp = await prisma.operacion.findFirst({
      where: { inmobiliariaId: currentUser.inmobiliariaId },
      orderBy: { nro: 'desc' },
      select: { nro: true }
    })
    const nextNro = (lastOp?.nro || 0) + 1

    const operacion = await prisma.operacion.create({
      data: {
        nro: nextNro,
        descripcion,
        direccion: direccion || null,
        precioVenta: precioVenta || null,
        tipoPunta: tipoPunta || 'UNA',
        porcentajeComision: porcentajeComision || null,
        comisionBruta: comisionBruta || null,
        porcentajeAgente: porcentajeAgente || null,
        comisionAgente: comisionAgente || null,
        clienteId: clienteId || null,
        usuarioId: currentUser.id,
        inmobiliariaId: currentUser.inmobiliariaId,
        observaciones: observaciones || null,
        estado: 'PENDIENTE',
        fechaOperacion: new Date(),
      },
      include: { 
        cliente: true,
        usuario: { select: { nombre: true } }
      },
    })

    return NextResponse.json(operacion, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al crear operación' },
      { status: 500 }
    )
  }
}
