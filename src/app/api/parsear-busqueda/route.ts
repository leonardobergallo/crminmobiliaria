import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'

interface BusquedaParseada {
  nombreCliente: string | null
  telefono: string | null
  tipoPropiedad: string

  operacion: string // ALQUILER, COMPRA
  presupuestoMin: number | null
  presupuestoMax: number | null
  moneda: string
  zonas: string[]
  dormitoriosMin: number | null
  ambientesMin: number | null
  cochera: boolean
  caracteristicas: string[]
  notas: string
  confianza: number // 0-100
}

type FiltrosPortalesInput = {
  moneda?: string
  precioDesde?: string | number
  precioHasta?: string | number
  dormitoriosMin?: string | number
  ambientesMin?: string | number
}

function getEnvPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  const parsed = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const MAX_DB_MATCHES = getEnvPositiveInt('MAX_DB_MATCHES', 100)
const SCRAPED_MAX_TOTAL = getEnvPositiveInt('SCRAPED_MAX_TOTAL', 200)
const SCRAPED_MAX_PER_PORTAL = getEnvPositiveInt('SCRAPED_MAX_PER_PORTAL', 80)
const SCRAPER_PORTAL_HARD_LIMIT = getEnvPositiveInt('SCRAPER_PORTAL_HARD_LIMIT', 80)

const ZONAS_SANTA_FE_DEFAULT = [
  'Santa Fe Capital',
  'Santo Tome',
  'Sauce Viejo',
  'Recreo',
  'Arroyo Leyes',
  'San Jose del Rincon',
  'Colastine',
]

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

function buildZonaPropUrl(criterios: BusquedaParseada) {
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  let tipo = 'inmuebles'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'

  const dormMin = criterios.dormitoriosMin || null
  let url = `https://www.zonaprop.com.ar/${tipo}-${operacion}-ciudad-de-santa-fe-sf`
  if (dormMin) url += `-${dormMin}-habitaciones`
  url += '.html'

  const params = new URLSearchParams()
  if (criterios.presupuestoMin) {
    params.set('precio-desde', String(criterios.presupuestoMin))
    params.set('price_from', String(criterios.presupuestoMin))
  }
  if (criterios.presupuestoMax) {
    params.set('precio-hasta', String(criterios.presupuestoMax))
    params.set('price_to', String(criterios.presupuestoMax))
  }
  if (criterios.presupuestoMin || criterios.presupuestoMax) {
    const moneda = criterios.moneda === 'ARS' ? 'ARS' : 'USD'
    params.set('moneda', moneda)
    params.set('currency', moneda)
  }
  if (criterios.ambientesMin) {
    params.set('ambientes', String(criterios.ambientesMin))
  }

  const query = params.toString()
  return query ? `${url}?${query}` : url
}

function getDormitoriosFiltro(criterios: BusquedaParseada): number | null {
  const dorm = criterios.dormitoriosMin ?? null
  const amb = criterios.ambientesMin ?? null
  if (dorm && dorm > 0) return dorm
  if (amb && amb > 0) return amb
  return null
}

function buildMercadoLibreUrl(criterios: BusquedaParseada) {
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  let tipo = 'inmuebles'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'

  let url = `https://inmuebles.mercadolibre.com.ar/${tipo}/${operacion}/santa-fe/santa-fe-capital`
  const params = new URLSearchParams()
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) params.set('DORMITORIOS', String(dormMin))
  if (criterios.presupuestoMax) params.set('precio_hasta', String(criterios.presupuestoMax))
  if (criterios.presupuestoMin) params.set('precio_desde', String(criterios.presupuestoMin))
  const query = params.toString()
  return query ? `${url}?${query}` : url
}

function buildArgenPropUrl(criterios: BusquedaParseada) {
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  let tipo = 'inmuebles'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casa'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamento'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terreno'

  let url = `https://www.argenprop.com/${tipo}-${operacion}-en-santa-fe-capital`
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) url += `-${dormMin}-dormitorios`
  if (criterios.presupuestoMax) {
    const monedaUrl = criterios.moneda === 'USD' ? 'dolares' : 'pesos'
    url += `-hasta-${criterios.presupuestoMax}-${monedaUrl}`
  }
  return url
}

function buildRemaxUrl(criterios: BusquedaParseada) {
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  const params = new URLSearchParams({
    address: 'Santa Fe, Santa Fe',
  })
  if (criterios.presupuestoMax) params.set('maxPrice', String(criterios.presupuestoMax))
  if (criterios.presupuestoMin) params.set('minPrice', String(criterios.presupuestoMin))
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) params.set('rooms', String(dormMin))
  return `https://www.remax.com.ar/propiedades/en-${operacion}?${params.toString()}`
}

function buildBuscainmuebleUrl(criterios: BusquedaParseada) {
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  let tipo = 'propiedades'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'

  const params = new URLSearchParams()
  if (criterios.presupuestoMax) params.set('precio_max', String(criterios.presupuestoMax))
  if (criterios.presupuestoMin) params.set('precio_min', String(criterios.presupuestoMin))
  params.set('moneda', criterios.moneda === 'USD' ? 'USD' : 'ARS')
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) params.set('dormitorios', String(dormMin))
  if (criterios.ambientesMin) params.set('ambientes', String(criterios.ambientesMin))

  const query = params.toString()
  const base = `https://www.buscainmueble.com/propiedades/${tipo}-en-${operacion}-en-santa-fe-santa-fe`
  return query ? `${base}?${query}` : base
}

// ----------------------------------------------------------------------
// UTILIDADES DE SCRAPING
// ----------------------------------------------------------------------

function getRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1'
  ]
  return agents[Math.floor(Math.random() * agents.length)]
}

function getScrapingHeaders(referer: string = 'https://www.google.com/') {
  const ua = getRandomUserAgent()
  const isMobile = ua.includes('iPhone') || ua.includes('iPad') || ua.includes('Mobile')
  
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': referer,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': isMobile 
      ? '"Not A(Brand";v="99", "Apple HTML";v="17", "Safari";v="17"'
      : '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
    'Sec-Ch-Ua-Platform': isMobile ? '"iOS"' : '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1'
  }
}

