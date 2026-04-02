import { PortalDiagCounter, PortalTelemetry, ScrapedItem } from './types'

export function getEnvPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  const parsed = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

export const MAX_DB_MATCHES = getEnvPositiveInt('MAX_DB_MATCHES', 100)
export const SCRAPED_MAX_TOTAL = getEnvPositiveInt('SCRAPED_MAX_TOTAL', 200)
export const SCRAPED_MAX_PER_PORTAL = getEnvPositiveInt('SCRAPED_MAX_PER_PORTAL', 80)
export const SCRAPER_PORTAL_HARD_LIMIT = getEnvPositiveInt('SCRAPER_PORTAL_HARD_LIMIT', 80)
export const SEARCH_TIMEOUT_MS = getEnvPositiveInt('SEARCH_TIMEOUT_MS', 25000)
export const SCRAPER_DELAY_MS = getEnvPositiveInt('SCRAPER_DELAY_MS', 1500)
export const SCRAPER_DELAY_BETWEEN_PORTALS_MIN = getEnvPositiveInt('SCRAPER_DELAY_BETWEEN_PORTALS_MIN', 2500)
export const SCRAPER_DELAY_BETWEEN_PORTALS_MAX = getEnvPositiveInt('SCRAPER_DELAY_BETWEEN_PORTALS_MAX', 4500)

export const ZONAS_SANTA_FE_DEFAULT = [
  'Santa Fe Capital',
  'Santo Tome',
  'Sauce Viejo',
  'Recreo',
  'Arroyo Leyes',
  'San Jose del Rincon',
  'Colastine',
]

export const SANTA_FE_WHITELIST = [
  'santa fe', 'santa-fe', 'santa fe capital', 'santa-fe-capital',
  'candioti', 'centro', 'microcentro', 'macrocentro', 'barrio sur', 'barrio norte',
  'guadalupe', '7 jefes', 'bulevar', 'constituyentes', 'mayoraz',
  'maria selva', 'sargento cabral', 'las flores', 'roma', 'fomento',
  'barranquitas', 'los hornos', 'ciudadela', 'san martin', 'recoleta',
  'puerto', 'costanera', 'villa setubal',
  'rincon', 'san jose del rincon', 'santo tome', 'sauce viejo',
  'arroyo leyes', 'recreo', 'colastine',
]

export const BSAS_BLACKLIST = [
  'buenos aires', 'capital federal', 'caba', 'bs as', 'bs-as', 'buenosaires',
  'palermo', 'belgrano', 'las cañitas', 'las canitas', 'cañitas',
  'nunez', 'saavedra', 'villa urquiza', 'colegiales', 'caballito', 'almagro',
  'villa crespo', 'flores', 'floresta', 'barracas', 'la boca',
  'san telmo', 'montserrat', 'puerto madero', 'retiro', 'san nicolas',
  'microcentro buenos aires', 'microcentro caba',
  'hilarion', 'quintana', 'hilarion de la quintana', 'villa ballester',
  'cid campeador', 'campeador',
  'san martin buenos aires', 'san martin gba',
  'quilmes', 'lanus', 'avellaneda', 'moron', 'lomas de zamora', 'san isidro',
  'vicente lopez', 'tigre', 'san fernando', 'zona norte', 'zona sur', 'zona oeste',
  'gba', 'gran buenos aires', 'provincia de buenos aires',
  'rosario', 'cordoba', 'mendoza', 'tucuman', 'la plata', 'mar del plata',
  'fisherton', 'pichincha', 'echesortu', 'arroyito', 'alberdi',
  'nueva cordoba', 'alta cordoba', 'villa cabrera',
  'rafaela', 'venado tuerto', 'reconquista', 'esperanza', 'sunchales',
]

export function newPortalCounter(): PortalDiagCounter {
  return { timeouts: 0, httpErrors: 0, blockedSignals: 0, selectorFallbacks: 0, errors: 0 }
}

export function newPortalTelemetry(): PortalTelemetry {
  return {
    mercadolibre: newPortalCounter(),
    argenprop: newPortalCounter(),
    remax: newPortalCounter(),
    zonaprop: newPortalCounter(),
    buscainmueble: newPortalCounter(),
  }
}

function getRandomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
  ]
  return agents[Math.floor(Math.random() * agents.length)]
}

export function getScrapingHeaders(referer: string = 'https://www.google.com/') {
  const ua = getRandomUserAgent()
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': referer,
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
  }
}

