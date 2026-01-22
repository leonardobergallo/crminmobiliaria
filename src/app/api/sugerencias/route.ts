import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

// GET: Obtener propiedades sugeridas para un cliente
// Filtra las que ya fueron enviadas y match con sus búsquedas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const busquedaId = searchParams.get('busquedaId')

    if (!clienteId) {
      return NextResponse.json(
        { error: 'clienteId es requerido' },
        { status: 400 }
      )
    }

    // 1. Obtener las propiedades ya enviadas a este cliente
    const envios = await prisma.envioPropiedad.findMany({
      where: { clienteId },
      select: { propiedadId: true },
    })
    const propiedadesEnviadas = envios
      .map(e => e.propiedadId)
      .filter(Boolean) as string[]

    // 2. Obtener búsqueda del cliente para matching
    let busqueda = null
    if (busquedaId) {
      busqueda = await prisma.busqueda.findUnique({
        where: { id: busquedaId },
      })
    } else {
      // Tomar la búsqueda más reciente activa
      busqueda = await prisma.busqueda.findFirst({
        where: { 
          clienteId,
          estado: { notIn: ['CERRADO', 'PERDIDO'] }
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    // 3. Construir filtros basados en la búsqueda
    const where: any = {
      id: { notIn: propiedadesEnviadas },
    }

    if (busqueda) {
      // Filtrar por tipo de propiedad si está especificado
      if (busqueda.tipoPropiedad) {
        where.tipo = busqueda.tipoPropiedad
      }

      // Filtrar por presupuesto (con margen del 20%)
      if (busqueda.presupuestoValor && busqueda.moneda) {
        const min = Math.floor(busqueda.presupuestoValor * 0.8)
        const max = Math.ceil(busqueda.presupuestoValor * 1.2)
        where.precio = { gte: min, lte: max }
        where.moneda = busqueda.moneda
      }

      // Filtrar por dormitorios mínimos
      if (busqueda.dormitoriosMin) {
        where.dormitorios = { gte: busqueda.dormitoriosMin }
      }

      // Filtrar por ubicación preferida (búsqueda parcial)
      if (busqueda.ubicacionPreferida) {
        where.OR = [
          { zona: { contains: busqueda.ubicacionPreferida, mode: 'insensitive' } },
          { localidad: { contains: busqueda.ubicacionPreferida, mode: 'insensitive' } },
          { ubicacion: { contains: busqueda.ubicacionPreferida, mode: 'insensitive' } },
        ]
      }

      // Si el origen es crédito, solo apta crédito
      if (busqueda.origen === 'CALIFICADA_CREDITO') {
        where.aptaCredito = true
      }
    }

    // 4. Obtener propiedades sugeridas
    const sugerencias = await prisma.propiedad.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20, // Limitar a 20 sugerencias
    })

    // 5. Si no hay suficientes con filtros estrictos, relajar
    let adicionales: any[] = []
    if (sugerencias.length < 5) {
      adicionales = await prisma.propiedad.findMany({
        where: {
          id: { 
            notIn: [...propiedadesEnviadas, ...sugerencias.map(s => s.id)] 
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    }

    return NextResponse.json({
      busqueda,
      propiedadesEnviadasCount: propiedadesEnviadas.length,
      sugerencias,
      adicionales,
      totalSugerencias: sugerencias.length + adicionales.length,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener sugerencias' },
      { status: 500 }
    )
  }
}
