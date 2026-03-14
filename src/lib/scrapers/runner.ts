import type { BusquedaParseada, PortalKey, ScrapedItem } from './types'
import {
  newPortalTelemetry, delay, diversificarPorPortal, esItemDeSantaFe,
  SCRAPED_MAX_TOTAL, SCRAPER_DELAY_BETWEEN_PORTALS_MIN, SCRAPER_DELAY_BETWEEN_PORTALS_MAX,
} from './config'
import {
  scrapearMercadoLibre, scrapearArgenProp, scrapearRemax,
  scrapearZonaProp, scrapearBuscainmueble,
} from './portals'

export type PortalStatus = 'OK' | 'HTTP_ERROR' | 'BLOQUEO_PROBABLE' | 'SIN_RESULTADOS' | 'SELECTOR_SIN_MATCH' | 'ERROR'

export interface PortalResult {
  portal: PortalKey
  status: PortalStatus
  items: ScrapedItem[]
  count: number
  error?: string
}

export interface ScrapingResult {
  items: ScrapedItem[]
  portales: PortalResult[]
  totalItems: number
  telemetry: ReturnType<typeof newPortalTelemetry>
}

function resolveStatus(portal: PortalKey, items: ScrapedItem[], telemetry: ReturnType<typeof newPortalTelemetry>): PortalStatus {
  const c = telemetry[portal]
  if (c.errors > 0) return 'ERROR'
  if (c.blockedSignals > 0) return 'BLOQUEO_PROBABLE'
  if (c.httpErrors > 0) return 'HTTP_ERROR'
  if (c.selectorFallbacks > 0 && items.length === 0) return 'SELECTOR_SIN_MATCH'
  if (items.length === 0) return 'SIN_RESULTADOS'
  return 'OK'
}

const SCRAPERS: { key: PortalKey; fn: (c: BusquedaParseada, counter: any) => Promise<ScrapedItem[]> }[] = [
  { key: 'mercadolibre', fn: scrapearMercadoLibre },
  { key: 'argenprop', fn: scrapearArgenProp },
  { key: 'zonaprop', fn: scrapearZonaProp },
  { key: 'remax', fn: scrapearRemax },
  { key: 'buscainmueble', fn: scrapearBuscainmueble },
]

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return delay(ms)
}

export async function scrapearTodos(criterios: BusquedaParseada): Promise<ScrapingResult> {
  const telemetry = newPortalTelemetry()
  const results: PromiseSettledResult<{ key: PortalKey; items: ScrapedItem[] }>[] = []

  for (let i = 0; i < SCRAPERS.length; i++) {
    if (i > 0) {
      await randomDelay(SCRAPER_DELAY_BETWEEN_PORTALS_MIN, SCRAPER_DELAY_BETWEEN_PORTALS_MAX)
    }
    const { key, fn } = SCRAPERS[i]
    try {
      const items = await fn(criterios, telemetry[key])
      results.push({ status: 'fulfilled', value: { key, items } })
    } catch (err) {
      results.push({ status: 'rejected', reason: err })
    }
  }

  const portales: PortalResult[] = []
  let allItems: ScrapedItem[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const scraperKey = SCRAPERS[i].key
    if (result.status === 'fulfilled') {
      const { key, items } = result.value
      const filtered = items.filter(esItemDeSantaFe)
      const status = resolveStatus(key, filtered, telemetry)
      const razon = status === 'OK' ? `${filtered.length} publicaciones extraidas.`
        : status === 'HTTP_ERROR' ? 'El portal respondio con error HTTP.'
        : status === 'BLOQUEO_PROBABLE' ? 'Cloudflare u otro sistema anti-bot bloqueo el acceso.'
        : status === 'SELECTOR_SIN_MATCH' ? 'Cambio de estructura HTML o selectores sin coincidencias.'
        : status === 'SIN_RESULTADOS' ? 'No se encontraron publicaciones para estos criterios.'
        : 'Error desconocido.'
      portales.push({ portal: key, status, items: filtered, count: filtered.length, error: razon })
      allItems.push(...filtered)
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : 'unknown error'
      portales.push({ portal: scraperKey, status: 'ERROR', items: [], count: 0, error: msg })
    }
  }

  const dedupMap = new Map<string, ScrapedItem>()
  for (const item of allItems) {
    const k = item.url || `${item.titulo}|${item.precio}`
    if (!dedupMap.has(k)) dedupMap.set(k, item)
  }
  const deduped = Array.from(dedupMap.values())
  const final = diversificarPorPortal(deduped, SCRAPED_MAX_TOTAL)

  return {
    items: final,
    portales,
    totalItems: final.length,
    telemetry,
  }
}
