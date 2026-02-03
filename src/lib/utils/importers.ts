import * as XLSX from 'xlsx'
import { prisma } from './prisma'

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
      let clienteDoc = await prisma.cliente.findFirst({
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

      await prisma.busqueda.create({
        data: {
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

      await prisma.propiedad.create({
        data: {
          tipo,
          ubicacion,
          localidad: (row['Localidad'] || row['localidad']) as string,
          precio: valor || null,
          moneda,
          descripcion: (row['Descripcion'] || row['descripcion']) as string,
          dormitorios: parseInt(
            (row['Dormitorios'] || row['dormitorios']) as string
          ) || null,
          urlMls: (row['MLS'] ||
            row['INMOBILIARIA'] ||
            row['mls'] ||
            row['inmobiliaria']) as string || null,
          aptaCredito: true,
          fuente: 'APTA_CREDITO',
        },
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
        precioVenta: isNaN(precioReal) ? null : precioReal,
        comisionBruta: isNaN(comisionTotal) ? null : comisionTotal,
        observaciones: (row['OBSERVACIONES'] as string) || null,
      },
      update: {},
    })
  }

  console.log('✅ Comisiones importadas')
}

// Importar Propiedades desde Excel con formato: titulo, tipo, zona, descripcion, precio, moneda, ambientes, banos, superficie, direccion, whatsapp
export async function importarPropiedadesDesdeExcel(filePath: string) {
  const workbook = XLSX.readFile(filePath)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[]

  let count = 0

  for (const row of data) {
    const titulo = (row['titulo'] as string) || ''
    const tipo = (row['tipo'] as string) || 'venta'
    const zona = (row['zona'] as string) || ''
    const descripcion = (row['descripcion'] as string) || ''
    let precio = row['precio']
    const monedaInput = (row['moneda'] as string) || 'USD'
    const ambientes = parseInt((row['ambientes'] as string) || '0') || 0
    const banos = parseInt((row['banos'] as string) || '0') || 0
    const superficie = parseInt((row['superficie'] as string) || '0') || 0
    const direccion = (row['direccion'] as string) || ''
    const whatsapp = (row['whatsapp'] as string) || ''

    // Convertir precio a número
    let precioNumerico = 0
    if (typeof precio === 'number') {
      precioNumerico = precio
    } else if (typeof precio === 'string') {
      precioNumerico = parseInt(precio.replace(/\D/g, '')) || 0
    }

    // Crear propiedad con datos básicos
    const existingPropiedad = await prisma.propiedad.findFirst({
      where: {
        direccion,
        tipo: normalizarTipoPropiedad(tipo),
      },
    })

    if (existingPropiedad) {
      await prisma.propiedad.update({
        where: { id: existingPropiedad.id },
        data: {
          titulo,
          descripcion,
          precio: precioNumerico,
          moneda: monedaInput.toUpperCase() === 'USD' ? 'USD' : 'ARS',
          ambientes,
          banos,
          superficie,
          whatsapp,
          zona,
          subtipo: tipo,
        },
      })
    } else {
      await prisma.propiedad.create({
        data: {
          titulo,
          tipo: normalizarTipoPropiedad(tipo),
          subtipo: tipo,
          ubicacion: zona || direccion || '',
          zona,
          descripcion,
          precio: precioNumerico,
          moneda: monedaInput.toUpperCase() === 'USD' ? 'USD' : 'ARS',
          ambientes,
          banos,
          superficie,
          direccion,
          whatsapp,
          urlMls: '',
          aptaCredito: false,
        },
      })
    }

    count++
  }

  console.log(`✅ ${count} propiedades importadas`)
  return { count }
}
