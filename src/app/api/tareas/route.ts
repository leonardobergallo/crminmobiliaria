import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const propiedadId = searchParams.get('propiedadId')
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')
    const rango = searchParams.get('rango') // hoy | semana | vencidas

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (propiedadId) where.propiedadId = propiedadId
    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo

    // Filtros de fecha
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const finDeHoy = new Date()
    finDeHoy.setHours(23, 59, 59, 999)

    if (rango === 'hoy') {
      where.fechaVencimiento = {
        gte: hoy,
        lte: finDeHoy
      }
    } else if (rango === 'semana') {
      const proximaSemana = new Date()
      proximaSemana.setDate(proximaSemana.getDate() + 7)
      where.fechaVencimiento = {
        gte: hoy,
        lte: proximaSemana
      }
    } else if (rango === 'vencidas') {
      where.fechaVencimiento = {
        lt: hoy
      }
      where.estado = 'PENDIENTE'
    }

    const tareas = await prisma.tarea.findMany({
      where,
      include: { 
        cliente: true, 
        busqueda: true,
        propiedad: {
          select: {
            id: true,
            titulo: true,
            direccion: true,
            zona: true
          }
        }
      },
      orderBy: { fechaVencimiento: 'asc' },
    })

    return NextResponse.json(tareas)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      busquedaId,
      propiedadId,
      titulo,
      descripcion,
      fechaVencimiento,
      estado,
      prioridad,
      tipo
    } = body

    if (!titulo) {
      return NextResponse.json(
        { error: 'titulo es requerido' },
        { status: 400 }
      )
    }

    const tarea = await prisma.tarea.create({
      data: {
        clienteId: clienteId || null,
        busquedaId: busquedaId || null,
        propiedadId: propiedadId || null,
        titulo,
        descripcion: descripcion || null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        estado: estado || 'PENDIENTE',
        prioridad: prioridad || 'MEDIA',
        tipo: tipo || 'GENERAL',
      },
      include: { 
        cliente: true, 
        busqueda: true,
        propiedad: true
      },
    })

    return NextResponse.json(tarea, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    )
  }
}
