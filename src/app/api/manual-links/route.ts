import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { demoGuard, getCurrentUser } from '@/lib/auth'
import { calculateManualLinkMatch, parseManualLink } from '@/lib/manual-links'

function buildBusquedaScope(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.rol === 'superadmin') {
    return {}
  }

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

function buildManualLinksScope(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (user.rol === 'superadmin') {
    return {}
  }

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

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const busquedaId = searchParams.get('busquedaId')
    const clienteId = searchParams.get('clienteId')

    const where: any = {
      ...buildManualLinksScope(currentUser),
    }

    if (busquedaId) where.busquedaId = busquedaId
    if (clienteId) where.clienteId = clienteId

    const items = await prisma.manualLink.findMany({
      where,
      include: {
        busqueda: {
          select: {
            id: true,
            tipoPropiedad: true,
            ubicacionPreferida: true,
            presupuestoTexto: true,
            presupuestoValor: true,
            moneda: true,
            dormitoriosMin: true,
          },
        },
      },
      orderBy: [
        { estado: 'asc' },
        { matchScore: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error al obtener manual links:', error)
    return NextResponse.json({ error: 'Error al obtener manual links' }, { status: 500 })
  }
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
    const rawUrl = String(body.url || '').trim()

    if (!busquedaId || !rawUrl) {
      return NextResponse.json({ error: 'busquedaId y url son requeridos' }, { status: 400 })
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
            usuarioId: true,
          },
        },
      },
    })

    if (!busqueda) {
      return NextResponse.json({ error: 'Búsqueda no encontrada' }, { status: 404 })
    }

    let parsed
    try {
      parsed = parseManualLink(rawUrl)
    } catch {
      return NextResponse.json({ error: 'La URL ingresada no es válida' }, { status: 400 })
    }
    const match = calculateManualLinkMatch(
      {
        id: busqueda.id,
        clienteId: busqueda.clienteId,
        tipoPropiedad: busqueda.tipoPropiedad,
        ubicacionPreferida: busqueda.ubicacionPreferida,
        presupuestoTexto: busqueda.presupuestoTexto,
        presupuestoValor: busqueda.presupuestoValor,
        moneda: busqueda.moneda,
        dormitoriosMin: busqueda.dormitoriosMin,
      },
      parsed
    )

    const envioPrevio = await prisma.envioPropiedad.findFirst({
      where: {
        clienteId: busqueda.clienteId,
        urlExterna: parsed.normalizedUrl,
      },
      select: { id: true, fechaEnvio: true },
    })

    const existing = await prisma.manualLink.findFirst({
      where: {
        busquedaId: busqueda.id,
        normalizedUrl: parsed.normalizedUrl,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Este link ya fue cargado para la búsqueda', existing },
        { status: 409 }
      )
    }

    const item = await prisma.manualLink.create({
      data: {
        busquedaId: busqueda.id,
        clienteId: busqueda.clienteId,
        createdBy: currentUser.id,
        url: parsed.url,
        normalizedUrl: parsed.normalizedUrl,
        portal: parsed.portal,
        portalDomain: parsed.portalDomain,
        tituloInferido: parsed.tituloInferido,
        precioInferido: parsed.precioInferido,
        monedaInferida: parsed.monedaInferida,
        zonaInferida: parsed.zonaInferida,
        tipoOperacion: parsed.tipoOperacion,
        dormitoriosInferidos: parsed.dormitoriosInferidos,
        ambientesInferidos: parsed.ambientesInferidos,
        tipoPropiedadInferido: parsed.tipoPropiedadInferido,
        matchScore: match.score,
        matchNivel: match.nivel,
        estado: 'NUEVO',
        fueEnviadoAntes: Boolean(envioPrevio),
        metadataJson: JSON.stringify({
          metadata: parsed.metadata,
          breakdown: match.breakdown,
          envioPrevio,
        }),
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error al crear manual link:', error)
    return NextResponse.json({ error: 'Error al crear manual link' }, { status: 500 })
  }
}
