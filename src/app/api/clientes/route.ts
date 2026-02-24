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
    const usuarioId = searchParams.get('usuarioId')

    const where: any = {}

    // Filtrar por inmobiliaria (multi-tenant)
    if (currentUser.rol === 'superadmin') {
      // Superadmin puede ver todas las inmobiliarias
      const inmobiliariaId = searchParams.get('inmobiliariaId')
      if (inmobiliariaId) {
        where.inmobiliariaId = inmobiliariaId
      }
    } else if (currentUser.inmobiliariaId) {
      // Otros usuarios solo ven su inmobiliaria
      where.inmobiliariaId = currentUser.inmobiliariaId
    }

    // Permisos por rol dentro de la inmobiliaria
    if (currentUser.rol === 'admin' || currentUser.rol === 'superadmin') {
      if (usuarioId) {
        where.usuarioId = usuarioId
      }
    } else if (currentUser.rol === 'agente') {
      // Agente solo ve sus clientes
      where.usuarioId = currentUser.id
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        busquedas: true,
        tareas: true,
        operaciones: true,
        usuario: {
          select: { id: true, nombre: true }
        },
        inmobiliaria: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { nombreCompleto: 'asc' },
    })
    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nombreCompleto, telefono, email, notas, usuarioId } = body

    if (!nombreCompleto) {
      return NextResponse.json(
        { error: 'nombreCompleto es requerido' },
        { status: 400 }
      )
    }

    // Determinar inmobiliariaId
    let inmobiliariaId = currentUser.inmobiliariaId
    if (currentUser.rol === 'superadmin' && body.inmobiliariaId) {
      inmobiliariaId = body.inmobiliariaId
    }

    let usuarioAsignadoId: string | null = currentUser.id

    if (usuarioId && typeof usuarioId === 'string') {
      if (currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin') {
        return NextResponse.json(
          { error: 'No autorizado para asignar cliente a otro agente' },
          { status: 403 }
        )
      }

      const usuarioAsignado = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, inmobiliariaId: true },
      })

      if (!usuarioAsignado) {
        return NextResponse.json(
          { error: 'Agente no encontrado' },
          { status: 404 }
        )
      }

      if (
        currentUser.rol !== 'superadmin' &&
        currentUser.inmobiliariaId &&
        usuarioAsignado.inmobiliariaId !== currentUser.inmobiliariaId
      ) {
        return NextResponse.json(
          { error: 'No puedes asignar clientes a usuarios de otra inmobiliaria' },
          { status: 403 }
        )
      }

      usuarioAsignadoId = usuarioAsignado.id
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombreCompleto,
        telefono: telefono || null,
        email: email || null,
        notas: notas || null,
        usuarioId: usuarioAsignadoId,
        inmobiliariaId,
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
    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}

