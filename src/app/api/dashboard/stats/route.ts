import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('usuarioId') // Para admin ver stats de un agente específico

    // Determinar el usuarioId para filtrar
    let filterUsuarioId: string | undefined
    if (currentUser.rol === 'admin') {
      // Admin puede ver todas o filtrar por un agente específico
      filterUsuarioId = usuarioId || undefined
    } else {
      // Agente solo ve sus datos
      filterUsuarioId = currentUser.id
    }

    // Construir where clauses
    const busquedaWhere: any = {}
    const propiedadWhere: any = {}
    const operacionWhere: any = {}

    if (filterUsuarioId) {
      // Para búsquedas: las que creó o de sus clientes
      busquedaWhere.OR = [
        { createdBy: filterUsuarioId },
        { cliente: { usuarioId: filterUsuarioId } }
      ]
      // Para propiedades: las que creó
      propiedadWhere.usuarioId = filterUsuarioId
      // Para operaciones: las que creó
      operacionWhere.usuarioId = filterUsuarioId
    }
    // Si filterUsuarioId es undefined (admin sin filtro), no agregamos filtros
    // y se obtienen todas las búsquedas/propiedades/operaciones

    // Obtener búsquedas con manejo de errores
    let busquedas: Array<{ estado: string }> = []
    try {
      busquedas = await prisma.busqueda.findMany({
        where: busquedaWhere,
        select: {
          estado: true,
        },
      })
    } catch (error: any) {
      console.error('Error obteniendo búsquedas para estadísticas:', error)
      // Si hay error, usar array vacío
      busquedas = []
    }

    // Contar búsquedas por estado
    const busquedasPorEstado = {
      NUEVO: 0,
      CALIFICADO: 0,
      VISITA: 0,
      RESERVA: 0,
      CERRADO: 0,
      PERDIDO: 0,
    }

    busquedas.forEach((b) => {
      const estado = b.estado as keyof typeof busquedasPorEstado
      if (busquedasPorEstado[estado] !== undefined) {
        busquedasPorEstado[estado]++
      }
    })

    // Obtener propiedades con manejo de errores
    let propiedades: Array<{ estado: string | null }> = []
    try {
      propiedades = await prisma.propiedad.findMany({
        where: propiedadWhere,
        select: {
          estado: true,
        },
      })
    } catch (error: any) {
      console.error('Error obteniendo propiedades para estadísticas:', error)
      // Si hay error, usar array vacío
      propiedades = []
    }

    // Contar propiedades por estado
    const propiedadesPorEstado = {
      BORRADOR: 0,
      EN_ANALISIS: 0,
      APROBADA: 0,
      DESCARTADA: 0,
    }

    propiedades.forEach((p) => {
      const estado = (p.estado || 'BORRADOR') as keyof typeof propiedadesPorEstado
      if (propiedadesPorEstado[estado] !== undefined) {
        propiedadesPorEstado[estado]++
      }
    })

    // Obtener operaciones para calcular comisiones con manejo de errores
    let operaciones: Array<{ comisionTotal: number | null }> = []
    try {
      operaciones = await prisma.operacion.findMany({
        where: operacionWhere,
        select: {
          comisionTotal: true,
        },
      })
    } catch (error: any) {
      console.error('Error obteniendo operaciones para estadísticas:', error)
      // Si hay error, usar array vacío
      operaciones = []
    }

    const comisionesTotales = operaciones.reduce(
      (sum, op) => sum + (op.comisionTotal || 0),
      0
    )

    // Obtener información del agente si se está filtrando
    let agenteInfo = null
    if (filterUsuarioId) {
      try {
        const usuario = await prisma.usuario.findUnique({
          where: { id: filterUsuarioId },
          select: {
            id: true,
            nombre: true,
          },
        })
        agenteInfo = usuario
      } catch (error) {
        console.error('Error obteniendo información del agente:', error)
        // Si hay error, agenteInfo queda como null
      }
    } else if (currentUser.rol === 'admin') {
      // Si es admin y no hay filtro, usar info del admin actual
      agenteInfo = {
        id: currentUser.id,
        nombre: currentUser.nombre,
      }
    } else {
      // Si es agente, usar su propia info
      agenteInfo = {
        id: currentUser.id,
        nombre: currentUser.nombre,
      }
    }

    return NextResponse.json({
      busquedas: {
        total: busquedas.length,
        porEstado: busquedasPorEstado,
      },
      propiedades: {
        total: propiedades.length,
        porEstado: propiedadesPorEstado,
      },
      comisiones: {
        total: comisionesTotales,
        cantidadOperaciones: operaciones.length,
      },
      agente: agenteInfo ? {
        id: agenteInfo.id,
        nombre: agenteInfo.nombre,
      } : null,
    })
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error)
    // Log detallado del error para debugging
    if (error.message) {
      console.error('Error message:', error.message)
    }
    if (error.code) {
      console.error('Error code:', error.code)
    }
    if (error.stack) {
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { 
        error: 'Error al obtener estadísticas',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
