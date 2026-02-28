import { NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

function buildKeys(p: { urlMls: string | null; direccion: string | null; ubicacion: string; titulo: string | null; precio: number | null; moneda: string }) {
  const keys: string[] = []

  if (p.urlMls) {
    keys.push(`url:${p.urlMls.split('?')[0].toLowerCase().trim()}`)
  }

  const dir = (p.direccion || '').toLowerCase().replaceAll(/\s+/g, ' ').trim()
  const ubic = (p.ubicacion || '').toLowerCase().replaceAll(/\s+/g, ' ').trim()
  const titulo = (p.titulo || '').toLowerCase().replaceAll(/\s+/g, ' ').trim()

  if (dir && p.precio) {
    keys.push(`dir:${dir}|${p.precio}|${p.moneda}`)
  }

  const fullText = `${dir} ${ubic} ${titulo}`
  const addrMatch = fullText.match(/([a-záéíóúñ]+)\s+\d{3,5}/gi)
  if (addrMatch?.[0] && p.precio) {
    keys.push(`addr:${addrMatch[0].toLowerCase().replaceAll(/\s+/g, ' ').trim()}|${p.precio}|${p.moneda}`)
  }

  if (titulo && p.precio && !dir) {
    keys.push(`titulo:${titulo}|${p.precio}|${p.moneda}`)
  }

  return keys
}

export async function POST() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const propiedades = await prisma.propiedad.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, titulo: true, direccion: true, ubicacion: true,
        precio: true, moneda: true, urlMls: true, createdAt: true,
      },
    })

    const toDelete: string[] = []
    const seen = new Map<string, string>()

    for (const p of propiedades) {
      const keys = buildKeys(p)
      const isDuplicate = keys.some(k => seen.has(k))

      if (isDuplicate) {
        toDelete.push(p.id)
      } else {
        for (const key of keys) seen.set(key, p.id)
      }
    }

    if (toDelete.length === 0) {
      return NextResponse.json({
        mensaje: 'No se encontraron duplicados',
        totalPropiedades: propiedades.length,
        eliminados: 0,
      })
    }

    await prisma.matchBusquedaPropiedad.deleteMany({ where: { propiedadId: { in: toDelete } } })
    await prisma.envioPropiedad.deleteMany({ where: { propiedadId: { in: toDelete } } })
    await prisma.tarea.deleteMany({ where: { propiedadId: { in: toDelete } } })

    const result = await prisma.propiedad.deleteMany({ where: { id: { in: toDelete } } })

    return NextResponse.json({
      mensaje: `Se eliminaron ${result.count} propiedades duplicadas`,
      totalAntes: propiedades.length,
      eliminados: result.count,
      totalDespues: propiedades.length - result.count,
    })
  } catch (error) {
    console.error('[limpiar-duplicados] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
