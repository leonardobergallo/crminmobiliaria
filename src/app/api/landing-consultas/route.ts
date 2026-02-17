import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nombre = String(body?.nombre || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const telefono = String(body?.telefono || '').trim()
    const mensaje = String(body?.mensaje || '').trim()
    const fechaDemo = String(body?.fechaDemo || '').trim()
    const horaDemo = String(body?.horaDemo || '').trim()

    if (!nombre || !email || !mensaje) {
      return NextResponse.json(
        { error: 'nombre, email y mensaje son requeridos' },
        { status: 400 }
      )
    }

    const notasCliente = [
      'Lead creado desde landing.',
      telefono ? `Telefono: ${telefono}` : null,
      fechaDemo ? `Fecha sugerida: ${fechaDemo}` : null,
      horaDemo ? `Hora sugerida: ${horaDemo}` : null,
      `Mensaje: ${mensaje}`,
    ]
      .filter(Boolean)
      .join('\n')

    // Reusar cliente si existe por email, para no duplicar leads
    let cliente = await prisma.cliente.findFirst({
      where: { email },
    })

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombreCompleto: nombre,
          email,
          telefono: telefono || null,
          notas: notasCliente,
        },
      })
    } else {
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          nombreCompleto: nombre || cliente.nombreCompleto,
          telefono: telefono || cliente.telefono,
          notas: notasCliente,
        },
      })
    }

    const observaciones = [
      'Consulta desde landing comercial.',
      fechaDemo ? `Fecha sugerida: ${fechaDemo}` : null,
      horaDemo ? `Hora sugerida: ${horaDemo}` : null,
      `Mensaje: ${mensaje}`,
    ]
      .filter(Boolean)
      .join(' | ')

    const busqueda = await prisma.busqueda.create({
      data: {
        clienteId: cliente.id,
        origen: 'LANDING_DEMO',
        tipoPropiedad: 'A DEFINIR',
        ubicacionPreferida: 'Consulta web',
        observaciones,
        estado: 'NUEVO',
      },
    })

    // Crea una tarea de seguimiento para que aparezca tambien en Agenda
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    manana.setHours(10, 0, 0, 0)

    await prisma.tarea.create({
      data: {
        clienteId: cliente.id,
        busquedaId: busqueda.id,
        titulo: `Seguimiento lead landing: ${cliente.nombreCompleto}`,
        descripcion: observaciones,
        tipo: 'LLAMADA',
        prioridad: 'ALTA',
        estado: 'PENDIENTE',
        fechaVencimiento: manana,
      },
    })

    return NextResponse.json({ ok: true, clienteId: cliente.id, busquedaId: busqueda.id }, { status: 201 })
  } catch (error) {
    console.error('Error creando consulta de landing:', error)
    return NextResponse.json(
      { error: 'Error al registrar la consulta' },
      { status: 500 }
    )
  }
}

