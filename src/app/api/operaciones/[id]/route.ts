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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const operacionActual = await prisma.operacion.findUnique({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        inmobiliariaId: true,
      },
    })

    if (!operacionActual) {
      return NextResponse.json({ error: 'Operacion no encontrada' }, { status: 404 })
    }

    const rol = normalizeRol((currentUser as any).rol)
    const isAgente = rol === 'AGENTE'
    const isAdmin = rol === 'ADMIN' || rol === 'SUPERADMIN'

    if (
      isAgente &&
      operacionActual.usuarioId &&
      operacionActual.usuarioId !== currentUser.id
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!isAdmin && !isAgente) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (
      rol !== 'SUPERADMIN' &&
      currentUser.inmobiliariaId &&
      operacionActual.inmobiliariaId &&
      operacionActual.inmobiliariaId !== currentUser.inmobiliariaId
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const venta = Number(body.precioVenta || 0)
    const tipoPunta = body.tipoPunta === 'DOS' ? 'DOS' : 'UNA'
    const porcentajeComision = tipoPunta === 'DOS' ? 6 : 3
    const comisionBruta = venta * (porcentajeComision / 100)

    const isCarli = isCarliEsquivelName((currentUser as any).nombre)
    const porcentajeAgenteBruto = isCarli ? 45 : 50
    const porcentajeAgente = isCarli
      ? Number((porcentajeAgenteBruto * 0.8).toFixed(2))
      : porcentajeAgenteBruto
    const comisionAgente = comisionBruta * (porcentajeAgente / 100)

    const operacion = await prisma.operacion.update({
      where: { id },
      data: {
        descripcion: body.descripcion,
        direccion: body.direccion || null,
        precioVenta: venta || null,
        tipoPunta,
        porcentajeComision,
        comisionBruta,
        porcentajeAgente,
        comisionAgente,
        estado: body.estado || 'PENDIENTE',
        clienteId: body.clienteId || null,
        observaciones: body.observaciones || null,
        fechaCobro:
          body.estado === 'COBRADA'
            ? new Date()
            : body.fechaCobro
            ? new Date(body.fechaCobro)
            : null,
      },
      include: {
        cliente: true,
        usuario: { select: { nombre: true } },
      },
    })

    return NextResponse.json(operacion)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Operacion no encontrada' },
        { status: 404 }
      )
    }

    console.error('Error PATCH /api/operaciones/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar operacion' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    const operacionActual = await prisma.operacion.findUnique({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        inmobiliariaId: true,
      },
    })

    if (!operacionActual) {
      return NextResponse.json({ error: 'Operacion no encontrada' }, { status: 404 })
    }

    const rol = normalizeRol((currentUser as any).rol)
    const isAgente = rol === 'AGENTE'
    const isAdmin = rol === 'ADMIN' || rol === 'SUPERADMIN'

    if (
      isAgente &&
      operacionActual.usuarioId &&
      operacionActual.usuarioId !== currentUser.id
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (!isAdmin && !isAgente) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (
      rol !== 'SUPERADMIN' &&
      currentUser.inmobiliariaId &&
      operacionActual.inmobiliariaId &&
      operacionActual.inmobiliariaId !== currentUser.inmobiliariaId
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.operacion.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Operacion no encontrada' },
        { status: 404 }
      )
    }

    console.error('Error DELETE /api/operaciones/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar operacion' },
      { status: 500 }
    )
  }
}


