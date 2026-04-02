import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { demoGuard, getCurrentUser } from '@/lib/auth'

function buildManualLinkWhereForUser(id: string, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.rol === 'superadmin') {
    return { id }
  }

  if (user.rol === 'admin' && user.inmobiliariaId) {
    return {
      id,
      busqueda: {
        cliente: {
          inmobiliariaId: user.inmobiliariaId,
        },
      },
    }
  }

  if (user.inmobiliariaId) {
    return {
      id,
      AND: [
        {
          busqueda: {
            cliente: {
              inmobiliariaId: user.inmobiliariaId,
            },
          },
        },
        {
          OR: [
            { createdBy: user.id },
            { cliente: { usuarioId: user.id } },
            { busqueda: { createdBy: user.id } },
          ],
        },
      ],
    }
  }

  return { id, createdBy: user.id }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const blocked = demoGuard(currentUser)
    if (blocked) return blocked

    const { id } = await context.params
    const body = await request.json()

    const item = await prisma.manualLink.findFirst({
      where: buildManualLinkWhereForUser(id, currentUser) as any,
    })

    if (!item) {
      return NextResponse.json({ error: 'Manual link no encontrado' }, { status: 404 })
    }

    const allowedEstado = ['NUEVO', 'SELECCIONADO', 'DESCARTADO', 'ENVIADO']
    const nextEstado = String(body.estado || '').toUpperCase()

    const updated = await prisma.manualLink.update({
      where: { id: item.id },
      data: {
        estado: allowedEstado.includes(nextEstado) ? nextEstado : item.estado,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error al actualizar manual link:', error)
    return NextResponse.json({ error: 'Error al actualizar manual link' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const blocked = demoGuard(currentUser)
    if (blocked) return blocked

    const { id } = await context.params

    const item = await prisma.manualLink.findFirst({
      where: buildManualLinkWhereForUser(id, currentUser) as any,
    })

    if (!item) {
      return NextResponse.json({ error: 'Manual link no encontrado' }, { status: 404 })
    }

    await prisma.manualLink.delete({
      where: { id: item.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar manual link:', error)
    return NextResponse.json({ error: 'Error al eliminar manual link' }, { status: 500 })
  }
}
