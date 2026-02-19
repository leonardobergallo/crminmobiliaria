import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

type Row = Record<string, unknown>
type PreviewAction = {
  fila: number
  accion: 'CREAR' | 'ACTUALIZAR' | 'OMITIR' | 'ERROR'
  detalle: string
}

function normalizeKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function createRowMap(row: Row): Map<string, unknown> {
  const map = new Map<string, unknown>()
  for (const [key, value] of Object.entries(row)) {
    map.set(normalizeKey(key), value)
  }
  return map
}

function getString(rowMap: Map<string, unknown>, aliases: string[]): string | null {
  for (const alias of aliases) {
    const value = rowMap.get(normalizeKey(alias))
    if (value === null || value === undefined) continue
    const str = String(value).trim()
    if (str) return str
  }
  return null
}

function parseNumber(value: string | null): number | null {
  if (!value) return null
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  if (Number.isNaN(parsed)) return null
  return Math.round(parsed)
}

function parseBoolean(value: string | null): boolean | null {
  if (!value) return null
  const normalized = normalizeKey(value)
  if (['si', 's', 'true', '1', 'yes'].includes(normalized)) return true
  if (['no', 'n', 'false', '0'].includes(normalized)) return false
  return null
}

function normalizeTipoPropiedad(value: string | null): string {
  if (!value) return 'OTRO'
  const normalized = normalizeKey(value)
  if (normalized.includes('depto') || normalized.includes('departamento')) return 'DEPARTAMENTO'
  if (normalized.includes('casa')) return 'CASA'
  if (normalized.includes('terreno') || normalized.includes('lote')) return 'TERRENO'
  if (normalized.includes('oficina')) return 'OFICINA'
  if (normalized.includes('local')) return 'LOCAL'
  return 'OTRO'
}

