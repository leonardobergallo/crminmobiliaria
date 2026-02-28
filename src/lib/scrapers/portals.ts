import { BusquedaParseada, PortalDiagCounter, ScrapedItem } from './types'
import {
  getDormitoriosFiltro, fetchWithTimeout, getScrapingHeaders,
  SEARCH_TIMEOUT_MS, filtrarSantaFe, validarItemContraCriterios,
  SCRAPER_PORTAL_HARD_LIMIT,
} from './config'
import { scrapePortal, PortalConfig } from './scrape-portal'
import {
  buildArgenPropUrl, buildZonaPropUrl, buildBuscainmuebleUrl,
} from './url-builders'

export async function scrapearMercadoLibre(criterios: BusquedaParseada, counter?: PortalDiagCounter): Promise<ScrapedItem[]> {
  let tipo = 'inmuebles'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'

  const params = new URLSearchParams()
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) params.set('DORMITORIOS', String(dormMin))
  if (criterios.presupuestoMax) params.set('precio_hasta', String(criterios.presupuestoMax))
  if (criterios.presupuestoMin) params.set('precio_desde', String(criterios.presupuestoMin))
  const q = params.toString()
  const suffix = q ? `?${q}` : ''

  const config: PortalConfig = {
    name: 'MercadoLibre',
    baseUrl: 'https://www.mercadolibre.com.ar',
    urls: [
      `https://inmuebles.mercadolibre.com.ar/${tipo}/${operacion}/santa-fe/santa-fe-capital${suffix}`,
      `https://listado.mercadolibre.com.ar/inmuebles/${tipo}/${operacion}/santa-fe/santa-fe-capital${suffix}`,
    ],
    selectors: {
      item: '.ui-search-layout__item, .poly-card, .ui-search-result, .andes-card, [data-testid="result-item"]',
      itemFallback: 'li.ui-search-layout__item, article, [class*="poly-card"], [class*="result"]',
      title: '.ui-search-item__title, .poly-component__title, .andes-item__title, h2',
      price: '.andes-money-amount, .poly-price__current, .ui-search-price__part, .ui-search-price, [class*="price"]',
      location: '.ui-search-item__location, .poly-component__location, [class*="location"]',
      link: 'a.ui-search-link, a.poly-component__title, a[href*="mercadolibre"], a',
      image: 'img.ui-search-result-image__element, img.poly-component__picture, img[data-src], img',
    },
  }
  return scrapePortal(config, criterios, counter)
}

export async function scrapearArgenProp(criterios: BusquedaParseada, counter?: PortalDiagCounter): Promise<ScrapedItem[]> {
  const url = buildArgenPropUrl(criterios)
  const config: PortalConfig = {
    name: 'ArgenProp',
    baseUrl: 'https://www.argenprop.com',
    urls: [url],
    selectors: {
      item: '.listing__item, .listing__items > div, [data-qa="posting"]',
      itemFallback: '.card[class*="property"], .card[class*="listing"], article.card',
      title: '.card__title, .card__address, h2.card__title',
      price: '.card__price, .card__price span',
      location: '.card__location, .card__address--secondary',
      link: 'a.card',
      image: 'img.card__photos-image, img[data-src]',
    },
    linkFallbackPattern: 'a[href*="/propiedad/"], a[href*="-en-santa-fe"]',
  }
  return scrapePortal(config, criterios, counter)
}

