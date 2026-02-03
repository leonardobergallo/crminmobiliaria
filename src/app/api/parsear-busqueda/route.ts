import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'
import OpenAI from 'openai'
import * as cheerio from 'cheerio'

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

// POST: Parsear mensaje de WhatsApp con IA
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { mensaje, guardar } = await request.json()

    if (!mensaje || mensaje.trim().length < 10) {
      return NextResponse.json(
        { error: 'El mensaje es muy corto para analizar' },
        { status: 400 }
      )
    }

    // Verificar que tenemos API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API key de OpenAI no configurada. Agregar OPENAI_API_KEY en .env.local' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const systemPrompt = `Eres un asistente especializado en analizar mensajes de WhatsApp de clientes que buscan propiedades inmobiliarias en Argentina.

Tu tarea es extraer la información estructurada del mensaje y devolverla en formato JSON.

Reglas importantes:
- Si el mensaje menciona "alquiler" o "alquilar", operacion = "ALQUILER"
- Si menciona "comprar", "compra", "venta", operacion = "COMPRA"
- Los precios en pesos argentinos son "ARS", en dólares "USD"
- Detecta zonas/barrios/localidades mencionadas
- Si dice "con cochera" o similar, cochera = true
- Extrae el nombre del cliente si está visible
- Si ves un número de teléfono, extráelo
- El campo "confianza" indica qué tan seguro estás de la interpretación (0-100)
- Si hay información ambigua, ponla en "notas"

Devuelve SOLO el JSON sin markdown ni explicaciones.`

    const userPrompt = `Analiza este mensaje de WhatsApp y extrae la búsqueda inmobiliaria:

"""
${mensaje}
"""

