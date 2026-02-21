import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

type Row = Record<string, unknown>
type PreviewAction = {
  fila: number
  accion: 'CREAR' | 'ACTUALIZAR' | 'OMITIR' | 'ERROR'
  entidad: 'CLIENTE' | 'BUSQUEDA'
  detalle: string
}

type ClienteImport = {
  id: string
  nombreCompleto: string
  telefono: string | null
  email: string | null
  notas: string | null
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
    const raw = rowMap.get(normalizeKey(alias))
    if (raw === null || raw === undefined) continue
    const value = String(raw).trim()
    if (value) return value
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

function normalizeOrigen(value: string | null): string {
  if (!value) return 'ACTIVA'
  const normalized = normalizeKey(value)
  if (normalized.includes('calificadaefectivo')) return 'CALIFICADA_EFECTIVO'
  if (normalized.includes('calificadacredito')) return 'CALIFICADA_CREDITO'
  if (normalized.includes('personalizada')) return 'PERSONALIZADA'
  if (normalized.includes('activa')) return 'ACTIVA'
  return value.toUpperCase()
}

function normalizeTipoPropiedad(value: string | null): string | null {
  if (!value) return null
  const normalized = normalizeKey(value)
  if (normalized.includes('depto') || normalized.includes('departamento')) return 'DEPARTAMENTO'
  if (normalized.includes('casa')) return 'CASA'
  return 'OTRO'
}

function normalizeEstado(value: string | null): string {
  if (!value) return 'NUEVO'
  const normalized = value.trim().toUpperCase()
  const allowed = new Set(['NUEVO', 'CALIFICADO', 'VISITA', 'RESERVA', 'CERRADO', 'PERDIDO'])
  return allowed.has(normalized) ? normalized : 'NUEVO'
}

function inferMoneda(presupuestoTexto: string | null, moneda: string | null): string | null {
  if (moneda) return moneda.trim().toUpperCase()
  if (!presupuestoTexto) return null
  const text = presupuestoTexto.toLowerCase()
  if (text.includes('usd') || text.includes('u$s') || text.includes('dolar')) return 'USD'
  if (text.includes('ars') || text.includes('$')) return 'ARS'
  return null
}

function normalizePrioridad(value: string | null): 'ALTA' | 'MEDIA' | 'BAJA' | null {
  if (!value) return null
  const normalized = normalizeKey(value)
  if (normalized.includes('alta')) return 'ALTA'
  if (normalized.includes('media')) return 'MEDIA'
  if (normalized.includes('baja')) return 'BAJA'
  return null
}

function upsertPrioridadInPlanillaRef(raw: string | null, prioridad: 'ALTA' | 'MEDIA' | 'BAJA' | null): string | null {
  const parts = String(raw || '')
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !/^PRIORIDAD:/i.test(p))

  if (prioridad) {
    parts.push(`PRIORIDAD:${prioridad}`)
  }

  return parts.length > 0 ? parts.join('|') : null
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

    let clientesCreados = 0
    let clientesActualizados = 0
    let busquedasCreadas = 0
    let busquedasActualizadas = 0
    let busquedasDuplicadas = 0
    let filasOmitidas = 0
    const errors: string[] = []
    const acciones: PreviewAction[] = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      const rowNumber = index + 2

      try {
        const rowMap = createRowMap(row)
        const nombreCompleto = getString(rowMap, [
          'cliente',
          'nombre',
          'nombreCompleto',
          'nombre cliente',
          'cliente o nombre',
          'cliente/nombre',
        ])

        if (!nombreCompleto) {
          filasOmitidas++
          acciones.push({
            fila: rowNumber,
            accion: 'OMITIR',
            entidad: 'CLIENTE',
            detalle: 'Falta nombre de cliente',
          })
          errors.push(`Fila ${rowNumber}: falta nombre de cliente.`)
          continue
        }

        const telefono = getString(rowMap, ['telefono', 'tel', 'celular', 'whatsapp'])
        const email = getString(rowMap, ['email', 'correo', 'mail'])
        const notasCliente = getString(rowMap, ['notasCliente', 'notas cliente', 'notaCliente', 'notas'])

        let cliente: ClienteImport | null = await prisma.cliente.findFirst({
          where: {
            nombreCompleto,
            inmobiliariaId,
          },
          select: {
            id: true,
            nombreCompleto: true,
            telefono: true,
            email: true,
            notas: true,
          },
        })

        if (!cliente) {
          if (!preview) {
            cliente = await prisma.cliente.create({
              data: {
                nombreCompleto,
                telefono,
                email,
                notas: notasCliente,
                usuarioId: ownerUserId,
                inmobiliariaId,
              },
              select: {
                id: true,
                nombreCompleto: true,
                telefono: true,
                email: true,
                notas: true,
              },
            })
          } else {
            cliente = {
              id: `preview-cliente-${rowNumber}`,
              nombreCompleto,
              telefono,
              email,
              notas: notasCliente,
            }
          }
          clientesCreados++
          acciones.push({
            fila: rowNumber,
            accion: 'CREAR',
            entidad: 'CLIENTE',
            detalle: nombreCompleto,
          })
        } else {
          const shouldUpdate =
            (telefono && telefono !== cliente.telefono) ||
            (email && email !== cliente.email) ||
            (notasCliente && notasCliente !== cliente.notas)

          if (shouldUpdate) {
            if (!preview) {
              cliente = await prisma.cliente.update({
                where: { id: cliente.id },
                data: {
                  telefono: telefono ?? cliente.telefono,
                  email: email ?? cliente.email,
                  notas: notasCliente ?? cliente.notas,
                },
                select: {
                  id: true,
                  nombreCompleto: true,
                  telefono: true,
                  email: true,
                  notas: true,
                },
              })
            }
            clientesActualizados++
            acciones.push({
              fila: rowNumber,
              accion: 'ACTUALIZAR',
              entidad: 'CLIENTE',
              detalle: nombreCompleto,
            })
          }
        }

        const origen = normalizeOrigen(getString(rowMap, ['origen', 'tipoOrigen']))
        const monedaInput = getString(rowMap, ['moneda', 'currency', 'divisa'])
        const presupuestoTextoRaw =
          getString(rowMap, ['presupuestoTexto', 'presupuesto', 'rangoPresupuesto', 'consulta']) ?? null
        const presupuestoDesde = parseNumber(
          getString(rowMap, ['presupuestoDesde', 'precioDesde', 'desde', 'presupuestoMin', 'minimo'])
        )
        const presupuestoHasta = parseNumber(
          getString(rowMap, ['presupuestoHasta', 'precioHasta', 'hasta', 'presupuestoMax', 'maximo', 'monto'])
        )
        const monedaInferida = inferMoneda(presupuestoTextoRaw, monedaInput)
        const moneda = monedaInferida || 'USD'

        const presupuestoTexto =
          presupuestoTextoRaw ||
          (presupuestoDesde !== null && presupuestoHasta !== null
            ? `${moneda} ${presupuestoDesde}-${presupuestoHasta}`
            : presupuestoHasta !== null
              ? `${moneda} ${presupuestoHasta}`
              : presupuestoDesde !== null
                ? `${moneda} desde ${presupuestoDesde}`
                : null)

        const presupuestoValorRaw = getString(rowMap, ['presupuestoValor', 'presupuestoMax', 'monto'])
        const presupuestoValor =
          presupuestoHasta ??
          parseNumber(presupuestoValorRaw ?? presupuestoTexto)
        const tipoPropiedad = normalizeTipoPropiedad(
          getString(rowMap, ['tipoPropiedad', 'tipo', 'propiedad', 'tipo propiedad'])
        )
        const barrio = getString(rowMap, ['barrio', 'zona'])
        const ciudad = getString(rowMap, ['ciudad', 'localidad'])
        const provincia = getString(rowMap, ['provincia'])
        const ubicacionDirecta =
          getString(rowMap, ['ubicacionPreferida', 'ubicacion']) ?? null
        const ubicacionPreferida =
          ubicacionDirecta ||
          [barrio, ciudad, provincia].filter(Boolean).join(', ') ||
          null
        const dormitoriosMin = parseNumber(getString(rowMap, ['dormitoriosMin', 'dormitorios']))
        const cochera = getString(rowMap, ['cochera'])
        const prioridad = normalizePrioridad(getString(rowMap, ['prioridad', 'priority']))
        const finalidad = getString(rowMap, ['finalidad'])
        const observaciones = getString(rowMap, ['observaciones', 'detalleConsulta', 'consulta']) ?? null
        const planillaRef = upsertPrioridadInPlanillaRef(
          getString(rowMap, ['planillaRef', 'referencia', 'idExterno']),
          prioridad
        )
        const estado = normalizeEstado(getString(rowMap, ['estado']))

        const existeBusqueda = await prisma.busqueda.findFirst({
          where: {
            clienteId: cliente.id,
            origen,
            tipoPropiedad,
            ubicacionPreferida,
            presupuestoTexto,
          },
          select: {
            id: true,
            moneda: true,
            presupuestoValor: true,
            dormitoriosMin: true,
            cochera: true,
            finalidad: true,
            estado: true,
            observaciones: true,
            planillaRef: true,
          },
        })

        if (existeBusqueda) {
          const shouldUpdateBusqueda =
            (moneda && moneda !== existeBusqueda.moneda) ||
            (presupuestoValor !== null && presupuestoValor !== existeBusqueda.presupuestoValor) ||
            (dormitoriosMin !== null && dormitoriosMin !== existeBusqueda.dormitoriosMin) ||
            (cochera && cochera !== existeBusqueda.cochera) ||
            (finalidad && finalidad !== existeBusqueda.finalidad) ||
            (estado && estado !== existeBusqueda.estado) ||
            (observaciones && observaciones !== existeBusqueda.observaciones) ||
            (planillaRef && planillaRef !== existeBusqueda.planillaRef)

          if (shouldUpdateBusqueda) {
            if (!preview) {
              await prisma.busqueda.update({
                where: { id: existeBusqueda.id },
                data: {
                  moneda: moneda ?? existeBusqueda.moneda,
                  presupuestoValor: presupuestoValor ?? existeBusqueda.presupuestoValor,
                  dormitoriosMin: dormitoriosMin ?? existeBusqueda.dormitoriosMin,
                  cochera: cochera ?? existeBusqueda.cochera,
                  finalidad: finalidad ?? existeBusqueda.finalidad,
                  estado: estado ?? existeBusqueda.estado,
                  observaciones: observaciones ?? existeBusqueda.observaciones,
                  planillaRef: planillaRef ?? existeBusqueda.planillaRef,
                },
              })
            }
            busquedasActualizadas++
            acciones.push({
              fila: rowNumber,
              accion: 'ACTUALIZAR',
              entidad: 'BUSQUEDA',
              detalle: `${nombreCompleto} · ${tipoPropiedad || 'SIN TIPO'}`,
            })
          } else {
            busquedasDuplicadas++
            acciones.push({
              fila: rowNumber,
              accion: 'OMITIR',
              entidad: 'BUSQUEDA',
              detalle: `${nombreCompleto} · duplicada`,
            })
          }
          continue
        }

        if (!preview) {
          await prisma.busqueda.create({
            data: {
              clienteId: cliente.id,
              origen,
              presupuestoTexto,
              presupuestoValor,
              moneda,
              tipoPropiedad,
              ubicacionPreferida,
              dormitoriosMin,
              cochera,
              finalidad,
              estado,
              observaciones,
              planillaRef,
              createdBy: ownerUserId,
            },
          })
        }
        busquedasCreadas++
        acciones.push({
          fila: rowNumber,
          accion: 'CREAR',
          entidad: 'BUSQUEDA',
          detalle: `${nombreCompleto} · ${tipoPropiedad || 'SIN TIPO'}`,
        })
      } catch (rowError) {
        acciones.push({
          fila: rowNumber,
          accion: 'ERROR',
          entidad: 'BUSQUEDA',
          detalle: (rowError as Error).message,
        })
        errors.push(`Fila ${rowNumber}: ${(rowError as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      mode: preview ? 'preview' : 'import',
      totalFilas: rows.length,
      clientesCreados,
      clientesActualizados,
      busquedasCreadas,
      busquedasActualizadas,
      busquedasDuplicadas,
      filasOmitidas,
      acciones: acciones.slice(0, 40),
      errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
    })
  } catch (error) {
    console.error('Error en importacion de clientes y busquedas:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
