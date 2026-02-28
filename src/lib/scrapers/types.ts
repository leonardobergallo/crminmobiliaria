export interface BusquedaParseada {
  nombreCliente: string | null
  telefono: string | null
  tipoPropiedad: string
  operacion: string
  presupuestoMin: number | null
  presupuestoMax: number | null
  moneda: string
  zonas: string[]
  dormitoriosMin: number | null
  ambientesMin: number | null
  cochera: boolean
  caracteristicas: string[]
  notas: string
  confianza: number
}

export type PortalKey = 'mercadolibre' | 'argenprop' | 'remax' | 'zonaprop' | 'buscainmueble'

export type PortalDiagCounter = {
  timeouts: number
  httpErrors: number
  blockedSignals: number
  selectorFallbacks: number
  errors: number
}

export type PortalTelemetry = Record<PortalKey, PortalDiagCounter>

export interface ScrapedItem {
  sitio: string
  titulo: string
  precio: string
  ubicacion: string
  url: string
  img: string | null
  origen?: string
  esSugerido?: boolean
}

export interface ExternLink {
  sitio: string
  titulo: string
  url: string
  icon: string
  categoria?: string
}