Responde con este formato JSON exacto:
{
  "nombreCliente": "nombre si está visible o null",
  "telefono": "teléfono si está visible o null",
  "tipoPropiedad": "DEPARTAMENTO|CASA|PH|TERRENO|LOCAL|OFICINA|OTRO",
  "operacion": "ALQUILER|COMPRA",
  "presupuestoMin": numero o null,
  "presupuestoMax": numero o null,
  "moneda": "ARS|USD",
  "zonas": ["zona1", "zona2"],
  "dormitoriosMin": numero o null,
  "ambientesMin": numero o null,
  "cochera": true o false,
  "caracteristicas": ["caracteristica1", "caracteristica2"],
  "notas": "cualquier información adicional relevante",
  "confianza": 0-100
}`

    let busquedaParseada: BusquedaParseada

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      })

      const content = completion.choices[0].message.content || '{}'
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim()
      busquedaParseada = JSON.parse(cleaned)

    } catch (openaiError: any) {
      console.warn('Fallo OpenAI (posible quota exceed), usando parser local.', openaiError)
      // Fallback local robusto cuando falla la API
      busquedaParseada = parsearBusquedaLocal(mensaje)
    }

    // Si se pide guardar, crear cliente y búsqueda
    if (guardar) {
      // Definir nombre consistente para búsqueda y creación
      const nombreFallback = `Cliente WhatsApp ${new Date().toLocaleDateString()}`
      const nombreParaGuardar = busquedaParseada.nombreCliente || nombreFallback

      // Buscar o crear cliente
      let cliente = await prisma.cliente.findFirst({
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
      
      // Scrapear resultados reales (MercadoLibre + ArgenProp)
      // Ejecutamos en paralelo para velocidad
      const [mlItems, apItems] = await Promise.all([
        scrapearMercadoLibre(busquedaParseada),
        scrapearArgenProp(busquedaParseada)
      ])

      // Combinar y deduplicar por URL
      const allScraped = [...mlItems, ...apItems]
    
    // Deduplicar: Preferir ArgenProp sobre ML si parecen iguales, o solo por URL única
    const uniqueScraped = Array.from(new Map(allScraped.map(item => [item.url, item])).values())

    return NextResponse.json({
      success: true,
      busquedaParseada,
      matches,
      webMatches,
      scrapedItems: uniqueScraped,
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
    
    // Scrapear resultados reales
    const [mlItems, apItems] = await Promise.all([
        scrapearMercadoLibre(busquedaParseada),
        scrapearArgenProp(busquedaParseada)
    ])
    
    const allScraped = [...mlItems, ...apItems]
    const uniqueScraped = Array.from(new Map(allScraped.map(item => [item.url, item])).values())

    return NextResponse.json({
      success: true,
      busquedaParseada,
      matches,
      webMatches,
      scrapedItems: uniqueScraped,
      guardado: null
    })
  } catch (error: unknown) {
    console.error('Error parseando búsqueda:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error al procesar con IA'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
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

  // 5. Detectar Dormitorios/Ambientes
  let dormitoriosMin: number | null = null
  const dormRegex = /(\d+)\s*(?:dorm|habitaci|hab|cuartos|piezas)/i
  const matchDorm = mensaje.match(dormRegex)
  if (matchDorm) dormitoriosMin = parseInt(matchDorm[1])
  
  let ambientesMin: number | null = null
  const ambRegex = /(\d+)\s*(?:amb)/i
  const matchAmb = mensaje.match(ambRegex)
  if (matchAmb) ambientesMin = parseInt(matchAmb[1])

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
async function encontrarMatchesEnDb(criterios: BusquedaParseada) {
  // Construir filtros de Prisma
  const where: any = {
    estado: 'APROBADA', // Solo activas
  }

  // 1. Tipo de Propiedad (fuzzy exact)
  // Mapeamos los tipos del parser a los de la DB
  if (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') {
    where.tipo = {
      equals: criterios.tipoPropiedad,
      mode: 'insensitive'
    }
  }

  // 2. Operación (Asumimos Ventas o Alquiler según detectado)
  // Schema dice Propiedad { tipo, subtipo, ... } pero no operacion explicita
  // Los títulos suelen decir "Venta" o "Alquiler".
  if (criterios.operacion) {
    where.OR = [
       { titulo: { contains: criterios.operacion, mode: 'insensitive' } },
       { subtipo: { contains: criterios.operacion, mode: 'insensitive' } }
    ]
    // Si es COMPRA, buscamos VENTA
    if (criterios.operacion === 'COMPRA') {
       where.OR.push({ titulo: { contains: 'Venta', mode: 'insensitive' } })
    }
  }
  
  // 3. Presupuesto
  if (criterios.presupuestoMax) {
    // Margen del 10% por arriba
    where.precio = {
      lte: criterios.presupuestoMax * 1.10
    }
    // Asegurar moneda coincide
    where.moneda = criterios.moneda
  }

  // 4. Zonas (OR condition)
  if (criterios.zonas.length > 0) {
    // Si hay zonas, DEBE estar en alguna de ellas
    // Buscamos en 'ubicacion', 'direccion', 'zona', 'localidad', 'titulo'
    const zonaConditions = criterios.zonas.flatMap(z => [
        { ubicacion: { contains: z, mode: 'insensitive' } },
        { direccion: { contains: z, mode: 'insensitive' } },
        { zona: { contains: z, mode: 'insensitive' } },
        { localidad: { contains: z, mode: 'insensitive' } },
        { titulo: { contains: z, mode: 'insensitive' } } // A veces "Casa en Candioti" está en titulo
    ])
    
    // Si ya teníamos un OR (por operacion), tenemos que combinarlos con AND
    // Prisma where: AND: [ { OR: op }, { OR: zona } ] 
    if (where.OR) {
       where.AND = [
         { OR: where.OR },
         { OR: zonaConditions }
       ]
       delete where.OR
    } else {
       where.OR = zonaConditions
    }
  }

  // 5. Ambientes / Dormitorios
  if (criterios.dormitoriosMin) {
    where.dormitorios = {
      gte: criterios.dormitoriosMin
    }
  }

  const propiedades = await prisma.propiedad.findMany({
    where,
    take: 5, // Top 5 matches
    orderBy: { precio: 'asc' }, // Más baratas primero en su rango
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

  return propiedades
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
    
    // Mejorar detección de zona para URL
    // SIEMPRE forzar contexto Santa Fe si no es explícitamente otra provincia
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
    if (zonaQuery === 'santa-fe') {
        zonaQuery = 'santa-fe/santa-fe-capital'
    } else if (!zonaQuery.includes('santa-fe')) {
        // Para Rincón, Santo Tomé, etc., agregar prefijo de provincia
        zonaQuery = `santa-fe/${zonaQuery}`
    }

    let url = `https://listado.mercadolibre.com.ar/inmuebles/${tipo}/${operacion}/${zonaQuery}`
    
    // Filtro anti-ruido (Buenos Aires, Rosario)
    // Agregamos término de búsqueda negativo en la query string si es posible, 
    // pero ML lo maneja mejor con la URL
    
    if (criterios.presupuestoMax) {
      url += '_ORDER_BY_PRICE_ASC'
    }

    console.log(`Scraping MercadoLibre: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    })

    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)
    
    const items: any[] = []

    // SOPORTE PARA DOS TIPOS DE DISEÑO DE ML (Lista vs Grilla/Poly)
    const elements = $('.ui-search-layout__item, .poly-card')
    
    // Palabras prohibidas para filtrar resultados de otras ciudades
    const blackList = [
      'buenos aires', 'capital federal', 'caba', 'palermo', 'belgrano', 'recoleta',
      'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
      'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi', // barrios rosarinos
      'nueva cordoba', 'alta cordoba', 'villa cabrera', // barrios cordobeses
      'las cañitas', 'nunez', 'saavedra', 'villa urquiza', 'colegiales', // CABA
      'caballito', 'almagro', 'villa crespo', 'flores', 'floresta',
      'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora',
      'zona norte', 'zona sur', 'zona oeste', // GBA
      'rafaela', 'venado tuerto', 'reconquista' // otras ciudades de SF
    ]

    elements.each((i, el) => {
      if (items.length >= 6) return

      // Selectores Híbridos (intenta uno, si no, el otro)
      const titulo = $(el).find('.ui-search-item__title, .poly-component__title').first().text().trim()
      const precio = $(el).find('.ui-search-price__part, .poly-price__current-price').first().text().trim()
      const ubicacion = $(el).find('.ui-search-item__location, .poly-component__location').first().text().trim()
      
      // Link
      let urlItem = $(el).find('a.ui-search-link, a.poly-component__title').first().attr('href')
      
      // FILTRADO: Descartar resultados de otras ciudades
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      // 1. Descartar si ubicación contiene palabras prohibidas
      if (blackList.some(bad => ubicacionLower.includes(bad))) return

      // 2. Descartar si el título sugiere otra provincia
      if (blackList.some(bad => tituloLower.includes(bad))) return
      
      // 3. Descartar si la URL apunta fuera de Santa Fe
      if (urlItem) {
          const urlLower = urlItem.toLowerCase()
          if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
          if (urlLower.includes('bs-as') || urlLower.includes('buenosaires')) return
      }

      // Imagen (Lazy Load a veces usa data-src)
      let img = $(el).find('img.ui-search-result-image__element, img.poly-component__picture').first().attr('data-src') || 
                $(el).find('img.ui-search-result-image__element, img.poly-component__picture').first().attr('src')

      if (titulo && urlItem && precio) {
        // Limpieza de datos
        if (criterios.presupuestoMax) {
            // Filtrado manual simple por si ML no ordenó bien
            // Extraer números del precio "$ 100.000" -> 100000
            // Solo filtrar si estamos muy seguros del parsing, por ahora lo dejamos pasar
        }

        items.push({
           sitio: 'MercadoLibre',
           titulo,
           precio,
           ubicacion,
           url: urlItem,
           img: img || null
        })
      }
    })

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
    
    // Agregar parametro provincia para asegurar
    // ArgenProp usa el slug geográfico completo a veces: santa-fe-santa-fe por ej
    // Probamos con la URL canónica detectada arriba.

    if (criterios.presupuestoMax) {
       // Argenprop permite filtro de precio en URL pero es complejo.
       // Ej: ...-hasta-200000-dolares
       const monedaUrl = criterios.moneda === 'USD' ? 'dolares' : 'pesos'
       url += `-hasta-${criterios.presupuestoMax}-${monedaUrl}`
    }

    console.log(`Scraping ArgenProp: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) return []

    const html = await response.text()
    const $ = cheerio.load(html)
    
    const items: any[] = []
    
    // Palabras prohibidas para filtrar resultados de otras ciudades
    const blackList = [
      'buenos aires', 'capital federal', 'caba', 'palermo', 'belgrano', 'recoleta',
      'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
      'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi',
      'nueva cordoba', 'alta cordoba', 'villa cabrera',
      'las cañitas', 'nunez', 'saavedra', 'villa urquiza', 'colegiales',
      'caballito', 'almagro', 'villa crespo', 'flores', 'floresta',
      'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora',
      'zona norte', 'zona sur', 'zona oeste'
    ]

    $('.listing__item').each((i, el) => {
      if (items.length >= 6) return

      const titulo = $(el).find('.card__title').text().trim() || $(el).find('.card__address').text().trim()
      const precio = $(el).find('.card__price').text().trim()
      const ubicacion = $(el).find('.card__location').text().trim() || $(el).find('.card__address').text().trim()
      const urlRel = $(el).find('a').attr('href')
      
      // FILTRADO: Descartar resultados de otras ciudades
      const ubicacionLower = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      if (blackList.some(bad => ubicacionLower.includes(bad))) return
      if (blackList.some(bad => tituloLower.includes(bad))) return

      // Filtrado por URL
      if (urlRel) {
         const urlLower = urlRel.toLowerCase()
         if (blackList.some(bad => urlLower.includes(bad.replace(' ', '-')))) return
         if (urlLower.includes('bs-as') || urlLower.includes('buenosaires')) return
      }

      // La foto suele estar en data-src de un div o img
      let img = $(el).find('img').first().attr('data-src') || $(el).find('img').first().attr('src')

      if (urlRel && precio) {
        items.push({
           sitio: 'ArgenProp',
           titulo,
           precio: precio.replace(/\n/g, '').trim(),
           ubicacion,
           url: `https://www.argenprop.com${urlRel}`, // Argenprop usa links relativos
           img: img || null
        })
      }
    })

    return items

  } catch (error) {
    console.error('Error scraping ArgenProp:', error)
    // Silently fail to not block other results
    return []
  }
}

