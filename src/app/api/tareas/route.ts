import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const estado = searchParams.get('estado')

    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (estado) where.estado = estado

    const tareas = await prisma.tarea.findMany({
      where,
      include: { cliente: true, busqueda: true },
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
      titulo,
      descripcion,
      fechaVencimiento,
      estado,
      prioridad,
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
        titulo,
        descripcion: descripcion || null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        estado: estado || 'PENDIENTE',
        prioridad: prioridad || 'MEDIA',
      },
      include: { cliente: true, busqueda: true },
    })

    return NextResponse.json(tarea, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    )
  }
}
