import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

function normalizeRol(rol?: string | null) {
  return String(rol || '').toUpperCase()
}

function isCarliEsquivelName(name?: string | null) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes('carli')
}

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

    const rol = normalizeRol((currentUser as any).rol)

    if (rol !== 'SUPERADMIN' && currentUser.inmobiliariaId) {
      where.inmobiliariaId = currentUser.inmobiliariaId
    }

    if (rol === 'AGENTE') {
      where.usuarioId = currentUser.id
    }

    const operaciones = await prisma.operacion.findMany({
      where,
      include: {
        cliente: true,
        usuario: { select: { nombre: true } },
      },
      orderBy: { fechaOperacion: 'desc' },
    })

    return NextResponse.json(operaciones)
  } catch (error) {
    console.error('Error GET /api/operaciones:', error)
    return NextResponse.json({ error: 'Error al obtener operaciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { descripcion, direccion, precioVenta, tipoPunta, clienteId, observaciones } = body

    if (!descripcion) {
      return NextResponse.json({ error: 'descripcion es requerida' }, { status: 400 })
    }

    const lastOp = await prisma.operacion.findFirst({
      where: { inmobiliariaId: currentUser.inmobiliariaId },
      orderBy: { nro: 'desc' },
      select: { nro: true },
    })
    const nextNro = (lastOp?.nro || 0) + 1

    const venta = Number(precioVenta || 0)
    const tipoPuntaCalc = tipoPunta === 'DOS' ? 'DOS' : 'UNA'
    const porcentajeComisionCalc = tipoPuntaCalc === 'DOS' ? 6 : 3
    const comisionBrutaCalc = venta * (porcentajeComisionCalc / 100)

    const isCarli = isCarliEsquivelName((currentUser as any)?.nombre)
    const porcentajeAgenteBruto = isCarli ? 45 : 50
    const porcentajeAgenteCalc = isCarli
      ? Number((porcentajeAgenteBruto * 0.8).toFixed(2))
      : porcentajeAgenteBruto
    const comisionAgenteCalc = comisionBrutaCalc * (porcentajeAgenteCalc / 100)

    const operacion = await prisma.operacion.create({
      data: {
        nro: nextNro,
        descripcion,
        direccion: direccion || null,
        precioVenta: venta || null,
        tipoPunta: tipoPuntaCalc,
        porcentajeComision: porcentajeComisionCalc,
        comisionBruta: comisionBrutaCalc,
        porcentajeAgente: porcentajeAgenteCalc,
        comisionAgente: comisionAgenteCalc,
        clienteId: clienteId || null,
        usuarioId: currentUser.id,
        inmobiliariaId: currentUser.inmobiliariaId,
        observaciones: observaciones || null,
        estado: 'PENDIENTE',
        fechaOperacion: new Date(),
      },
      include: {
        cliente: true,
        usuario: { select: { nombre: true } },
      },
    })

    return NextResponse.json(operacion, { status: 201 })
  } catch (error) {
    console.error('Error POST /api/operaciones:', error)
    return NextResponse.json({ error: 'Error al crear operacion' }, { status: 500 })
  }
}


