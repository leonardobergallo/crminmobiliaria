import { BusquedaParseada } from './types'
import { getDormitoriosFiltro } from './config'

export function buildMercadoLibreUrl(criterios: BusquedaParseada) {
  let tipo = 'inmuebles'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'

  const url = `https://inmuebles.mercadolibre.com.ar/${tipo}/${operacion}/santa-fe/santa-fe-capital`
  const params = new URLSearchParams()
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) params.set('DORMITORIOS', String(dormMin))
  if (criterios.presupuestoMax) params.set('precio_hasta', String(criterios.presupuestoMax))
  if (criterios.presupuestoMin) params.set('precio_desde', String(criterios.presupuestoMin))
  const q = params.toString()
  return q ? `${url}?${q}` : url
}

export function buildArgenPropUrl(criterios: BusquedaParseada) {
  let tipo = 'inmuebles'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casa'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamento'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terreno'
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'

  let url = `https://www.argenprop.com/${tipo}-${operacion}-en-santa-fe-capital`
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) url += `-${dormMin}-dormitorios`
  if (criterios.presupuestoMax) {
    const monedaUrl = criterios.moneda === 'USD' ? 'dolares' : 'pesos'
    url += `-hasta-${criterios.presupuestoMax}-${monedaUrl}`
  }
  return url
}

export function buildRemaxUrl(criterios: BusquedaParseada) {
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  const params = new URLSearchParams({ address: 'Santa Fe, Santa Fe' })
  if (criterios.presupuestoMax) params.set('maxPrice', String(criterios.presupuestoMax))
  if (criterios.presupuestoMin) params.set('minPrice', String(criterios.presupuestoMin))
  const dormMin = getDormitoriosFiltro(criterios)
  if (dormMin) params.set('rooms', String(dormMin))
  return `https://www.remax.com.ar/propiedades/en-${operacion}?${params.toString()}`
}

export function buildZonaPropUrl(criterios: BusquedaParseada) {
  let tipo = 'inmuebles'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
  const dormMin = getDormitoriosFiltro(criterios)

  let url = `https://www.zonaprop.com.ar/${tipo}-${operacion}-santa-fe-santa-fe`
  if (dormMin) url += `-${dormMin}-habitaciones`
  url += '.html'

  const params = new URLSearchParams()
  if (criterios.presupuestoMin) params.set('precio-desde', String(criterios.presupuestoMin))
  if (criterios.presupuestoMax) params.set('precio-hasta', String(criterios.presupuestoMax))
  if (criterios.presupuestoMin || criterios.presupuestoMax) {
    params.set('moneda', criterios.moneda === 'ARS' ? 'ARS' : 'USD')
  }
  if (criterios.ambientesMin) params.set('ambientes', String(criterios.ambientesMin))
  const q = params.toString()
  return q ? `${url}?${q}` : url
}

export function buildBuscainmuebleUrl(criterios: BusquedaParseada) {
  let tipo = 'propiedades'
  if (criterios.tipoPropiedad === 'CASA') tipo = 'casas'
  if (criterios.tipoPropiedad === 'DEPARTAMENTO') tipo = 'departamentos'
  if (criterios.tipoPropiedad === 'TERRENO') tipo = 'terrenos'
  const operacion = criterios.operacion === 'ALQUILER' ? 'alquiler' : 'venta'

  const base = `https://www.buscainmueble.com/${operacion}/${tipo}/santa-fe-santa-fe`
  return base
}
