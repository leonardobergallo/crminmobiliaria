import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        busquedas: true,
        tareas: true,
        operaciones: true,
      },
      orderBy: { nombreCompleto: 'asc' },
    })
    return NextResponse.json(clientes)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombreCompleto, telefono, email, notas } = body

    if (!nombreCompleto) {
      return NextResponse.json(
        { error: 'nombreCompleto es requerido' },
        { status: 400 }
      )
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombreCompleto,
        telefono: telefono || null,
        email: email || null,
        notas: notas || null,
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El cliente ya existe' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}
