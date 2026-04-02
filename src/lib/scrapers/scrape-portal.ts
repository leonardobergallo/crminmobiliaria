import * as cheerio from 'cheerio'
import { BusquedaParseada, PortalDiagCounter, ScrapedItem } from './types'
import {
  fetchWithTimeout, getScrapingHeaders, SEARCH_TIMEOUT_MS, SCRAPER_PORTAL_HARD_LIMIT,
  filtrarSantaFe, validarItemContraCriterios, safeAbsoluteUrl, extractPriceFromText,
  isBlockedPage,
} from './config'

export interface PortalConfig {
  name: string
  baseUrl: string
  urls: string[]
  selectors: {
    item: string
    itemFallback: string
    title: string
    price: string
    location: string
    link: string
    image: string
  }
  linkFallbackPattern?: string
  pricePrefix?: string
}

export async function scrapePortal(
  config: PortalConfig,
  criterios: BusquedaParseada,
  counter?: PortalDiagCounter
): Promise<ScrapedItem[]> {
  try {
    let html = ''
    for (const url of config.urls) {
      console.log(`[${config.name}] Intentando: ${url}`)
      const response = await fetchWithTimeout(url, {
        headers: getScrapingHeaders(config.baseUrl),
      }, SEARCH_TIMEOUT_MS, counter)

      if (!response.ok) {
        if (counter) counter.httpErrors += 1
        continue
      }

      const text = await response.text()
      if (!text || text.length < 500) {
        if (counter) counter.blockedSignals += 1
        continue
      }

      const $ = cheerio.load(text)
      const title = $('title').text()
      if (isBlockedPage(title)) {
        if (counter) counter.blockedSignals += 1
        console.warn(`[${config.name}] Bloqueado: ${title.substring(0, 80)}`)
        continue
      }

      html = text
      break
    }

    if (!html) {
      console.error(`[${config.name}] Sin HTML valido`)
      return []
    }

    const $ = cheerio.load(html)
    const items: ScrapedItem[] = []

    let elements = $(config.selectors.item)
    if (elements.length === 0) {
      if (counter) counter.selectorFallbacks += 1
      elements = $(config.selectors.itemFallback)
      console.log(`[${config.name}] Fallback selectores: ${elements.length} elementos`)
    } else {
      console.log(`[${config.name}] ${elements.length} elementos encontrados`)
    }

    elements.each((_i, el) => {
      if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return

      const titulo = $(el).find(config.selectors.title).first().text().trim()
      const pricePrefix = config.pricePrefix ? $(el).find(config.pricePrefix).first().text().trim() : ''
      let rawPrice = $(el).find(config.selectors.price).first().text().trim()
      if (!rawPrice) rawPrice = $(el).find('[class*="price"], [data-price], .price').first().text().trim()
      let precio = pricePrefix && rawPrice ? `${pricePrefix} ${rawPrice}` : rawPrice
      const ubicacion = $(el).find(config.selectors.location).first().text().trim()
      const urlRel = $(el).find(config.selectors.link).first().attr('href') ||
                     $(el).find('a').first().attr('href')
      const img = $(el).find(config.selectors.image).first().attr('data-src') ||
                  $(el).find(config.selectors.image).first().attr('src') ||
                  $(el).find('img').first().attr('data-src') ||
                  $(el).find('img').first().attr('src')

      if (!titulo && !precio) return
      if (!titulo || !precio || !urlRel) return

      if (!filtrarSantaFe(titulo, ubicacion, urlRel)) return

      const validacion = validarItemContraCriterios(titulo, precio, criterios)
      if (!validacion.valido) return

      const urlCompleta = safeAbsoluteUrl(urlRel, config.baseUrl) || urlRel
      items.push({
        sitio: config.name,
        titulo,
        precio: precio.replace(/\n/g, '').trim(),
        ubicacion: ubicacion || 'Santa Fe',
        url: urlCompleta,
        img: img || null,
      })
    })

    // Fallback: buscar links directos si no encontramos items
    if (items.length === 0 && config.linkFallbackPattern) {
      $(config.linkFallbackPattern).each((_i, a) => {
        if (items.length >= SCRAPER_PORTAL_HARD_LIMIT) return
        const href = $(a).attr('href')
        const urlCompleta = safeAbsoluteUrl(href, config.baseUrl)
        if (!urlCompleta) return

        const container = $(a).closest('article, div, li')
        const rawText = container.text().replace(/\s+/g, ' ').trim()
        const titulo = $(a).text().trim() || container.find('h2, h3, [class*="title"]').first().text().trim()
        const precio = extractPriceFromText(rawText) || container.find('[class*="price"]').first().text().trim()
        const ubicacion = container.find('[class*="location"], .location, .address').first().text().trim()
          || (rawText.includes('Santa Fe') ? 'Santa Fe' : '')
        if (!titulo || titulo.length < 10 || !precio) return
        if (items.some(it => it.url === urlCompleta && it.titulo === titulo)) return

        const v = validarItemContraCriterios(titulo, precio, criterios)
        if (!v.valido) return

        items.push({
          sitio: config.name,
          titulo,
          precio: precio.replace(/\n/g, '').trim(),
          ubicacion: ubicacion || 'Santa Fe',
          url: urlCompleta,
          img: container.find('img').first().attr('data-src') || container.find('img').first().attr('src') || null,
        })
      })
      if (items.length > 0) console.log(`[${config.name}] Fallback links: ${items.length}`)
    }

    console.log(`[${config.name}] Total: ${items.length}`)
    return items
  } catch (error) {
    if (counter) counter.errors += 1
    console.error(`[${config.name}] Error:`, error)
    return []
  }
}
