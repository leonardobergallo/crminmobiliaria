import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.rol !== 'superadmin') {
      return NextResponse.json(
        { error: 'No autorizado - Solo superadmin puede eliminar datos de prueba' },
        { status: 401 }
      )
    }

    // Buscar cliente "Carli Esquivel" (case insensitive)
    const clienteCarli = await prisma.cliente.findFirst({
      where: {
        nombreCompleto: {
          contains: 'carli',
          mode: 'insensitive'
        }
      }
    })

    if (!clienteCarli) {
      return NextResponse.json(
        { error: 'No se encontró cliente "Carli Esquivel"' },
        { status: 404 }
      )
    }

    // Eliminar solo las búsquedas y comunicaciones, mantener el cliente
    const resultados = {
      comunicacionesEliminadas: 0,
      busquedasEliminadas: 0,
      enviosEliminados: 0,
      clienteConservado: true
    }

    try {
      // Eliminar comunicaciones del cliente
      const comunicaciones = await prisma.comunicacion.deleteMany({
        where: { clienteId: clienteCarli.id }
      })
      resultados.comunicacionesEliminadas = comunicaciones.count

      // Eliminar envíos de propiedades del cliente
      const envios = await prisma.envioPropiedad.deleteMany({
        where: { clienteId: clienteCarli.id }
      })
      resultados.enviosEliminados = envios.count

      // Eliminar búsquedas del cliente
      const busquedas = await prisma.busqueda.deleteMany({
        where: { clienteId: clienteCarli.id }
      })
      resultados.busquedasEliminadas = busquedas.count

      // NOTA: El cliente se conserva para poder seguir usándolo

      return NextResponse.json({
        mensaje: 'Búsquedas y comunicaciones de Carli Esquivel eliminadas. Cliente conservado.',
        cliente: {
          id: clienteCarli.id,
          nombre: clienteCarli.nombreCompleto,
          telefono: clienteCarli.telefono,
          email: clienteCarli.email
        },
        resultados
      })

    } catch (error) {
      console.error('Error al eliminar datos de Carli:', error)
      return NextResponse.json(
        { error: 'Error al eliminar datos de prueba' },
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
