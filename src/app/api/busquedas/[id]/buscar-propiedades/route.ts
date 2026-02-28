import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  BusquedaParseada,
  scrapearTodos,
  ZONAS_SANTA_FE_DEFAULT,
} from '@/lib/scrapers'

export const maxDuration = 55

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const busqueda = await prisma.busqueda.findUnique({
      where: { id },
      include: { cliente: true },
    })

    if (!busqueda) {
      return NextResponse.json({ error: 'Busqueda no encontrada' }, { status: 404 })
    }

    const zonas = busqueda.ubicacionPreferida
      ? busqueda.ubicacionPreferida.split(',').map(z => z.trim()).filter(Boolean)
      : ZONAS_SANTA_FE_DEFAULT

    const criterios: BusquedaParseada = {
      nombreCliente: busqueda.cliente?.nombreCompleto || null,
      telefono: busqueda.cliente?.telefono || null,
      tipoPropiedad: busqueda.tipoPropiedad || 'OTRO',
      operacion: busqueda.observaciones?.includes('ALQUILER') ? 'ALQUILER' : 'COMPRA',
      presupuestoMin: (busqueda as Record<string, unknown>).presupuestoMin as number | null ?? null,
      presupuestoMax: busqueda.presupuestoValor || null,
      moneda: busqueda.moneda || 'USD',
      zonas,
      dormitoriosMin: busqueda.dormitoriosMin || null,
      ambientesMin: null,
      cochera: busqueda.cochera === 'SI',
      caracteristicas: [],
      notas: busqueda.observaciones || '',
      confianza: 100,
    }

    console.log(`[buscar-propiedades] Buscando para busqueda ${id}:`, JSON.stringify(criterios, null, 2))

    const result = await scrapearTodos(criterios)

    const titulo = [
      criterios.tipoPropiedad !== 'OTRO' ? criterios.tipoPropiedad.toLowerCase() : null,
      criterios.operacion === 'ALQUILER' ? 'en alquiler' : 'en venta',
      zonas[0] ? `en ${zonas[0]}` : null,
      criterios.presupuestoMax ? `hasta ${criterios.moneda} ${criterios.presupuestoMax.toLocaleString()}` : null,
    ].filter(Boolean).join(' - ')

    return NextResponse.json({
      success: true,
      busquedaId: id,
      titulo,
      criterios,
      items: result.items,
      portales: result.portales,
      totalItems: result.totalItems,
    })
  } catch (error) {
    console.error('[buscar-propiedades] Error:', error)
    const message = error instanceof Error ? error.message : 'Error al buscar propiedades'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