// Remax uses a public JSON API instead of HTML scraping
export async function scrapearRemax(criterios: BusquedaParseada, counter?: PortalDiagCounter): Promise<ScrapedItem[]> {
  const REMAX_API = 'https://api-ar.redremax.com/remaxweb-ar/api/listings/findAllWithEntrepreneurships'
  const operationId = criterios.operacion === 'ALQUILER' ? 2 : 1

  const params = new URLSearchParams({
    page: '0',
    pageSize: '80',
    sort: '-createdAt',
  })
  params.append('in', `operationId:${operationId}`)
  params.append('in', 'eStageId:0,1,2,3,4')

  const url = `${REMAX_API}?${params.toString()}`
  console.log(`[Remax] API: ${url}`)

  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        ...getScrapingHeaders('https://www.remax.com.ar/'),
        'Accept': 'application/json',
        'Origin': 'https://www.remax.com.ar',
      },
    }, SEARCH_TIMEOUT_MS, counter)

    if (!response.ok) {
      if (counter) counter.httpErrors += 1
      console.error(`[Remax] HTTP ${response.status}`)
      return []
    }

    const json = await response.json()
    const listings = json?.data?.data || []
    console.log(`[Remax] API returned ${listings.length} listings (total: ${json?.data?.totalItems})`)

    const sfKeywords = ['santa fe', 'santo tom', 'sauce viejo', 'recreo', 'colastin', 'rincon', 'arroyo leyes']
    const items: ScrapedItem[] = []

    for (const l of listings) {
      if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) break

      const geoLabel = (l.geoLabel || '').toLowerCase()
      const isSantaFe = sfKeywords.some(k => geoLabel.includes(k))
      if (!isSantaFe) continue

      const titulo = l.title || l.publicTitle || l.slug?.replace(/-/g, ' ') || ''
      const precio = `${l.currency?.value || 'USD'} ${(l.price || 0).toLocaleString()}`
      const ubicacion = l.geoLabel || l.displayAddress || ''
      const slug = l.slug || l.id
      const urlProp = `https://www.remax.com.ar/listings/${slug}`
      const photo = l.photos?.[0]?.rawValue
      const img = photo ? `https://d1acdg20u0pmxj.cloudfront.net/${photo}` : null

      if (!titulo || titulo.length < 5) continue
      if (!filtrarSantaFe(titulo, ubicacion, urlProp)) continue

      const validacion = validarItemContraCriterios(titulo, precio, criterios)
      if (!validacion.valido) continue

      items.push({ sitio: 'Remax', titulo, precio, ubicacion, url: urlProp, img })
    }

    console.log(`[Remax] ${items.length} items de Santa Fe`)
    return items
  } catch (error) {
    if (counter) counter.errors += 1
    console.error(`[Remax] Error:`, error)
    return []
  }
}

export async function scrapearZonaProp(criterios: BusquedaParseada, counter?: PortalDiagCounter): Promise<ScrapedItem[]> {
  const url = buildZonaPropUrl(criterios)
  const config: PortalConfig = {
    name: 'ZonaProp',
    baseUrl: 'https://www.zonaprop.com.ar',
    urls: [url],
    selectors: {
      item: '.posting-card, .posting, [data-posting-id], [data-qa="posting"], article, [class*="posting"]',
      itemFallback: '[class*="card"], [class*="property"], [class*="item"], [data-testid]',
      title: '.posting-title, .posting-title a, h2, .title, [class*="title"]',
      price: '.posting-price, .price, [data-price], [class*="price"]',
      location: '.posting-location, .location, .address, [class*="location"]',
      link: 'a',
      image: 'img',
    },
    linkFallbackPattern: 'a[href*="/propiedades/"]',
  }
  return scrapePortal(config, criterios, counter)
}

export async function scrapearBuscainmueble(criterios: BusquedaParseada, counter?: PortalDiagCounter): Promise<ScrapedItem[]> {
  const url = buildBuscainmuebleUrl(criterios)
  const config: PortalConfig = {
    name: 'Buscainmueble',
    baseUrl: 'https://www.buscainmueble.com',
    urls: [url],
    selectors: {
      item: '.listing__item',
      itemFallback: '[class*="card "]',
      title: '.card__title--primary, .card__title',
      price: '.card__price',
      location: '.card__address',
      link: 'a[href*="/"]',
      image: 'img[data-src], img',
    },
    linkFallbackPattern: 'a[href*="-en-venta-"], a[href*="-en-alquiler-"]',
    pricePrefix: '.card__currency',
  }
  return scrapePortal(config, criterios, counter)
}