function normalizeText(input: string): string {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function extractPriceFromText(text: string): string {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  const usd = normalized.match(/(?:u\$s|us\$|usd)\s*[\d\.\,]+/i)
  if (usd?.[0]) return usd[0]
  const ars = normalized.match(/\$\s*[\d\.\,]+/i)
  if (ars?.[0]) return ars[0]
  return ''
}

function safeAbsoluteUrl(href: string | undefined, base: string): string | null {
  if (!href) return null
  if (href.startsWith('http')) return href
  if (!href.startsWith('/')) return `${base}/${href}`
  return `${base}${href}`
}

async function fetchWithTimeout(url: string, options: any = {}, timeout: number = 8000) {
  // Soporte para Proxy de Scraping (opcional)
  const proxyUrl = process.env.SCRAPER_PROXY_URL
  const withProxy = proxyUrl
    ? `${proxyUrl}${proxyUrl.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`
    : null

  const doFetch = async (targetUrl: string, mode: 'proxy' | 'direct') => {
    const controller = new AbortController()
    const id = setTimeout(() => {
      console.warn(`Timeout de ${timeout}ms alcanzado para: ${url} (${mode})`)
      controller.abort()
    }, timeout)
    try {
      const response = await fetch(targetUrl, {
        ...options,
        cache: 'no-store',
        signal: controller.signal
      })
      clearTimeout(id)
      return response
    } catch (error: any) {
      clearTimeout(id)
      if (error.name === 'AbortError') {
        console.error(`PeticiÃƒÂ³n abortada (timeout) para: ${url} (${mode})`)
      } else {
        console.error(`Error en fetch para ${url} (${mode}):`, error.message)
      }
      return { ok: false, status: 0, statusText: error.message } as any
    }
  }

  if (withProxy) {
    console.log(`[scraper] proxy:on -> ${url}`)
    const proxied = await doFetch(withProxy, 'proxy')
    const status = Number((proxied as any)?.status || 0)
    if (proxied.ok || ![401, 403, 407, 429].includes(status)) {
      return proxied
    }

    console.warn(`[scraper] proxy bloqueado (${status}) -> retry direct ${url}`)
    return doFetch(url, 'direct')
  }

  console.log(`[scraper] proxy:off -> ${url}`)
  return doFetch(url, 'direct')
}

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
    
    console.log('Iniciando scraping paralelo de portales...')
    const [mlItems, apItems, remaxItems, zpItems, biItems] = await Promise.all([
      scrapearMercadoLibre(busquedaParseada),
      scrapearArgenProp(busquedaParseada),
      scrapearRemax(busquedaParseada),
      scrapearZonaProp(busquedaParseada),
      scrapearBuscainmueble(busquedaParseada)
    ])

    const allScraped = [...mlItems, ...apItems, ...remaxItems, ...zpItems, ...biItems]
    const uniqueScraped = Array.from(new Map(allScraped.map(item => [item.url, item])).values())
      .filter((item: any) => esItemDeSantaFe(item))
    const scrapedDiversificado = diversificarPorPortal(
      uniqueScraped,
      SCRAPED_MAX_TOTAL,
      SCRAPED_MAX_PER_PORTAL
    )
    const fallbackPortales = construirFallbackPortalesDesdeLinks(busquedaParseada, webMatches as any)
    const scrapedItemsFinalBase = scrapedDiversificado.length > 0
      ? scrapedDiversificado
      : fallbackPortales.slice(0, Math.min(20, SCRAPED_MAX_TOTAL))
    const scrapedItemsFinal = scrapedItemsFinalBase.slice(0, 20)
    const portalStats = {
      mercadolibre: mlItems.length,
      argenprop: apItems.length,
      remax: remaxItems.length,
      zonaprop: zpItems.length,
      buscainmueble: biItems.length,
      totalUnicos: uniqueScraped.length,
      totalDiversificados: Math.min(scrapedDiversificado.length, 20),
      totalFallbackLinks: scrapedDiversificado.length === 0 ? fallbackPortales.length : 0,
    }

    return NextResponse.json({
      success: true,
      busquedaParseada,
      matches,
      webMatches,
      scrapedItems: scrapedItemsFinal,
      portalStats,
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

  // Construir condiciones - BÃƒÅ¡SQUEDA MÃƒÂS ESTRICTA (debe cumplir criterios relevantes)
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
    // Pero si tiene otros criterios (tipo, precio, dormitorios), SÃƒÂ buscar
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
  // Pero si tiene tipo + dormitorios o tipo + zona, SÃƒÂ buscar
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

function esItemDeSantaFe(item: { titulo?: string; ubicacion?: string; url?: string }): boolean {
  const texto = `${item?.titulo || ''} ${item?.ubicacion || ''} ${item?.url || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const blacklist = [
    'buenos aires',
    'capital federal',
    'caba',
    'palermo',
    'belgrano',
    'olivos',
    'martinez',
    'pilar',
    'escobar',
    'rosario',
    'cordoba',
    'mendoza',
  ]

  if (blacklist.some((b) => texto.includes(b))) return false

  const whitelist = [
    'santa fe',
    'santa-fe',
    'santa fe capital',
    'candioti',
    '7 jefes',
    'guadalupe',
    'bulevar',
    'constituyentes',
    'costanera',
    'santo tome',
    'sauce viejo',
    'arroyo leyes',
    'recreo',
    'colastine',
    'rincon',
  ]

  if (whitelist.some((w) => texto.includes(w))) return true

  // Aceptar solo si no hay ubicacion clara pero la URL esta forzada a Santa Fe
  if (texto.includes('ciudad-de-santa-fe') || texto.includes('/santa-fe-') || texto.includes(', santa fe')) {
    return true
  }

  // Fallback: si es un clasificado del portal y no contiene ciudades prohibidas, confiar en filtro previo del scraper.
  if (texto.includes('zonaprop.com.ar/propiedades/') || texto.includes('argenprop.com/propiedad')) {
    return true
  }

  return false
}

function diversificarPorPortal(
  items: any[],
  maxTotal = SCRAPED_MAX_TOTAL,
  maxPorPortal = SCRAPED_MAX_PER_PORTAL
) {
  const porPortal = new Map<string, any[]>()
  for (const item of items) {
    const key = String(item?.sitio || 'Portal')
    if (!porPortal.has(key)) porPortal.set(key, [])
    porPortal.get(key)!.push(item)
  }

  const resultado: any[] = []
  for (const [, lista] of porPortal) {
    resultado.push(...lista.slice(0, maxPorPortal))
    if (resultado.length >= maxTotal) break
  }
  return resultado.slice(0, maxTotal)
}

function construirFallbackPortalesDesdeLinks(
  criterios: BusquedaParseada,
  links: Array<{ sitio?: string; titulo?: string; url?: string; categoria?: string }>
) {
  const ubicacionBase = criterios.zonas?.[0] || 'Santa Fe Capital'
  const precioBase = 'Consultar'

  return (links || [])
    .filter((l) => l?.url && (l?.categoria === 'PORTALES' || l?.categoria === 'INMOBILIARIAS'))
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

// ----------------------------------------------------------------------
// FUNCIÓN AUXILIAR: Validar que un item cumple con los criterios de búsqueda
// ----------------------------------------------------------------------
function validarItemContraCriterios(
  titulo: string, 
  precio: string, 
  criterios: BusquedaParseada,
  sitio: string
): { valido: boolean; razon?: string } {
  const tituloLower = titulo.toLowerCase().trim()
  const precioLower = precio.toLowerCase().trim()
  
  // 1. Rechazar elementos de UI (mÃƒÂ¡s estricto)
  // Si el tÃƒÂ­tulo es muy corto o contiene palabras clave de UI, rechazar
  if (tituloLower.length < 10) {
    return { valido: false, razon: 'tÃƒÂ­tulo muy corto (posible elemento UI)' }
  }
  
  const palabrasUI = [
    'buscar solo', 'filtrar', 'moneda:', 'limpiar', 'aplicar',
    'argentina', 'uruguay', 'paraguay', 'brasil', 'emiratos', 'espaÃƒÂ±a',
    'estados unidos', 'seleccionar', 'opciones', 'paÃƒÂ­s', 'paÃƒÂ­ses'
  ]
  
  if (palabrasUI.some(palabra => tituloLower.includes(palabra))) {
    return { valido: false, razon: 'elemento de UI' }
  }
  
  // Si el precio contiene texto de UI (como "expensas" sin contexto de propiedad)
  if (precioLower.includes('expensas') && !tituloLower.includes('departamento') && !tituloLower.includes('casa')) {
    return { valido: false, razon: 'precio con texto de UI' }
  }

  if (precioLower.includes('consultar')) {
    return { valido: false, razon: 'precio no informado' }
  }
  
  // Si la ubicaciÃƒÂ³n es muy genÃƒÂ©rica o parece ser un selector
  if (tituloLower.match(/^\([0-9]+\)$/)) {
    return { valido: false, razon: 'ubicaciÃƒÂ³n genÃƒÂ©rica (selector UI)' }
  }
  
  // 2. Filtrar por tipo de propiedad
  if (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') {
    if (criterios.tipoPropiedad === 'DEPARTAMENTO') {
      if (tituloLower.includes('casa') && !tituloLower.includes('departamento')) {
        return { valido: false, razon: 'tipo no coincide (casa vs departamento)' }
      }
      if (tituloLower.includes('terreno') || tituloLower.includes('lote')) {
        return { valido: false, razon: 'tipo no coincide (terreno)' }
      }
    }
    if (criterios.tipoPropiedad === 'CASA') {
      if (tituloLower.includes('departamento') && !tituloLower.includes('casa')) {
        return { valido: false, razon: 'tipo no coincide (departamento vs casa)' }
      }
    }
  }
  
  // 3. Filtrar por operaciÃƒÂ³n
  if (criterios.operacion === 'COMPRA') {
    if (tituloLower.includes('alquiler') || precioLower.includes('alquiler') || precioLower.includes('alq')) {
      return { valido: false, razon: 'operaciÃƒÂ³n no coincide (alquiler vs compra)' }
    }
  } else if (criterios.operacion === 'ALQUILER') {
    if (tituloLower.includes('venta') || tituloLower.includes('vende') || precioLower.includes('venta')) {
      return { valido: false, razon: 'operaciÃƒÂ³n no coincide (venta vs alquiler)' }
    }
  }
  
  // 4. Filtrar por presupuesto
  if (criterios.presupuestoMax) {
    const precioNumero = precio.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')
    const precioValor = parseFloat(precioNumero)
    
    if (!isNaN(precioValor) && precioValor > 0) {
      let precioFinal = precioValor
      if (precioValor < 1000 && precioValor > 0) {
        precioFinal = precioValor * 1000
      }
      
      const precioEsUSD = precioLower.includes('us$') || precioLower.includes('usd') || precioLower.includes('u$s')
      const precioEsARS = precioLower.includes('$') && !precioEsUSD && !precioLower.includes('us')
      
      if ((criterios.moneda === 'USD' && precioEsUSD) || (criterios.moneda === 'ARS' && precioEsARS)) {
        if (criterios.presupuestoMin && precioFinal < criterios.presupuestoMin) {
          return { valido: false, razon: `precio por debajo del minimo (${precioFinal} < ${criterios.presupuestoMin})` }
        }
        if (precioFinal > criterios.presupuestoMax * 1.4) {
          return { valido: false, razon: `precio excede presupuesto (${precioFinal} > ${criterios.presupuestoMax})` }
        }
      }
    }
  }
  
  return { valido: true }
}

// ----------------------------------------------------------------------
// SCRAPER MERCADOLIBRE (En tiempo real)
// ----------------------------------------------------------------------
async function scrapearMercadoLibre(criterios: BusquedaParseada) {
  try {
     // ConfiguraciÃƒÂ³n
    const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    let tipo = 'inmuebles'
    if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
    if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
    if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
    
    let zonaStr = criterios.zonas.length > 0 ? criterios.zonas[0] : 'santa-fe'
    const zonasSantaFe = ['santa-fe', 'rincon', 'santo-tome', 'sauce-viejo', 'arroyo-leyes', 'recreo', 'colastine']
    const esZonaLocal = zonasSantaFe.some(z => zonaStr.toLowerCase().includes(z))
    if (!esZonaLocal) zonaStr = 'santa-fe'

    const zonaLimipia = zonaStr.toLowerCase().replace(/[^a-z0-9]/g, '-')
    let zonaQuery = zonaLimipia
    if (zonaQuery === 'santa-fe' || zonaQuery.includes('santa-fe-capital')) {
        zonaQuery = 'santa-fe/santa-fe-capital'
    } else if (!zonaQuery.includes('santa-fe')) {
        zonaQuery = `santa-fe/${zonaQuery}`
    }

    // LISTADO DE URLs A INTENTAR (Desktop y Mobile como fallback)
    const urlsToTry = [
      `https://listado.mercadolibre.com.ar/inmuebles/${tipo}/${operacion}/${zonaQuery}`,
      `https://inmuebles.mercadolibre.com.ar/${tipo}/${operacion}/${zonaQuery}`,
      `https://www.mercadolibre.com.ar/inmuebles/${tipo}/${operacion}/${zonaQuery}`
    ]

    let html = ''
    let lastUrl = ''
    
    for (const url of urlsToTry) {
      const dormMin = getDormitoriosFiltro(criterios)
      const params = new URLSearchParams()
      if (dormMin) params.set('DORMITORIOS', String(dormMin))
      if (criterios.presupuestoMax) params.set('precio_hasta', String(criterios.presupuestoMax))
      if (criterios.presupuestoMin) params.set('precio_desde', String(criterios.presupuestoMin))
      const query = params.toString()
      lastUrl = query ? `${url}?${query}` : url

      console.log(`Intentando scraping MercadoLibre: ${lastUrl}`)
      const response = await fetchWithTimeout(lastUrl, {
        headers: getScrapingHeaders('https://www.mercadolibre.com.ar/')
      })

      if (response.ok) {
        const text = await response.text()
        if (text && text.length > 1000 && !text.toLowerCase().includes('robot') && !text.toLowerCase().includes('atenciÃƒÂ³n')) {
          html = text
          break // Ãƒâ€°xito, salir del bucle
        } else {
          console.warn(`MercadoLibre: URL bloqueada o invÃƒÂ¡lida, intentando siguiente... URL: ${lastUrl}`)
        }
      }
    }

    if (!html) {
      console.error(`MercadoLibre: Todos los intentos fallaron o fueron bloqueados.`)
      return []
    }

    const $ = cheerio.load(html)
    const items: any[] = []

    // SOPORTE PARA MÃƒÅ¡LTIPLES DISEÃƒâ€˜OS DE ML (Lista vs Grilla/Poly vs otros)
    // Intentar mÃƒÂºltiples selectores para asegurar que encontramos resultados
    let elements = $('.ui-search-layout__item, .poly-card, .ui-search-result, [data-testid="item"], .results-item')
    
    // Si no encontramos elementos, intentar selectores mÃƒÂ¡s genÃƒÂ©ricos
    if (elements.length === 0) {
      elements = $('article, .item, [class*="item"], [class*="card"], [class*="result"]')
      console.log(`MercadoLibre: Usando selectores genÃƒÂ©ricos, encontrados: ${elements.length}`)
    } else {
      console.log(`MercadoLibre: Encontrados ${elements.length} elementos con selectores especÃƒÂ­ficos`)
    }
    
    // Whitelist: Solo zonas de Santa Fe Capital y alrededores permitidas
    const santaFeZonas = [
      'santa fe', 'santa-fe', 'santa fe capital', 'santa-fe-capital',
      'candioti', 'centro', 'microcentro', 'macrocentro', 'barrio sur', 'barrio norte',
      'guadalupe', '7 jefes', 'bulevar', 'constituyentes', 'mayoraz',
      'maria selva', 'sargento cabral', 'las flores', 'roma', 'fomento',
      'barranquitas', 'los hornos', 'ciudadela', 'recoleta',
      'puerto', 'costanera', 'villa setubal',
      // Alrededores de Santa Fe Capital
      'rincon', 'san jose del rincon', 'santo tome', 'sauce viejo',
      'arroyo leyes', 'recreo', 'colastine'
    ]
    
    // Blacklist ESTRICTA: Excluir Buenos Aires y otras ciudades
    const blackList = [
      // Buenos Aires / CABA
      'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
      'palermo', 'belgrano', 'recoleta', 'las caÃƒÂ±itas', 'las canitas', 'caÃƒÂ±itas',
      'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
      'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
      'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
      'microcentro buenos aires', 'microcentro caba',
      // Calles y zonas especÃƒÂ­ficas de Buenos Aires
      'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
      'cid campeador', 'campeador',
      'san martin buenos aires', 'san martin gba',
      // Gran Buenos Aires
      'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora', 'san isidro',
      'vicente lopez', 'tigre', 'san fernando', 'zona norte', 'zona sur', 'zona oeste',
      'gba', 'gran buenos aires', 'provincia de buenos aires',
      // Otras ciudades grandes
      'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
      'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi',
      'nueva cordoba', 'alta cordoba', 'villa cabrera',
      // Otras ciudades de Santa Fe (fuera de capital)
      'rafaela', 'venado tuerto', 'reconquista', 'esperanza', 'sunchales'
    ]

    elements.each((i, el) => {
      if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return

      // Selectores HÃƒÂ­bridos (intenta uno, si no, el otro)
      const titulo = $(el).find('.ui-search-item__title, .poly-component__title, h2, h3, [class*="title"]').first().text().trim()
      // Selectores expandidos para precio (MercadoLibre tiene mÃƒÂºltiples variantes)
      let precio = $(el).find('.ui-search-price__part, .poly-price__current-price, .ui-search-price, [class*="price"]').first().text().trim()
      // Si no encontramos precio con los selectores principales, intentar mÃƒÂ¡s genÃƒÂ©ricos
      if (!precio) {
        precio = $(el).find('[class*="price"], [data-price], .price, span:contains("$")').first().text().trim()
      }
      const ubicacion = $(el).find('.ui-search-item__location, .poly-component__location, [class*="location"]').first().text().trim()
      
      // Link
      let urlItem = $(el).find('a.ui-search-link, a.poly-component__title').first().attr('href')
      
      // FILTRADO FLEXIBLE: Solo Santa Fe Capital y alrededores
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      // PRIMERO: Verificar si es CLARAMENTE de Santa Fe (antes de aplicar blacklist)
      // Si tiene "Santa Fe Capital" o "Santa Fe" explÃƒÂ­citamente, es vÃƒÂ¡lida
      const esClaramenteSantaFe = ubicacionLower.includes('santa fe capital') || 
                                   ubicacionLower.includes('santafe capital') ||
                                   tituloLower.includes('santa fe capital') ||
                                   tituloLower.includes('santafe capital') ||
                                   ubicacionLower.includes(', santa fe') ||
                                   tituloLower.includes(', santa fe')
      
      // Validar URL primero (mÃƒÂ¡s confiable)
      let urlValida = false
      if (urlItem) {
          const urlLower = urlItem.toLowerCase()
          // Si la URL menciona santa-fe, es vÃƒÂ¡lida
          if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
              urlValida = true
          }
          // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
          if (!esClaramenteSantaFe && !urlValida) {
            if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
            if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
          }
      }
      
      // 1. VALIDACIÃƒâ€œN POSITIVA: Debe contener alguna zona de Santa Fe (en tÃƒÂ­tulo/ubicaciÃƒÂ³n O en URL)
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )
      
      // 2. VALIDACIÃƒâ€œN NEGATIVA: Blacklist ESTRICTA (incluye URL tambiÃƒÂ©n)
      // PERO: NO aplicar blacklist si es claramente de Santa Fe
      let tieneProhibido = false
      if (!esClaramenteSantaFe) {
        tieneProhibido = blackList.some(bad => {
          const badLower = bad.toLowerCase()
          return ubicacionLower.includes(badLower) || 
                 tituloLower.includes(badLower) || 
                 (urlItem && urlItem.toLowerCase().includes(badLower.replace(' ', '-'))) ||
                 (urlItem && urlItem.toLowerCase().includes(badLower.replace(' ', '')))
        })
      }
      
      // 3. FILTRO ESTRICTO: Rechazar SIEMPRE si tiene palabras prohibidas Y NO es claramente de Santa Fe
      if (tieneProhibido && !esClaramenteSantaFe) {
        console.log(`Rechazado por blacklist: ${titulo} - ${ubicacion}`)
        return
      }
      
      // 4. FILTRO INTELIGENTE: Como la URL de bÃƒÂºsqueda SIEMPRE apunta a Santa Fe, ser mÃƒÂ¡s permisivo
      // Si la URL del item menciona santa-fe Ã¢â€ â€™ aceptar
      // Si tiene zona de Santa Fe explÃƒÂ­cita Ã¢â€ â€™ aceptar
      // Si NO tiene palabras prohibidas Ã¢â€ â€™ aceptar (confiar en que el portal devolviÃƒÂ³ resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explÃƒÂ­citas (ya validado arriba)
      if (urlValida) {
        // URL del item vÃƒÂ¡lida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explÃƒÂ­cita, aceptar
      } else {
        // Como la bÃƒÂºsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas Ã¢â€ â€™ aceptar
        // Confiamos en que el portal devolviÃƒÂ³ resultados de Santa Fe
        // No rechazar si no tiene indicadores explÃƒÂ­citos, confiar en la URL de bÃƒÂºsqueda
      }

      // Imagen (Lazy Load a veces usa data-src)
      let img = $(el).find('img.ui-search-result-image__element, img.poly-component__picture').first().attr('data-src') || 
                $(el).find('img.ui-search-result-image__element, img.poly-component__picture').first().attr('src')

      if (titulo && urlItem && precio) {
        // Validar que el item cumple con los criterios de bÃƒÂºsqueda
        const validacion = validarItemContraCriterios(titulo, precio, criterios, 'MercadoLibre')
        if (!validacion.valido) {
          console.log(`MercadoLibre: Rechazado - ${validacion.razon}: ${titulo.substring(0, 50)}`)
          return
        }

        items.push({
           sitio: 'MercadoLibre',
           titulo,
           precio,
           ubicacion: ubicacion || 'Santa Fe',
           url: urlItem,
           img: img || null
        })
        console.log(`MercadoLibre: Agregado item ${items.length}: ${titulo.substring(0, 50)}`)
      } else {
        console.log(`MercadoLibre: Item rechazado - titulo: ${titulo ? 'SÃƒÂ­' : 'No'}, precio: ${precio ? 'SÃƒÂ­' : 'No'}, url: ${urlItem ? 'SÃƒÂ­' : 'No'}`)
      }
    })

    console.log(`MercadoLibre: Total de items encontrados: ${items.length}`)
    return items
  } catch (error) {
    console.error('Error scraping ML:', error)
    return []
  }
}

