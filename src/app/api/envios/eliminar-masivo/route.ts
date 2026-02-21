import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !['superadmin', 'admin', 'agente'].includes(currentUser.rol)) {
      return NextResponse.json(
        { error: 'No autorizado - Solo superadmin, admin o agente puede eliminar envios' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs invalidos' },
        { status: 400 }
      )
    }

    const where: any = {
      id: { in: ids }
    }

    if (currentUser.rol === 'admin') {
      where.cliente = {
        inmobiliariaId: currentUser.inmobiliariaId || '__sin_inmobiliaria__'
      }
    } else if (currentUser.rol === 'agente') {
      where.cliente = {
        usuarioId: currentUser.id
      }
    }

    const resultado = await prisma.envioPropiedad.deleteMany({ where })

    return NextResponse.json({
      mensaje: `${resultado.count} envios eliminados correctamente`,
      eliminados: resultado.count
    })
  } catch (error) {
    console.error('Error al eliminar envios:', error)
    return NextResponse.json(
      { error: 'Error al eliminar envios' },
      { status: 500 }
    )
  }
}
