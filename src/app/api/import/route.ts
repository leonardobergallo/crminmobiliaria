import { NextRequest, NextResponse } from 'next/server'
import {
  importarBuscadasCalificadas,
  importarAptaCredito,
  importarComisiones,
} from '@/lib/utils/importers'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileType, filePath } = body

    // Validar que el archivo existe (básico)
    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'filePath es requerido' },
        { status: 400 }
      )
    }

    let imported = 0

    switch (fileType) {
      case 'busquedas-calificadas':
        await importarBuscadasCalificadas(filePath)
        imported++
        break
      case 'apta-credito':
        await importarAptaCredito(filePath)
        imported++
        break
      case 'comisiones':
        await importarComisiones(filePath)
        imported++
        break
      case 'all':
        // Importar todos los archivos
        // Nota: requiere rutas configuradas en .env o request body
        if (body.buscadasCalificadas) {
          await importarBuscadasCalificadas(body.buscadasCalificadas)
          imported++
        }
        if (body.aptaCredito) {
          await importarAptaCredito(body.aptaCredito)
          imported++
        }
        if (body.comisiones) {
          await importarComisiones(body.comisiones)
          imported++
        }
        break
      default:
        return NextResponse.json(
          { error: 'fileType no reconocido' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `Importación completada. ${imported} archivo(s) procesado(s).`,
      imported,
    })
  } catch (error: any) {
    console.error('Error importing:', error)
    return NextResponse.json(
      { error: `Error en importación: ${error.message}` },
      { status: 500 }
    )
  }
}
