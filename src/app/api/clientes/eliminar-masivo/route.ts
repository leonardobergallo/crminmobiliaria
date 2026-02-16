import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs inválidos' },
        { status: 400 }
      )
    }

    try {
      await prisma.comunicacion.deleteMany({
        where: {
          clienteId: {
            in: ids
          }
        }
      })

      await prisma.envioPropiedad.deleteMany({
        where: {
          clienteId: {
            in: ids
          }
        }
      })

      await prisma.busqueda.deleteMany({
        where: {
          clienteId: {
            in: ids
          }
        }
      })

      await prisma.tarea.deleteMany({
        where: {
          clienteId: {
            in: ids
          }
        }
      })

      await prisma.operacion.deleteMany({
        where: {
          clienteId: {
            in: ids
          }
        }
      })

      const resultado = await prisma.cliente.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })

      return NextResponse.json({
        mensaje: `${resultado.count} clientes eliminados correctamente`,
        eliminados: resultado.count
      })

    } catch (error) {
      console.error('Error al eliminar clientes:', error)
      return NextResponse.json(
        { error: 'Error al eliminar clientes' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