// ----------------------------------------------------------------------
// SCRAPER ARGENPROP (Nuevo)
// ----------------------------------------------------------------------
async function scrapearArgenProp(criterios: BusquedaParseada) {
  try {
     // Config
    const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    let tipo = 'inmuebles'
    if (criterios.tipoPropiedad === 'CASA') tipo = 'casa'
    if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamento'
    if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos' // Argenprop suele usar singular/plural inconsistente, probamos singular
    if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terreno'
    
    // Zona
    // LÃƒÂ³gica "Fina": Forzar Santa Fe
    let zonaStr = criterios.zonas.length > 0 ? criterios.zonas[0] : 'santa-fe'
    
    // Mapeo manual de zonas ArgenProp si es necesario
    const zonasMapAP: any = {
        'rincon': 'san-jose-del-rincon',
        'santo-tome': 'santo-tome',
        'sauce-viejo': 'sauce-viejo',
        'colastine': 'colastine',
        'santa-fe': 'santa-fe-capital' // ArgenProp usa 'santa-fe-capital' para la ciudad
    }

    // Normalizar zona entrada
    let zonaKey = zonaStr.toLowerCase()
    
    // Si no es ninguna de las satÃƒÂ©lites conocidas, asumir Santa Fe Capital
    // para evitar ir a 'Buenos Aires' por defecto.
    const zonasSatelite = ['rincon', 'santo tome', 'sauce viejo', 'colastine', 'arroyo leyes', 'recreo']
    let esSatelite = zonasSatelite.some(z => zonaKey.includes(z))
    
    let zonaFinal = 'santa-fe-capital' // Default seguro
    
    if (esSatelite) {
        if (zonaKey.includes('rincon')) zonaFinal = 'san-jose-del-rincon'
        if (zonaKey.includes('santo tome')) zonaFinal = 'santo-tome'
        if (zonaKey.includes('sauce viejo')) zonaFinal = 'sauce-viejo'
        if (zonaKey.includes('colastine')) zonaFinal = 'colastine'
        if (zonaKey.includes('arroyo leyes')) zonaFinal = 'arroyo-leyes'
        if (zonaKey.includes('recreo')) zonaFinal = 'recreo'
    } else {
        // Zonas de ciudad (Candioti, Centro, etc) -> santa-fe-capital
        // ArgenProp no siempre tiene slugs por barrio, mejor buscar en santa-fe-capital
        zonaFinal = 'santa-fe-capital' 
    }

    // ArgenProp suele usar formato: /{tipo}-{operacion}-en-{zona}
    // URL: https://www.argenprop.com/casa-venta-en-santa-fe-capital
    let url = `https://www.argenprop.com/${tipo}-${operacion}-en-${zonaFinal}`
    
    // La URL siempre apunta a Santa Fe, asÃƒÂ­ que confiamos en ella
    const urlBusquedaEsSantaFe = true
    
    // Agregar parametro provincia para asegurar
    // ArgenProp usa el slug geogrÃƒÂ¡fico completo a veces: santa-fe-santa-fe por ej
    // Probamos con la URL canÃƒÂ³nica detectada arriba.

    // Agregar dormitorios si estÃƒÂ¡ disponible
    if (criterios.dormitoriosMin) {
      // Intentar agregar dormitorios en la URL
      url += `-${criterios.dormitoriosMin}-dormitorios`
    }
    
    if (criterios.presupuestoMax) {
       // Argenprop permite filtro de precio en URL pero es complejo.
       // Ej: ...-hasta-200000-dolares
       const monedaUrl = criterios.moneda === 'USD' ? 'dolares' : 'pesos'
       url += `-hasta-${criterios.presupuestoMax}-${monedaUrl}`
    }

    url = buildArgenPropUrl(criterios)
    console.log(`Scraping ArgenProp: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.argenprop.com/')
    })

    if (!response.ok) {
      console.error(`ArgenProp: Error HTTP ${response.status} (${response.statusText}) para URL: ${url}`)
      return []
    }

    const html = await response.text()
    if (!html || html.length < 500) {
      console.warn(`ArgenProp: Se recibiÃƒÂ³ HTML vacÃƒÂ­o o muy corto (${html?.length || 0} bytes)`)
      return []
    }

    const $ = cheerio.load(html)
    
    // Debug: Verificar si la pÃƒÂ¡gina tiene contenido o bloqueos
    const pageTitle = $('title').text()
    console.log(`ArgenProp: TÃƒÂ­tulo de pÃƒÂ¡gina: ${pageTitle.substring(0, 100)}`)
    if (pageTitle.toLowerCase().includes('atenciÃƒÂ³n') || pageTitle.toLowerCase().includes('robot') || pageTitle.toLowerCase().includes('forbidden')) {
      console.warn(`ArgenProp: Posible bloqueo o CAPTCHA detectado. TÃƒÂ­tulo: ${pageTitle}`)
    }
    
    const items: any[] = []
    
    // Whitelist: Solo zonas de Santa Fe Capital y alrededores permitidas
    const santaFeZonas = [
      'santa fe', 'santa-fe', 'santa fe capital', 'santa-fe-capital',
      'candioti', 'centro', 'microcentro', 'macrocentro', 'barrio sur', 'barrio norte',
      'guadalupe', '7 jefes', 'bulevar', 'constituyentes', 'mayoraz',
      'maria selva', 'sargento cabral', 'las flores', 'roma', 'fomento',
      'barranquitas', 'los hornos', 'ciudadela', 'san martin', 'recoleta',
      'puerto', 'costanera', 'villa setubal',
      // Alrededores de Santa Fe Capital
      'rincon', 'san jose del rincon', 'santo tome', 'sauce viejo',
      'arroyo leyes', 'recreo', 'colastine'
    ]
    
      // Blacklist: Excluir Buenos Aires y otras ciudades (MUY ESTRICTA)
      const blackList = [
        // Buenos Aires / CABA
        'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
        'palermo', 'belgrano', 'recoleta', 'las caÃƒÂ±itas', 'las canitas', 'caÃƒÂ±itas',
        'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
        'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
        'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
        'microcentro buenos aires', 'microcentro caba',
        // Calles y zonas especÃƒÂ­ficas de Buenos Aires
        'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
        'cid campeador', 'campeador',
        'villa crespo', 'villa urquiza', 'caballito', 'almagro', 'flores',
        'barracas', 'la boca', 'san telmo', 'montserrat', 'nunez', 'saavedra',
        'colegiales', 'recoleta buenos aires', 'recoleta caba',
        'san martin buenos aires', 'san martin gba',
        'general san martin', 'gral san martin',
        'la matanza', 'ramos mejia', 'villa maipu',
        // Gran Buenos Aires
        'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora', 'san isidro',
        'vicente lopez', 'tigre', 'san fernando', 'zona norte', 'zona sur', 'zona oeste',
        'gba', 'gran buenos aires', 'provincia de buenos aires',
        // Otras ciudades grandes
        'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
        'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi',
        'nueva cordoba', 'alta cordoba', 'villa cabrera',
        // Otras ciudades de Santa Fe (fuera de capital)
        'rafaela', 'venado tuerto', 'reconquista', 'esperanza', 'sunchales'
      ]

    // Intentar mÃƒÂºltiples selectores para ArgenProp
    let argenElements = $('.listing__item, .card, [class*="card"], [class*="listing"], article')
    
    if (argenElements.length === 0) {
      // Si no encontramos con selectores especÃƒÂ­ficos, intentar mÃƒÂ¡s genÃƒÂ©ricos
      argenElements = $('[class*="property"], [class*="item"], [data-testid]')
      console.log(`ArgenProp: Usando selectores genÃƒÂ©ricos, encontrados: ${argenElements.length}`)
    } else {
      console.log(`ArgenProp: Encontrados ${argenElements.length} elementos con selectores especÃƒÂ­ficos`)
    }
    
    argenElements.each((i, el) => {
      if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return

      const titulo = $(el).find('.card__title, .title, h2, h3, [class*="title"]').first().text().trim() || 
                     $(el).find('.card__address, [class*="address"]').first().text().trim()
      const precio = $(el).find('.card__price, .price, [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.card__location, .location, [class*="location"]').first().text().trim() || 
                        $(el).find('.card__address, [class*="address"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos bÃƒÂ¡sicos, saltar este elemento
      if (!titulo && !precio) return
      
      // FILTRADO FLEXIBLE: Solo Santa Fe Capital y alrededores
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      
      // Rechazar elementos de UI ANTES de procesar (mÃƒÂ¡s temprano)
      if (tituloLower.length < 10 || 
          tituloLower.includes('buscar solo') || 
          tituloLower.includes('moneda:') ||
          (tituloLower.includes('argentina') && !tituloLower.includes('departamento') && !tituloLower.includes('casa')) ||
          /^\d[\d\.\, ]+\s+(casas?|departamentos?|terrenos?|inmuebles?)\s+en\s+(venta|alquiler)/i.test(tituloLower) ||
          /^\(\d+\)$/.test(tituloLower)) {
        return // Rechazar elementos de UI
      }
      
      // PRIMERO: Verificar si es CLARAMENTE de Santa Fe (antes de aplicar blacklist)
      const esClaramenteSantaFe = ubicacionLower.includes('santa fe capital') || 
                                   ubicacionLower.includes('santafe capital') ||
                                   tituloLower.includes('santa fe capital') ||
                                   tituloLower.includes('santafe capital') ||
                                   ubicacionLower.includes(', santa fe') ||
                                   tituloLower.includes(', santa fe')
      
      // Validar URL primero (mÃƒÂ¡s confiable)
      let urlValida = false
      if (urlRel) {
         const urlLower = urlRel.toLowerCase()
         // Si la URL menciona santa-fe, es vÃƒÂ¡lida
         if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
             urlValida = true
         }
         // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
         if (!esClaramenteSantaFe && !urlValida) {
           if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
           if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
         }
      }
      
      // 1. VALIDACIÃƒâ€œN POSITIVA: Debe contener alguna zona de Santa Fe (en tÃƒÂ­tulo/ubicaciÃƒÂ³n O en URL)
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )

      // Si no hay ninguna señal de Santa Fe, descartar (evita listados nacionales de ArgenProp)
      if (!esClaramenteSantaFe && !urlValida && !tieneZonaSantaFe) {
        return
      }
      
      // 2. VALIDACIÃƒâ€œN NEGATIVA: Blacklist ESTRICTA (incluye URL tambiÃƒÂ©n)
      // PERO: NO aplicar blacklist si es claramente de Santa Fe
      let tieneProhibido = false
      if (!esClaramenteSantaFe) {
        tieneProhibido = blackList.some(bad => {
          const badLower = bad.toLowerCase()
          return ubicacionLower.includes(badLower) || 
                 tituloLower.includes(badLower) || 
                 (urlRel && urlRel.toLowerCase().includes(badLower.replace(' ', '-'))) ||
                 (urlRel && urlRel.toLowerCase().includes(badLower.replace(' ', '')))
        })
      }
      
      // 3. FILTRO ESTRICTO: Rechazar SIEMPRE si tiene palabras prohibidas Y NO es claramente de Santa Fe
      if (tieneProhibido && !esClaramenteSantaFe) {
        console.log(`Rechazado por blacklist: ${titulo} - ${ubicacion}`)
        return
      }
      
      // 4. FILTRO INTELIGENTE: Como la URL de bÃƒÂºsqueda SIEMPRE apunta a Santa Fe, ser mÃƒÂ¡s permisivo
      // Si la URL del item menciona santa-fe Ã¢â€ â€™ aceptar
      // Si tiene zona de Santa Fe explÃƒÂ­cita Ã¢â€ â€™ aceptar
      // Si NO tiene palabras prohibidas Ã¢â€ â€™ aceptar (confiar en que el portal devolviÃƒÂ³ resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explÃƒÂ­citas (ya validado arriba)
      if (urlValida) {
        // URL del item vÃƒÂ¡lida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explÃƒÂ­cita, aceptar
      } else {
        // Como la bÃƒÂºsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas Ã¢â€ â€™ aceptar
        // Confiamos en que el portal devolviÃƒÂ³ resultados de Santa Fe
        // No rechazar si no tiene indicadores explÃƒÂ­citos, confiar en la URL de bÃƒÂºsqueda
      }

      // La foto suele estar en data-src de un div o img
      let img = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src')

      if (!titulo || !urlRel || !precio) {
        return
      }
      
      // Validar que el item cumple con los criterios de bÃƒÂºsqueda
      const validacion = validarItemContraCriterios(titulo, precio, criterios, 'ArgenProp')
      if (!validacion.valido) {
        console.log(`ArgenProp: Rechazado - ${validacion.razon}: ${titulo.substring(0, 50)}`)
        return
      }

      items.push({
         sitio: 'ArgenProp',
         titulo,
         precio: precio.replace(/\n/g, '').trim(),
         ubicacion,
         url: safeAbsoluteUrl(urlRel, 'https://www.argenprop.com') || `https://www.argenprop.com${urlRel}`,
         img: img || null
      })
      console.log(`ArgenProp: Agregado item ${items.length}: ${titulo.substring(0, 50)}`)
    })

    if (items.length === 0) {
      $('a[href*="/propiedad"], a[href*="-en-santa-fe"]').each((i, a) => {
        if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return
        const href = $(a).attr('href')
        const urlCompleta = safeAbsoluteUrl(href, 'https://www.argenprop.com')
        if (!urlCompleta) return

        const urlNorm = normalizeText(urlCompleta)
        if (!urlNorm.includes('argenprop.com')) return

        const container = $(a).closest('article, div, li')
        const rawText = container.text().replace(/\s+/g, ' ').trim()
        const titulo = $(a).text().trim() || container.find('h2, h3, [class*="title"]').first().text().trim()
        const precio = extractPriceFromText(rawText) || container.find('[class*="price"], .price').first().text().trim()
        const ubicacion =
          container.find('[class*="location"], .location, [class*="address"], .address').first().text().trim() ||
          (rawText.includes('Santa Fe') ? 'Santa Fe' : '')

        if (!titulo || titulo.length < 10 || !precio) return
        const key = `${urlCompleta}|${titulo}`
        if (items.some((it) => `${it.url}|${it.titulo}` === key)) return

        const validacion = validarItemContraCriterios(titulo, precio, criterios, 'ArgenProp')
        if (!validacion.valido) return

        items.push({
          sitio: 'ArgenProp',
          titulo,
          precio: precio.replace(/\n/g, '').trim(),
          ubicacion: ubicacion || 'Santa Fe',
          url: urlCompleta,
          img: container.find('img').first().attr('data-src') || container.find('img').first().attr('src') || null,
        })
      })
      console.log(`ArgenProp: fallback por links, total: ${items.length}`)
    }

    console.log(`ArgenProp: Total de items encontrados: ${items.length}`)
    return items

  } catch (error) {
    console.error('Error scraping ArgenProp:', error)
    // Silently fail to not block other results
    return []
  }
}

