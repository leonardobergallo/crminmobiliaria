export type MatchNivel = 'ALTO' | 'MEDIO' | 'BAJO'
export type ManualLinkEstado = 'NUEVO' | 'SELECCIONADO' | 'DESCARTADO' | 'ENVIADO'

export type ManualLinkBusqueda = {
  id: string
  clienteId: string
  tipoPropiedad?: string | null
  ubicacionPreferida?: string | null
  presupuestoTexto?: string | null
  presupuestoValor?: number | null
  moneda?: string | null
  dormitoriosMin?: number | null
}

export type ParsedManualLink = {
  url: string
  normalizedUrl: string
  portal: string
  portalDomain: string
  tituloInferido: string
  precioInferido: number | null
  monedaInferida: string | null
  zonaInferida: string | null
  tipoOperacion: string | null
  dormitoriosInferidos: number | null
  ambientesInferidos: number | null
  tipoPropiedadInferido: string | null
  metadata: {
    hostname: string
    pathname: string
    search: string
    tokens: string[]
  }
}

export type MatchDetails = {
  score: number
  nivel: MatchNivel
  breakdown: {
    zona: number
    precio: number
    dormitorios: number
    tipo: number
  }
}

const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
])

const PORTAL_LABELS: Record<string, string> = {
  'zonaprop.com.ar': 'ZonaProp',
  'www.zonaprop.com.ar': 'ZonaProp',
  'argenprop.com': 'ArgenProp',
  'www.argenprop.com': 'ArgenProp',
  'mercadolibre.com.ar': 'MercadoLibre',
  'inmuebles.mercadolibre.com.ar': 'MercadoLibre',
  'listado.mercadolibre.com.ar': 'MercadoLibre',
  'remax.com.ar': 'Remax',
  'www.remax.com.ar': 'Remax',
}

const PROPERTY_TYPE_ALIASES: Array<[RegExp, string]> = [
  [/\bmonoamb(?:iente)?\b/i, 'DEPARTAMENTO'],
  [/\bdepartamento?s?\b/i, 'DEPARTAMENTO'],
  [/\bdepto?s?\b/i, 'DEPARTAMENTO'],
  [/\bcasa?s?\b/i, 'CASA'],
  [/\bph\b/i, 'PH'],
  [/\bterreno?s?\b/i, 'TERRENO'],
  [/\blote?s?\b/i, 'TERRENO'],
  [/\boficina?s?\b/i, 'OFICINA'],
  [/\blocal(?:es)?\b/i, 'LOCAL'],
]