function buildProxyUrl(targetUrl: string): string | null {
  const base = process.env.SCRAPER_PROXY_URL
  if (!base?.trim()) return null

  const params = new URLSearchParams()
  params.set('url', targetUrl)
  if (!base.includes('country_code')) params.set('country_code', 'ar')
  if (!base.includes('render=')) params.set('render', 'false')

  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}${params.toString()}`
}

export async function fetchWithTimeout(
  url: string,
  options: Record<string, unknown> = {},
  timeout: number = SEARCH_TIMEOUT_MS,
  counter?: PortalDiagCounter
) {
  const withProxy = buildProxyUrl(url)
  const isProd = process.env.VERCEL === '1'

  const doFetch = async (targetUrl: string, mode: 'proxy' | 'direct') => {
    const controller = new AbortController()
    const id = setTimeout(() => {
      controller.abort()
    }, timeout)
    try {
      const response = await fetch(targetUrl, {
        ...options,
        cache: 'no-store' as RequestCache,
        signal: controller.signal,
      } as RequestInit)
      clearTimeout(id)
      return response
    } catch (error: unknown) {
      clearTimeout(id)
      const err = error as { name?: string; message?: string }
      if (err.name === 'AbortError') {
        if (counter) counter.timeouts += 1
        console.error(`[scraper] timeout ${timeout}ms: ${url} (${mode})`)
      } else {
        if (counter) counter.errors += 1
        console.error(`[scraper] error: ${url} (${mode}):`, err.message)
      }
      return { ok: false, status: 0, statusText: err.message || 'error' } as unknown as Response
    }
  }

  if (withProxy) {
    console.log(`[scraper] proxy:on -> ${url}`)
    const proxied = await doFetch(withProxy, 'proxy')
    const status = Number((proxied as Response)?.status || 0)
    if (proxied.ok) return proxied

    if (status === 401) {
      console.error('[scraper] proxy 401: API key invalida o no configurada. Verifica SCRAPER_PROXY_URL en Vercel.')
      return proxied
    }
    if (isProd && [403, 407, 429].includes(status)) {
      console.warn(`[scraper] proxy ${status} en produccion - no retry direct (siempre bloqueado)`)
      return proxied
    }
    console.warn(`[scraper] proxy ${status} -> retry direct ${url}`)
    return doFetch(url, 'direct')
  }

  if (isProd) {
    console.warn('[scraper] SCRAPER_PROXY_URL no configurado en produccion - los portales suelen bloquear')
  }
  console.log(`[scraper] proxy:off -> ${url}`)
  return doFetch(url, 'direct')
}

export function delay(ms: number = SCRAPER_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function safeAbsoluteUrl(href: string | undefined, base: string): string | null {
  if (!href) return null
  if (href.startsWith('http')) return href
  if (!href.startsWith('/')) return `${base}/${href}`
  return `${base}${href}`
}

export function extractPriceFromText(text: string): string {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  const usd = normalized.match(/(?:u\$s|us\$|usd)\s*[\d.,]+/i)
  if (usd?.[0]) return usd[0]
  const ars = normalized.match(/\$\s*[\d.,]+/i)
  if (ars?.[0]) return ars[0]
  return ''
}

export function getDormitoriosFiltro(criterios: { dormitoriosMin?: number | null; ambientesMin?: number | null }): number | null {
  const dorm = criterios.dormitoriosMin ?? null
  const amb = criterios.ambientesMin ?? null
  if (dorm && dorm > 0) return dorm
  if (amb && amb > 0) return amb
  return null
}

export function isBlockedPage($title: string): boolean {
  const t = $title.toLowerCase()
  return t.includes('robot') || t.includes('atención') || t.includes('forbidden') ||
    t.includes('captcha') || t.includes('access denied')
}

export function esClaramenteSantaFe(ubicacion: string, titulo: string): boolean {
  const u = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const t = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return u.includes('santa fe capital') || u.includes('santafe capital') ||
    t.includes('santa fe capital') || t.includes('santafe capital') ||
    u.includes(', santa fe') || t.includes(', santa fe')
}

export function filtrarSantaFe(
  titulo: string,
  ubicacion: string,
  urlItem: string | undefined,
): boolean {
  const u = ubicacion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const t = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const claraSF = esClaramenteSantaFe(ubicacion, titulo)

  if (claraSF) return true

  const strictBl = [
    'buenos aires', 'capital federal', 'caba', 'bs as', 'buenosaires',
    'palermo', 'belgrano', 'olivos', 'pilar', 'escobar',
    'quilmes', 'lanus', 'avellaneda', 'lomas de zamora',
    'rosario', 'cordoba', 'mendoza capital', 'tucuman', 'la plata', 'mar del plata',
  ]

  if (urlItem) {
    const ul = urlItem.toLowerCase()
    if (strictBl.some(bad => ul.includes(bad.replace(/ /g, '-')))) return false
  }

  if (strictBl.some(bad => u.includes(bad) || t.includes(bad))) return false

  return true
}

export function validarItemContraCriterios(
  titulo: string,
  precio: string,
  criterios: { tipoPropiedad?: string; operacion?: string; presupuestoMin?: number | null; presupuestoMax?: number | null; moneda?: string },
): { valido: boolean; razon?: string } {
  const tl = titulo.toLowerCase().trim()
  const pl = precio.toLowerCase().trim()

  if (tl.length < 10) return { valido: false, razon: 'titulo muy corto' }
  const uiWords = [
    'buscar solo', 'filtrar', 'moneda:', 'limpiar', 'aplicar', 'seleccionar', 'opciones',
    'argentina uruguay', 'cookie', 'iniciar sesion', 'registrate', 'descargar app',
    'avisos en moneda', 'ingresa tu', 'suscribi', 'newsletter', 'ver mas resultados',
  ]
  if (uiWords.some(w => tl.includes(w))) return { valido: false, razon: 'elemento UI' }
  if (pl.includes('consultar') && pl.length < 15) return { valido: false, razon: 'precio no informado' }

  if (criterios.tipoPropiedad && criterios.tipoPropiedad !== 'OTRO') {
    if (criterios.tipoPropiedad === 'DEPARTAMENTO' && tl.includes('casa') && !tl.includes('departamento'))
      return { valido: false, razon: 'tipo no coincide' }
    if (criterios.tipoPropiedad === 'CASA' && tl.includes('departamento') && !tl.includes('casa'))
      return { valido: false, razon: 'tipo no coincide' }
  }

  if (criterios.operacion === 'COMPRA' && (tl.includes('alquiler') || pl.includes('alquiler')))
    return { valido: false, razon: 'operacion no coincide' }
  if (criterios.operacion === 'ALQUILER' && (tl.includes('venta') || tl.includes('vende')))
    return { valido: false, razon: 'operacion no coincide' }

  if (criterios.presupuestoMax) {
    const num = parseFloat(precio.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'))
    if (!isNaN(num) && num > 0) {
      let final = num < 1000 ? num * 1000 : num
      const esUSD = pl.includes('us$') || pl.includes('usd') || pl.includes('u$s')
      const esARS = pl.includes('$') && !esUSD
      if ((criterios.moneda === 'USD' && esUSD) || (criterios.moneda === 'ARS' && esARS)) {
        if (criterios.presupuestoMin && final < criterios.presupuestoMin)
          return { valido: false, razon: 'precio bajo minimo' }
        if (final > criterios.presupuestoMax * 1.4)
          return { valido: false, razon: 'precio excede presupuesto' }
      }
    }
  }

  return { valido: true }
}

export function esItemDeSantaFe(item: { titulo?: string; ubicacion?: string; url?: string; sitio?: string }): boolean {
  const texto = `${item?.titulo || ''} ${item?.ubicacion || ''} ${item?.url || ''}`
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const wl = ['santa fe', 'santa-fe', 'candioti', '7 jefes', 'guadalupe', 'bulevar',
    'constituyentes', 'costanera', 'santo tome', 'sauce viejo', 'arroyo leyes', 'recreo', 'colastine', 'rincon']
  const claraSF = wl.some(w => texto.includes(w)) ||
    texto.includes('ciudad-de-santa-fe') || texto.includes('/santa-fe-') || texto.includes(', santa fe')

  if (claraSF) return true

  const bl = ['buenos aires', 'capital federal', 'caba', 'palermo', 'belgrano', 'olivos',
    'pilar', 'escobar', 'rosario', 'cordoba']
  if (bl.some(b => texto.includes(b))) return false

  if (texto.includes('zonaprop.com.ar/propiedades/') || texto.includes('argenprop.com/propiedad')) return true

  return false
}

export function diversificarPorPortal(
  items: ScrapedItem[],
  maxTotal = SCRAPED_MAX_TOTAL,
  maxPorPortal = SCRAPED_MAX_PER_PORTAL
): ScrapedItem[] {
  const porPortal = new Map<string, ScrapedItem[]>()
  for (const item of items) {
    const key = String(item?.sitio || 'Portal')
    if (!porPortal.has(key)) porPortal.set(key, [])
    porPortal.get(key)!.push(item)
  }
  const resultado: ScrapedItem[] = []
  porPortal.forEach((lista) => {
    if (resultado.length < maxTotal) {
      resultado.push(...lista.slice(0, maxPorPortal))
    }
  })
  return resultado.slice(0, maxTotal)
}
