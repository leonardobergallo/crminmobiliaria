import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { demoGuard, getCurrentUser } from '@/lib/auth'

function buildBusquedaScope(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.rol === 'superadmin') return {}

  if (user.rol === 'admin' && user.inmobiliariaId) {
    return {
      cliente: {
        inmobiliariaId: user.inmobiliariaId,
      },
    }
  }

  if (user.inmobiliariaId) {
    return {
      AND: [
        {
          cliente: {
            inmobiliariaId: user.inmobiliariaId,
          },
        },
        {
          OR: [
            { createdBy: user.id },
            { cliente: { usuarioId: user.id } },
          ],
        },
      ],
    }
  }

  return { createdBy: user.id }
}

function buildManualLinkScope(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.rol === 'superadmin') return {}

  if (user.rol === 'admin' && user.inmobiliariaId) {
    return {
      busqueda: {
        cliente: {
          inmobiliariaId: user.inmobiliariaId,
        },
      },
    }
  }

  if (user.inmobiliariaId) {
    return {
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

  return { createdBy: user.id }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const blocked = demoGuard(currentUser)
    if (blocked) return blocked

    const body = await request.json()
    const busquedaId = String(body.busquedaId || '').trim()

    if (!busquedaId) {
      return NextResponse.json({ error: 'busquedaId es requerido' }, { status: 400 })
    }

    const busqueda = await prisma.busqueda.findFirst({
      where: {
        id: busquedaId,
        ...(buildBusquedaScope(currentUser) as any),
      } as any,
      include: {
        cliente: {
          select: {
            id: true,
            nombreCompleto: true,
          },
        },
      },
    })

    if (!busqueda) {
      return NextResponse.json({ error: 'Búsqueda no encontrada' }, { status: 404 })
    }

    const links = await prisma.manualLink.findMany({
      where: {
        ...(buildManualLinkScope(currentUser) as any),
        busquedaId,
        estado: 'SELECCIONADO',
      },
      orderBy: [
        { matchScore: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    if (links.length === 0) {
      return NextResponse.json({ error: 'No hay links seleccionados' }, { status: 400 })
    }

    const existingEnvios = await prisma.envioPropiedad.findMany({
      where: {
        clienteId: busqueda.clienteId,
        urlExterna: {
          in: links.map((item) => item.normalizedUrl),
        },
      },
      select: {
        id: true,
        urlExterna: true,
      },
    })

    const existingMap = new Map(existingEnvios.map((envio) => [envio.urlExterna, envio]))
    const now = new Date()

    const createdEnvios = []
    for (const item of links) {
      const existente = existingMap.get(item.normalizedUrl)
      if (existente) {
        await prisma.manualLink.update({
          where: { id: item.id },
          data: {
            estado: 'ENVIADO',
            fueEnviadoAntes: true,
            enviadoGestionAt: now,
          },
        })
        continue
      }

      const envio = await prisma.envioPropiedad.create({
        data: {
          clienteId: busqueda.clienteId,
          urlExterna: item.normalizedUrl,
          tituloExterno: item.tituloInferido,
          canal: 'WHATSAPP',
          mensaje: `Link manual seleccionado desde Flujo Manual Inteligente (${item.portal})`,
        },
      })

      createdEnvios.push(envio)

      await prisma.manualLink.update({
        where: { id: item.id },
        data: {
          estado: 'ENVIADO',
          fueEnviadoAntes: true,
          enviadoGestionAt: now,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      clienteId: busqueda.clienteId,
      clienteNombre: busqueda.cliente.nombreCompleto,
      enviados: createdEnvios.length,
      seleccionados: links.length,
    })
  } catch (error) {
    console.error('Error al guardar selección manual:', error)
    return NextResponse.json({ error: 'Error al guardar selección manual' }, { status: 500 })
  }
}