const STOP_TOKENS = new Set([
  'www',
  'com',
  'ar',
  'html',
  'q',
  'listings',
  'clasificado',
  'listado',
  'ficha',
  'detalle',
  'interno',
  'veclapin',
  'src',
  'pg',
  'pills',
  'pos',
  'n',
  'venta',
  'alquiler',
  'departamento',
  'departamentos',
  'casa',
  'casas',
  'propiedad',
  'propiedades',
  'inmueble',
  'inmuebles',
  'argentina',
  'santa',
  'fe',
  'capital',
  'usd',
  'ars',
  'pesos',
  'dolares',
  'remax',
  'zonaprop',
  'argenprop',
  'mercadolibre',
  'ml',
])

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function humanizeToken(token: string) {
  return token
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeText(value: string) {
  return stripAccents(value).toLowerCase().trim()
}

function extractNumericCandidate(value: string) {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return null
  const parsed = Number(digits)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

function parseBudgetRange(busqueda: ManualLinkBusqueda) {
  const presupuestoValor = Number(busqueda.presupuestoValor || 0)
  if (presupuestoValor > 0) {
    return { min: 0, max: presupuestoValor }
  }

  const text = String(busqueda.presupuestoTexto || '')
  const values = text
    .match(/\d[\d.,]*/g)
    ?.map((chunk) => extractNumericCandidate(chunk))
    .filter((value): value is number => Boolean(value)) || []

  if (values.length >= 2) {
    return { min: Math.min(...values), max: Math.max(...values) }
  }

  if (values.length === 1) {
    return { min: 0, max: values[0] }
  }

  return { min: null, max: null }
}

function tokenize(value: string) {
  return normalizeText(value)
    .replace(/[/?=&]+/g, '-')
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter(Boolean)
}

function uniqueTokens(tokens: string[]) {
  return Array.from(new Set(tokens))
}

function cleanSlugToken(token: string) {
  return token
    .replace(/\.html?$/i, '')
    .replace(/^\d+$/, '')
    .trim()
}

function getPathTokens(url: URL) {
  return uniqueTokens(
    url.pathname
      .split('/')
      .flatMap((part) => part.split('-'))
      .map(cleanSlugToken)
      .map((token) => normalizeText(token))
      .filter(Boolean)
  )
}

export function normalizeManualUrl(rawUrl: string) {
  const incoming = String(rawUrl || '').trim()
  const candidate = /^https?:\/\//i.test(incoming) ? incoming : `https://${incoming}`
  const url = new URL(candidate)
  url.hash = ''

  const keptParams = new URLSearchParams()
  Array.from(url.searchParams.entries())
    .filter(([key]) => !TRACKING_QUERY_PARAMS.has(key.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => keptParams.append(key, value))

  url.search = keptParams.toString()
  url.hostname = url.hostname.toLowerCase()
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'

  return url.toString()
}

export function detectPortal(hostname: string) {
  const normalized = hostname.toLowerCase()
  if (PORTAL_LABELS[normalized]) return PORTAL_LABELS[normalized]
  if (normalized.includes('zonaprop')) return 'ZonaProp'
  if (normalized.includes('argenprop')) return 'ArgenProp'
  if (normalized.includes('mercadolibre')) return 'MercadoLibre'
  if (normalized.includes('remax')) return 'Remax'
  return humanizeToken(normalized.replace(/^www\./, '').split('.').slice(0, -1).join(' '))
}

function inferOperation(tokens: string[]) {
  if (tokens.some((token) => ['alquiler', 'alquilar'].includes(token))) return 'ALQUILER'
  if (tokens.some((token) => ['venta', 'vender'].includes(token))) return 'VENTA'
  return null
}

function inferCurrencyAndPrice(raw: string) {
  const pricePatterns = [
    /(?:usd|u\$s|u?s\$|dolares?)[^\d]{0,6}(\d[\d.]*)/i,
    /(?:ars|\$)[^\d]{0,6}(\d[\d.]*)/i,
    /(?:precio|valor|price)[^\d]{0,10}(\d[\d.]*)/i,
    /(\d{5,9})-(?:usd|ars)\b/i,
    /(?:usd|ars)-(\d{5,9})\b/i,
  ]

  for (const pattern of pricePatterns) {
    const match = raw.match(pattern)
    if (!match?.[1]) continue
    const price = extractNumericCandidate(match[1])
    if (!price) continue

    const matchedText = match[0].toLowerCase()
    const moneda = matchedText.includes('ars') || matchedText.includes('$') ? 'ARS' : 'USD'
    return { precio: price, moneda }
  }

  return { precio: null, moneda: null }
}

function inferBedrooms(tokens: string[], raw: string) {
  if (/\bmonoamb(?:iente)?\b/i.test(raw)) {
    return { dormitorios: 0, ambientes: 1 }
  }

  const dormMatch = raw.match(/(\d+)[-\s]?(?:dorm|dormitorio|dormitorios|hab|habitaciones)\b/i)
  if (dormMatch?.[1]) {
    return { dormitorios: Number(dormMatch[1]), ambientes: null }
  }

  const ambMatch = raw.match(/(\d+)[-\s]?(?:amb|ambiente|ambientes)\b/i)
  if (ambMatch?.[1]) {
    const ambientes = Number(ambMatch[1])
    return { dormitorios: ambientes > 1 ? ambientes - 1 : 0, ambientes }
  }

  const tokenDorm = tokens.find((token) => /^\d+d$/.test(token))
  if (tokenDorm) {
    return { dormitorios: Number(tokenDorm.replace('d', '')), ambientes: null }
  }

  return { dormitorios: null, ambientes: null }
}

function inferPropertyType(raw: string) {
  for (const [pattern, value] of PROPERTY_TYPE_ALIASES) {
    if (pattern.test(raw)) return value
  }
  return null
}

function inferZone(tokens: string[]) {
  const normalizedTokens = uniqueTokens(tokens.map((token) => normalizeText(token)))

  if (normalizedTokens.includes('santa') && normalizedTokens.includes('fe')) {
    return 'Santa Fe'
  }

  if (normalizedTokens.includes('candioti')) {
    return 'Candioti'
  }

  const candidates = uniqueTokens(tokens)
    .filter((token) => token.length >= 3)
    .filter((token) => !STOP_TOKENS.has(token))
    .filter((token) => !/^\d+$/.test(token))

  if (candidates.length === 0) return null

  const joined = candidates.slice(-3).map(humanizeToken).join(' ')
  return joined || null
}

function inferTitle(parsed: {
  tipoPropiedadInferido: string | null
  tipoOperacion: string | null
  zonaInferida: string | null
  dormitoriosInferidos: number | null
  ambientesInferidos: number | null
  pathTokens: string[]
}) {
  const parts: string[] = []
  const contextTokens = parsed.pathTokens.filter((token) => !STOP_TOKENS.has(token))
  const context = contextTokens
    .filter((token) => token.length >= 3)
    .filter((token) => !/^\d+$/.test(token))
    .slice(0, 4)
    .map(humanizeToken)
    .join(' ')

  if (parsed.tipoPropiedadInferido) {
    parts.push(humanizeToken(parsed.tipoPropiedadInferido))
  } else {
    parts.push('Propiedad')
  }

  if (parsed.tipoOperacion) {
    parts.push(parsed.tipoOperacion === 'ALQUILER' ? 'en alquiler' : 'en venta')
  }

  if (parsed.zonaInferida) {
    parts.push(`en ${parsed.zonaInferida}`)
  }

  if (context && !normalizeText(parts.join(' ')).includes(normalizeText(context))) {
    parts.push(`| ${context}`)
  }

  if (parsed.dormitoriosInferidos !== null) {
    if (parsed.dormitoriosInferidos === 0) {
      parts.push('monoambiente')
    } else {
      parts.push(`${parsed.dormitoriosInferidos} dorm`)
    }
  } else if (parsed.ambientesInferidos) {
    parts.push(`${parsed.ambientesInferidos} amb`)
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function parseManualLink(rawUrl: string): ParsedManualLink {
  const normalizedUrl = normalizeManualUrl(rawUrl)
  const url = new URL(normalizedUrl)
  const raw = decodeURIComponent(`${url.hostname}${url.pathname}?${url.searchParams.toString()}`)
  const pathTokens = getPathTokens(url)
  const queryTokens = tokenize(url.search)
  const tokens = uniqueTokens([...pathTokens, ...queryTokens])
  const { precio, moneda } = inferCurrencyAndPrice(raw)
  const { dormitorios, ambientes } = inferBedrooms(tokens, raw)
  const tipoOperacion = inferOperation(tokens)
  const tipoPropiedadInferido = inferPropertyType(raw)
  const zonaInferida = inferZone(pathTokens)
  const portal = detectPortal(url.hostname)

  const tituloInferido = inferTitle({
    tipoPropiedadInferido,
    tipoOperacion,
    zonaInferida,
    dormitoriosInferidos: dormitorios,
    ambientesInferidos: ambientes,
    pathTokens,
  })

  return {
    url: normalizedUrl,
    normalizedUrl,
    portal,
    portalDomain: url.hostname.toLowerCase(),
    tituloInferido: tituloInferido || 'Propiedad detectada desde link manual',
    precioInferido: precio,
    monedaInferida: moneda,
    zonaInferida,
    tipoOperacion,
    dormitoriosInferidos: dormitorios,
    ambientesInferidos: ambientes,
    tipoPropiedadInferido,
    metadata: {
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
      tokens,
    },
  }
}

function zoneMatches(busquedaZone?: string | null, inferredZone?: string | null) {
  const searchZone = normalizeText(String(busquedaZone || ''))
  const linkZone = normalizeText(String(inferredZone || ''))

  if (!searchZone || !linkZone) return false
  return searchZone.includes(linkZone) || linkZone.includes(searchZone)
}

function typeMatches(busquedaType?: string | null, inferredType?: string | null) {
  const expected = normalizeText(String(busquedaType || ''))
  const received = normalizeText(String(inferredType || ''))

  if (!expected || !received) return false
  if (expected === received) return true

  return (
    (expected === 'departamento' && ['depto', 'monoambiente', 'ph'].includes(received)) ||
    (expected === 'casa' && received === 'ph')
  )
}

function bedroomMatches(busquedaDorms?: number | null, inferredDorms?: number | null) {
  if (busquedaDorms === null || busquedaDorms === undefined) return false
  if (inferredDorms === null || inferredDorms === undefined) return false
  return inferredDorms >= busquedaDorms
}

function priceMatches(busqueda: ManualLinkBusqueda, parsed: ParsedManualLink) {
  const price = parsed.precioInferido
  if (!price) return false

  const range = parseBudgetRange(busqueda)
  if (range.max === null) return false

  const currency = String(busqueda.moneda || 'USD').toUpperCase()
  if (parsed.monedaInferida && currency && parsed.monedaInferida !== currency) return false

  const min = range.min || 0
  return price >= min && price <= range.max
}

export function calculateManualLinkMatch(
  busqueda: ManualLinkBusqueda,
  parsed: ParsedManualLink
): MatchDetails {
  const breakdown = {
    zona: zoneMatches(busqueda.ubicacionPreferida, parsed.zonaInferida) ? 40 : 0,
    precio: priceMatches(busqueda, parsed) ? 30 : 0,
    dormitorios: bedroomMatches(busqueda.dormitoriosMin, parsed.dormitoriosInferidos) ? 20 : 0,
    tipo: typeMatches(busqueda.tipoPropiedad, parsed.tipoPropiedadInferido) ? 10 : 0,
  }

  const score = breakdown.zona + breakdown.precio + breakdown.dormitorios + breakdown.tipo
  const nivel: MatchNivel = score >= 80 ? 'ALTO' : score >= 50 ? 'MEDIO' : 'BAJO'

  return { score, nivel, breakdown }
}

export function buildPortalTargets(busqueda: ManualLinkBusqueda) {
  const operacion = normalizeText(String(busqueda.presupuestoTexto || '')).includes('alquiler')
    ? 'alquiler'
    : 'venta'
  const tipo = normalizeText(String(busqueda.tipoPropiedad || ''))
  const zona = encodeURIComponent(String(busqueda.ubicacionPreferida || 'santa fe'))

  return [
    {
      key: 'zonaprop',
      label: 'ZonaProp',
      url: `https://www.zonaprop.com.ar/${tipo.includes('casa') ? 'casas' : 'departamentos'}-${operacion}-q-${zona}.html`,
    },
    {
      key: 'argenprop',
      label: 'ArgenProp',
      url: `https://www.argenprop.com/${operacion}/${tipo.includes('casa') ? 'casas' : 'departamentos'}/${zona}`,
    },
    {
      key: 'mercadolibre',
      label: 'MercadoLibre',
      url: `https://inmuebles.mercadolibre.com.ar/${operacion}/${tipo.includes('casa') ? 'casas' : 'departamentos'}/${zona}`,
    },
    {
      key: 'remax',
      label: 'Remax',
      url: `https://www.remax.com.ar/listings/${operacion}/${tipo.includes('casa') ? 'casa' : 'departamento'}?query=${zona}`,
    },
  ]
}

export function getManualLinkMatchPresentation(score: number) {
  if (score >= 80) {
    return {
      label: 'Alta coincidencia',
      dotClassName: 'bg-emerald-500',
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }

  if (score >= 50) {
    return {
      label: 'Coincidencia media',
      dotClassName: 'bg-amber-500',
      badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    }
  }

  return {
    label: 'Baja coincidencia',
    dotClassName: 'bg-rose-500',
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
  }
}
