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
    const clienteId = searchParams.get('clienteId')
    const estado = searchParams.get('estado')
    const createdBy = searchParams.get('createdBy') // Filtro por agente (solo admin)

    const where: any = {}
    
    // Filtros básicos
    if (clienteId) where.clienteId = clienteId
    if (estado) where.estado = estado
    
    // Permisos por rol
    if (currentUser.rol === 'admin') {
      // Admin puede ver todas, pero puede filtrar por createdBy
      if (createdBy) {
        where.createdBy = createdBy
      }
      // Si no hay filtro, admin ve todas (no agregamos ningún filtro adicional)
    } else if (currentUser.rol === 'agente') {
      // Agente solo ve las que creó o de sus clientes
      // Construir condiciones OR de forma segura
      where.OR = [
        // Búsquedas que el agente creó (puede incluir null para compatibilidad)
        { 
          createdBy: currentUser.id 
        },
        // Búsquedas de clientes asignados al agente
        { 
          cliente: { 
            usuarioId: currentUser.id 
          } 
        }
      ]
    }

    // Consulta básica sin la relación usuario que puede causar problemas
    const busquedas = await prisma.busqueda.findMany({
      where,
      include: {
        cliente: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
              }
            }
          }
        },
        matchesPropiedades: {
          include: {
            propiedad: true
          },
          orderBy: { fecha: 'desc' }
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Obtener usuarios creadores en batch si hay createdBy
    const createdByIds = [...new Set(busquedas.map(b => b.createdBy).filter(Boolean) as string[])]
    const usuariosMap = new Map()
    
    if (createdByIds.length > 0) {
      const usuarios = await prisma.usuario.findMany({
        where: {
          id: { in: createdByIds }
        },
        select: {
          id: true,
          nombre: true,
        }
      })
      usuarios.forEach(u => usuariosMap.set(u.id, u))
    }

    // Agregar información del usuario creador a cada búsqueda
    const busquedasConUsuario = busquedas.map(b => ({
      ...b,
      usuario: b.createdBy ? usuariosMap.get(b.createdBy) || null : null
    }))

    return NextResponse.json(busquedasConUsuario)
  } catch (error: any) {
    console.error('Error al obtener búsquedas:', error)
    // Log detallado del error para debugging
    if (error.message) {
      console.error('Error message:', error.message)
    }
    if (error.code) {
      console.error('Error code:', error.code)
    }
    return NextResponse.json(
      { 
        error: 'Error al obtener búsquedas',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.error('POST /api/busquedas: Usuario no autenticado')
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('POST /api/busquedas: Usuario autenticado:', currentUser.id, currentUser.rol)

    const body = await request.json()
    console.log('POST /api/busquedas: Body recibido:', JSON.stringify(body))
    const {
      clienteId,
      origen,
      presupuestoTexto,
      presupuestoValor,
      moneda,
      tipoPropiedad,
      ubicacionPreferida,
      dormitoriosMin,
      cochera,
      finalidad,
      observaciones,
      planillaRef,
    } = body

    // Validaciones
    if (!clienteId || !origen) {
      return NextResponse.json(
        { error: 'clienteId y origen son requeridos' },
        { status: 400 }
      )
    }

    // Validar que clienteId sea un string válido
    if (typeof clienteId !== 'string' || clienteId.trim() === '') {
      return NextResponse.json(
        { error: 'clienteId debe ser un ID válido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe y asignar usuarioId si no lo tiene
    console.log('POST /api/busquedas: Buscando cliente con ID:', clienteId)
    let cliente
    try {
      cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
      })
    } catch (dbError: any) {
      console.error('POST /api/busquedas: Error al buscar cliente:', dbError)
      return NextResponse.json(
        { error: 'Error al buscar cliente en la base de datos', details: process.env.NODE_ENV === 'development' ? dbError.message : undefined },
        { status: 500 }
      )
    }

    if (!cliente) {
      console.error('POST /api/busquedas: Cliente no encontrado:', clienteId)
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    console.log('POST /api/busquedas: Cliente encontrado:', cliente.nombreCompleto)

    // Verificar que el usuario creador existe en la base de datos (solo si vamos a usar createdBy)
    let usuarioCreadorExiste = null
    try {
      usuarioCreadorExiste = await prisma.usuario.findUnique({
        where: { id: currentUser.id }
      })
    } catch (dbError: any) {
      console.error('POST /api/busquedas: Error al buscar usuario creador:', dbError)
      // No fallar aquí, simplemente no asignar createdBy si hay error
      usuarioCreadorExiste = null
    }

    if (!usuarioCreadorExiste) {
      console.warn('POST /api/busquedas: Usuario creador no existe en BD, continuando sin createdBy:', currentUser.id)
      // No fallar, simplemente no asignar createdBy (es opcional en el schema)
    }

    // Si el cliente no tiene usuarioId, asignarlo
    if (!cliente.usuarioId && currentUser.rol === 'agente') {
      await prisma.cliente.update({
        where: { id: clienteId },
        data: { usuarioId: currentUser.id }
      })
    }

    // Normalizar datos antes de crear - solo incluir campos requeridos y opcionales con valores válidos
    const busquedaData: any = {
      clienteId: clienteId.trim(),
      origen: origen.trim(),
    }

    // TEMPORAL: No usar createdBy hasta que se regenere el cliente de Prisma
    // El campo existe en el schema pero el cliente de Prisma no lo reconoce aún
    // Por ahora, el agente se puede rastrear a través de cliente.usuarioId
    // TODO: Descomentar después de ejecutar `npx prisma generate`
    // if (usuarioCreadorExiste) {
    //   busquedaData.createdBy = currentUser.id
    // }

    // Campos opcionales - solo agregar si tienen valores válidos (no null, no undefined, no string vacío)
    if (presupuestoTexto && typeof presupuestoTexto === 'string') {
      const trimmed = presupuestoTexto.trim()
      if (trimmed !== '') {
        busquedaData.presupuestoTexto = trimmed
      }
    }

    if (presupuestoValor !== undefined && presupuestoValor !== null && presupuestoValor !== '') {
      const parsed = typeof presupuestoValor === 'number' ? presupuestoValor : Number.parseInt(String(presupuestoValor))
      if (!Number.isNaN(parsed) && parsed > 0) {
        busquedaData.presupuestoValor = parsed
      }
    }

    if (moneda && typeof moneda === 'string') {
      const trimmed = moneda.trim()
      if (trimmed !== '') {
        busquedaData.moneda = trimmed
      }
    }

    if (tipoPropiedad && typeof tipoPropiedad === 'string') {
      const trimmed = tipoPropiedad.trim()
      if (trimmed !== '') {
        busquedaData.tipoPropiedad = trimmed
      }
    }

    if (ubicacionPreferida && typeof ubicacionPreferida === 'string') {
      const trimmed = ubicacionPreferida.trim()
      if (trimmed !== '') {
        busquedaData.ubicacionPreferida = trimmed
      }
    }

    if (dormitoriosMin !== undefined && dormitoriosMin !== null && dormitoriosMin !== '') {
      const parsed = typeof dormitoriosMin === 'number' ? dormitoriosMin : Number.parseInt(String(dormitoriosMin))
      if (!Number.isNaN(parsed) && parsed > 0) {
        busquedaData.dormitoriosMin = parsed
      }
    }

    if (cochera && typeof cochera === 'string') {
      const trimmed = cochera.trim()
      if (trimmed !== '') {
        busquedaData.cochera = trimmed
      }
    }

    if (finalidad && typeof finalidad === 'string') {
      const trimmed = finalidad.trim()
      if (trimmed !== '') {
        busquedaData.finalidad = trimmed
      }
    }

    if (observaciones && typeof observaciones === 'string') {
      const trimmed = observaciones.trim()
      if (trimmed !== '') {
        busquedaData.observaciones = trimmed
      }
    }

    if (planillaRef && typeof planillaRef === 'string') {
      const trimmed = planillaRef.trim()
      if (trimmed !== '') {
        busquedaData.planillaRef = trimmed
      }
    }

    console.log('POST /api/busquedas: Datos a crear:', JSON.stringify(busquedaData, null, 2))
    console.log('POST /api/busquedas: Tipos de datos:', {
      clienteId: typeof busquedaData.clienteId,
      origen: typeof busquedaData.origen,
      createdBy: typeof busquedaData.createdBy,
    })
    
    // Validar que los campos requeridos estén presentes y sean del tipo correcto
    if (!busquedaData.clienteId || typeof busquedaData.clienteId !== 'string') {
      console.error('POST /api/busquedas: clienteId inválido:', busquedaData.clienteId)
      return NextResponse.json(
        { error: 'clienteId debe ser un string válido' },
        { status: 400 }
      )
    }

    if (!busquedaData.origen || typeof busquedaData.origen !== 'string') {
      console.error('POST /api/busquedas: origen inválido:', busquedaData.origen)
      return NextResponse.json(
        { error: 'origen debe ser un string válido' },
        { status: 400 }
      )
    }
    
    // Crear la búsqueda sin includes complejos primero
    let busqueda
    try {
      busqueda = await prisma.busqueda.create({
        data: busquedaData,
      })
      console.log('POST /api/busquedas: Búsqueda creada exitosamente:', busqueda.id)
    } catch (prismaError: any) {
      console.error('POST /api/busquedas: Error de Prisma al crear:', prismaError)
      console.error('POST /api/busquedas: Código de error:', prismaError.code)
      console.error('POST /api/busquedas: Mensaje:', prismaError.message)
      console.error('POST /api/busquedas: Meta:', prismaError.meta)
      
      let errorMessage = 'Error al crear búsqueda en la base de datos'
      if (prismaError.code === 'P2002') {
        errorMessage = 'Ya existe una búsqueda con estos datos'
      } else if (prismaError.code === 'P2003') {
        errorMessage = 'El cliente o usuario especificado no existe'
      } else if (prismaError.message) {
        errorMessage = `Error de base de datos: ${prismaError.message}`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? {
            code: prismaError.code,
            message: prismaError.message,
            meta: prismaError.meta
          } : undefined
        },
        { status: 400 }
      )
    }

    // Obtener datos relacionados por separado para evitar problemas
    let clienteConUsuario = null
    try {
      clienteConUsuario = await prisma.cliente.findUnique({
        where: { id: busqueda.clienteId },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
            }
          }
        }
      })
    } catch (error) {
      console.error('POST /api/busquedas: Error al obtener cliente:', error)
      // Continuar aunque falle obtener el cliente
    }

    // Obtener el usuario creador
    let usuarioCreador = null
    if (busqueda.createdBy) {
      try {
        usuarioCreador = await prisma.usuario.findUnique({
          where: { id: busqueda.createdBy },
          select: {
            id: true,
            nombre: true,
          }
        })
      } catch (error) {
        console.error('POST /api/busquedas: Error al obtener usuario creador:', error)
        // Continuar aunque falle obtener el usuario
      }
    }

    return NextResponse.json({
      ...busqueda,
      cliente: clienteConUsuario,
      usuario: usuarioCreador
    }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/busquedas: Error general:', error)
    console.error('POST /api/busquedas: Tipo de error:', typeof error)
    console.error('POST /api/busquedas: Error name:', error?.name)
    
    // Log detallado del error
    if (error?.message) {
      console.error('POST /api/busquedas: Error message:', error.message)
    }
    if (error?.code) {
      console.error('POST /api/busquedas: Error code:', error.code)
    }
    if (error?.meta) {
      console.error('POST /api/busquedas: Error meta:', JSON.stringify(error.meta, null, 2))
    }
    if (error?.stack) {
      console.error('POST /api/busquedas: Error stack:', error.stack)
    }
    
    // Devolver mensaje de error más descriptivo
    let errorMessage = 'Error al crear búsqueda'
    let statusCode = 500
    
    if (error?.code === 'P2002') {
      errorMessage = 'Ya existe una búsqueda con estos datos'
      statusCode = 400
    } else if (error?.code === 'P2003') {
      errorMessage = 'El cliente especificado no existe'
      statusCode = 400
    } else if (error?.message) {
      errorMessage = `Error: ${error.message}`
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    // Asegurarse de devolver siempre un JSON válido
    try {
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? {
            message: error?.message || 'Error desconocido',
            code: error?.code,
            meta: error?.meta,
            type: typeof error,
            name: error?.name
          } : undefined
        },
        { status: statusCode }
      )
    } catch (jsonError) {
      // Si falla crear el JSON, devolver un error básico
      console.error('POST /api/busquedas: Error al crear respuesta JSON:', jsonError)
      return new NextResponse(
        JSON.stringify({ error: 'Error interno del servidor' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}
