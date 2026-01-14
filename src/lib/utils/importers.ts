import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Utilidades para normalización
export function normalizarMonto(texto: string): {
  valor: number | null
  moneda: string
  textoOriginal: string
} {
  if (!texto) return { valor: null, moneda: 'ARS', textoOriginal: texto }

  const textoLower = texto.toLowerCase()
  let moneda = 'ARS'

  if (textoLower.includes('usd') || textoLower.includes('dolar')) {
    moneda = 'USD'
  }

  // Extraer número: buscar patrón de números con puntos/comas
  const match = texto.match(/[\d.,]+/)
  if (match) {
    let numeroStr = match[0]
    // Reemplazar puntos por nada (si hay punto de miles) y comas por puntos decimales
    numeroStr = numeroStr.replace(/\./g, '').replace(/,/g, '.')
    const valor = parseInt(numeroStr)
    return { valor: isNaN(valor) ? null : valor, moneda, textoOriginal: texto }
  }

  return { valor: null, moneda, textoOriginal: texto }
}

export function normalizarTipoPropiedad(texto: string): string {
  if (!texto) return 'OTRO'
  const lower = texto.toLowerCase()
  if (lower.includes('departamento') || lower.includes('depar')) return 'DEPARTAMENTO'
  if (lower.includes('casa')) return 'CASA'
  return 'OTRO'
}

// Importar Búsquedas Calificadas (estructura tabular)
export async function importarBuscadasCalificadas(filePath: string) {
  const workbook = XLSX.readFile(filePath)

  for (const sheetName of ['Efectivo', 'Creditos']) {
    if (!workbook.SheetNames.includes(sheetName)) continue

    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[]

    for (const row of data) {
      const cliente = row['CLIENTE'] as string | undefined
      const monto = row['MONTO'] as string | undefined

      if (!cliente || !monto) continue

      // Obtener o crear cliente
      let clienteDoc = await prisma.cliente.findUnique({
        where: { nombreCompleto: cliente },
      })

      if (!clienteDoc) {
        clienteDoc = await prisma.cliente.create({
          data: { nombreCompleto: cliente },
        })
      }

      // Normalizar monto
      const { valor, moneda, textoOriginal } = normalizarMonto(monto)

      // Crear búsqueda
      const origen =
        sheetName === 'Efectivo' ? 'CALIFICADA_EFECTIVO' : 'CALIFICADA_CREDITO'

      await prisma.busqueda.upsert({
        where: {
          // No hay unique constraint para búsquedas, así que usar create
          id: `${clienteDoc.id}-${sheetName}`,
        },
        create: {
          clienteId: clienteDoc.id,
          origen,
          presupuestoTexto: textoOriginal,
          presupuestoValor: valor,
          moneda,
          tipoPropiedad: normalizarTipoPropiedad(
            (row['TIPO DE PROPIEDAD'] as string) || ''
          ),
          ubicacionPreferida: (row['UBICACION'] || row['UBICACIÓN']) as string,
          dormitoriosMin: parseInt(row['DORMITORIOS'] as string) || null,
          cochera: (row['COCHERA'] as string) || null,
          finalidad: (row['INVERSION O VIVIENDA'] as string) || null,
          planillaRef: sheetName,
          estado: (row['ESTADO'] as string) || 'NUEVO',
        },
        update: {},
      })
    }
  }

  console.log('✅ Búsquedas Calificadas importadas')
}

// Importar propiedades APTA CREDITO
export async function importarAptaCredito(filePath: string) {
  const workbook = XLSX.readFile(filePath)

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[]

    for (const row of data) {
      const ubicacion = (row['Ubicación'] || row['ubicacion']) as string
      const precio = (row['Precio'] || row['precio']) as string

      if (!ubicacion) continue

      const { valor, moneda } = normalizarMonto(precio || '')
      const tipo = sheetName.toLowerCase().includes('depar')
        ? 'DEPARTAMENTO'
        : 'CASA'

      await prisma.propiedad.upsert({
        where: {
          // Usar combinación como unique
          id: `${ubicacion}-${precio}`,
        },
        create: {
          tipo,
          ubicacion,
          localidad: (row['Localidad'] || row['localidad']) as string,
          precio,
          precioNumerico: valor,
          moneda,
          descripcion: (row['Descripcion'] || row['descripcion']) as string,
          dormitorios: parseInt(
            (row['Dormitorios'] || row['dormitorios']) as string
          ) || null,
          link: (row['MLS'] ||
            row['INMOBILIARIA'] ||
            row['mls'] ||
            row['inmobiliaria']) as string,
          aptaCredito: true,
          fuente: 'APTA_CREDITO',
        },
        update: {},
      })
    }
  }

  console.log('✅ Propiedades APTA CREDITO importadas')
}

// Importar comisiones
export async function importarComisiones(filePath: string) {
  const workbook = XLSX.readFile(filePath)

  if (!workbook.SheetNames.includes('ULTIMAS OEPERACIONES')) {
    console.log('⚠️ Sheet "ULTIMAS OEPERACIONES" no encontrado')
    return
  }

  const worksheet = workbook.Sheets['ULTIMAS OEPERACIONES']
  const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[]

  for (const row of data) {
    const nro = parseInt(row['NRO'] as string)
    if (isNaN(nro)) continue // Saltear filas sin número

    const descripcion = row['COMISIONES (VENTA EFECTIVO)'] as string
    if (!descripcion) continue

    const precioReal = parseInt(
      (row['PRECIO REAL'] as string).replace(/\./g, '')
    )
    const comisionTotal = parseFloat(
      (row['COMISIONES-TOTAL'] as string) || '0'
    )

    await prisma.operacion.upsert({
      where: { nro },
      create: {
        nro,
        descripcion,
        precioReal: isNaN(precioReal) ? null : precioReal,
        comisionTotal: isNaN(comisionTotal) ? null : comisionTotal,
        totalComisionEquipo: parseFloat(
          (row['TOTAL-COMISION-EQUIPO'] as string) || '0'
        ) || null,
        comisionEquipoUnaPunta: parseFloat(
          (row['COMISION-EQUIPO(UNA PUNTAS)'] as string) || '0'
        ) || null,
        comisionLeoDosPuntas: parseFloat(
          (row['COMISION-LEO(DOS PUNTAS)'] as string) || '0'
        ) || null,
        comisionLeoUnaPunta: parseFloat(
          (row['COMISION-LEO(UNA PUNTAS)'] as string) || '0'
        ) || null,
        observaciones: (row['OBSERVACIONES'] as string) || null,
      },
      update: {},
    })
  }

  console.log('✅ Comisiones importadas')
}
