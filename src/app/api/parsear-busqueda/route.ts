import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'
import OpenAI from 'openai'

export const maxDuration = 55
import {
  BusquedaParseada, PortalDiagCounter, PortalKey,
  newPortalTelemetry, SCRAPED_MAX_TOTAL, SCRAPED_MAX_PER_PORTAL, MAX_DB_MATCHES,
  ZONAS_SANTA_FE_DEFAULT, esItemDeSantaFe, diversificarPorPortal,
  getDormitoriosFiltro,
} from '@/lib/scrapers'
import {
  scrapearMercadoLibre, scrapearArgenProp, scrapearRemax,
  scrapearZonaProp, scrapearBuscainmueble,
} from '@/lib/scrapers/portals'
import {
  buildMercadoLibreUrl, buildArgenPropUrl, buildRemaxUrl,
  buildZonaPropUrl, buildBuscainmuebleUrl,
} from '@/lib/scrapers/url-builders'

type FiltrosPortalesInput = {
  moneda?: string
  precioDesde?: string | number
  precioHasta?: string | number
  dormitoriosMin?: string | number
  ambientesMin?: string | number
}


function normalizarZonasSantaFe(zonas: unknown): string[] {
  const lista = Array.isArray(zonas) ? zonas : []
  const limpias = lista
    .map((z) => String(z || '').trim())
    .filter(Boolean)

  const prohibidas = [
    'buenos aires',
    'capital federal',
    'caba',
    'palermo',
    'belgrano',
    'olivos',
    'pilar',
    'escobar',
    'martinez',
  ]

  const filtradas = limpias.filter((z) => {
    const lower = z.toLowerCase()
    return !prohibidas.some((p) => lower.includes(p))
  })

  return filtradas.length > 0 ? filtradas : ZONAS_SANTA_FE_DEFAULT
}

function parseIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const cleaned = String(value).replace(/[^\d]/g, '')
  if (!cleaned) return null
  const parsed = Number.parseInt(cleaned, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function esZonaAmpliaSantaFe(zona: string): boolean {
  const z = zona.toLowerCase()
  return (
    z.includes('bulevar') ||
    z.includes('boulevard') ||
    z.includes('dentro de bulevares') ||
    z.includes('dentro de bv') ||
    z.includes('santa fe capital')
  )
}

function aplicarFiltrosPortales(
  criterios: BusquedaParseada,
  filtros: FiltrosPortalesInput | null | undefined
): BusquedaParseada {
  if (!filtros) return criterios

  const moneda = String(filtros.moneda || '').toUpperCase()
  const precioDesde = parseIntOrNull(filtros.precioDesde)
  const precioHasta = parseIntOrNull(filtros.precioHasta)
  const dormitoriosMin = parseIntOrNull(filtros.dormitoriosMin)
  const ambientesMin = parseIntOrNull(filtros.ambientesMin)

  return {
    ...criterios,
    moneda: moneda === 'ARS' || moneda === 'USD' ? moneda : criterios.moneda,
    presupuestoMin: precioDesde ?? criterios.presupuestoMin,
    presupuestoMax: precioHasta ?? criterios.presupuestoMax,
    dormitoriosMin: dormitoriosMin ?? criterios.dormitoriosMin,
    ambientesMin: ambientesMin ?? criterios.ambientesMin,
  }
}

// URL builders, scraping utils, fetchWithTimeout -> importados de @/lib/scrapers

// POST: Parsear mensaje de WhatsApp
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { mensaje, guardar, clienteId, filtrosPortales } = await request.json()

    if (!mensaje || mensaje.trim().length < 10) {
      return NextResponse.json(
        { error: 'El mensaje es muy corto para analizar' },
        { status: 400 }
      )
    }

    // Intentar primero con IA si estÃƒÂ¡ configurada, de lo contrario usar parser local
    let busquedaParseada: BusquedaParseada;
    let usandoIA = false;

    try {
      if (process.env.OPENAI_API_KEY) {
        console.log('Utilizando IA para analizar el mensaje...');
        busquedaParseada = await parsearBusquedaConIA(mensaje);
        usandoIA = true;
      } else {
        console.log('OPENAI_API_KEY no configurada, usando parser local...');
        busquedaParseada = parsearBusquedaLocal(mensaje);
      }
    } catch (aiError: any) {
      const code = aiError?.code || aiError?.type || 'ai_error'
      const status = aiError?.status || 0
      const msg = aiError?.message || 'sin detalle'
      console.warn(`[IA fallback] ${code} status=${status} -> parser local (${msg})`)
      busquedaParseada = parsearBusquedaLocal(mensaje);
    }

    busquedaParseada = aplicarFiltrosPortales(busquedaParseada, filtrosPortales)

    let guardadoInfo = null;

    // Si se pide guardar, crear cliente y bÃƒÂºsqueda
    if (guardar) {
      let cliente = null

      // Si se proporciona clienteId, usarlo directamente
      if (clienteId) {
        cliente = await prisma.cliente.findUnique({
          where: { id: clienteId }
        })
        
        if (!cliente) {
          return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
        }

        if (cliente.inmobiliariaId !== currentUser.inmobiliariaId) {
          return NextResponse.json({ error: 'No autorizado para este cliente' }, { status: 403 })
        }
      } else {
        const nombreFallback = `Cliente WhatsApp ${new Date().toLocaleDateString()}`
        const nombreParaGuardar = busquedaParseada.nombreCliente || nombreFallback

        cliente = await prisma.cliente.findFirst({
          where: {
            inmobiliariaId: currentUser.inmobiliariaId,
            OR: [
               ...(busquedaParseada.telefono ? [{ telefono: busquedaParseada.telefono }] : []),
               { nombreCompleto: nombreParaGuardar }
            ]
          }
        })

        if (!cliente) {
          try {
            cliente = await prisma.cliente.create({
              data: {
                nombreCompleto: nombreParaGuardar,
                telefono: busquedaParseada.telefono,
                inmobiliariaId: currentUser.inmobiliariaId!,
                usuarioId: currentUser.id,
              }
            })
          } catch (e: any) {
             if (e.code === 'P2002') {
                cliente = await prisma.cliente.findFirst({
                  where: {
                    nombreCompleto: nombreParaGuardar,
                    inmobiliariaId: currentUser.inmobiliariaId
                  }
                })
             }
             if (!cliente) throw e
          }
        }
      }

      if (cliente) {
        const busqueda = await prisma.busqueda.create({
          data: {
            clienteId: cliente.id,
            tipoPropiedad: busquedaParseada.tipoPropiedad,
            presupuestoTexto: busquedaParseada.presupuestoMax 
              ? `${busquedaParseada.moneda} ${busquedaParseada.presupuestoMax.toLocaleString()}`
              : null,
            presupuestoValor: busquedaParseada.presupuestoMax,
            moneda: busquedaParseada.moneda,
            ubicacionPreferida: busquedaParseada.zonas.join(', '),
            dormitoriosMin: busquedaParseada.dormitoriosMin,
            cochera: busquedaParseada.cochera ? 'SI' : 'NO',
            observaciones: `OperaciÃƒÂ³n: ${busquedaParseada.operacion}\n${busquedaParseada.notas}\n\nCaracterÃƒÂ­sticas: ${busquedaParseada.caracteristicas.join(', ')}\n\n--- Mensaje original ---\n${mensaje}`,
            origen: 'PERSONALIZADA',
            estado: 'ACTIVA',
            createdBy: currentUser.id,
          }
        })
        guardadoInfo = {
          clienteId: cliente.id,
          clienteNombre: cliente.nombreCompleto,
          busquedaId: busqueda.id,
        }
      }
    }

    // Buscar coincidencias y scraping paralelo
    const [matches, webMatches] = await Promise.all([
      encontrarMatchesEnDb(busquedaParseada, currentUser),
      Promise.resolve(generarLinksExternos(busquedaParseada))
    ])
    
    const telemetry = newPortalTelemetry()
    console.log('Iniciando scraping paralelo de portales...')
    const [mlItems, apItems, remaxItems, zpItems, biItems] = await Promise.all([
      scrapearMercadoLibre(busquedaParseada, telemetry.mercadolibre),
      scrapearArgenProp(busquedaParseada, telemetry.argenprop),
      scrapearRemax(busquedaParseada, telemetry.remax),
      scrapearZonaProp(busquedaParseada, telemetry.zonaprop),
      scrapearBuscainmueble(busquedaParseada, telemetry.buscainmueble)
    ])

    const allScraped = [...mlItems, ...apItems, ...remaxItems, ...zpItems, ...biItems]
    const uniqueScraped = Array.from(new Map(allScraped.map(item => [item.url, item])).values())
      .filter((item: any) => esItemDeSantaFe(item))
    const scrapedDiversificado = diversificarPorPortal(
      uniqueScraped,
      SCRAPED_MAX_TOTAL,
      SCRAPED_MAX_PER_PORTAL
    )
    const scrapedItemsFinal = scrapedDiversificado.slice(0, 50)
    const portalStats = {
      mercadolibre: mlItems.length,
      argenprop: apItems.length,
      remax: remaxItems.length,
      zonaprop: zpItems.length,
      buscainmueble: biItems.length,
      totalUnicos: uniqueScraped.length,
      totalDiversificados: scrapedDiversificado.length,
      totalFallbackLinks: 0,
    }

    const buildPortalDiag = (portal: string, count: number, counter: PortalDiagCounter) => {
      let estado = 'SIN_RESULTADOS'
      let razon = 'No se extrajeron publicaciones validas para los filtros.'

      if (count > 0) {
        estado = 'OK'
        razon = `${count} publicaciones extraidas.`
      } else if (counter.timeouts > 0) {
        estado = 'TIMEOUT'
        razon = 'El portal no respondio a tiempo durante el scraping.'
      } else if (counter.blockedSignals > 0) {
        estado = 'BLOQUEO_PROBABLE'
        razon = 'Se detectaron senales de bloqueo o anti-bot.'
      } else if (counter.httpErrors > 0) {
        estado = 'HTTP_ERROR'
        razon = 'El portal respondio con error HTTP.'
      } else if (counter.selectorFallbacks > 0) {
        estado = 'SELECTOR_SIN_MATCH'
        razon = 'Cambio de estructura HTML o selectores sin coincidencias.'
      }

      return {
        portal,
        estado,
        razon,
        publicaciones: count,
        metricas: counter,
      }
    }

    const portalDiagnostics = [
      buildPortalDiag('MercadoLibre', mlItems.length, telemetry.mercadolibre),
      buildPortalDiag('ArgenProp', apItems.length, telemetry.argenprop),
      buildPortalDiag('Remax', remaxItems.length, telemetry.remax),
      buildPortalDiag('ZonaProp', zpItems.length, telemetry.zonaprop),
      buildPortalDiag('Buscainmueble', biItems.length, telemetry.buscainmueble),
    ]

    return NextResponse.json({
      success: true,
      busquedaParseada,
      matches,
      webMatches,
      scrapedItems: scrapedItemsFinal,
      portalStats,
      portalDiagnostics,
      usandoIA,
      guardado: guardadoInfo
    })
  } catch (error: unknown) {
    console.error('Error parseando bÃƒÂºsqueda:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al procesar el mensaje'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// ----------------------------------------------------------------------
// PARSER CON IA (OpenAI)
// ----------------------------------------------------------------------
async function parsearBusquedaConIA(mensaje: string): Promise<BusquedaParseada> {
  const openaiApiKey = process.env.OPENAI_API_KEY
  const aiModel = process.env.AI_MODEL || 'gpt-4o-mini'
  const aiTemperature = parseFloat(process.env.AI_TEMPERATURE || '0.3')

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY no configurada')
  }

  const openai = new OpenAI({
    apiKey: openaiApiKey,
  })

  const systemPrompt = `Eres un asistente experto en anÃƒÂ¡lisis de mensajes de WhatsApp para bÃƒÂºsquedas inmobiliarias en Santa Fe Capital, Argentina.

Analiza el mensaje y extrae la siguiente informaciÃƒÂ³n en formato JSON:
{
  "tipoPropiedad": "CASA|DEPARTAMENTO|TERRENO|PH|LOCAL|OFICINA|OTRO",
  "operacion": "COMPRA|ALQUILER",
  "presupuestoMin": nÃƒÂºmero o null,
  "presupuestoMax": nÃƒÂºmero o null,
  "moneda": "USD|ARS",
  "zonas": ["array de zonas mencionadas"],
  "dormitoriosMin": nÃƒÂºmero o null,
  "ambientesMin": nÃƒÂºmero o null,
  "cochera": true|false,
  "caracteristicas": ["array de caracterÃƒÂ­sticas especiales"],
  "notas": "texto adicional relevante"
}

Zonas comunes en Santa Fe Capital: Candioti, Centro, Microcentro, Barrio Sur, Barrio Norte, Guadalupe, 7 Jefes, Bulevar, Constituyentes, Mayoraz, Maria Selva, Sargento Cabral, Las Flores, Roma, Fomento, Barranquitas, Los Hornos, Ciudadela, San MartÃƒÂ­n, Recoleta, Puerto, Costanera, Villa Setubal.

IMPORTANTE: 
- SIEMPRE asume que la bÃƒÂºsqueda es para Santa Fe Capital, Argentina
- Si menciona "Santa Fe" sin mÃƒÂ¡s detalles, asume que es Santa Fe Capital
- Si NO menciona ninguna zona especÃƒÂ­fica, SIEMPRE usa ["Santa Fe Capital"] por defecto
- Si menciona zonas de Buenos Aires (Palermo, Belgrano, Hilarion, Quintana, Villa Ballester, etc.), IGNÃƒâ€œRALAS completamente
- Si menciona "habitaciones", "dormitorios", "ambientes" sin zona, asume Santa Fe Capital
- Para presupuesto, extrae solo nÃƒÂºmeros (ej: "USD 150.000" -> 150000)
- NUNCA uses zonas de Buenos Aires, solo zonas de Santa Fe Capital
- Responde SOLO con el JSON, sin texto adicional.`

  const userPrompt = `Analiza este mensaje de WhatsApp y extrae la informaciÃƒÂ³n de bÃƒÂºsqueda inmobiliaria:\n\n"${mensaje}"`

  try {
    const completion = await openai.chat.completions.create({
      model: aiModel,
      temperature: aiTemperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    })

    const respuesta = completion.choices[0]?.message?.content
    if (!respuesta) {
      throw new Error('No se recibiÃƒÂ³ respuesta de la IA')
    }

    const parsed = JSON.parse(respuesta)

    return {
      nombreCliente: null,
      telefono: null,
      tipoPropiedad: parsed.tipoPropiedad || 'OTRO',
      operacion: parsed.operacion || 'COMPRA',
      presupuestoMin: parsed.presupuestoMin || null,
      presupuestoMax: parsed.presupuestoMax || null,
      moneda: parsed.moneda || 'USD',
      zonas: normalizarZonasSantaFe(parsed.zonas),
      dormitoriosMin: parsed.dormitoriosMin || null,
      ambientesMin: parsed.ambientesMin || null,
      cochera: parsed.cochera || false,
      caracteristicas: Array.isArray(parsed.caracteristicas) ? parsed.caracteristicas : [],
      notas: parsed.notas || `Procesado con IA. ${mensaje.substring(0, 100)}`,
      confianza: 90 // IA tiene mayor confianza
    }
  } catch (error: any) {
    const code = error?.code || error?.type || 'ai_error'
    const status = error?.status || 0
    const msg = error?.message || 'sin detalle'
    console.warn(`[IA parse] ${code} status=${status}: ${msg}`)
    throw error
  }
}

// ----------------------------------------------------------------------
// PARSER LOCAL DE FALLBACK (Regex System)
// ----------------------------------------------------------------------
function parsearBusquedaLocal(mensaje: string): BusquedaParseada {
  const msg = mensaje.toLowerCase()
  
  // 1. Detectar OperaciÃƒÂ³n
  let operacion = 'COMPRA'
  if (msg.includes('alquilo') || msg.includes('alquilar') || msg.includes('alquiler') || msg.includes('renta')) {
    operacion = 'ALQUILER'
  }
  
  // 2. Detectar Tipo
  let tipoPropiedad = 'OTRO'
  if (msg.includes('casa') || msg.includes('chalet') || msg.includes('duplex')) tipoPropiedad = 'CASA'
  else if (msg.includes('depto') || msg.includes('departamento') || msg.includes('piso')) tipoPropiedad = 'DEPARTAMENTO'
  else if (msg.includes('terreno') || msg.includes('lote')) tipoPropiedad = 'TERRENO'
  else if (msg.includes('ph')) tipoPropiedad = 'PH'
  else if (msg.includes('local') || msg.includes('comercio')) tipoPropiedad = 'LOCAL'
  else if (msg.includes('oficina') || msg.includes('consultorio')) tipoPropiedad = 'OFICINA'
  else if (msg.includes('cochera') || msg.includes('garage')) tipoPropiedad = 'COCHERA'
  else if (msg.includes('quinta')) tipoPropiedad = 'CASA' // Mapear quinta a casa o crear tipo QUINTA

  // 3. Detectar Moneda
  let moneda = 'USD'
  if (msg.includes('pesos') || msg.includes('ars') || msg.includes('$')) {
    // Si dice "dolares" o "usd" es USD
    if (operacion === 'ALQUILER' && !msg.includes('usd') && !msg.includes('dolares')) moneda = 'ARS'
  }
  if (msg.includes('us$') || msg.includes('u$d') || msg.includes('dÃƒÂ³lares') || msg.includes('dolares') || msg.includes('usd')) {
    moneda = 'USD'
  }

  // 4. Detectar Presupuesto
  let presupuestoMin: number | null = null
  let presupuestoMax: number | null = null
  const rangoRegex = /(?:entre|de)\s*(?:u\$s|u\$d|usd|ars|\$)?\s*(\d+(?:[\.,]\d+)?)\s*(k|mil|m|millones)?\s*(?:y|a|-)\s*(?:u\$s|u\$d|usd|ars|\$)?\s*(\d+(?:[\.,]\d+)?)\s*(k|mil|m|millones)?/i
  const matchRango = mensaje.match(rangoRegex)

  const parseMonto = (raw: string, sufijo?: string) => {
    let n = parseFloat(raw.replace(/\./g, '').replace(/,/g, '.'))
    const s = (sufijo || '').toLowerCase()
    if (s === 'k' || s === 'mil') n *= 1000
    if (s === 'm' || s === 'millones') n *= 1000000
    if (n < 1000 && n > 0 && operacion === 'COMPRA') n *= 1000
    return n
  }

  if (matchRango) {
    const a = parseMonto(matchRango[1], matchRango[2])
    const b = parseMonto(matchRango[3], matchRango[4])
    presupuestoMin = Math.min(a, b)
    presupuestoMax = Math.max(a, b)
  }
  // Regex mejorado: Busca "hasta X", "max X", "menos de X", "X o menos"
  const precioRegex = /(?:hasta|max|mÃƒÂ¡x|presupuesto|pago|gastarÃƒÂ­a|menos de|precio|valor)\s*(?:de)?\s*(?:u\$s|u\$d|\$|usd|ars)?\s*(\d+(?:[\.,]\d+)?)(?:\s*(?:k|mil|millones|m))?/i
  
  // Intento 1: ExpresiÃƒÂ³n directa
  let matchPrecio = mensaje.match(precioRegex)
  
  // Intento 2: Buscar numero suelto grande cerca de moneda si no hallÃƒÂ³ nada
  if (!matchPrecio) {
     const loosePriceRegex = /(?:u\$s|u\$d|usd)\s*(\d+(?:[\.,]\d+)?)(\s*k|\s*mil)?/i
     matchPrecio = mensaje.match(loosePriceRegex)
  }

  if (!presupuestoMax && matchPrecio) {
    let rawStr = matchPrecio[1].replace(/\./g, '').replace(/,/g, '.')
    let num = parseFloat(rawStr)
    
    // Multipliers
    const suffix = matchPrecio[0].toLowerCase()
    if (suffix.includes('k') || suffix.includes('mil ')) num *= 1000
    if (suffix.includes('millÃƒÂ³n') || suffix.includes('millon') || suffix.includes('m')) num *= 1000000
    
    // Heuristic for "200.000" vs "200"
    if (rawStr.includes('.') && rawStr.split('.')[1].length === 3) {
       num = parseInt(rawStr.replace('.', ''))
    }

    // Fix small numbers (e.g. "200") for properties (assume thousands)
    if (num < 1000 && num > 0) {
       if (operacion === 'COMPRA') num *= 1000 
    }
    presupuestoMax = num
  }

  // 5. Detectar Dormitorios/Ambientes (MEJORADO para detectar "una habitaciÃƒÂ³n", "un dormitorio", etc.)
  let dormitoriosMin: number | null = null
  
  // Mapeo de palabras a nÃƒÂºmeros
  const numerosTexto: Record<string, number> = {
    'una': 1, 'un': 1, 'uno': 1,
    'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
    'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10
  }
  
  // Regex mejorado: busca nÃƒÂºmeros O palabras de nÃƒÂºmero seguidos de dorm/habitaci/hab
  // Ejemplos: "1 habitaciÃƒÂ³n", "una habitaciÃƒÂ³n", "con 2 dormitorios", "un dormitorio"
  const dormRegex1 = /(\d+)\s*(?:dorm|habitaci|hab|cuartos|piezas)/i
  const matchDorm1 = mensaje.match(dormRegex1)
  if (matchDorm1) {
    dormitoriosMin = parseInt(matchDorm1[1])
  } else {
    // Buscar palabras de nÃƒÂºmero + habitaciÃƒÂ³n/dormitorio
    const dormRegex2 = /(?:con|de|tiene|tener)?\s*(una|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:dorm|habitaci|hab|cuartos|piezas)/i
    const matchDorm2 = mensaje.match(dormRegex2)
    if (matchDorm2) {
      const palabraNumero = matchDorm2[1].toLowerCase()
      dormitoriosMin = numerosTexto[palabraNumero] || null
    } else {
      // Buscar "habitaciÃƒÂ³n" o "dormitorio" despuÃƒÂ©s de "una/un"
      const dormRegex3 = /(?:con|de|tiene|tener)?\s*(una|un|uno)\s+(?:habitaci|dorm|hab|cuartos|piezas)/i
      const matchDorm3 = mensaje.match(dormRegex3)
      if (matchDorm3) {
        dormitoriosMin = 1
      }
    }
  }
  
  // TambiÃƒÂ©n buscar por ambientes
  let ambientesMin: number | null = null
  const ambRegex1 = /(\d+)\s*(?:amb)/i
  const matchAmb1 = mensaje.match(ambRegex1)
  if (matchAmb1) {
    ambientesMin = parseInt(matchAmb1[1])
  } else {
    // Buscar "una ambiente", "un ambiente", etc.
    const ambRegex2 = /(?:con|de|tiene|tener)?\s*(una|un|uno|dos|tres|cuatro|cinco)\s+amb/i
    const matchAmb2 = mensaje.match(ambRegex2)
    if (matchAmb2) {
      const palabraNumero = matchAmb2[1].toLowerCase()
      ambientesMin = numerosTexto[palabraNumero] || null
    }
  }
  
  // Si detectamos ambientes pero no dormitorios, usar ambientes como dormitorios
  if (!dormitoriosMin && ambientesMin) {
    dormitoriosMin = ambientesMin
  }

  // 6. Cochera
  const cochera = msg.includes('cochera') || msg.includes('estacionamiento') || msg.includes('garage') || msg.includes('auto')

  // 7. Zonas - SANTA FE CAPITAL Enhanced
  const zonasMap: Record<string, string> = {
    'candioti': 'Candioti',
    'candioti sur': 'Candioti Sur',
    'candioti norte': 'Candioti Norte',
    'sur': 'Barrio Sur',
    'barrio sur': 'Barrio Sur',
    'norte': 'Barrio Norte',
    'guadalupe': 'Guadalupe',
    'guadalupe este': 'Guadalupe Este',
    'guadalupe oeste': 'Guadalupe Oeste',
    '7 jefes': '7 Jefes',
    'siete jefes': '7 Jefes',
    'centro': 'Centro',
    'microcentro': 'Centro',
    'bulevar': 'Bulevar',
    'boulevard': 'Bulevar',
    'constituyentes': 'Constituyentes',
    'mayoraz': 'Mayoraz',
    'maria selva': 'Maria Selva',
    'sargento cabral': 'Sargento Cabral',
    'las flores': 'Las Flores',
    'roma': 'Roma',
    'fomento': 'Fomento 9 de Julio',
    '9 de julio': 'Fomento 9 de Julio',
    'barranquitas': 'Barranquitas',
    'los hornos': 'Los Hornos',
    'ciudadela': 'Ciudadela',
    'san martin': 'San MartÃƒÂ­n',
    'recoleta': 'Recoleta',
    'puerto': 'Puerto',
    'costanera': 'Costanera',
    'lawn tennis': 'Costanera/7 Jefes',
    'avda almirante brown': 'Costanera',
    'villa setubal': 'Villa Setubal'
  }

  const zonasEncontradas: string[] = []
  Object.keys(zonasMap).forEach(key => {
    if (msg.includes(key)) {
      const val = zonasMap[key]
      if (!zonasEncontradas.includes(val)) zonasEncontradas.push(val)
    }
  })

  const zonasFinales = normalizarZonasSantaFe(zonasEncontradas)

  // 8. Particularidades (A refaccionar)
  const caracteristicas: string[] = []
  if (msg.includes('refaccionar') || msg.includes('reciclar') || msg.includes('demoler')) caracteristicas.push('A Refaccionar')
  if (msg.includes('patio')) caracteristicas.push('Patio')
  if (msg.includes('pileta') || msg.includes('piscina')) caracteristicas.push('Pileta')
  if (msg.includes('balcon') || msg.includes('balcÃƒÂ³n')) caracteristicas.push('BalcÃƒÂ³n')

  return {
    nombreCliente: null, 
    telefono: null,
    tipoPropiedad,
    operacion,
    presupuestoMin,
    presupuestoMax,
    moneda,
    zonas: zonasFinales,
    dormitoriosMin,
    ambientesMin,
    cochera,
    caracteristicas,
    notas: `Procesado Localmente (Sin IA). Zonas detectadas: ${zonasFinales.join(', ')}. Presupuesto: ${presupuestoMax} ${moneda}`,
    confianza: 75
  }
}

// ----------------------------------------------------------------------
// BUSCAR PROPIEDADES EN DB (MATCHING AUTOMATICO)
// ----------------------------------------------------------------------
// Respeta permisos: inmobiliaria del usuario y, para agente, solo sus propiedades.
async function encontrarMatchesEnDb(
  criterios: BusquedaParseada,
  currentUser: { id: string; rol: string; inmobiliariaId: string | null }
) {
  // Construir filtros de Prisma - BÃƒÅ¡SQUEDA ESTRICTA (solo coincidencias reales)
  const where: any = {
    estado: { in: ['APROBADA', 'BORRADOR', 'EN_ANALISIS'] },
  }

  // Admin: ve su inmobiliaria. Superadmin y agente: bÃºsqueda global.
  if (currentUser.rol === 'admin' && currentUser.inmobiliariaId) {
    where.inmobiliariaId = currentUser.inmobiliariaId
  }

  // El agente puede buscar en toda la base para encontrar mejores opciones.

  // Validar que tengamos al menos un criterio importante para buscar
  // Ahora siempre tenemos zonas (por defecto "Santa Fe Capital"), asÃƒÂ­ que esto siempre serÃƒÂ¡ true
  const tieneCriterios = criterios.tipoPropiedad || criterios.presupuestoMax || criterios.zonas.length > 0 || criterios.dormitoriosMin
  
  if (!tieneCriterios) {
    // Si no hay criterios especÃƒÂ­ficos, buscar todas las propiedades aprobadas
    const todas = await prisma.propiedad.findMany({
      where,
      take: 10,
      orderBy: { precio: 'asc' },
      include: {
        inmobiliaria: {
          select: {
            nombre: true,
            email: true,
            whatsapp: true,
            slug: true
          }
        }
      }
    })
    return todas
  }

  // Construir condiciones - BÃƒÅ¡SQUEDA MÃƒÂS ESTRICTA (debe cumplir criterios relevantes)
  const condicionesAND: any[] = []
  const condicionesOR: any[] = []

  // Filtrar propiedades con precio vÃƒÂ¡lido (mayor a 0)
  condicionesAND.push({
    precio: { gt: 0 }
  })

  // 1. Tipo de Propiedad (OBLIGATORIO si estÃƒÂ¡ especificado y no es OTRO)
  if (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') {
    condicionesAND.push({
      OR: [
        { tipo: { equals: criterios.tipoPropiedad, mode: 'insensitive' } },
        { tipo: { contains: criterios.tipoPropiedad, mode: 'insensitive' } },
        { titulo: { contains: criterios.tipoPropiedad, mode: 'insensitive' } },
        { subtipo: { contains: criterios.tipoPropiedad, mode: 'insensitive' } }
      ]
    })
  }

  // 2. Presupuesto (OBLIGATORIO si estÃƒÂ¡ especificado - margen razonable)
  if (criterios.presupuestoMax) {
    // Margen mÃƒÂ¡s razonable: desde 70% hasta 130% del presupuesto
    const minPrecio = Math.floor(criterios.presupuestoMax * 0.7)
    const maxPrecio = Math.ceil(criterios.presupuestoMax * 1.3)
    
    condicionesAND.push({
      precio: {
        gte: minPrecio,
        lte: maxPrecio
      },
      moneda: criterios.moneda || 'USD'
    })
  }

  // 3. Zonas (FLEXIBLE - busca si hay otros criterios o si es zona especÃƒÂ­fica)
  const tieneCriteriosEspecificos = (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') || 
                                     criterios.presupuestoMax || 
                                     criterios.dormitoriosMin
  const tieneSoloZonasAmplias =
    criterios.zonas.length > 0 &&
    criterios.zonas.every((z) => esZonaAmpliaSantaFe(String(z || '')))
  
  if (criterios.zonas.length > 0) {
    // Si solo tiene "Santa Fe Capital" por defecto SIN otros criterios, no buscar
    // Pero si tiene otros criterios (tipo, precio, dormitorios), SÃƒÂ buscar
    const esSoloSantaFeDefault = criterios.zonas.length === 1 && 
                                  criterios.zonas[0].toLowerCase().includes('santa fe capital')
    
    if (!esSoloSantaFeDefault || tieneCriteriosEspecificos) {
      // Evitar filtro de zona demasiado literal para etiquetas amplias
      // como "Dentro de Bulevares": con criterios concretos ya aplicados
      // (tipo/precio/dorms), esta zona debe funcionar como "Santa Fe Capital".
      if (tieneSoloZonasAmplias && tieneCriteriosEspecificos) {
        // no-op: dejamos que resuelvan tipo/precio/dormitorios
      } else {
      // Buscar por zonas especÃƒÂ­ficas (mÃƒÂ¡s flexible)
      const zonaConditions = criterios.zonas.flatMap(z => {
        const condiciones: any[] = [
          { ubicacion: { contains: z, mode: 'insensitive' } },
          { zona: { contains: z, mode: 'insensitive' } },
          { localidad: { contains: z, mode: 'insensitive' } },
          { titulo: { contains: z, mode: 'insensitive' } }
        ]
        
        // Si es "Santa Fe Capital", tambiÃƒÂ©n buscar por "santa fe" solo
        if (z.toLowerCase().includes('santa fe capital')) {
          condiciones.push(
            { ubicacion: { contains: 'santa fe', mode: 'insensitive' } },
            { localidad: { contains: 'santa fe', mode: 'insensitive' } },
            { zona: { contains: 'santa fe', mode: 'insensitive' } }
          )
        }
        
        return condiciones
      })
      
      condicionesAND.push({ OR: zonaConditions })
      }
    }
  }

  // 4. Dormitorios (OBLIGATORIO si estÃƒÂ¡ especificado - permite 1 menos)
  if (criterios.dormitoriosMin) {
    condicionesAND.push({
      OR: [
        { dormitorios: { gte: criterios.dormitoriosMin } },
        { dormitorios: { gte: Math.max(1, criterios.dormitoriosMin - 1) } },
        { ambientes: { gte: criterios.dormitoriosMin } }
      ]
    })
  }

  // Si no hay criterios especÃƒÂ­ficos, no buscar (evitar mostrar todas las propiedades)
  // Pero si tiene tipo + dormitorios o tipo + zona, SÃƒÂ buscar
  const tieneCriteriosRelevantes = (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') ||
                                    criterios.presupuestoMax ||
                                    criterios.dormitoriosMin ||
                                    (criterios.zonas.length > 0 && condicionesAND.length > 1)
  
  if (!tieneCriteriosRelevantes && condicionesAND.length === 1) {
    // Solo tiene el filtro de precio > 0 y no hay otros criterios
    return []
  }

  // Aplicar todas las condiciones AND (debe cumplir TODAS)
  if (condicionesAND.length > 0) {
    where.AND = condicionesAND
  }

  // Si no hay ningÃƒÂºn criterio especÃƒÂ­fico, buscar todas las propiedades aprobadas
  if (!where.OR && !where.AND) {
    // Buscar propiedades sin filtros especÃƒÂ­ficos (solo por estado)
    const todas = await prisma.propiedad.findMany({
      where,
      take: 10,
      orderBy: { precio: 'asc' },
      include: {
        inmobiliaria: {
          select: {
            nombre: true,
            email: true,
            whatsapp: true,
            slug: true
          }
        }
      }
    })
    return todas
  }

  // Buscar propiedades que cumplan TODOS los criterios
  const propiedades = await prisma.propiedad.findMany({
    where,
    take: 20, // Buscar mÃƒÂ¡s para luego filtrar mejor
    orderBy: { precio: 'asc' },
    include: {
      inmobiliaria: {
        select: {
          nombre: true,
          email: true,
          whatsapp: true,
          slug: true
        }
      }
    }
  })

  // ValidaciÃƒÂ³n ESTRICTA: solo propiedades que realmente coinciden
  const propiedadesValidadas = propiedades.filter(prop => {
    // 1. Validar precio (OBLIGATORIO si estÃƒÂ¡ especificado)
    if (criterios.presupuestoMax && prop.precio) {
      const minPrecio = Math.floor(criterios.presupuestoMax * 0.7)
      const maxPrecio = Math.ceil(criterios.presupuestoMax * 1.3)
      if (prop.precio < minPrecio || prop.precio > maxPrecio) return false
      if (prop.moneda !== criterios.moneda) return false
    }

    // 2. Validar tipo (OBLIGATORIO si estÃƒÂ¡ especificado y no es OTRO)
    if (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') {
      const textoCompleto = `${prop.tipo} ${prop.titulo} ${prop.subtipo || ''}`.toLowerCase()
      const tipoLower = criterios.tipoPropiedad.toLowerCase()
      if (!textoCompleto.includes(tipoLower)) return false
    }

    // 3. Validar dormitorios (OBLIGATORIO si estÃƒÂ¡ especificado)
    if (criterios.dormitoriosMin) {
      const dorms = prop.dormitorios || 0
      const ambientes = prop.ambientes || 0
      const dormOk = dorms >= criterios.dormitoriosMin || 
                     dorms >= Math.max(1, criterios.dormitoriosMin - 1) ||
                     (ambientes >= criterios.dormitoriosMin)
      if (!dormOk) return false
    }

    // 4. Validar zona (FLEXIBLE - solo rechazar si es explÃƒÂ­citamente de otra ciudad)
    if (criterios.zonas.length > 0) {
      const textoCompleto = `${prop.ubicacion} ${prop.zona || ''} ${prop.localidad || ''} ${prop.direccion || ''} ${prop.titulo || ''}`.toLowerCase()
      
      // Blacklist: rechazar SIEMPRE si menciona explÃƒÂ­citamente otras ciudades
      const ciudadesProhibidas = ['buenos aires', 'capital federal', 'caba', 'rosario', 'cordoba', 'mendoza']
      const tieneCiudadProhibida = ciudadesProhibidas.some(ciudad => textoCompleto.includes(ciudad))
      if (tieneCiudadProhibida) return false
      
      // Si tiene otros criterios especÃƒÂ­ficos (tipo, dormitorios), ser mÃƒÂ¡s flexible con la zona
      const tieneCriteriosEspecificos = (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') || 
                                         criterios.presupuestoMax || 
                                         criterios.dormitoriosMin
      
      // Si tiene criterios especÃƒÂ­ficos, aceptar si NO tiene ciudad prohibida (asumimos Santa Fe)
      // Si no tiene criterios especÃƒÂ­ficos, validar que tenga zona de Santa Fe
      if (!tieneCriteriosEspecificos) {
        const tieneZona = criterios.zonas.some(z => {
          const zonaLower = z.toLowerCase()
          return textoCompleto.includes(zonaLower) || 
                 textoCompleto.includes('santa fe') || 
                 textoCompleto.includes('santafe')
        })
        if (!tieneZona) return false
      }
      // Si tiene criterios especÃƒÂ­ficos, solo validamos que NO tenga ciudad prohibida (ya hecho arriba)
    }

    return true
  })

  // Limite configurable para evitar respuesta excesiva en casos extremos.
  return propiedadesValidadas.slice(0, MAX_DB_MATCHES)
}

function construirFallbackPortalesDesdeLinks(
  criterios: BusquedaParseada,
  links: Array<{ sitio?: string; titulo?: string; url?: string; categoria?: string }>
) {
  const ubicacionBase = criterios.zonas?.[0] || 'Santa Fe Capital'
  const precioBase = 'Consultar'

  return (links || [])
    .filter((l) => {
      if (!l?.url) return false
      if (!(l?.categoria === 'PORTALES' || l?.categoria === 'INMOBILIARIAS')) return false

      // Evitar mostrar cards "falsas" desde busquedas de Google.
      // El fallback debe priorizar links directos de portales/inmobiliarias.
      const url = String(l.url).toLowerCase()
      if (url.includes('google.com/search') || url.includes('google.com.ar/search')) return false

      return true
    })
    .map((l) => ({
      sitio: l.sitio || 'Portal',
      titulo: l.titulo || `${l.sitio || 'Portal'}: busqueda filtrada`,
      precio: precioBase,
      ubicacion: ubicacionBase,
      url: l.url!,
      img: null,
      origen: 'LINK_SUGERIDO',
      esSugerido: true,
    }))
}

// ----------------------------------------------------------------------
// GENERAR LINKS EXTERNOS (WEB MATCHING)
// ----------------------------------------------------------------------
function generarLinksExternos(criterios: BusquedaParseada) {
  interface ExternLink {
      sitio: string
      titulo: string
      url: string
      icon: string
      categoria: 'PORTALES' | 'INMOBILIARIAS' | 'INTERNACIONALES'
  }

  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  const tipo = criterios.tipoPropiedad.toLowerCase()
  const zona = 'santa fe capital'
  const dormMin = criterios.dormitoriosMin || criterios.ambientesMin || null
  const terminosBusqueda = `${tipo} ${operacion} ${zona} ${dormMin ? `${dormMin} dormitorios` : ''} ${criterios.presupuestoMin ? `desde ${criterios.presupuestoMin}` : ''} ${criterios.presupuestoMax ? `hasta ${criterios.presupuestoMax}` : ''}`.trim()

  const links: ExternLink[] = [
    {
      sitio: 'ZonaProp',
      titulo: 'ZonaProp: busqueda filtrada',
      url: buildZonaPropUrl(criterios),
      icon: 'ZP',
      categoria: 'PORTALES'
    },
    {
      sitio: 'ArgenProp',
      titulo: 'ArgenProp: busqueda filtrada',
      url: buildArgenPropUrl(criterios),
      icon: 'AP',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Remax',
      titulo: 'Remax: Santa Fe Capital',
      url: buildRemaxUrl(criterios),
      icon: 'RX',
      categoria: 'INMOBILIARIAS'
    },
    {
      sitio: 'MercadoLibre',
      titulo: 'MercadoLibre (busqueda web)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:inmuebles.mercadolibre.com.ar ${terminosBusqueda}`)}`,
      icon: 'ML',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Buscainmueble',
      titulo: 'Buscainmueble (busqueda web)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:buscainmueble.com ${terminosBusqueda}`)}`,
      icon: 'BI',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Google',
      titulo: `Google: ${terminosBusqueda}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(terminosBusqueda + ' inmobiliaria santa fe')}`,
      icon: 'GO',
      categoria: 'PORTALES'
    },
    {
      sitio: 'ZonaProp',
      titulo: 'ZonaProp (sitio en Google)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:zonaprop.com.ar ${terminosBusqueda}`)}`,
      icon: 'ZP',
      categoria: 'PORTALES'
    },
    {
      sitio: 'ArgenProp',
      titulo: 'ArgenProp (sitio en Google)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:argenprop.com ${terminosBusqueda}`)}`,
      icon: 'AP',
      categoria: 'PORTALES'
    },
    {
      sitio: 'MercadoLibre',
      titulo: 'MercadoLibre (listado)',
      url: buildMercadoLibreUrl(criterios),
      icon: 'ML',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Buscainmueble',
      titulo: 'Buscainmueble (URL directa)',
      url: buildBuscainmuebleUrl(criterios),
      icon: 'BI',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Inmobiliarias SF',
      titulo: 'Inmobiliarias en Santa Fe Capital',
      url: `https://www.google.com/search?q=${encodeURIComponent(`inmobiliarias santa fe capital ${tipo} ${operacion}`)}`,
      icon: 'SF',
      categoria: 'INMOBILIARIAS'
    },
    {
      sitio: 'Remax',
      titulo: 'Remax (sitio en Google)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:remax.com.ar ${terminosBusqueda}`)}`,
      icon: 'RX',
      categoria: 'INMOBILIARIAS'
    },
    {
      sitio: 'Century21',
      titulo: 'Century21 (sitio en Google)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:century21.com.ar ${terminosBusqueda}`)}`,
      icon: 'C21',
      categoria: 'INMOBILIARIAS'
    },
    {
      sitio: 'MercadoUnico',
      titulo: 'MercadoUnico (sitio en Google)',
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:mercado-unico.com ${terminosBusqueda}`)}`,
      icon: 'MU',
      categoria: 'INMOBILIARIAS'
    },
    {
      sitio: 'Google',
      titulo: `${tipo} ${operacion} Santa Fe Capital`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${tipo} ${operacion} santa fe capital`)}`,
      icon: 'GO',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Google',
      titulo: `${tipo} ${operacion} Candioti`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${tipo} ${operacion} candioti santa fe`)}`,
      icon: 'GO',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Google',
      titulo: `${tipo} ${operacion} Centro`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${tipo} ${operacion} centro santa fe`)}`,
      icon: 'GO',
      categoria: 'PORTALES'
    },
    {
      sitio: 'Google',
      titulo: `${tipo} ${operacion} Barrio Sur`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${tipo} ${operacion} barrio sur santa fe`)}`,
      icon: 'GO',
      categoria: 'PORTALES'
    }
  ]

  const dedup = Array.from(new Map(links.map((l) => [l.url, l])).values())
  return dedup.slice(0, 20)
}