function normalizeMoneda(value: string | null, precioTexto: string | null): string {
  const source = (value || precioTexto || '').toLowerCase()
  if (source.includes('usd') || source.includes('u$s') || source.includes('dolar')) return 'USD'
  if (source.includes('ars') || source.includes('$')) return 'ARS'
  return 'USD'
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const fileName = typeof body.fileName === 'string' ? body.fileName : ''
    const fileData = typeof body.fileData === 'string' ? body.fileData : ''
    const inmobiliariaIdBody = typeof body.inmobiliariaId === 'string' ? body.inmobiliariaId : null
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId : null
    const preview = body.preview === true || body.mode === 'preview'

    if (!fileName || !fileData) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 })
    }

    let targetUser: { id: string; inmobiliariaId: string | null } | null = null
    if (targetUserId) {
      targetUser = await prisma.usuario.findUnique({
        where: { id: targetUserId },
        select: { id: true, inmobiliariaId: true },
      })
    }

    const inmobiliariaId =
      currentUser.rol === 'superadmin'
        ? (inmobiliariaIdBody ?? targetUser?.inmobiliariaId ?? currentUser.inmobiliariaId ?? null)
        : (currentUser.inmobiliariaId ?? null)

    if (currentUser.rol === 'superadmin' && !inmobiliariaId) {
      return NextResponse.json(
        { error: 'Como superadmin debes seleccionar un agente o una inmobiliaria destino antes de importar.' },
        { status: 400 }
      )
    }

    const ownerUserId = currentUser.rol === 'superadmin' && targetUser?.id ? targetUser.id : currentUser.id

    const buffer = Buffer.from(fileData, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Row[]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'El archivo esta vacio' }, { status: 400 })
    }

    let creadas = 0
    let actualizadas = 0
    let omitidas = 0
    const errors: string[] = []
    const acciones: PreviewAction[] = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      const rowNumber = index + 2

      try {
        const rowMap = createRowMap(row)

        const titulo = getString(rowMap, ['titulo', 'title'])
        const tipoRaw = getString(rowMap, ['tipo', 'tipo propiedad', 'property type'])
        const tipo = normalizeTipoPropiedad(tipoRaw)
        const subtipo = tipoRaw
        const zona = getString(rowMap, ['zona', 'barrio'])
        const localidad = getString(rowMap, ['localidad', 'ciudad'])
        const descripcion = getString(rowMap, ['descripcion', 'description'])
        const precioTexto = getString(rowMap, ['precio', 'price'])
        const precio = parseNumber(precioTexto)
        const moneda = normalizeMoneda(getString(rowMap, ['moneda', 'currency']), precioTexto)
        const ambientes = parseNumber(getString(rowMap, ['ambientes']))
        const banos = parseNumber(getString(rowMap, ['banos', 'baños', 'bathrooms', 'banyos']))
        const dormitorios = parseNumber(getString(rowMap, ['dormitorios', 'habitaciones', 'bedrooms']))
        const superficie = parseNumber(getString(rowMap, ['superficie', 'area_m2', 'm2', 'superficie total']))
        const superficieCubierta = parseNumber(
          getString(rowMap, ['superficieCubierta', 'superficie cubierta', 'covered_m2'])
        )
        const direccion = getString(rowMap, ['direccion', 'address'])
        const ubicacion =
          getString(rowMap, ['ubicacion', 'location']) ??
          ([direccion, zona, localidad].filter(Boolean).join(', ') || null)
        const whatsapp = getString(rowMap, ['whatsapp', 'telefono', 'celular'])
        const urlMls = getString(rowMap, ['urlMls', 'url', 'link'])
        const aptaCredito = parseBoolean(getString(rowMap, ['aptaCredito', 'apta credito'])) ?? false

        if (!ubicacion) {
          omitidas++
          acciones.push({ fila: rowNumber, accion: 'OMITIR', detalle: 'Falta ubicacion o direccion' })
          errors.push(`Fila ${rowNumber}: falta ubicacion o direccion.`)
          continue
        }

        const where: {
          direccion?: string
          tipo: string
          inmobiliariaId: string | null
          ubicacion?: string
        } = {
          tipo,
          inmobiliariaId,
        }

        if (direccion) {
          where.direccion = direccion
        } else {
          where.ubicacion = ubicacion
        }

        const existing = await prisma.propiedad.findFirst({
          where,
          select: { id: true },
        })

        const data = {
          titulo: titulo ?? null,
          tipo,
          subtipo: subtipo ?? null,
          ubicacion,
          zona: zona ?? null,
          localidad: localidad ?? null,
          direccion: direccion ?? null,
          precio,
          moneda,
          descripcion: descripcion ?? null,
          dormitorios,
          ambientes,
          banos,
          superficie,
          superficieCubierta,
          whatsapp: whatsapp ?? null,
          urlMls: urlMls ?? null,
          aptaCredito,
          usuarioId: ownerUserId,
          inmobiliariaId,
        }

        if (existing) {
          if (!preview) {
            await prisma.propiedad.update({
              where: { id: existing.id },
              data,
            })
          }
          actualizadas++
          acciones.push({
            fila: rowNumber,
            accion: 'ACTUALIZAR',
            detalle: `${titulo || direccion || ubicacion || 'Propiedad'}`
          })
        } else {
          if (!preview) {
            await prisma.propiedad.create({
              data: {
                ...data,
                imagenes: [],
                estado: 'BORRADOR',
              },
            })
          }
          creadas++
          acciones.push({
            fila: rowNumber,
            accion: 'CREAR',
            detalle: `${titulo || direccion || ubicacion || 'Propiedad'}`
          })
        }
      } catch (rowError) {
        acciones.push({
          fila: rowNumber,
          accion: 'ERROR',
          detalle: (rowError as Error).message
        })
        errors.push(`Fila ${rowNumber}: ${(rowError as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      mode: preview ? 'preview' : 'import',
      totalFilas: rows.length,
      creadas,
      actualizadas,
      omitidas,
      count: creadas + actualizadas,
      acciones: acciones.slice(0, 30),
      errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
    })
  } catch (error) {
    console.error('Error en importacion de propiedades:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
