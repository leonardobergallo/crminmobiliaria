import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

// Función para calcular score de coincidencia
function calcularScore(propiedad: any, busqueda: any): { score: number; nivel: string; detalles: string[] } {
  let score = 0
  const maxScore = 100
  const detalles: string[] = []

  // Tipo de propiedad (20 puntos)
  if (busqueda.tipoPropiedad) {
    if (propiedad.tipo === busqueda.tipoPropiedad) {
      score += 20
      detalles.push('✅ Tipo coincide')
    } else if (busqueda.tipoPropiedad === 'OTRO') {
      score += 10 // Búsqueda flexible
      detalles.push('⚠️ Tipo flexible')
    } else {
      detalles.push('❌ Tipo no coincide')
    }
  } else {
    score += 10 // Sin preferencia = puntos parciales
  }

  // Precio (30 puntos)
  if (busqueda.presupuestoValor && propiedad.precio) {
    const ratio = propiedad.precio / busqueda.presupuestoValor
    if (ratio <= 1) {
      score += 30
      detalles.push('✅ Dentro del presupuesto')
    } else if (ratio <= 1.1) {
      score += 20
      detalles.push('⚠️ 10% sobre presupuesto')
    } else if (ratio <= 1.2) {
      score += 10
      detalles.push('⚠️ 20% sobre presupuesto')
    } else {
      detalles.push('❌ Supera presupuesto')
    }
  } else {
    score += 15 // Sin precio definido
  }

  // Dormitorios (15 puntos)
  if (busqueda.dormitoriosMin && propiedad.dormitorios) {
    if (propiedad.dormitorios >= busqueda.dormitoriosMin) {
      score += 15
      detalles.push('✅ Dormitorios OK')
    } else {
      detalles.push('❌ Menos dormitorios')
    }
  } else {
    score += 7
  }

  // Ubicación (25 puntos) - búsqueda parcial en zonas
  if (busqueda.ubicacionPreferida) {
    const ubicBusqueda = busqueda.ubicacionPreferida.toLowerCase()
    const ubicPropiedad = `${propiedad.zona || ''} ${propiedad.localidad || ''} ${propiedad.ubicacion || ''}`.toLowerCase()
    
    // Buscar coincidencias parciales
    const zonasPreferidas = ubicBusqueda.split(/[,;]/).map((z: string) => z.trim())
    let coincide = false
    for (const zona of zonasPreferidas) {
      if (zona && ubicPropiedad.includes(zona)) {
        coincide = true
        break
      }
    }
    
    if (coincide) {
      score += 25
      detalles.push('✅ Zona coincide')
    } else {
      // Buscar palabras clave
      const palabras = ubicBusqueda.split(/\s+/).filter((p: string) => p.length > 3)
      const coincideParcial = palabras.some((p: string) => ubicPropiedad.includes(p))
      if (coincideParcial) {
        score += 15
        detalles.push('⚠️ Zona parcialmente coincide')
      } else {
        detalles.push('❌ Zona no coincide')
      }
    }
  } else {
    score += 12
  }

  // Cochera (10 puntos)
  if (busqueda.cochera && busqueda.cochera.toUpperCase().includes('SI')) {
    // Buscar cochera en descripción o campos
    const desc = (propiedad.descripcion || '').toLowerCase()
    if (desc.includes('cochera') || desc.includes('garage') || desc.includes('estacionamiento')) {
      score += 10
      detalles.push('✅ Tiene cochera')
    } else {
      detalles.push('❌ Sin cochera detectada')
    }
  } else {
    score += 5
  }

  // Determinar nivel
  let nivel = 'BAJA'
  if (score >= 70) {
    nivel = 'ALTA'
  } else if (score >= 50) {
    nivel = 'MEDIA'
  }

  return { score, nivel, detalles }
}