// ----------------------------------------------------------------------
// SCRAPER REMAX
// ----------------------------------------------------------------------
async function scrapearRemax(criterios: BusquedaParseada) {
  try {
    const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    let tipo = 'inmuebles'
    if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
    if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
    if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
    
    // Remax usa bÃƒÂºsqueda por ubicaciÃƒÂ³n
    // URL: https://www.remax.com.ar/propiedades/en-venta?address=Santa+Fe%2C+Santa+Fe
    let url = `https://www.remax.com.ar/propiedades/en-${operacion}?address=Santa+Fe%2C+Santa+Fe`
    
    // Agregar filtros si estÃƒÂ¡n disponibles
    if (criterios.presupuestoMax) {
      // Remax permite filtros en query params
      url += `&maxPrice=${criterios.presupuestoMax}`
    }
    
    url = buildRemaxUrl(criterios)
    console.log(`Scraping Remax: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.remax.com.ar/')
    })

    if (!response.ok) {
      console.error(`Remax: Error HTTP ${response.status} (${response.statusText}) para URL: ${url}`)
      return []
    }

    const html = await response.text()
    if (!html || html.length < 500) {
      console.warn(`Remax: Se recibiÃƒÂ³ HTML vacÃƒÂ­o o muy corto (${html?.length || 0} bytes)`)
      return []
    }

    const $ = cheerio.load(html)
    
    // Debug: Verificar si la pÃƒÂ¡gina tiene contenido o bloqueos
    const pageTitle = $('title').text()
    console.log(`Remax: TÃƒÂ­tulo de pÃƒÂ¡gina: ${pageTitle.substring(0, 100)}`)
    if (pageTitle.toLowerCase().includes('atenciÃƒÂ³n') || pageTitle.toLowerCase().includes('robot') || pageTitle.toLowerCase().includes('forbidden') || pageTitle.toLowerCase().includes('access denied')) {
      console.warn(`Remax: Posible bloqueo detectado. TÃƒÂ­tulo: ${pageTitle}`)
    }
    
    const items: any[] = []
    
    // Remax: Intentar mÃƒÂºltiples selectores
    let remaxElements = $('.property-card, .listing-card, [data-testid="property-card"], .card, article, [class*="property"], [class*="listing"]')
    
    if (remaxElements.length === 0) {
      remaxElements = $('[class*="card"], [class*="item"], [data-testid]')
      console.log(`Remax: Usando selectores genÃƒÂ©ricos, encontrados: ${remaxElements.length}`)
    } else {
      console.log(`Remax: Encontrados ${remaxElements.length} elementos con selectores especÃƒÂ­ficos`)
    }
    
    remaxElements.each((i, el) => {
      if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return

      const titulo = $(el).find('.property-title, .listing-title, h3, h4, [class*="title"]').first().text().trim()
      const precio = $(el).find('.property-price, .price, [data-testid="price"], [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.property-location, .location, [data-testid="location"], [class*="location"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos bÃƒÂ¡sicos, saltar este elemento
      if (!titulo && !precio) return
      
      // Filtrar resultados de otras ciudades
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      // Whitelist: Solo zonas de Santa Fe Capital y alrededores permitidas
      const santaFeZonas = [
        'santa fe', 'santa-fe', 'santa fe capital', 'santa-fe-capital',
        'candioti', 'centro', 'microcentro', 'macrocentro', 'barrio sur', 'barrio norte',
        'guadalupe', '7 jefes', 'bulevar', 'constituyentes', 'mayoraz',
        'maria selva', 'sargento cabral', 'las flores', 'roma', 'fomento',
        'barranquitas', 'los hornos', 'ciudadela', 'san martin', 'recoleta',
        'puerto', 'costanera', 'villa setubal',
        'rincon', 'san jose del rincon', 'santo tome', 'sauce viejo',
        'arroyo leyes', 'recreo', 'colastine'
      ]
      
      // Blacklist: Excluir Buenos Aires y otras ciudades
      const blackList = [
        'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
        'palermo', 'belgrano', 'recoleta', 'las caÃƒÂ±itas', 'las canitas', 'caÃƒÂ±itas',
        'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
        'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
        'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
        'microcentro buenos aires', 'microcentro caba',
        'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora', 'san isidro',
        'vicente lopez', 'tigre', 'san fernando', 'zona norte', 'zona sur', 'zona oeste',
        'gba', 'gran buenos aires',
        'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
        'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi',
        'nueva cordoba', 'alta cordoba', 'villa cabrera',
        'rafaela', 'venado tuerto', 'reconquista', 'esperanza', 'sunchales'
      ]
      
      // PRIMERO: Verificar si es CLARAMENTE de Santa Fe (antes de aplicar blacklist)
      const esClaramenteSantaFe = ubicacionLower.includes('santa fe capital') || 
                                   ubicacionLower.includes('santafe capital') ||
                                   tituloLower.includes('santa fe capital') ||
                                   tituloLower.includes('santafe capital') ||
                                   ubicacionLower.includes(', santa fe') ||
                                   tituloLower.includes(', santa fe')
      
      // Validar URL primero (mÃƒÂ¡s confiable)
      let urlValida = false
      if (urlRel) {
          const urlLower = urlRel.toLowerCase()
          // Si la URL menciona santa-fe, es vÃƒÂ¡lida
          if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
              urlValida = true
          }
          // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
          if (!esClaramenteSantaFe && !urlValida) {
            if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
            if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
          }
      }
      
      // VALIDACIÃƒâ€œN POSITIVA: Debe contener alguna zona de Santa Fe (en tÃƒÂ­tulo/ubicaciÃƒÂ³n O en URL)
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )
      
      // VALIDACIÃƒâ€œN NEGATIVA: Blacklist ESTRICTA (incluye URL tambiÃƒÂ©n)
      // PERO: NO aplicar blacklist si es claramente de Santa Fe
      let tieneProhibido = false
      if (!esClaramenteSantaFe) {
        tieneProhibido = blackList.some(bad => {
          const badLower = bad.toLowerCase()
          return ubicacionLower.includes(badLower) || 
                 tituloLower.includes(badLower) || 
                 (urlRel && urlRel.toLowerCase().includes(badLower.replace(' ', '-'))) ||
                 (urlRel && urlRel.toLowerCase().includes(badLower.replace(' ', '')))
        })
      }
      
      // FILTRO ESTRICTO: Rechazar SIEMPRE si tiene palabras prohibidas Y NO es claramente de Santa Fe
      if (tieneProhibido && !esClaramenteSantaFe) {
        console.log(`Rechazado por blacklist: ${titulo} - ${ubicacion}`)
        return
      }
      
      // FILTRO INTELIGENTE: Como la URL de bÃƒÂºsqueda SIEMPRE apunta a Santa Fe, ser mÃƒÂ¡s permisivo
      // Si la URL del item menciona santa-fe Ã¢â€ â€™ aceptar
      // Si tiene zona de Santa Fe explÃƒÂ­cita Ã¢â€ â€™ aceptar
      // Si NO tiene palabras prohibidas Ã¢â€ â€™ aceptar (confiar en que el portal devolviÃƒÂ³ resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explÃƒÂ­citas (ya validado arriba)
      if (urlValida) {
        // URL del item vÃƒÂ¡lida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explÃƒÂ­cita, aceptar
      } else {
        // Como la bÃƒÂºsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas Ã¢â€ â€™ aceptar
        // Confiamos en que el portal devolviÃƒÂ³ resultados de Santa Fe
        // No rechazar si no tiene indicadores explÃƒÂ­citos, confiar en la URL de bÃƒÂºsqueda
      }

      let img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src')

      if (titulo && precio) {
        const urlCompleta = urlRel?.startsWith('http') 
          ? urlRel 
          : urlRel 
            ? `https://www.remax.com.ar${urlRel}`
            : null

        // Validar que el item cumple con los criterios de bÃƒÂºsqueda
        if (titulo && precio) {
          const validacion = validarItemContraCriterios(titulo, precio, criterios, 'Remax')
          if (!validacion.valido) {
            console.log(`Remax: Rechazado - ${validacion.razon}: ${titulo.substring(0, 50)}`)
            return
          }
        }
        
        items.push({
           sitio: 'Remax',
           titulo: titulo || 'Propiedad Remax',
           precio: precio.replace(/\n/g, '').trim(),
           ubicacion: ubicacion || 'Santa Fe',
           url: urlCompleta || url,
           img: img || null
        })
        console.log(`Remax: Agregado item ${items.length}: ${titulo ? titulo.substring(0, 50) : 'Sin tÃƒÂ­tulo'}`)
      } else {
        console.log(`Remax: Item rechazado - titulo: ${titulo ? 'SÃƒÂ­' : 'No'}, precio: ${precio ? 'SÃƒÂ­' : 'No'}`)
      }
    })

    console.log(`Remax: Total de items encontrados: ${items.length}`)
    return items

  } catch (error) {
    console.error('Error scraping Remax:', error)
    // Silently fail to not block other results
    return []
  }
}

