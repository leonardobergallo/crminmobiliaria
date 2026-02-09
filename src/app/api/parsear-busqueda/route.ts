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

// ----------------------------------------------------------------------
// UTILIDADES DE SCRAPING
// ----------------------------------------------------------------------

function getRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
  ]
  return agents[Math.floor(Math.random() * agents.length)]
}

function getScrapingHeaders(referer: string = 'https://www.google.com/') {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': referer,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Upgrade-Insecure-Requests': '1'
  }
}

async function fetchWithTimeout(url: string, options: any = {}, timeout: number = 8000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

// POST: Parsear mensaje de WhatsApp (parser local)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { mensaje, guardar, clienteId } = await request.json()

    if (!mensaje || mensaje.trim().length < 10) {
      return NextResponse.json(
        { error: 'El mensaje es muy corto para analizar' },
        { status: 400 }
      )
    }

    // Usar SOLO parser local (IA deshabilitada por solicitud del usuario)
    const busquedaParseada = parsearBusquedaLocal(mensaje)
    const usandoIA = false

    // Si se pide guardar, crear cliente y búsqueda
    if (guardar) {
      let cliente = null

      // Si se proporciona clienteId, usarlo directamente
      if (clienteId) {
        cliente = await prisma.cliente.findUnique({
          where: { id: clienteId }
        })
        
        if (!cliente) {
          return NextResponse.json(
            { error: 'Cliente no encontrado' },
            { status: 404 }
          )
        }

        // Verificar que el cliente pertenece a la misma inmobiliaria
        if (cliente.inmobiliariaId !== currentUser.inmobiliariaId) {
          return NextResponse.json(
            { error: 'No autorizado para este cliente' },
            { status: 403 }
          )
        }
      } else {
        // Si no se proporciona clienteId, buscar o crear automáticamente
        const nombreFallback = `Cliente WhatsApp ${new Date().toLocaleDateString()}`
        const nombreParaGuardar = busquedaParseada.nombreCliente || nombreFallback

        // Buscar cliente existente
        cliente = await prisma.cliente.findFirst({
          where: {
            inmobiliariaId: currentUser.inmobiliariaId,
            OR: [
               // Buscar por teléfono si existe
               ...(busquedaParseada.telefono ? [{ telefono: busquedaParseada.telefono }] : []),
               // O buscar por el nombre exacto que usaríamos
               { nombreCompleto: nombreParaGuardar }
            ]
          }
        })

        // Si no existe, crear nuevo cliente
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
             // En caso de race condition, intentar buscar de nuevo
             if (e.code === 'P2002') {
                cliente = await prisma.cliente.findFirst({
                  where: {
                    nombreCompleto: nombreParaGuardar,
                    inmobiliariaId: currentUser.inmobiliariaId
                  }
                })
             }
             if (!cliente) throw e // Si aun así falla, re-lanzar
          }
        }
      }

      // Crear búsqueda
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
          observaciones: `Operación: ${busquedaParseada.operacion}\n${busquedaParseada.notas}\n\nCaracterísticas: ${busquedaParseada.caracteristicas.join(', ')}\n\n--- Mensaje original ---\n${mensaje}`,
          origen: 'PERSONALIZADA',
          estado: 'ACTIVA',
          createdBy: currentUser.id,
        }
      })

      // Buscar coincidencias en DB
      const matches = await encontrarMatchesEnDb(busquedaParseada)
      
      // Generar links a portales externos
      const webMatches = generarLinksExternos(busquedaParseada)
      
      // Scrapear resultados reales (MercadoLibre + ArgenProp + Remax + ZonaProp + Buscainmueble)
      // Ejecutamos en paralelo para velocidad
      const [mlItems, apItems, remaxItems, zpItems, biItems] = await Promise.all([
        scrapearMercadoLibre(busquedaParseada),
        scrapearArgenProp(busquedaParseada),
        scrapearRemax(busquedaParseada),
        scrapearZonaProp(busquedaParseada),
        scrapearBuscainmueble(busquedaParseada)
      ])

      // Combinar y deduplicar por URL
      const allScraped = [...mlItems, ...apItems, ...remaxItems, ...zpItems, ...biItems]
    
      // Deduplicar: Preferir ArgenProp sobre ML si parecen iguales, o solo por URL única
      const uniqueScraped = Array.from(new Map(allScraped.map(item => [item.url, item])).values())

      return NextResponse.json({
        success: true,
        busquedaParseada,
        matches,
        webMatches,
        scrapedItems: uniqueScraped,
        usandoIA,
        guardado: {
          clienteId: cliente.id,
          clienteNombre: cliente.nombreCompleto,
          busquedaId: busqueda.id,
        }
      })
    }

    // Buscar coincidencias en DB
    const matches = await encontrarMatchesEnDb(busquedaParseada)
    // Generar links a portales externos
    const webMatches = generarLinksExternos(busquedaParseada)
    
    // Scrapear resultados reales (MercadoLibre + ArgenProp + Remax)
    const [mlItems, apItems, remaxItems] = await Promise.all([
        scrapearMercadoLibre(busquedaParseada),
        scrapearArgenProp(busquedaParseada),
        scrapearRemax(busquedaParseada)
    ])
    
    const allScraped = [...mlItems, ...apItems, ...remaxItems]
    const uniqueScraped = Array.from(new Map(allScraped.map(item => [item.url, item])).values())

    return NextResponse.json({
      success: true,
      busquedaParseada,
      matches,
      webMatches,
      scrapedItems: uniqueScraped,
      usandoIA,
      guardado: null
    })
  } catch (error: unknown) {
    console.error('Error parseando búsqueda:', error)
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

  const systemPrompt = `Eres un asistente experto en análisis de mensajes de WhatsApp para búsquedas inmobiliarias en Santa Fe Capital, Argentina.

Analiza el mensaje y extrae la siguiente información en formato JSON:
{
  "tipoPropiedad": "CASA|DEPARTAMENTO|TERRENO|PH|LOCAL|OFICINA|OTRO",
  "operacion": "COMPRA|ALQUILER",
  "presupuestoMax": número o null,
  "moneda": "USD|ARS",
  "zonas": ["array de zonas mencionadas"],
  "dormitoriosMin": número o null,
  "ambientesMin": número o null,
  "cochera": true|false,
  "caracteristicas": ["array de características especiales"],
  "notas": "texto adicional relevante"
}

Zonas comunes en Santa Fe Capital: Candioti, Centro, Microcentro, Barrio Sur, Barrio Norte, Guadalupe, 7 Jefes, Bulevar, Constituyentes, Mayoraz, Maria Selva, Sargento Cabral, Las Flores, Roma, Fomento, Barranquitas, Los Hornos, Ciudadela, San Martín, Recoleta, Puerto, Costanera, Villa Setubal.

IMPORTANTE: 
- SIEMPRE asume que la búsqueda es para Santa Fe Capital, Argentina
- Si menciona "Santa Fe" sin más detalles, asume que es Santa Fe Capital
- Si NO menciona ninguna zona específica, SIEMPRE usa ["Santa Fe Capital"] por defecto
- Si menciona zonas de Buenos Aires (Palermo, Belgrano, Hilarion, Quintana, Villa Ballester, etc.), IGNÓRALAS completamente
- Si menciona "habitaciones", "dormitorios", "ambientes" sin zona, asume Santa Fe Capital
- Para presupuesto, extrae solo números (ej: "USD 150.000" -> 150000)
- NUNCA uses zonas de Buenos Aires, solo zonas de Santa Fe Capital
- Responde SOLO con el JSON, sin texto adicional.`

  const userPrompt = `Analiza este mensaje de WhatsApp y extrae la información de búsqueda inmobiliaria:\n\n"${mensaje}"`

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
      throw new Error('No se recibió respuesta de la IA')
    }

    const parsed = JSON.parse(respuesta)

    return {
      nombreCliente: null,
      telefono: null,
      tipoPropiedad: parsed.tipoPropiedad || 'OTRO',
      operacion: parsed.operacion || 'COMPRA',
      presupuestoMin: null,
      presupuestoMax: parsed.presupuestoMax || null,
      moneda: parsed.moneda || 'USD',
      zonas: Array.isArray(parsed.zonas) && parsed.zonas.length > 0 
        ? parsed.zonas 
        : ['Santa Fe Capital'], // Si no hay zonas, usar Santa Fe Capital por defecto
      dormitoriosMin: parsed.dormitoriosMin || null,
      ambientesMin: parsed.ambientesMin || null,
      cochera: parsed.cochera || false,
      caracteristicas: Array.isArray(parsed.caracteristicas) ? parsed.caracteristicas : [],
      notas: parsed.notas || `Procesado con IA. ${mensaje.substring(0, 100)}`,
      confianza: 90 // IA tiene mayor confianza
    }
  } catch (error) {
    console.error('Error en parseo con IA:', error)
    throw error
  }
}