// GET: Obtener propiedades sugeridas para un cliente con scoring
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let clienteId = searchParams.get('clienteId')
    const busquedaId = searchParams.get('busquedaId')

    // Si se pasa busquedaId, obtener clienteId de la búsqueda
    let busqueda = null
    if (busquedaId) {
      busqueda = await prisma.busqueda.findUnique({
        where: { id: busquedaId },
        include: { cliente: true }
      })
      if (!busqueda) {
        return NextResponse.json({ error: 'Búsqueda no encontrada' }, { status: 404 })
      }
      clienteId = busqueda.clienteId
    }

    if (!clienteId) {
      return NextResponse.json(
        { error: 'clienteId o busquedaId es requerido' },
        { status: 400 }
      )
    }

    // Obtener cliente para verificar inmobiliaria
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, inmobiliariaId: true, nombreCompleto: true }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // 1. Obtener las propiedades ya enviadas a este cliente
    const envios = await prisma.envioPropiedad.findMany({
      where: { clienteId },
      select: { propiedadId: true },
    })
    const propiedadesEnviadas = envios
      .map(e => e.propiedadId)
      .filter(Boolean) as string[]

    // 2. Si no tenemos búsqueda aún, obtenerla
    if (!busqueda) {
      busqueda = await prisma.busqueda.findFirst({
        where: { 
          clienteId,
          estado: { notIn: ['CERRADO', 'PERDIDO'] }
        },
        orderBy: { createdAt: 'desc' },
        include: { cliente: true }
      })
    }

    // 3. Obtener propiedades de la misma inmobiliaria (MULTI-TENANT)
    const whereBase: any = {
      id: { notIn: propiedadesEnviadas },
      // Incluir propiedades APROBADAS y en BORRADOR (para testing)
      estado: { in: ['APROBADA', 'BORRADOR', 'EN_ANALISIS'] },
    }

    // Filtrar por inmobiliaria del cliente
    if (cliente.inmobiliariaId) {
      whereBase.inmobiliariaId = cliente.inmobiliariaId
    }

    // Filtros básicos de la búsqueda
    const whereFiltrado = { ...whereBase }
    
    if (busqueda) {
      // Filtrar por tipo (excepto OTRO que es flexible)
      if (busqueda.tipoPropiedad && busqueda.tipoPropiedad !== 'OTRO') {
        whereFiltrado.tipo = busqueda.tipoPropiedad
      }

      // Filtrar por rango de precio amplio (50% - 130%)
      if (busqueda.presupuestoValor && busqueda.moneda) {
        const min = Math.floor(busqueda.presupuestoValor * 0.5)
        const max = Math.ceil(busqueda.presupuestoValor * 1.3)
        whereFiltrado.precio = { gte: min, lte: max }
        whereFiltrado.moneda = busqueda.moneda
      }

      // Si el origen es crédito, solo apta crédito
      if (busqueda.origen === 'CALIFICADA_CREDITO') {
        whereFiltrado.aptaCredito = true
      }
    }

    // 4. Obtener propiedades
    const propiedades = await prisma.propiedad.findMany({
      where: whereFiltrado,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // 5. Calcular score para cada propiedad
    const sugerenciasConScore = propiedades.map(prop => {
      const { score, nivel, detalles } = busqueda 
        ? calcularScore(prop, busqueda) 
        : { score: 50, nivel: 'MEDIA', detalles: ['Sin búsqueda para comparar'] }
      
      return {
        ...prop,
        _score: score,
        _nivel: nivel,
        _detalles: detalles,
      }
    })

    // 6. Ordenar por score y tomar los mejores
    sugerenciasConScore.sort((a, b) => b._score - a._score)

    const sugerencias = sugerenciasConScore.slice(0, 20)
    
    // Agrupar por nivel
    const porNivel = {
      ALTA: sugerencias.filter(s => s._nivel === 'ALTA'),
      MEDIA: sugerencias.filter(s => s._nivel === 'MEDIA'),
      BAJA: sugerencias.filter(s => s._nivel === 'BAJA'),
    }

    // Formatear matches para la vista
    const matches = sugerencias.map(s => ({
      propiedad: {
        id: s.id,
        titulo: s.titulo,
        tipo: s.tipo,
        operacion: s.titulo?.toLowerCase().includes('alquiler') ? 'ALQUILER' : 'VENTA',
        precio: s.precio,
        moneda: s.moneda,
        dormitorios: s.dormitorios,
        ambientes: s.ambientes,
        superficie: s.superficie,
        direccion: s.direccion,
        zona: s.zona,
        ciudad: s.localidad,
      },
      score: s._score,
      nivel: s._nivel,
      detalles: s._detalles.map((d: string) => d.replace(/^[✅⚠️❌]\s*/, '')),
    }))

    return NextResponse.json({
      busqueda,
      cliente,
      propiedadesEnviadasCount: propiedadesEnviadas.length,
      matches,
      sugerencias, // mantener para compatibilidad
      porNivel,
      resumen: {
        total: sugerencias.length,
        alta: porNivel.ALTA.length,
        media: porNivel.MEDIA.length,
        baja: porNivel.BAJA.length,
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener sugerencias' },
      { status: 500 }
    )
  }
}
