import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs invalidos' }, { status: 400 })
    }

    const where: any = {
      id: { in: ids }
    }

    if (currentUser.rol === 'admin') {
      where.cliente = {
        inmobiliariaId: currentUser.inmobiliariaId || '__sin_inmobiliaria__'
      }
    } else if (currentUser.rol === 'agente') {
      where.OR = [
        { createdBy: currentUser.id },
        { cliente: { usuarioId: currentUser.id } }
      ]
    }

    const resultado = await prisma.busqueda.deleteMany({ where })

    return NextResponse.json({
      mensaje: `${resultado.count} busquedas eliminadas correctamente`,
      eliminadas: resultado.count
    })
  } catch (error) {
    console.error('Error al eliminar busquedas:', error)
    return NextResponse.json(
      { error: 'Error al eliminar busquedas' },
      { status: 500 }
    )
  }
}