// ----------------------------------------------------------------------
// PARSER LOCAL DE FALLBACK (Regex System)
// ----------------------------------------------------------------------
function parsearBusquedaLocal(mensaje: string): BusquedaParseada {
  const msg = mensaje.toLowerCase()
  
  // 1. Detectar Operación
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
  if (msg.includes('us$') || msg.includes('u$d') || msg.includes('dólares') || msg.includes('dolares') || msg.includes('usd')) {
    moneda = 'USD'
  }

  // 4. Detectar Presupuesto
  let presupuestoMax: number | null = null
  // Regex mejorado: Busca "hasta X", "max X", "menos de X", "X o menos"
  const precioRegex = /(?:hasta|max|máx|presupuesto|pago|gastaría|menos de|precio|valor)\s*(?:de)?\s*(?:u\$s|u\$d|\$|usd|ars)?\s*(\d+(?:[\.,]\d+)?)(?:\s*(?:k|mil|millones|m))?/i
  
  // Intento 1: Expresión directa
  let matchPrecio = mensaje.match(precioRegex)
  
  // Intento 2: Buscar numero suelto grande cerca de moneda si no halló nada
  if (!matchPrecio) {
     const loosePriceRegex = /(?:u\$s|u\$d|usd)\s*(\d+(?:[\.,]\d+)?)(\s*k|\s*mil)?/i
     matchPrecio = mensaje.match(loosePriceRegex)
  }

  if (matchPrecio) {
    let rawStr = matchPrecio[1].replace(/\./g, '').replace(/,/g, '.')
    let num = parseFloat(rawStr)
    
    // Multipliers
    const suffix = matchPrecio[0].toLowerCase()
    if (suffix.includes('k') || suffix.includes('mil ')) num *= 1000
    if (suffix.includes('millón') || suffix.includes('millon') || suffix.includes('m')) num *= 1000000
    
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

  // 5. Detectar Dormitorios/Ambientes (MEJORADO para detectar "una habitación", "un dormitorio", etc.)
  let dormitoriosMin: number | null = null
  
  // Mapeo de palabras a números
  const numerosTexto: Record<string, number> = {
    'una': 1, 'un': 1, 'uno': 1,
    'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
    'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10
  }
  
  // Regex mejorado: busca números O palabras de número seguidos de dorm/habitaci/hab
  // Ejemplos: "1 habitación", "una habitación", "con 2 dormitorios", "un dormitorio"
  const dormRegex1 = /(\d+)\s*(?:dorm|habitaci|hab|cuartos|piezas)/i
  const matchDorm1 = mensaje.match(dormRegex1)
  if (matchDorm1) {
    dormitoriosMin = parseInt(matchDorm1[1])
  } else {
    // Buscar palabras de número + habitación/dormitorio
    const dormRegex2 = /(?:con|de|tiene|tener)?\s*(una|un|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:dorm|habitaci|hab|cuartos|piezas)/i
    const matchDorm2 = mensaje.match(dormRegex2)
    if (matchDorm2) {
      const palabraNumero = matchDorm2[1].toLowerCase()
      dormitoriosMin = numerosTexto[palabraNumero] || null
    } else {
      // Buscar "habitación" o "dormitorio" después de "una/un"
      const dormRegex3 = /(?:con|de|tiene|tener)?\s*(una|un|uno)\s+(?:habitaci|dorm|hab|cuartos|piezas)/i
      const matchDorm3 = mensaje.match(dormRegex3)
      if (matchDorm3) {
        dormitoriosMin = 1
      }
    }
  }
  
  // También buscar por ambientes
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
    'san martin': 'San Martín',
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

  // IMPORTANTE: Si no se detectó ninguna zona, usar "Santa Fe Capital" por defecto
  // Esto asegura que siempre busque en Santa Fe, no en Buenos Aires
  if (zonasEncontradas.length === 0) {
    zonasEncontradas.push('Santa Fe Capital')
  }

  // 8. Particularidades (A refaccionar)
  const caracteristicas: string[] = []
  if (msg.includes('refaccionar') || msg.includes('reciclar') || msg.includes('demoler')) caracteristicas.push('A Refaccionar')
  if (msg.includes('patio')) caracteristicas.push('Patio')
  if (msg.includes('pileta') || msg.includes('piscina')) caracteristicas.push('Pileta')
  if (msg.includes('balcon') || msg.includes('balcón')) caracteristicas.push('Balcón')

  return {
    nombreCliente: null, 
    telefono: null,
    tipoPropiedad,
    operacion,
    presupuestoMin: null,
    presupuestoMax,
    moneda,
    zonas: zonasEncontradas,
    dormitoriosMin,
    ambientesMin,
    cochera,
    caracteristicas,
    notas: `Procesado Localmente (Sin IA). Zonas detectadas: ${zonasEncontradas.join(', ')}. Presupuesto: ${presupuestoMax} ${moneda}`,
    confianza: 75
  }
}

// ----------------------------------------------------------------------
// BUSCAR PROPIEDADES EN DB (MATCHING AUTOMATICO)
// ----------------------------------------------------------------------
// NOTA: Esta función busca en TODAS las inmobiliarias (Solar, Carli, etc.)
// No filtra por inmobiliariaId para permitir búsqueda global
async function encontrarMatchesEnDb(criterios: BusquedaParseada) {
  // Construir filtros de Prisma - BÚSQUEDA ESTRICTA (solo coincidencias reales)
  // IMPORTANTE: No filtramos por inmobiliariaId para buscar en TODAS las inmobiliarias
  const where: any = {
    estado: { in: ['APROBADA', 'BORRADOR', 'EN_ANALISIS'] },
    // Buscar en todas las inmobiliarias (Solar, Carli, etc.)
    // inmobiliariaId no se filtra aquí para permitir búsqueda global
  }

  // Validar que tengamos al menos un criterio importante para buscar
  // Ahora siempre tenemos zonas (por defecto "Santa Fe Capital"), así que esto siempre será true
  const tieneCriterios = criterios.tipoPropiedad || criterios.presupuestoMax || criterios.zonas.length > 0 || criterios.dormitoriosMin
  
  if (!tieneCriterios) {
    // Si no hay criterios específicos, buscar todas las propiedades aprobadas
    const todas = await prisma.propiedad.findMany({
      where: { estado: { in: ['APROBADA', 'BORRADOR', 'EN_ANALISIS'] } },
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

  // Construir condiciones - BÚSQUEDA MÁS ESTRICTA (debe cumplir criterios relevantes)
  const condicionesAND: any[] = []
  const condicionesOR: any[] = []

  // Filtrar propiedades con precio válido (mayor a 0)
  condicionesAND.push({
    precio: { gt: 0 }
  })

  // 1. Tipo de Propiedad (OBLIGATORIO si está especificado y no es OTRO)
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

  // 2. Presupuesto (OBLIGATORIO si está especificado - margen razonable)
  if (criterios.presupuestoMax) {
    // Margen más razonable: desde 70% hasta 130% del presupuesto
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

  // 3. Zonas (FLEXIBLE - busca si hay otros criterios o si es zona específica)
  const tieneCriteriosEspecificos = (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') || 
                                     criterios.presupuestoMax || 
                                     criterios.dormitoriosMin
  
  if (criterios.zonas.length > 0) {
    // Si solo tiene "Santa Fe Capital" por defecto SIN otros criterios, no buscar
    // Pero si tiene otros criterios (tipo, precio, dormitorios), SÍ buscar
    const esSoloSantaFeDefault = criterios.zonas.length === 1 && 
                                  criterios.zonas[0].toLowerCase().includes('santa fe capital')
    
    if (!esSoloSantaFeDefault || tieneCriteriosEspecificos) {
      // Buscar por zonas específicas (más flexible)
      const zonaConditions = criterios.zonas.flatMap(z => {
        const condiciones: any[] = [
          { ubicacion: { contains: z, mode: 'insensitive' } },
          { zona: { contains: z, mode: 'insensitive' } },
          { localidad: { contains: z, mode: 'insensitive' } },
          { titulo: { contains: z, mode: 'insensitive' } }
        ]
        
        // Si es "Santa Fe Capital", también buscar por "santa fe" solo
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

  // 4. Dormitorios (OBLIGATORIO si está especificado - permite 1 menos)
  if (criterios.dormitoriosMin) {
    condicionesAND.push({
      OR: [
        { dormitorios: { gte: criterios.dormitoriosMin } },
        { dormitorios: { gte: Math.max(1, criterios.dormitoriosMin - 1) } },
        { ambientes: { gte: criterios.dormitoriosMin } }
      ]
    })
  }

  // Si no hay criterios específicos, no buscar (evitar mostrar todas las propiedades)
  // Pero si tiene tipo + dormitorios o tipo + zona, SÍ buscar
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

  // Si no hay ningún criterio específico, buscar todas las propiedades aprobadas
  if (!where.OR && !where.AND) {
    // Buscar propiedades sin filtros específicos (solo por estado)
    const todas = await prisma.propiedad.findMany({
      where: { estado: { in: ['APROBADA', 'BORRADOR', 'EN_ANALISIS'] } },
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
    take: 20, // Buscar más para luego filtrar mejor
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

  // Validación ESTRICTA: solo propiedades que realmente coinciden
  const propiedadesValidadas = propiedades.filter(prop => {
    // 1. Validar precio (OBLIGATORIO si está especificado)
    if (criterios.presupuestoMax && prop.precio) {
      const minPrecio = Math.floor(criterios.presupuestoMax * 0.7)
      const maxPrecio = Math.ceil(criterios.presupuestoMax * 1.3)
      if (prop.precio < minPrecio || prop.precio > maxPrecio) return false
      if (prop.moneda !== criterios.moneda) return false
    }

    // 2. Validar tipo (OBLIGATORIO si está especificado y no es OTRO)
    if (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') {
      const textoCompleto = `${prop.tipo} ${prop.titulo} ${prop.subtipo || ''}`.toLowerCase()
      const tipoLower = criterios.tipoPropiedad.toLowerCase()
      if (!textoCompleto.includes(tipoLower)) return false
    }

    // 3. Validar dormitorios (OBLIGATORIO si está especificado)
    if (criterios.dormitoriosMin) {
      const dorms = prop.dormitorios || 0
      const ambientes = prop.ambientes || 0
      const dormOk = dorms >= criterios.dormitoriosMin || 
                     dorms >= Math.max(1, criterios.dormitoriosMin - 1) ||
                     (ambientes >= criterios.dormitoriosMin)
      if (!dormOk) return false
    }

    // 4. Validar zona (FLEXIBLE - solo rechazar si es explícitamente de otra ciudad)
    if (criterios.zonas.length > 0) {
      const textoCompleto = `${prop.ubicacion} ${prop.zona || ''} ${prop.localidad || ''} ${prop.direccion || ''} ${prop.titulo || ''}`.toLowerCase()
      
      // Blacklist: rechazar SIEMPRE si menciona explícitamente otras ciudades
      const ciudadesProhibidas = ['buenos aires', 'capital federal', 'caba', 'rosario', 'cordoba', 'mendoza']
      const tieneCiudadProhibida = ciudadesProhibidas.some(ciudad => textoCompleto.includes(ciudad))
      if (tieneCiudadProhibida) return false
      
      // Si tiene otros criterios específicos (tipo, dormitorios), ser más flexible con la zona
      const tieneCriteriosEspecificos = (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') || 
                                         criterios.presupuestoMax || 
                                         criterios.dormitoriosMin
      
      // Si tiene criterios específicos, aceptar si NO tiene ciudad prohibida (asumimos Santa Fe)
      // Si no tiene criterios específicos, validar que tenga zona de Santa Fe
      if (!tieneCriteriosEspecificos) {
        const tieneZona = criterios.zonas.some(z => {
          const zonaLower = z.toLowerCase()
          return textoCompleto.includes(zonaLower) || 
                 textoCompleto.includes('santa fe') || 
                 textoCompleto.includes('santafe')
        })
        if (!tieneZona) return false
      }
      // Si tiene criterios específicos, solo validamos que NO tenga ciudad prohibida (ya hecho arriba)
    }

    return true
  })

  // Limitar resultados a máximo 8 para mostrar resultados relevantes
  return propiedadesValidadas.slice(0, 8)
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

  const links: ExternLink[] = []
  
  // Normalizar datos para URLs
  const zonas = criterios.zonas.length > 0 ? criterios.zonas : ['Santa Fe']
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  const tipo = criterios.tipoPropiedad.toLowerCase() // casa, departamento, terreno
  
  // Helpers
  const slugify = (text: string) => text.toLowerCase().trim().replace(/\s+/g, '-')
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

  zonas.forEach(zona => {
    const terminosBusqueda = `${tipo} ${operacion} ${zona} ${criterios.dormitoriosMin ? criterios.dormitoriosMin + ' dormitorios' : ''}`
    
    // ------------------------------------------------------------------
    // 1. PORTALES PRINCIPALES
    // ------------------------------------------------------------------
    
    // ZonaProp
    // Forzamos "ciudad-de-santa-fe-sf" para evitar conflictos
    let zpTipo = tipo === 'departamento' ? 'departamentos' : (tipo === 'casa' ? 'casas' : 'inmuebles')
    let zpUrl = `https://www.zonaprop.com.ar/${zpTipo}-${operacion}-ciudad-de-santa-fe-sf`
    if (criterios.dormitoriosMin) zpUrl += `-${criterios.dormitoriosMin}-habitaciones`
    links.push({
      sitio: 'ZonaProp',
      titulo: `ZonaProp: ${capital(tipo)} en ${zona}`,
      url: `${zpUrl}.html`,
      icon: '🏢',
      categoria: 'PORTALES'
    })

    // ArgenProp
    // EVITAR "santa-fe" porque matchea con Av Santa Fe en CABA
    // Usar "santa-fe-santa-fe" o "santa-fe-capital"
    let apTipo = tipo === 'departamento' ? 'departamentos' : (tipo === 'casa' ? 'casas' : (tipo === 'terreno' ? 'terrenos' : 'inmuebles'))
    let apUrl = `https://www.argenprop.com/${apTipo}/${operacion}/santa-fe-santa-fe`
    links.push({
      sitio: 'ArgenProp',
      titulo: `ArgenProp: ${capital(tipo)} en Santa Fe`,
      url: apUrl,
      icon: '🏠',
      categoria: 'PORTALES'
    })

    // MercadoLibre
    // Explicitamente "santa-fe/santa-fe-capital"
    const mlOperacion = operacion === 'venta' ? 'venta' : 'alquiler'
    const mlTipo = tipo === 'departamento' ? 'departamentos' : (tipo === 'casa' ? 'casas' : 'inmuebles')
    let mlUrl = `https://inmuebles.mercadolibre.com.ar/${mlTipo}/${mlOperacion}/santa-fe/santa-fe-capital`
    links.push({
       sitio: 'MercadoLibre',
       titulo: `MercadoLibre: ${capital(tipo)}`,
       url: mlUrl,
       icon: '🤝',
       categoria: 'PORTALES'
    })
    
    // Buscainmueble (Agregador)
    links.push({
        sitio: 'Buscainmueble',
        titulo: 'Buscainmueble: Agregador',
        url: `https://www.buscainmueble.com/propiedades/${tipo}s-en-${operacion}-en-santa-fe-santa-fe`,
        icon: '🔎',
        categoria: 'PORTALES'
    })

    // ------------------------------------------------------------------
    // 2. INMOBILIARIAS Y REDES
    // ------------------------------------------------------------------

    // Remax
    // Address estricto "Santa Fe, Santa Fe"
    const rxOp = operacion === 'venta' ? 'venta' : 'alquiler'
    links.push({
        sitio: 'Remax',
        titulo: 'Red Remax',
        url: `https://www.remax.com.ar/propiedades/en-${rxOp}?address=Santa+Fe%2C+Santa+Fe`,
        icon: '🎈',
        categoria: 'INMOBILIARIAS'
    })

    // Century 21
    // Ubicacion "Santa Fe Capital" para evitar Buenos Aires
    const c21Op = operacion === 'venta' ? 'Venta' : 'Alquiler'
    const c21Tipo = tipo === 'casa' ? 'Casa' : (tipo === 'departamento' ? 'Departamento' : 'Propiedad')
    links.push({
        sitio: 'Century 21',
        titulo: 'Century 21 Global',
        url: `https://www.century21.com.ar/propiedades?operacion=${c21Op}&tipo_propiedad=${c21Tipo}&ubicacion=Santa+Fe+Capital`,
        icon: '🏠',
        categoria: 'INMOBILIARIAS'
    })

    // ------------------------------------------------------------------
    // 3. PORTALES INTERNACIONALES / OTROS
    // ------------------------------------------------------------------

    // Properstar
    // https://www.properstar.com.ar/argentina/santa-fe-province/santa-fe/casa-venta
    links.push({
        sitio: 'Properstar',
        titulo: 'Properstar (Internacional)',
        url: `https://www.properstar.com.ar/argentina/santa-fe-province/santa-fe/${slugify(tipo)}-${operacion}`,
        icon: '⭐',
        categoria: 'INTERNACIONALES'
    })

    // FazWaz
    // https://www.fazwaz.com.ar/en-venta/argentina/santa-fe/santa-fe
    links.push({
        sitio: 'FazWaz',
        titulo: 'FazWaz Invest',
        url: `https://www.fazwaz.com.ar/en-${operacion}/argentina/santa-fe/santa-fe`,
        icon: '📈',
        categoria: 'INTERNACIONALES'
    })

    // Rentberry (Solo Alquileres, si aplica)
    if (operacion === 'alquiler') {
        links.push({
            sitio: 'Rentberry',
            titulo: 'Rentberry (Global Rentals)',
            url: `https://rentberry.com/ar/apartments/s/santa-fe-argentina`,
            icon: '🍇',
            categoria: 'INTERNACIONALES'
        })
    }

    // Google Search (Genérico)
    links.push({
        sitio: 'Google',
        titulo: `Google: ${terminosBusqueda}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(terminosBusqueda + ' inmobiliaria santa fe')}`,
        icon: '🔍',
        categoria: 'PORTALES'
    })
  })

  // Eliminar duplicados de URL (manteniendo el último por si es más específico)
  const uniqueLinks = Array.from(new Map(links.map(item => [item.url, item])).values())
  return uniqueLinks
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
  
  // 1. Rechazar elementos de UI (más estricto)
  // Si el título es muy corto o contiene palabras clave de UI, rechazar
  if (tituloLower.length < 10) {
    return { valido: false, razon: 'título muy corto (posible elemento UI)' }
  }
  
  const palabrasUI = [
    'buscar solo', 'filtrar', 'moneda:', 'limpiar', 'aplicar',
    'argentina', 'uruguay', 'paraguay', 'brasil', 'emiratos', 'españa',
    'estados unidos', 'seleccionar', 'opciones', 'país', 'países'
  ]
  
  if (palabrasUI.some(palabra => tituloLower.includes(palabra))) {
    return { valido: false, razon: 'elemento de UI' }
  }
  
  // Si el precio contiene texto de UI (como "expensas" sin contexto de propiedad)
  if (precioLower.includes('expensas') && !tituloLower.includes('departamento') && !tituloLower.includes('casa')) {
    return { valido: false, razon: 'precio con texto de UI' }
  }
  
  // Si la ubicación es muy genérica o parece ser un selector
  if (tituloLower.match(/^\([0-9]+\)$/)) {
    return { valido: false, razon: 'ubicación genérica (selector UI)' }
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
  
  // 3. Filtrar por operación
  if (criterios.operacion === 'COMPRA') {
    if (tituloLower.includes('alquiler') || precioLower.includes('alquiler') || precioLower.includes('alq')) {
      return { valido: false, razon: 'operación no coincide (alquiler vs compra)' }
    }
  } else if (criterios.operacion === 'ALQUILER') {
    if (tituloLower.includes('venta') || tituloLower.includes('vende') || precioLower.includes('venta')) {
      return { valido: false, razon: 'operación no coincide (venta vs alquiler)' }
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
        if (precioFinal > criterios.presupuestoMax * 1.1) { // Permitir 10% de margen
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
     // Configuración
    const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    let tipo = 'inmuebles'
    if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
    if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
    if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
    
    // SIEMPRE buscar en Santa Fe Capital
    // Mejorar detección de zona para URL
    let zonaStr = criterios.zonas.length > 0 ? criterios.zonas[0] : 'santa-fe'
    
    // Lista blanca de zonas permitidas (Santa Fe y alrededores)
    const zonasSantaFe = ['santa-fe', 'rincon', 'santo-tome', 'sauce-viejo', 'arroyo-leyes', 'recreo', 'colastine']
    const esZonaLocal = zonasSantaFe.some(z => zonaStr.toLowerCase().includes(z))
    
    if (!esZonaLocal) {
        // Si la zona detectada no es local conocida, forzamos santa-fe
        zonaStr = 'santa-fe'
    }

    const zonaLimipia = zonaStr.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    // Intentamos URL de búsqueda directa que suele ser más permisiva
    // Format: https://listado.mercadolibre.com.ar/inmuebles/{tipo}/{operacion}/{zona}
    
    // Estrategia "Fina": Si es Santa Fe Capital, usar "santa-fe/santa-fe-capital"
    let zonaQuery = zonaLimipia
    if (zonaQuery === 'santa-fe' || zonaQuery.includes('santa-fe-capital')) {
        zonaQuery = 'santa-fe/santa-fe-capital'
    } else if (!zonaQuery.includes('santa-fe')) {
        // Para Rincón, Santo Tomé, etc., agregar prefijo de provincia
        zonaQuery = `santa-fe/${zonaQuery}`
    }

    // La URL siempre apunta a Santa Fe, así que confiamos en ella
    const urlBusquedaEsSantaFe = true
    
    let url = `https://listado.mercadolibre.com.ar/inmuebles/${tipo}/${operacion}/${zonaQuery}`
    
    // Agregar filtro de dormitorios si está disponible (ML permite esto en algunos casos)
    if (criterios.dormitoriosMin) {
      // MercadoLibre permite agregar dormitorios en la query string
      url += `?DORMITORIOS=${criterios.dormitoriosMin}`
    }
    
    // Filtro anti-ruido (Buenos Aires, Rosario)
    // Agregamos término de búsqueda negativo en la query string si es posible, 
    // pero ML lo maneja mejor con la URL
    
    if (criterios.presupuestoMax && !criterios.dormitoriosMin) {
      url += url.includes('?') ? '&_ORDER_BY_PRICE_ASC' : '?_ORDER_BY_PRICE_ASC'
    } else if (criterios.presupuestoMax && criterios.dormitoriosMin) {
      url += '&_ORDER_BY_PRICE_ASC'
    }

    console.log(`Scraping MercadoLibre: ${url}`)
    
    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.mercadolibre.com.ar/')
    })

    if (!response.ok) {
      console.log(`MercadoLibre: Error HTTP ${response.status} para URL: ${url}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    const items: any[] = []

    // SOPORTE PARA MÚLTIPLES DISEÑOS DE ML (Lista vs Grilla/Poly vs otros)
    // Intentar múltiples selectores para asegurar que encontramos resultados
    let elements = $('.ui-search-layout__item, .poly-card, .ui-search-result, [data-testid="item"], .results-item')
    
    // Si no encontramos elementos, intentar selectores más genéricos
    if (elements.length === 0) {
      elements = $('article, .item, [class*="item"], [class*="card"], [class*="result"]')
      console.log(`MercadoLibre: Usando selectores genéricos, encontrados: ${elements.length}`)
    } else {
      console.log(`MercadoLibre: Encontrados ${elements.length} elementos con selectores específicos`)
    }
    
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
    
    // Blacklist ESTRICTA: Excluir Buenos Aires y otras ciudades
    const blackList = [
      // Buenos Aires / CABA
      'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
      'palermo', 'belgrano', 'recoleta', 'las cañitas', 'las canitas', 'cañitas',
      'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
      'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
      'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
      'microcentro buenos aires', 'microcentro caba',
      // Calles y zonas específicas de Buenos Aires
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
      if (items.length >= 10) return // Aumentar a 10 resultados por portal

      // Selectores Híbridos (intenta uno, si no, el otro)
      const titulo = $(el).find('.ui-search-item__title, .poly-component__title, h2, h3, [class*="title"]').first().text().trim()
      // Selectores expandidos para precio (MercadoLibre tiene múltiples variantes)
      let precio = $(el).find('.ui-search-price__part, .poly-price__current-price, .ui-search-price, [class*="price"]').first().text().trim()
      // Si no encontramos precio con los selectores principales, intentar más genéricos
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
      // Si tiene "Santa Fe Capital" o "Santa Fe" explícitamente, es válida
      const esClaramenteSantaFe = ubicacionLower.includes('santa fe capital') || 
                                   ubicacionLower.includes('santafe capital') ||
                                   tituloLower.includes('santa fe capital') ||
                                   tituloLower.includes('santafe capital') ||
                                   ubicacionLower.includes(', santa fe') ||
                                   tituloLower.includes(', santa fe')
      
      // Validar URL primero (más confiable)
      let urlValida = false
      if (urlItem) {
          const urlLower = urlItem.toLowerCase()
          // Si la URL menciona santa-fe, es válida
          if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
              urlValida = true
          }
          // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
          if (!esClaramenteSantaFe && !urlValida) {
            if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
            if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
          }
      }
      
      // 1. VALIDACIÓN POSITIVA: Debe contener alguna zona de Santa Fe (en título/ubicación O en URL)
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )
      
      // 2. VALIDACIÓN NEGATIVA: Blacklist ESTRICTA (incluye URL también)
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
      
      // 4. FILTRO INTELIGENTE: Como la URL de búsqueda SIEMPRE apunta a Santa Fe, ser más permisivo
      // Si la URL del item menciona santa-fe → aceptar
      // Si tiene zona de Santa Fe explícita → aceptar
      // Si NO tiene palabras prohibidas → aceptar (confiar en que el portal devolvió resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explícitas (ya validado arriba)
      if (urlValida) {
        // URL del item válida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explícita, aceptar
      } else {
        // Como la búsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas → aceptar
        // Confiamos en que el portal devolvió resultados de Santa Fe
        // No rechazar si no tiene indicadores explícitos, confiar en la URL de búsqueda
      }

      // Imagen (Lazy Load a veces usa data-src)
      let img = $(el).find('img.ui-search-result-image__element, img.poly-component__picture').first().attr('data-src') || 
                $(el).find('img.ui-search-result-image__element, img.poly-component__picture').first().attr('src')

      if (titulo && urlItem && precio) {
        // Validar que el item cumple con los criterios de búsqueda
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
        console.log(`MercadoLibre: Item rechazado - titulo: ${titulo ? 'Sí' : 'No'}, precio: ${precio ? 'Sí' : 'No'}, url: ${urlItem ? 'Sí' : 'No'}`)
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
    // Lógica "Fina": Forzar Santa Fe
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
    
    // Si no es ninguna de las satélites conocidas, asumir Santa Fe Capital
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
    
    // La URL siempre apunta a Santa Fe, así que confiamos en ella
    const urlBusquedaEsSantaFe = true
    
    // Agregar parametro provincia para asegurar
    // ArgenProp usa el slug geográfico completo a veces: santa-fe-santa-fe por ej
    // Probamos con la URL canónica detectada arriba.

    // Agregar dormitorios si está disponible
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

    console.log(`Scraping ArgenProp: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.argenprop.com/')
    })

    if (!response.ok) {
      console.log(`ArgenProp: Error HTTP ${response.status} para URL: ${url}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Debug: Verificar si la página tiene contenido
    const pageTitle = $('title').text()
    console.log(`ArgenProp: Título de página: ${pageTitle.substring(0, 100)}`)
    
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
        'palermo', 'belgrano', 'recoleta', 'las cañitas', 'las canitas', 'cañitas',
        'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
        'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
        'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
        'microcentro buenos aires', 'microcentro caba',
        // Calles y zonas específicas de Buenos Aires
        'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
        'cid campeador', 'campeador',
        'villa crespo', 'villa urquiza', 'caballito', 'almagro', 'flores',
        'barracas', 'la boca', 'san telmo', 'montserrat', 'nunez', 'saavedra',
        'colegiales', 'recoleta buenos aires', 'recoleta caba',
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

    // Intentar múltiples selectores para ArgenProp
    let argenElements = $('.listing__item, .card, [class*="card"], [class*="listing"], article')
    
    if (argenElements.length === 0) {
      // Si no encontramos con selectores específicos, intentar más genéricos
      argenElements = $('[class*="property"], [class*="item"], [data-testid]')
      console.log(`ArgenProp: Usando selectores genéricos, encontrados: ${argenElements.length}`)
    } else {
      console.log(`ArgenProp: Encontrados ${argenElements.length} elementos con selectores específicos`)
    }
    
    argenElements.each((i, el) => {
      if (items.length >= 10) return // Aumentar a 10 resultados

      const titulo = $(el).find('.card__title, .title, h2, h3, [class*="title"]').first().text().trim() || 
                     $(el).find('.card__address, [class*="address"]').first().text().trim()
      const precio = $(el).find('.card__price, .price, [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.card__location, .location, [class*="location"]').first().text().trim() || 
                        $(el).find('.card__address, [class*="address"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos básicos, saltar este elemento
      if (!titulo && !precio) return
      
      // FILTRADO FLEXIBLE: Solo Santa Fe Capital y alrededores
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      
      // Rechazar elementos de UI ANTES de procesar (más temprano)
      if (tituloLower.length < 10 || 
          tituloLower.includes('buscar solo') || 
          tituloLower.includes('moneda:') ||
          (tituloLower.includes('argentina') && !tituloLower.includes('departamento') && !tituloLower.includes('casa')) ||
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
      
      // Validar URL primero (más confiable)
      let urlValida = false
      if (urlRel) {
         const urlLower = urlRel.toLowerCase()
         // Si la URL menciona santa-fe, es válida
         if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
             urlValida = true
         }
         // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
         if (!esClaramenteSantaFe && !urlValida) {
           if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
           if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
         }
      }
      
      // 1. VALIDACIÓN POSITIVA: Debe contener alguna zona de Santa Fe (en título/ubicación O en URL)
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )
      
      // 2. VALIDACIÓN NEGATIVA: Blacklist ESTRICTA (incluye URL también)
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
      
      // 4. FILTRO INTELIGENTE: Como la URL de búsqueda SIEMPRE apunta a Santa Fe, ser más permisivo
      // Si la URL del item menciona santa-fe → aceptar
      // Si tiene zona de Santa Fe explícita → aceptar
      // Si NO tiene palabras prohibidas → aceptar (confiar en que el portal devolvió resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explícitas (ya validado arriba)
      if (urlValida) {
        // URL del item válida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explícita, aceptar
      } else {
        // Como la búsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas → aceptar
        // Confiamos en que el portal devolvió resultados de Santa Fe
        // No rechazar si no tiene indicadores explícitos, confiar en la URL de búsqueda
      }

      // La foto suele estar en data-src de un div o img
      let img = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src')

      if (!titulo || !urlRel || !precio) {
        return
      }
      
      // Validar que el item cumple con los criterios de búsqueda
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
         url: `https://www.argenprop.com${urlRel}`, // Argenprop usa links relativos
         img: img || null
      })
      console.log(`ArgenProp: Agregado item ${items.length}: ${titulo.substring(0, 50)}`)
    })

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
    
    // Remax usa búsqueda por ubicación
    // URL: https://www.remax.com.ar/propiedades/en-venta?address=Santa+Fe%2C+Santa+Fe
    let url = `https://www.remax.com.ar/propiedades/en-${operacion}?address=Santa+Fe%2C+Santa+Fe`
    
    // Agregar filtros si están disponibles
    if (criterios.presupuestoMax) {
      // Remax permite filtros en query params
      url += `&maxPrice=${criterios.presupuestoMax}`
    }
    
    console.log(`Scraping Remax: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.remax.com.ar/')
    })

    if (!response.ok) {
      console.log(`Remax: Error HTTP ${response.status} para URL: ${url}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Debug: Verificar si la página tiene contenido
    const pageTitle = $('title').text()
    console.log(`Remax: Título de página: ${pageTitle.substring(0, 100)}`)
    
    const items: any[] = []
    
    // Remax: Intentar múltiples selectores
    let remaxElements = $('.property-card, .listing-card, [data-testid="property-card"], .card, article, [class*="property"], [class*="listing"]')
    
    if (remaxElements.length === 0) {
      remaxElements = $('[class*="card"], [class*="item"], [data-testid]')
      console.log(`Remax: Usando selectores genéricos, encontrados: ${remaxElements.length}`)
    } else {
      console.log(`Remax: Encontrados ${remaxElements.length} elementos con selectores específicos`)
    }
    
    remaxElements.each((i, el) => {
      if (items.length >= 10) return // Aumentar a 10 resultados

      const titulo = $(el).find('.property-title, .listing-title, h3, h4, [class*="title"]').first().text().trim()
      const precio = $(el).find('.property-price, .price, [data-testid="price"], [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.property-location, .location, [data-testid="location"], [class*="location"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos básicos, saltar este elemento
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
        'palermo', 'belgrano', 'recoleta', 'las cañitas', 'las canitas', 'cañitas',
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
      
      // Validar URL primero (más confiable)
      let urlValida = false
      if (urlRel) {
          const urlLower = urlRel.toLowerCase()
          // Si la URL menciona santa-fe, es válida
          if (urlLower.includes('santa-fe') || urlLower.includes('santafe')) {
              urlValida = true
          }
          // Si la URL tiene palabras prohibidas Y NO es claramente de Santa Fe, descartar
          if (!esClaramenteSantaFe && !urlValida) {
            if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
            if (urlLower.includes('bs-as') || urlLower.includes('buenosaires') || urlLower.includes('capital-federal')) return
          }
      }
      
      // VALIDACIÓN POSITIVA: Debe contener alguna zona de Santa Fe (en título/ubicación O en URL)
      const tieneZonaSantaFe = santaFeZonas.some(zona => 
        ubicacionLower.includes(zona.toLowerCase()) || tituloLower.includes(zona.toLowerCase())
      )
      
      // VALIDACIÓN NEGATIVA: Blacklist ESTRICTA (incluye URL también)
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
      
      // FILTRO INTELIGENTE: Como la URL de búsqueda SIEMPRE apunta a Santa Fe, ser más permisivo
      // Si la URL del item menciona santa-fe → aceptar
      // Si tiene zona de Santa Fe explícita → aceptar
      // Si NO tiene palabras prohibidas → aceptar (confiar en que el portal devolvió resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explícitas (ya validado arriba)
      if (urlValida) {
        // URL del item válida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explícita, aceptar
      } else {
        // Como la búsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas → aceptar
        // Confiamos en que el portal devolvió resultados de Santa Fe
        // No rechazar si no tiene indicadores explícitos, confiar en la URL de búsqueda
      }

      let img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src')

      if (titulo && precio) {
        const urlCompleta = urlRel?.startsWith('http') 
          ? urlRel 
          : urlRel 
            ? `https://www.remax.com.ar${urlRel}`
            : null

        // Validar que el item cumple con los criterios de búsqueda
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
        console.log(`Remax: Agregado item ${items.length}: ${titulo ? titulo.substring(0, 50) : 'Sin título'}`)
      } else {
        console.log(`Remax: Item rechazado - titulo: ${titulo ? 'Sí' : 'No'}, precio: ${precio ? 'Sí' : 'No'}`)
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
    const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    let tipo = 'inmuebles'
    if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
    if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
    if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
    
    // ZonaProp usa "ciudad-de-santa-fe-sf" para Santa Fe Capital
    let url = `https://www.zonaprop.com.ar/${tipo}-${operacion}-ciudad-de-santa-fe-sf`
    if (criterios.dormitoriosMin) url += `-${criterios.dormitoriosMin}-habitaciones`
    url += '.html'
    
    // La URL siempre apunta a Santa Fe, así que confiamos en ella
    const urlBusquedaEsSantaFe = true
    
    // Agregar filtro de precio si está disponible
    if (criterios.presupuestoMax) {
      const precioMax = criterios.presupuestoMax
      url += `?precio-desde=0&precio-hasta=${precioMax}&moneda=${criterios.moneda === 'USD' ? 'USD' : 'ARS'}`
    }

    console.log(`Scraping ZonaProp: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.zonaprop.com.ar/')
    })

    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)
    
    const items: any[] = []
    
    // ZonaProp usa diferentes selectores según la versión
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
      'palermo', 'belgrano', 'recoleta', 'las cañitas', 'las canitas', 'cañitas',
      'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
      'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
      'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
      'microcentro buenos aires', 'microcentro caba',
      // Calles y zonas específicas de Buenos Aires
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

    // ZonaProp: Intentar múltiples selectores
    let zonaElements = $('.posting-card, .posting, [data-posting-id], .card, article, [class*="posting"], [class*="card"]')
    
    if (zonaElements.length === 0) {
      zonaElements = $('[class*="property"], [class*="item"], [data-testid]')
      console.log(`ZonaProp: Usando selectores genéricos, encontrados: ${zonaElements.length}`)
    } else {
      console.log(`ZonaProp: Encontrados ${zonaElements.length} elementos con selectores específicos`)
    }
    
    zonaElements.each((i, el) => {
      if (items.length >= 10) return

      const titulo = $(el).find('.posting-title, .posting-title a, h2, .title, [class*="title"]').first().text().trim()
      const precio = $(el).find('.posting-price, .price, [data-price], [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.posting-location, .location, .address, [class*="location"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos básicos, saltar este elemento
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
        'palermo', 'belgrano', 'las cañitas', 'las canitas', 'cañitas',
        'puerto madero', 'retiro', 'microcentro buenos aires', 'microcentro caba',
        'quilmes', 'lanus', 'san isidro', 'tigre', 'san fernando',
        'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
        // Calles y zonas específicas de Buenos Aires
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
      
      // FILTRO INTELIGENTE: Como la URL de búsqueda SIEMPRE apunta a Santa Fe, ser más permisivo
      // Si la URL del item menciona santa-fe → aceptar
      // Si tiene zona de Santa Fe explícita → aceptar
      // Si NO tiene palabras prohibidas → aceptar (confiar en que el portal devolvió resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explícitas (ya validado arriba)
      if (urlValida) {
        // URL del item válida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explícita, aceptar
      } else {
        // Como la búsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas → aceptar
        // Confiamos en que el portal devolvió resultados de Santa Fe
        // No rechazar si no tiene indicadores explícitos, confiar en la URL de búsqueda
      }

      let img = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src')

      if (titulo && precio && urlRel) {
        // Validar que el item cumple con los criterios de búsqueda
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
    
    // La URL siempre apunta a Santa Fe, así que confiamos en ella
    const urlBusquedaEsSantaFe = true
    
    if (criterios.presupuestoMax) {
      url += `?precio_max=${criterios.presupuestoMax}&moneda=${criterios.moneda === 'USD' ? 'USD' : 'ARS'}`
    }

    console.log(`Scraping Buscainmueble: ${url}`)

    const response = await fetchWithTimeout(url, {
      headers: getScrapingHeaders('https://www.buscainmueble.com/')
    })

    if (!response.ok) {
      console.log(`Buscainmueble: Error HTTP ${response.status} para URL: ${url}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
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
      'palermo', 'belgrano', 'recoleta', 'las cañitas', 'las canitas', 'cañitas',
      'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
      'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
      'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
      'microcentro buenos aires', 'microcentro caba',
      // Calles y zonas específicas de Buenos Aires
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

    // Buscainmueble: Intentar múltiples selectores
    let buscaElements = $('.property-card, .listing-item, [data-property-id], .card, article, [class*="property"], [class*="card"]')
    
    if (buscaElements.length === 0) {
      buscaElements = $('[class*="item"], [class*="listing"], [data-testid]')
      console.log(`Buscainmueble: Usando selectores genéricos, encontrados: ${buscaElements.length}`)
    } else {
      console.log(`Buscainmueble: Encontrados ${buscaElements.length} elementos con selectores específicos`)
    }
    
    buscaElements.each((i, el) => {
      if (items.length >= 10) return

      const titulo = $(el).find('.property-title, .title, h3, h4, [class*="title"]').first().text().trim()
      const precio = $(el).find('.property-price, .price, [class*="price"]').first().text().trim()
      const ubicacion = $(el).find('.property-location, .location, [class*="location"]').first().text().trim()
      const urlRel = $(el).find('a').first().attr('href')
      
      // Si no encontramos datos básicos, saltar este elemento
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
        'palermo', 'belgrano', 'las cañitas', 'las canitas', 'cañitas',
        'puerto madero', 'retiro', 'microcentro buenos aires', 'microcentro caba',
        'quilmes', 'lanus', 'san isidro', 'tigre', 'san fernando',
        'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
        // Calles y zonas específicas de Buenos Aires
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
      
      // FILTRO INTELIGENTE: Como la URL de búsqueda SIEMPRE apunta a Santa Fe, ser más permisivo
      // Si la URL del item menciona santa-fe → aceptar
      // Si tiene zona de Santa Fe explícita → aceptar
      // Si NO tiene palabras prohibidas → aceptar (confiar en que el portal devolvió resultados de Santa Fe)
      // Solo rechazar si tiene palabras prohibidas explícitas (ya validado arriba)
      if (urlValida) {
        // URL del item válida (menciona santa-fe), aceptar
      } else if (tieneZonaSantaFe) {
        // Tiene zona de Santa Fe explícita, aceptar
      } else {
        // Como la búsqueda SIEMPRE apunta a Santa Fe y no tiene palabras prohibidas → aceptar
        // Confiamos en que el portal devolvió resultados de Santa Fe
        // No rechazar si no tiene indicadores explícitos, confiar en la URL de búsqueda
      }

      let img = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src')

      if (titulo && precio && urlRel) {
        // Validar que el item cumple con los criterios de búsqueda
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
        console.log(`Buscainmueble: Item rechazado - titulo: ${titulo ? 'Sí' : 'No'}, precio: ${precio ? 'Sí' : 'No'}, url: ${urlRel ? 'Sí' : 'No'}`)
      }
    })

    console.log(`Buscainmueble: Total de items encontrados: ${items.length}`)
    return items

  } catch (error) {
    console.error('Error scraping Buscainmueble:', error)
    return []
  }
}

