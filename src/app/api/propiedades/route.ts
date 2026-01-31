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
    const localidad = searchParams.get('localidad')
    const aptaCredito = searchParams.get('aptaCredito')
    const estado = searchParams.get('estado')
    const usuarioId = searchParams.get('usuarioId') // Filtro por agente (solo admin)

    const where: any = {}
    
    // Filtros básicos
    if (localidad) where.localidad = localidad
    if (aptaCredito === 'true') where.aptaCredito = true
    if (estado) where.estado = estado
    
    // Permisos por rol
    if (currentUser.rol === 'admin') {
      // Admin puede ver todas, pero puede filtrar por usuarioId
      if (usuarioId) {
        where.usuarioId = usuarioId
      }
    } else if (currentUser.rol === 'agente') {
      // Agente solo ve las suyas
      where.usuarioId = currentUser.id
    }

    const propiedades = await prisma.propiedad.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(propiedades)
  } catch (error) {
    console.error('Error al obtener propiedades:', error)
    return NextResponse.json(
      { error: 'Error al obtener propiedades' },
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
    const {
      titulo,
      tipo,
      ubicacion,
      zona,
      localidad,
      direccion,
      precio,
      moneda,
      descripcion,
      dormitorios,
      ambientes,
      banos,
      superficie,
      whatsapp,
      urlMls,
      fuente,
      aptaCredito,
    } = body

    if (!tipo || !ubicacion) {
      return NextResponse.json(
        { error: 'tipo y ubicacion son requeridos' },
        { status: 400 }
      )
    }

    const propiedad = await prisma.propiedad.create({
      data: {
        titulo: titulo || null,
        tipo,
        ubicacion,
        zona: zona || null,
        localidad: localidad || null,
        direccion: direccion || null,
        precio: precio || null,
        moneda: moneda || 'USD',
        descripcion: descripcion || null,
        dormitorios: dormitorios || null,
        ambientes: ambientes || null,
        banos: banos || null,
        superficie: superficie || null,
        whatsapp: whatsapp || null,
        urlMls: urlMls || null,
        fuente: fuente || null,
        aptaCredito: aptaCredito || false,
        usuarioId: currentUser.id, // Asignar automáticamente el usuario que crea
        estado: 'BORRADOR', // Estado por defecto
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
          }
        }
      },
    })

    return NextResponse.json(propiedad, { status: 201 })
  } catch (error) {
    console.error('Error al crear propiedad:', error)
    return NextResponse.json(
      { error: 'Error al crear propiedad' },
      { status: 500 }
    )
  }
}