// ----------------------------------------------------------------------
// SCRAPER ZONAPROP
// ----------------------------------------------------------------------
async function scrapearZonaProp(criterios: BusquedaParseada) {
  try {
    const url = buildZonaPropUrl(criterios)

    console.log(`Scraping ZonaProp: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.zonaprop.com.ar/')
    })

    if (!response.ok) {
      console.error(`ZonaProp: Error HTTP ${response.status} (${response.statusText}) para URL: ${url}`)
      return []
    }

    const html = await response.text()
    if (!html || html.length < 500) {
      console.warn(`ZonaProp: Se recibiÃƒÂ³ HTML vacÃƒÂ­o o muy corto (${html?.length || 0} bytes)`)
      return []
    }

    const $ = cheerio.load(html)
    
    // Debug: Verificar si la pÃƒÂ¡gina tiene contenido o bloqueos
    const pageTitle = $('title').text()
    console.log(`ZonaProp: TÃƒÂ­tulo de pÃƒÂ¡gina: ${pageTitle.substring(0, 100)}`)
    if (pageTitle.toLowerCase().includes('atenciÃƒÂ³n') || pageTitle.toLowerCase().includes('robot') || pageTitle.toLowerCase().includes('forbidden') || pageTitle.toLowerCase().includes('captcha')) {
      console.warn(`ZonaProp: Posible bloqueo o CAPTCHA detectado. TÃƒÂ­tulo: ${pageTitle}`)
    }
    
    const items: any[] = []
    
    // ZonaProp usa diferentes selectores segÃƒÂºn la versiÃƒÂ³n
    const santaFeZonas = [
      'santa fe', 'santa-fe', 'santa fe capital', 'santa-fe-capital',
      'candioti', 'centro', 'microcentro', 'macrocentro', 'barrio sur', 'barrio norte',
      'guadalupe', '7 jefes', 'bulevar', 'constituyentes', 'mayoraz',
      'maria selva', 'sargento cabral', 'las flores', 'roma', 'fomento',
      'barranquitas', 'los hornos', 'ciudadela', 'san martin', 'recoleta',
      'puerto', 'costanera', 'villa setubal',
      'rincon', 'san jose del rincon', 'santo tome', 'sauce viejo',
      'arroyo leyes', 'recreo', 'colastine'
    ]
    
    const blackList = [
      'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
      'palermo', 'belgrano', 'recoleta', 'las caÃƒÂ±itas', 'las canitas', 'caÃƒÂ±itas',
      'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
      'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
      'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
      'microcentro buenos aires', 'microcentro caba',
      // Calles y zonas especÃƒÂ­ficas de Buenos Aires
      'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
      'cid campeador', 'campeador',
      'san martin buenos aires', 'san martin gba',
      'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora', 'san isidro',
      'vicente lopez', 'tigre', 'san fernando', 'zona norte', 'zona sur', 'zona oeste',
      'gba', 'gran buenos aires', 'provincia de buenos aires',
      'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
      'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi',
      'nueva cordoba', 'alta cordoba', 'villa cabrera',
      'rafaela', 'venado tuerto', 'reconquista', 'esperanza', 'sunchales'
    ]

    // ZonaProp: Intentar mÃƒÂºltiples selectores
    let zonaElements = $('.posting-card, .posting, [data-posting-id], .card, article, [class*="posting"], [class*="card"]')
    
    if (zonaElements.length === 0) {
      zonaElements = $('[class*="property"], [class*="item"], [data-testid]')
      console.log(`ZonaProp: Usando selectores genÃƒÂ©ricos, encontrados: ${zonaElements.length}`)
    } else {
      console.log(`ZonaProp: Encontrados ${zonaElements.length} elementos con selectores especÃƒÂ­ficos`)
    }
    
    zonaElements.each((i, el) => {
      if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return

      const titulo = $(el).find('.posting-title, .posting-title a, h2, .title, [class*="title"]').first().text().trim()
      const precio = $(el).find('.posting-price, .price, [data-price], [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.posting-location, .location, .address, [class*="location"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos bÃƒÂ¡sicos, saltar este elemento
      if (!titulo && !precio) return
      
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      // PRIMERO: Verificar si es CLARAMENTE de Santa Fe (antes de aplicar blacklist)
      const esClaramenteSantaFe = ubicacionLower.includes('santa fe capital') || 
                                   ubicacionLower.includes('santafe capital') ||
                                   tituloLower.includes('santa fe capital') ||
                                   tituloLower.includes('santafe capital') ||
                                   ubicacionLower.includes(', santa fe') ||
                                   tituloLower.includes(', santa fe')
      
      // Validar URL primero
      let urlValida = false
      if (urlRel) {
          const urlLower = urlRel.toLowerCase()
          if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
              urlValida = true
          }
          // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
          if (!esClaramenteSantaFe && !urlValida) {
            if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
            if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
          }
      }
      
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )
      
      // Blacklist ESTRICTA de Buenos Aires
      const blackListEstricta = [
        'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
        'palermo', 'belgrano', 'las caÃƒÂ±itas', 'las canitas', 'caÃƒÂ±itas',
        'puerto madero', 'retiro', 'microcentro buenos aires', 'microcentro caba',
        'quilmes', 'lanus', 'san isidro', 'tigre', 'san fernando',
        'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
        // Calles y zonas especÃƒÂ­ficas de Buenos Aires
        'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
        'cid campeador', 'campeador',
        'villa crespo', 'villa urquiza', 'caballito', 'almagro', 'flores',
        'barracas', 'la boca', 'san telmo', 'montserrat', 'nunez', 'saavedra',
        'colegiales', 'recoleta buenos aires', 'recoleta caba'
      ]
      // PERO: NO aplicar blacklist si es claramente de Santa Fe
      let tieneProhibido = false
      if (!esClaramenteSantaFe) {
        tieneProhibido = blackListEstricta.some(bad => 
          ubicacionLower.includes(bad) || tituloLower.includes(bad) || urlRel?.toLowerCase().includes(bad.replace(' ', '-'))
        )
      }
      
      // FILTRO ESTRICTO: Rechazar SIEMPRE si tiene palabras prohibidas Y NO es claramente de Santa Fe
      if (tieneProhibido && !esClaramenteSantaFe) return
      
      // FILTRO INTELIGENTE: Como la URL de bÃƒÂºsqueda SIEMPRE apunta a Santa Fe, ser mÃƒÂ¡s permisivo
      // Si la URL del item menciona santa-fe Ã¢â€ â€™ aceptar
      // Si tiene zona de Santa Fe explÃƒÂ­cita Ã¢â€ â€™ aceptar
      // Si NO tiene palabras prohibidas Ã¢â€ â€™ aceptar (confiar en que el portal devolviÃƒÂ³ resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explÃƒÂ­citas (ya validado arriba)
      if (urlValida) {
        // URL del item vÃƒÂ¡lida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explÃƒÂ­cita, aceptar
      } else {
        // Como la bÃƒÂºsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas Ã¢â€ â€™ aceptar
        // Confiamos en que el portal devolviÃƒÂ³ resultados de Santa Fe
        // No rechazar si no tiene indicadores explÃƒÂ­citos, confiar en la URL de bÃƒÂºsqueda
      }

      let img = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src')

      if (titulo && precio && urlRel) {
        // Validar que el item cumple con los criterios de bÃƒÂºsqueda
        const validacion = validarItemContraCriterios(titulo, precio, criterios, 'ZonaProp')
        if (!validacion.valido) {
          console.log(`ZonaProp: Rechazado - ${validacion.razon}: ${titulo.substring(0, 50)}`)
          return
        }
        
        const urlCompleta = urlRel.startsWith('http') 
          ? urlRel 
          : `https://www.zonaprop.com.ar${urlRel}`

        items.push({
           sitio: 'ZonaProp',
           titulo: titulo,
           precio: precio.replace(/\n/g, '').trim(),
           ubicacion: ubicacion || 'Santa Fe',
           url: urlCompleta,
           img: img || null
        })
        console.log(`ZonaProp: Agregado item ${items.length}: ${titulo.substring(0, 50)}`)
      }
    })

    if (items.length === 0) {
      $('a[href*="/propiedades/"]').each((i, a) => {
        if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return
        const href = $(a).attr('href')
        const urlCompleta = safeAbsoluteUrl(href, 'https://www.zonaprop.com.ar')
        if (!urlCompleta) return

        const container = $(a).closest('article, div, li')
        const rawText = container.text().replace(/\s+/g, ' ').trim()
        const titulo = $(a).text().trim() || container.find('h2, h3, [class*="title"]').first().text().trim()
        const precio = extractPriceFromText(rawText) || container.find('[class*="price"], .price').first().text().trim()
        const ubicacion =
          container.find('[class*="location"], .location, .address').first().text().trim() ||
          (rawText.includes('Santa Fe') ? 'Santa Fe' : '')

        if (!titulo || titulo.length < 10 || !precio) return
        const key = `${urlCompleta}|${titulo}`
        if (items.some((it) => `${it.url}|${it.titulo}` === key)) return

        const validacion = validarItemContraCriterios(titulo, precio, criterios, 'ZonaProp')
        if (!validacion.valido) return

        items.push({
          sitio: 'ZonaProp',
          titulo,
          precio: precio.replace(/\n/g, '').trim(),
          ubicacion: ubicacion || 'Santa Fe',
          url: urlCompleta,
          img: container.find('img').first().attr('data-src') || container.find('img').first().attr('src') || null,
        })
      })
      console.log(`ZonaProp: fallback por links, total: ${items.length}`)
    }

    console.log(`ZonaProp: Total de items encontrados: ${items.length}`)
    return items

  } catch (error) {
    console.error('Error scraping ZonaProp:', error)
    return []
  }
}

