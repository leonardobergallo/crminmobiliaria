import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.rol !== 'superadmin') {
      return NextResponse.json(
        { error: 'No autorizado - Solo superadmin puede eliminar envíos' },
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
      const resultado = await prisma.envioPropiedad.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })

      return NextResponse.json({
        mensaje: `${resultado.count} envíos eliminados correctamente`,
        eliminados: resultado.count
      })

    } catch (error) {
      console.error('Error al eliminar envíos:', error)
      return NextResponse.json(
        { error: 'Error al eliminar envíos' },
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