// ----------------------------------------------------------------------
// SCRAPER BUSCAINMUEBLE
// ----------------------------------------------------------------------
async function scrapearBuscainmueble(criterios: BusquedaParseada) {
  try {
    const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    let tipo = 'propiedades'
    if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
    if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
    if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
    
    // Buscainmueble usa formato: /propiedades/{tipo}s-en-{operacion}-en-santa-fe-santa-fe
    let url = `https://www.buscainmueble.com/propiedades/${tipo}-en-${operacion}-en-santa-fe-santa-fe`
    
    // La URL siempre apunta a Santa Fe, asÃƒÂ­ que confiamos en ella
    const urlBusquedaEsSantaFe = true
    
    if (criterios.presupuestoMax) {
      url += `?precio_max=${criterios.presupuestoMax}&moneda=${criterios.moneda === 'USD' ? 'USD' : 'ARS'}`
    }

    url = buildBuscainmuebleUrl(criterios)
    console.log(`Scraping Buscainmueble: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.buscainmueble.com/')
    })

    if (!response.ok) {
      console.error(`Buscainmueble: Error HTTP ${response.status} (${response.statusText}) para URL: ${url}`)
      return []
    }

    const html = await response.text()
    if (!html || html.length < 500) {
      console.warn(`Buscainmueble: Se recibiÃƒÂ³ HTML vacÃƒÂ­o o muy corto (${html?.length || 0} bytes)`)
      return []
    }

    const $ = cheerio.load(html)
    
    // Debug: Verificar si la pÃƒÂ¡gina tiene contenido o bloqueos
    const pageTitle = $('title').text()
    console.log(`Buscainmueble: TÃƒÂ­tulo de pÃƒÂ¡gina: ${pageTitle.substring(0, 100)}`)
    if (pageTitle.toLowerCase().includes('atenciÃƒÂ³n') || pageTitle.toLowerCase().includes('robot') || pageTitle.toLowerCase().includes('forbidden') || pageTitle.toLowerCase().includes('captcha')) {
      console.warn(`Buscainmueble: Posible bloqueo detectado. TÃƒÂ­tulo: ${pageTitle}`)
    }
    
    const items: any[] = []
    
    const santaFeZonas = [
      'santa fe', 'santa-fe', 'santa fe capital', 'santa-fe-capital',
      'candioti', 'centro', 'microcentro', 'macrocentro', 'barrio sur', 'barrio norte',
      'guadalupe', '7 jefes', 'bulevar', 'constituyentes', 'mayoraz',
      'maria selva', 'sargento cabral', 'las flores', 'roma', 'fomento',
      'barranquitas', 'los hornos', 'ciudadela', 'san martin', 'recoleta',
      'puerto', 'costanera', 'villa setubal',
      'rincon', 'san jose del rincon', 'santo tome', 'sauce viejo',
      'arroyo leyes', 'recreo', 'colastine'
    ]
    
    const blackList = [
      'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
      'palermo', 'belgrano', 'recoleta', 'las caÃƒÂ±itas', 'las canitas', 'caÃƒÂ±itas',
      'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
      'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
      'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
      'microcentro buenos aires', 'microcentro caba',
      // Calles y zonas especÃƒÂ­ficas de Buenos Aires
      'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
      'cid campeador', 'campeador',
      'san martin buenos aires', 'san martin gba',
      'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora', 'san isidro',
      'vicente lopez', 'tigre', 'san fernando', 'zona norte', 'zona sur', 'zona oeste',
      'gba', 'gran buenos aires', 'provincia de buenos aires',
      'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
      'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi',
      'nueva cordoba', 'alta cordoba', 'villa cabrera',
      'rafaela', 'venado tuerto', 'reconquista', 'esperanza', 'sunchales'
    ]

    // Buscainmueble: Intentar mÃƒÂºltiples selectores
    let buscaElements = $('.property-card, .listing-item, [data-property-id], .card, article, [class*="property"], [class*="card"]')
    
    if (buscaElements.length === 0) {
      buscaElements = $('[class*="item"], [class*="listing"], [data-testid]')
      console.log(`Buscainmueble: Usando selectores genÃƒÂ©ricos, encontrados: ${buscaElements.length}`)
    } else {
      console.log(`Buscainmueble: Encontrados ${buscaElements.length} elementos con selectores especÃƒÂ­ficos`)
    }
    
    buscaElements.each((i, el) => {
      if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return

      const titulo = $(el).find('.property-title, .title, h3, h4, [class*="title"]').first().text().trim()
      const precio = $(el).find('.property-price, .price, [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.property-location, .location, [class*="location"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos bÃƒÂ¡sicos, saltar este elemento
      if (!titulo && !precio) return
      
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      // PRIMERO: Verificar si es CLARAMENTE de Santa Fe (antes de aplicar blacklist)
      const esClaramenteSantaFe = ubicacionLower.includes('santa fe capital') || 
                                   ubicacionLower.includes('santafe capital') ||
                                   tituloLower.includes('santa fe capital') ||
                                   tituloLower.includes('santafe capital') ||
                                   ubicacionLower.includes(', santa fe') ||
                                   tituloLower.includes(', santa fe')
      
      // Validar URL primero
      let urlValida = false
      if (urlRel) {
          const urlLower = urlRel.toLowerCase()
          if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
              urlValida = true
          }
          // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
          if (!esClaramenteSantaFe && !urlValida) {
            if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
            if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
          }
      }
      
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )
      
      // Blacklist ESTRICTA de Buenos Aires
      const blackListEstricta = [
        'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
        'palermo', 'belgrano', 'las caÃƒÂ±itas', 'las canitas', 'caÃƒÂ±itas',
        'puerto madero', 'retiro', 'microcentro buenos aires', 'microcentro caba',
        'quilmes', 'lanus', 'san isidro', 'tigre', 'san fernando',
        'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
        // Calles y zonas especÃƒÂ­ficas de Buenos Aires
        'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
        'cid campeador', 'campeador',
        'villa crespo', 'villa urquiza', 'caballito', 'almagro', 'flores',
        'barracas', 'la boca', 'san telmo', 'montserrat', 'nunez', 'saavedra',
        'colegiales', 'recoleta buenos aires', 'recoleta caba'
      ]
      // PERO: NO aplicar blacklist si es claramente de Santa Fe
      let tieneProhibido = false
      if (!esClaramenteSantaFe) {
        tieneProhibido = blackListEstricta.some(bad => 
          ubicacionLower.includes(bad) || tituloLower.includes(bad) || urlRel?.toLowerCase().includes(bad.replace(' ', '-'))
        )
      }
      
      // FILTRO ESTRICTO: Rechazar SIEMPRE si tiene palabras prohibidas Y NO es claramente de Santa Fe
      if (tieneProhibido && !esClaramenteSantaFe) return
      
      // FILTRO INTELIGENTE: Como la URL de bÃƒÂºsqueda SIEMPRE apunta a Santa Fe, ser mÃƒÂ¡s permisivo
      // Si la URL del item menciona santa-fe Ã¢â€ â€™ aceptar
      // Si tiene zona de Santa Fe explÃƒÂ­cita Ã¢â€ â€™ aceptar
      // Si NO tiene palabras prohibidas Ã¢â€ â€™ aceptar (confiar en que el portal devolviÃƒÂ³ resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explÃƒÂ­citas (ya validado arriba)
      if (urlValida) {
        // URL del item vÃƒÂ¡lida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explÃƒÂ­cita, aceptar
      } else {
        // Como la bÃƒÂºsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas Ã¢â€ â€™ aceptar
        // Confiamos en que el portal devolviÃƒÂ³ resultados de Santa Fe
        // No rechazar si no tiene indicadores explÃƒÂ­citos, confiar en la URL de bÃƒÂºsqueda
      }

      let img = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src')

      if (titulo && precio && urlRel) {
        // Validar que el item cumple con los criterios de bÃƒÂºsqueda
        const validacion = validarItemContraCriterios(titulo, precio, criterios, 'Buscainmueble')
        if (!validacion.valido) {
          console.log(`Buscainmueble: Rechazado - ${validacion.razon}: ${titulo.substring(0, 50)}`)
          return
        }
        
        const urlCompleta = urlRel.startsWith('http') 
          ? urlRel 
          : `https://www.buscainmueble.com${urlRel}`

        items.push({
           sitio: 'Buscainmueble',
           titulo: titulo,
           precio: precio.replace(/\n/g, '').trim(),
           ubicacion: ubicacion || 'Santa Fe',
           url: urlCompleta,
           img: img || null
        })
        console.log(`Buscainmueble: Agregado item ${items.length}: ${titulo.substring(0, 50)}`)
      } else {
        console.log(`Buscainmueble: Item rechazado - titulo: ${titulo ? 'SÃƒÂ­' : 'No'}, precio: ${precio ? 'SÃƒÂ­' : 'No'}, url: ${urlRel ? 'SÃƒÂ­' : 'No'}`)
      }
    })

    console.log(`Buscainmueble: Total de items encontrados: ${items.length}`)
    return items

  } catch (error) {
    console.error('Error scraping Buscainmueble:', error)
    return []
  }
}






