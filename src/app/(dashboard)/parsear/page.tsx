'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Cliente = {
  id: string
  nombreCompleto?: string | null
  nombre?: string | null
}

type Busqueda = {
  id: string
  tipoPropiedad?: string | null
  presupuestoTexto?: string | null
  presupuestoValor?: number | null
  moneda?: string | null
  dormitoriosMin?: number | null
  ubicacionPreferida?: string | null
  observaciones?: string | null
  origen?: string | null
  estado?: string | null
  createdAt?: string | null
}

type ManualLinkDraft = {
  id: string
  titulo: string
  url: string
}

const BUSQUEDA_DRAFT_KEY = 'busquedaDraftFromUltimaWeb'

const MERCADO_UNICO_INMOBILIARIAS = [
  '9010 Inmobiliaria',
  'AGP Negocios Inmobiliarios',
  'ALICANDRO SRL',
  'ANA MORE PROPIEDADES',
  'ANABEL INMOBILIARIA',
  'APL GATTAS',
  'APL Inmobiliaria',
  'AQUARAELLA INMOBILIARIA',
  'AUSTRAL INMOBILIARIA',
  'Abraham Inmobiliaria',
  'Agustin Leiva Propiedades',
  'Alianza Real Estate',
  'Andres&Andres',
  'Awen Propiedades',
  'AyG Inmobiliaria',
  'BARCAS Inmobiliaria',
  'BIROCCO BIENES RAICES',
  'BREGA Inmobiliaria',
  'BRUCKEN Inmobiliaria',
  'Benuzzi Inmobiliaria',
  'Bernardi Inmobiliaria',
  'Bossio Propiedades',
  'CAIROLI INMOBILIARIA',
  'CARLUCCI Inmobiliaria',
  'CASA MAYOR Servicios Inmobiliarios',
  'CASABLANCA SRL',
  'CF PROPIEDADES',
  'COFASA administracion de inmuebles',
  'COPRI SA',
  'COSTA PROPIEDADES',
  'Candioti Bienes Raices',
  'Capital Propiedades',
  'Carina Meurzet Propiedades',
  'Casastierra Inmobiliaria',
  'Cometto Inmobiliaria',
  'Compania Inmobiliaria',
  'Concepto Negocios Inmobiliarios',
  'DUXON Inmobiliaria',
  'Demichelis & Biasoni Inmobiliaria',
  'EMINENT inmobiliaria',
  'ENFOQUE Inmobiliaria',
  'Emprendimientos Inmobiliarios Barbier',
  'Estudio Tonina Inmobiliaria',
  'FORTEN PROPIEDADES',
  'Fides Inmobiliaria',
  'Fincas del Litoral',
  'GM PROPIEDADES',
  'GROSSO PROPIEDADES',
  'Gentina Inmobiliaria',
  'Gerelli y Correnti Inmobiliaria',
  'Gomez Galvez Inmobiliaria',
  'Grow Inmobiliaria',
  'Grupo Cuatro Inmobiliaria',
  'Grupo ID Inmobiliaria',
  'HO2 Mediaciones Inmobiliarias',
  'INMOCORP Broker Inmobiliario',
  'INNOVA INMOBILIARIA',
  'Incosur Gestion Inmobiliaria',
  'Inmobiliaria Reinoso',
  'Inmobiliaria Weidmann',
  'Inversiones Negocios Inmobiliarios',
  'JB&NL negocios inmobiliarios',
  'LOQUET Inmobiliaria',
  'Lenarduzzi Inmobiliaria',
  'Lingua Inmobiliaria',
  'M.A.S. Gestion inmobiliaria',
  'MARED',
  'MB Inmobiliaria',
  'MB Propiedades',
  'MEGA',
  'MENZELLA INMOBILIARIA',
  'Mercado Unico',
  'Metropolis Santa Fe',
  'Migone',
  'Monza Negocios Inmobiliarios',
  'NEXO inmobiliaria',
  'Pedro Marelli Inmobiliaria',
  'Penalva Inmobiliaria',
  'Pi Propiedades',
  'Pilay Inmobiliaria',
  'Pino Maglione Negocios Inmobiliarios',
  'Platino Inversiones Inmobiliarias',
  'Plaza Inmobiliaria',
  'Plus Inmobiliaria + Desarrollos',
  'Porto Asesores',
  'Postigo Sauan Inmobiliaria',
  'Puentes Bienes Raices',
  'RAES Inversiones',
  'RUBEN BOSCO PROPIEDADES',
  'Raffin Inmobiliaria',
  'Raices Inmobiliaria',
  'Realeza Inmobiliaria',
  'Rodolfo Curcio Propiedades',
  'Royo Inmobiliaria',
  'S.AIELLO Servicios Inmobiliarios',
  'SAUCE Inmobiliaria',
  'SIGNARA Inmobiliaria',
  'SITIO SERVICIOS INMOBILIARIOS',
  'SOFIA EMPRENDIMIENTOS',
  'STAMATI PROPIEDADES',
  'SUR Inmobiliaria',
  'Samar Inmobiliaria',
  'Santa Fe Propiedades',
  'Sarricchio Bienes Raices',
  'Sanudo Inmobiliaria',
  'Silvina Grosso',
  'Solar Inmobiliaria',
  'Soluciones Inmobiliarias',
  'Strada Peirotti SRL',
  'TAVERNA INMOBILIARIA',
  'Terra Soluciones Inmobiliarias',
  'TOMAS INMOBILIARIA',
  'Uibao Propiedades',
  'Urbano soluciones inmobiliarias',
  'VERA CRUZ INMOBILIARIA',
  'VISINTIN EMPRENDIMIENTOS INMOBILIARIOS',
  'Vestalia',
  'Villa Inmobiliaria',
  'XAVI LOZA - XL GESTION DE NEGOCIOS',
]

const MERCADO_UNICO_SITIOS_OFICIALES: Record<string, string> = {
  'solar inmobiliaria': 'https://solarinmobiliaria.com.ar/',
  'mercado unico': 'https://www.mercado-unico.com/',
  'pilay inmobiliaria': 'https://www.pilay.com.ar/',
  'raes inversiones': 'https://www.raesinversiones.com/',
  'remax': 'https://www.remax.com.ar/',
  'century 21': 'https://www.century21.com.ar/',
  'properstar': 'https://www.properstar.com/',
}

const normalizeInmoName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

const buildSitioOficialSearchUrl = (inmo: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${inmo} inmobiliaria santa fe sitio web`)}`

const buildMercadoUnicoSearchUrl = (inmo: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${inmo} propiedades site:mercado-unico.com`)}`

const getSitioOficialInmo = (inmo: string) => {
  const key = normalizeInmoName(inmo)
  return MERCADO_UNICO_SITIOS_OFICIALES[key] || buildSitioOficialSearchUrl(inmo)
}

const hasSitioOficialInmo = (inmo: string) => {
  const key = normalizeInmoName(inmo)
  return Boolean(MERCADO_UNICO_SITIOS_OFICIALES[key])
}

/** Devuelve la URL principal para la inmobiliaria: sitio oficial si existe, sino Mercado Único */
const getInmoPrimaryUrl = (inmo: string) => {
  const key = normalizeInmoName(inmo)
  if (MERCADO_UNICO_SITIOS_OFICIALES[key]) return MERCADO_UNICO_SITIOS_OFICIALES[key]
  return buildMercadoUnicoSearchUrl(inmo)
}

const getInmoPrimaryLabel = (inmo: string) => {
  return hasSitioOficialInmo(inmo) ? 'Abrir sitio oficial' : 'Buscar en Mercado Único'
}

function toTimestamp(value?: string | null) {
  if (!value) return 0
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? 0 : t
}

function ParsearBusquedaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdFromUrl = searchParams.get('clienteId')

  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<any>(null)
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [busquedaId, setBusquedaId] = useState('')
  const [busquedaFiltro, setBusquedaFiltro] = useState('')
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [manualLinks, setManualLinks] = useState<ManualLinkDraft[]>([{ id: 'manual-1', titulo: '', url: '' }])
  const [manualLinksSeleccionados, setManualLinksSeleccionados] = useState<Set<string>>(new Set())
  const [inmoMercadoUnico, setInmoMercadoUnico] = useState('')

  const getPortalSearchLinks = (criterios: any) => {
    const op = criterios?.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    const moneda = String(criterios?.moneda || 'USD').toUpperCase() === 'ARS' ? 'ARS' : 'USD'
    const precioDesde = Number(criterios?.presupuestoMin || 0) || null
    const precioHasta = Number(criterios?.presupuestoMax || 0) || null
    const dormMin = Number(criterios?.dormitoriosMin || criterios?.ambientesMin || 0) || null

    let zpTipo = 'inmuebles'
    if (criterios?.tipoPropiedad === 'CASA') zpTipo = 'casas'
    if (criterios?.tipoPropiedad === 'DEPARTAMENTO') zpTipo = 'departamentos'
    if (criterios?.tipoPropiedad === 'TERRENO') zpTipo = 'terrenos'
    let zonaprop = `https://www.zonaprop.com.ar/${zpTipo}-${op}-ciudad-de-santa-fe-sf`
    if (dormMin) zonaprop += `-${dormMin}-habitaciones`
    zonaprop += '.html'
    const zpParams = new URLSearchParams()
    if (precioDesde) zpParams.set('precio-desde', String(precioDesde))
    if (precioHasta) zpParams.set('precio-hasta', String(precioHasta))
    if (precioDesde) zpParams.set('price_from', String(precioDesde))
    if (precioHasta) zpParams.set('price_to', String(precioHasta))
    if (precioDesde || precioHasta) zpParams.set('moneda', moneda)
    if (precioDesde || precioHasta) zpParams.set('currency', moneda)
    const zpQ = zpParams.toString()
    if (zpQ) zonaprop += `?${zpQ}`

    let apTipo = 'inmuebles'
    if (criterios?.tipoPropiedad === 'CASA') apTipo = 'casa'
    if (criterios?.tipoPropiedad === 'DEPARTAMENTO') apTipo = 'departamento'
    if (criterios?.tipoPropiedad === 'TERRENO') apTipo = 'terreno'
    let argenprop = `https://www.argenprop.com/${apTipo}-${op}-en-santa-fe-capital`
    if (dormMin) argenprop += `-${dormMin}-dormitorios`
    if (precioHasta) argenprop += `-hasta-${precioHasta}-${moneda === 'USD' ? 'dolares' : 'pesos'}`
    
    let mlTipo = 'inmuebles'
    if (criterios?.tipoPropiedad === 'CASA') mlTipo = 'casas'
    if (criterios?.tipoPropiedad === 'DEPARTAMENTO') mlTipo = 'departamentos'
    if (criterios?.tipoPropiedad === 'TERRENO') mlTipo = 'terrenos'
    let mercadolibre = `https://inmuebles.mercadolibre.com.ar/${mlTipo}/${op}/santa-fe/santa-fe-capital`
    const mlParams = new URLSearchParams()
    if (dormMin) mlParams.set('DORMITORIOS', String(dormMin))
    if (precioDesde) mlParams.set('precio_desde', String(precioDesde))
    if (precioHasta) mlParams.set('precio_hasta', String(precioHasta))
    const mlQ = mlParams.toString()
    if (mlQ) mercadolibre += `?${mlQ}`

    let remax = `https://www.remax.com.ar/propiedades/en-${op}?address=Santa+Fe%2C+Santa+Fe`
    const rxParams = new URLSearchParams()
    if (precioDesde) rxParams.set('minPrice', String(precioDesde))
    if (precioHasta) rxParams.set('maxPrice', String(precioHasta))
    if (dormMin) rxParams.set('rooms', String(dormMin))
    const rxQ = rxParams.toString()
    if (rxQ) remax += `&${rxQ}`

    return [
      { id: 'zonaprop', label: 'ZonaProp', url: zonaprop },
      { id: 'argenprop', label: 'ArgenProp', url: argenprop },
      { id: 'mercadolibre', label: 'MercadoLibre', url: mercadolibre },
      { id: 'remax', label: 'Remax', url: remax },
    ]
  }

  const getAnalisisExtraLinks = (criterios: any) => {
    const op = criterios?.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    const dormMin = Number(criterios?.dormitoriosMin || criterios?.ambientesMin || 0) || null
    const precioDesde = Number(criterios?.presupuestoMin || 0) || null
    const precioHasta = Number(criterios?.presupuestoMax || 0) || null
    const tipo = String(criterios?.tipoPropiedad || 'propiedad').toLowerCase()
    const q = `${tipo} ${op} santa fe capital ${dormMin ? `${dormMin} dormitorios` : ''} ${precioDesde ? `desde ${precioDesde}` : ''} ${precioHasta ? `hasta ${precioHasta}` : ''}`.trim()

    return [
      { id: 'google', label: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(q)}` },
      { id: 'site_c21', label: 'Century 21 (sitio)', url: `https://www.google.com/search?q=${encodeURIComponent(`site:century21.com.ar ${q}`)}` },
      { id: 'mercadounico', label: 'MercadoUnico', url: `https://www.google.com/search?q=${encodeURIComponent(`mercadounico inmobiliaria santa fe capital ${q}`)}` },
      { id: 'inmo_sf', label: 'Inmobiliarias Santa Fe', url: `https://www.google.com/search?q=${encodeURIComponent(`inmobiliarias en santa fe capital ${tipo}`)}` },
    ]
  }

  const inferPortalFromUrl = (rawUrl?: string) => {
    const fallback = {
      nombre: 'Link externo',
      badge: 'WEB',
      dominio: '',
    }

    if (!rawUrl) return fallback

    try {
      const url = new URL(rawUrl)
      const host = url.hostname.replace(/^www\./, '')
      const lower = host.toLowerCase()

      if (lower.includes('zonaprop')) return { nombre: 'ZonaProp', badge: 'ZP', dominio: host }
      if (lower.includes('argenprop')) return { nombre: 'ArgenProp', badge: 'AP', dominio: host }
      if (lower.includes('mercadolibre')) return { nombre: 'MercadoLibre', badge: 'ML', dominio: host }
      if (lower.includes('remax')) return { nombre: 'Remax', badge: 'RX', dominio: host }
      if (lower.includes('buscainmueble')) return { nombre: 'Buscainmueble', badge: 'BI', dominio: host }
      if (lower.includes('mercado-unico')) return { nombre: 'Mercado Unico', badge: 'MU', dominio: host }
      if (lower.includes('google')) return { nombre: 'Google', badge: 'GO', dominio: host }

      const hostLabel = host.split('.').filter(Boolean)[0] || host
      return {
        nombre: hostLabel ? hostLabel.charAt(0).toUpperCase() + hostLabel.slice(1) : 'Link externo',
        badge: 'WEB',
        dominio: host,
      }
    } catch {
      return fallback
    }
  }

  const deriveTitleFromUrl = (rawUrl?: string) => {
    if (!rawUrl) return ''

    try {
      const url = new URL(rawUrl)
      const lastSegment = url.pathname.split('/').filter(Boolean).pop() || ''
      const cleaned = lastSegment
        .replace(/\.html?$/i, '')
        .replace(/^clasificado\//i, '')
        .replace(/^[a-z0-9]+-/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!cleaned) return ''

      return cleaned
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    } catch {
      return ''
    }
  }

  const getManualLinkPreview = (link: ManualLinkDraft) => {
    const portal = inferPortalFromUrl(link.url.trim())
    const tituloDesdeUrl = deriveTitleFromUrl(link.url.trim())
    return {
      portal,
      titulo: link.titulo.trim() || tituloDesdeUrl || portal.nombre,
      subtitulo: portal.dominio || 'Pegá una URL completa para identificar el portal',
    }
  }

  const getPortalColorClasses = (badge?: string) => {
    switch (badge) {
      case 'ZP':
        return {
          chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
          card: 'border-emerald-300 bg-emerald-50/60',
        }
      case 'AP':
        return {
          chip: 'border-sky-200 bg-sky-50 text-sky-700',
          card: 'border-sky-300 bg-sky-50/60',
        }
      case 'ML':
        return {
          chip: 'border-amber-200 bg-amber-50 text-amber-700',
          card: 'border-amber-300 bg-amber-50/60',
        }
      case 'RX':
        return {
          chip: 'border-violet-200 bg-violet-50 text-violet-700',
          card: 'border-violet-300 bg-violet-50/60',
        }
      case 'BI':
        return {
          chip: 'border-cyan-200 bg-cyan-50 text-cyan-700',
          card: 'border-cyan-300 bg-cyan-50/60',
        }
      case 'MU':
        return {
          chip: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
          card: 'border-fuchsia-300 bg-fuchsia-50/60',
        }
      case 'GO':
        return {
          chip: 'border-rose-200 bg-rose-50 text-rose-700',
          card: 'border-rose-300 bg-rose-50/60',
        }
      default:
        return {
          chip: 'border-slate-200 bg-slate-50 text-slate-700',
          card: 'border-slate-300 bg-slate-50/60',
        }
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const me = await fetch('/api/auth/me')
        if (!me.ok) {
          router.push('/login')
          return
        }

        const resClientes = await fetch('/api/clientes')
        if (!resClientes.ok) {
          setClientes([])
          setLoading(false)
          return
        }
        const data = await resClientes.json()
        setClientes(Array.isArray(data) ? data : [])
      } catch {
        setClientes([])
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  useEffect(() => {
    if (clienteIdFromUrl) setClienteId(clienteIdFromUrl)
  }, [clienteIdFromUrl])

  useEffect(() => {
    const fetchBusquedasCliente = async () => {
      if (!clienteId) {
        setBusquedas([])
        setBusquedaId('')
        return
      }

      try {
        const res = await fetch(`/api/busquedas?clienteId=${encodeURIComponent(clienteId)}`)
        if (!res.ok) {
          setBusquedas([])
          return
        }
        const data = await res.json()
        setBusquedas(Array.isArray(data) ? data : [])
      } catch {
        setBusquedas([])
      }
    }

    fetchBusquedasCliente()
  }, [clienteId])

  const busquedasOrdenadas = useMemo(() => {
    return [...busquedas].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
  }, [busquedas])

  useEffect(() => {
    if (!busquedasOrdenadas.length) {
      setBusquedaId('')
      return
    }
    if (!busquedaId || !busquedasOrdenadas.some((b) => b.id === busquedaId)) {
      setBusquedaId(busquedasOrdenadas[0].id)
    }
  }, [busquedasOrdenadas, busquedaId])

  const busquedasFiltradas = useMemo(() => {
    const query = busquedaFiltro.trim().toLowerCase()
    if (!query) return busquedasOrdenadas

    return busquedasOrdenadas.filter((b) => {
      const text = [
        b.tipoPropiedad,
        b.ubicacionPreferida,
        b.presupuestoTexto,
        b.estado,
        b.origen,
      ].join(' ').toLowerCase()
      return text.includes(query)
    })
  }, [busquedasOrdenadas, busquedaFiltro])

  const clienteLabel = useMemo(() => {
    const c = clientes.find((x) => x.id === clienteId)
    return c?.nombreCompleto || c?.nombre || ''
  }, [clientes, clienteId])
  const portalSearchLinks = useMemo(() => getPortalSearchLinks(resultado?.busquedaParseada), [resultado])
  const analisisExtraLinks = useMemo(() => getAnalisisExtraLinks(resultado?.busquedaParseada), [resultado])
  const inmoMercadoUnicoUrl = useMemo(
    () => inmoMercadoUnico ? buildMercadoUnicoSearchUrl(inmoMercadoUnico) : null,
    [inmoMercadoUnico]
  )
  const inmoSitioOficialUrl = useMemo(
    () => (inmoMercadoUnico ? getSitioOficialInmo(inmoMercadoUnico) : null),
    [inmoMercadoUnico]
  )
  const inmoPrimaryUrl = useMemo(
    () => inmoMercadoUnico ? getInmoPrimaryUrl(inmoMercadoUnico) : null,
    [inmoMercadoUnico]
  )
  const inmoPrimaryLabel = useMemo(
    () => inmoMercadoUnico ? getInmoPrimaryLabel(inmoMercadoUnico) : '',
    [inmoMercadoUnico]
  )

  const busquedaSeleccionada = useMemo(() => {
    return busquedasOrdenadas.find((b) => b.id === busquedaId) || null
  }, [busquedasOrdenadas, busquedaId])

  const buildBusquedaLabel = (b: Busqueda) => {
    const parts = [b.tipoPropiedad || 'Propiedad']
    if (b.ubicacionPreferida) {
      const ubicParts = b.ubicacionPreferida.split(',').map(p => p.trim()).filter(Boolean)
      const unique = [...new Set(ubicParts.map(p => p.toLowerCase()))].map((_, i) => ubicParts[i])
      parts.push(unique.slice(0, 2).join(', '))
    }
    if (b.presupuestoTexto) parts.push(b.presupuestoTexto)
    if (typeof b.dormitoriosMin === 'number' && b.dormitoriosMin > 0) {
      parts.push(`${b.dormitoriosMin} dorm`)
    }
    return parts.join(' · ')
  }

  const buildMensajeFromBusqueda = (b: Busqueda) => {
    const partes: string[] = []
    partes.push('Hola, estoy buscando una propiedad')
    if (b.tipoPropiedad) partes.push(`tipo ${b.tipoPropiedad}`)
    if (b.ubicacionPreferida) partes.push(`en ${b.ubicacionPreferida}`)

    const parseNum = (value: string) => Number.parseInt(value.replace(/[^\d]/g, ''), 10)
    const moneda = b.moneda || 'USD'
    const desdeMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/desde\s+(?:u\$s|u\$d|usd|ars|\$)?\s*([\d.,]+)/i) : null
    const rangoMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/(?:u\$s|u\$d|usd|ars|\$)?\s*([\d.,]+)\s*[-\u2013]\s*(?:u\$s|u\$d|usd|ars|\$)?\s*([\d.,]+)/i) : null

    if (rangoMatch) {
      const d = parseNum(rangoMatch[1])
      const h = parseNum(rangoMatch[2])
      if (!isNaN(d) && !isNaN(h)) partes.push(`presupuesto entre ${moneda} ${d} y ${h}`)
    } else if (desdeMatch) {
      const d = parseNum(desdeMatch[1])
      if (!isNaN(d)) partes.push(`presupuesto desde ${moneda} ${d}`)
    } else if (typeof b.presupuestoValor === 'number') {
      partes.push(`presupuesto hasta ${moneda} ${b.presupuestoValor}`)
    } else if (b.presupuestoTexto) {
      partes.push(`presupuesto hasta ${b.presupuestoTexto}`)
    }

    if (typeof b.dormitoriosMin === 'number' && b.dormitoriosMin > 0) {
      partes.push(`${b.dormitoriosMin} dormitorios minimo`)
    }
    partes.push('Por favor enviame opciones')
    return partes.join(', ') + '.'
  }

  const toggleSeleccion = (key: string) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const updateManualLink = (id: string, field: 'titulo' | 'url', value: string) => {
    setManualLinks((prev) => {
      const next = prev.map((link) => (link.id === id ? { ...link, [field]: value } : link))

      if (field !== 'url') return next

      const trimmed = value.trim()
      if (!trimmed) return next

      const editedIndex = next.findIndex((link) => link.id === id)
      const isLast = editedIndex === next.length - 1
      const lastHasContent = next[next.length - 1]?.url.trim()

      if (isLast && lastHasContent) {
        const nextId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        next.push({ id: nextId, titulo: '', url: '' })
      }

      return next
    })
  }

  const addManualLink = () => {
    const nextId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setManualLinks((prev) => [...prev, { id: nextId, titulo: '', url: '' }])
  }

  const removeManualLink = (id: string) => {
    setManualLinks((prev) => {
      if (prev.length === 1) return [{ ...prev[0], titulo: '', url: '' }]
      return prev.filter((link) => link.id !== id)
    })
    setManualLinksSeleccionados((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleManualLinkSeleccionado = (id: string) => {
    setManualLinksSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const manualLinksOrdenados = [...manualLinks].sort((a, b) => {
    const aSelected = manualLinksSeleccionados.has(a.id) ? 1 : 0
    const bSelected = manualLinksSeleccionados.has(b.id) ? 1 : 0
    if (aSelected !== bSelected) return bSelected - aSelected
    return manualLinks.findIndex((item) => item.id === a.id) - manualLinks.findIndex((item) => item.id === b.id)
  })

  const moveManualLink = (id: string, direction: 'up' | 'down') => {
    setManualLinks((prev) => {
      const index = prev.findIndex((link) => link.id === id)
      if (index < 0) return prev

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev

      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  const guardarBusqueda = () => {
    if (!clienteId) return
    const items = Array.from(seleccionadas).map((k) => {
      const [tipo, idx] = k.split(':')
      const i = parseInt(idx, 10)
      if (tipo === 'web' && resultado?.webMatches?.[i]) {
      const w = resultado.webMatches[i]
      return { tipo: 'externo', item: { url: w.url, titulo: w.titulo || w.sitio || 'Link sugerido' } }
    }
      if (tipo === 'match' && resultado?.matches?.[i]) return { tipo: 'match', item: resultado.matches[i] }
      return null
    }).filter(Boolean)

    const manualLinksValidos = manualLinks
      .filter((link) => manualLinksSeleccionados.has(link.id))
      .map((link) => link.url.trim() ? ({
        tipo: 'externo',
        item: { url: link.url.trim(), titulo: getManualLinkPreview(link).titulo || 'Link externo' },
      }) : null)
      .filter(Boolean)

    if (manualLinksValidos.length > 0) {
      items.push(...manualLinksValidos)
    }

    const params = new URLSearchParams()
    params.set('clienteId', clienteId)
    params.set('propSeleccionadas', JSON.stringify(items))
    window.location.href = `/gestion?${params.toString()}`
  }

  const irNuevaBusqueda = () => {
    const draft = {
      clienteId: clienteId || '',
      origen: 'PERSONALIZADA',
      moneda: 'USD',
      presupuestoDesde: '',
      presupuestoHasta: '',
      tipoPropiedad: '',
      provincia: 'Santa Fe',
      ciudad: 'Santa Fe Capital',
      barrio: '',
      dormitoriosMin: '',
      observaciones: '',
    }
    localStorage.setItem(BUSQUEDA_DRAFT_KEY, JSON.stringify(draft))
    router.push('/busquedas')
  }

  const analizar = async () => {
    if (!clienteId) {
      setError('Selecciona un cliente')
      return
    }

    if (!busquedaSeleccionada) {
      setError('Selecciona una busqueda')
      return
    }

    setSubmitting(true)
    setError(null)
    setResultado(null)
    setSeleccionadas(new Set())
    setManualLinks([{ id: 'manual-1', titulo: '', url: '' }])
    setManualLinksSeleccionados(new Set())
    try {
      const mensaje = buildMensajeFromBusqueda(busquedaSeleccionada)
      const res = await fetch('/api/parsear-busqueda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, guardar: false, clienteId: null }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Error al analizar')
        return
      }

      setResultado(data)
    } catch (e: any) {
      setError(e?.message || 'Error de conexion')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Busqueda guiada</h1>
          <p className="text-sm text-slate-600 mt-1">Selecciona una busqueda, abre portales sugeridos y carga links manuales para seguir el flujo.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/busquedas')}>Volver</Button>
      </div>
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-4">
          <div className="text-sm text-slate-700">
            Guia rapida: `1)` elegir cliente, `2)` elegir busqueda, `3)` abrir portales sugeridos, `4)` pegar links manuales y ordenarlos, `5)` guardar y pasar a Gestion.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cliente y busquedas</CardTitle>
            <p className="text-sm text-slate-600">
              Este bloque define el contexto de la busqueda. Todo lo que selecciones se podra enviar al cliente desde Gestion.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</div>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombreCompleto || c.nombre || c.id}
                </option>
              ))}
            </select>
          </div>

          {clienteId && busquedasOrdenadas.length > 3 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtrar busquedas</div>
              <Input
                value={busquedaFiltro}
                onChange={(e) => setBusquedaFiltro(e.target.value)}
                placeholder="Filtra por tipo, ubicacion, presupuesto..."
              />
            </div>
          )}

          {clienteId && busquedasFiltradas.length === 0 && (
            <div className="text-sm text-slate-500">Este cliente no tiene busquedas cargadas.</div>
          )}

          {busquedasFiltradas.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {busquedasFiltradas.length === 1 ? 'Busqueda del cliente' : `Busquedas del cliente (${busquedasFiltradas.length})`}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {busquedasFiltradas.slice(0, 6).map((b) => {
                  const isActive = b.id === busquedaId
                  const ubicParts = (b.ubicacionPreferida || '').split(',').map(p => p.trim()).filter(Boolean)
                  const ubicUnique = [...new Set(ubicParts.map(p => p.toLowerCase()))].map((_, i) => ubicParts[i])
                  const ubicLabel = ubicUnique.slice(0, 2).join(', ') || 'Sin ubicacion'
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBusquedaId(b.id)}
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        isActive
                          ? 'border-sky-400 bg-sky-50 ring-1 ring-sky-200'
                          : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">{b.tipoPropiedad || 'Propiedad'}</span>
                        {typeof b.dormitoriosMin === 'number' && b.dormitoriosMin > 0 && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{b.dormitoriosMin} dorm</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">{ubicLabel}</div>
                      {b.presupuestoTexto && (
                        <div className="text-xs font-medium text-emerald-700 mt-1">{b.presupuestoTexto}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {busquedaSeleccionada && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">Busqueda seleccionada</div>
              <div className="flex flex-wrap gap-2">
                {busquedaSeleccionada.tipoPropiedad && (
                  <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                    {busquedaSeleccionada.tipoPropiedad}
                  </span>
                )}
                {busquedaSeleccionada.ubicacionPreferida && (() => {
                  const parts = busquedaSeleccionada.ubicacionPreferida!.split(',').map(p => p.trim()).filter(Boolean)
                  const unique = [...new Set(parts.map(p => p.toLowerCase()))].map((_, i) => parts[i])
                  return (
                    <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                      {unique.join(', ')}
                    </span>
                  )
                })()}
                {busquedaSeleccionada.presupuestoTexto && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                    {busquedaSeleccionada.presupuestoTexto}
                  </span>
                )}
                {typeof busquedaSeleccionada.dormitoriosMin === 'number' && busquedaSeleccionada.dormitoriosMin > 0 && (
                  <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                    {busquedaSeleccionada.dormitoriosMin}+ dormitorios
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              disabled={submitting}
              onClick={analizar}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {submitting ? 'Analizando...' : 'Analizar propiedades'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={irNuevaBusqueda}
            >
              Nueva busqueda
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setResultado(null)
                setError(null)
                setSeleccionadas(new Set())
              }}
            >
              Limpiar resultado
            </Button>
          </div>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <p className="text-sm text-slate-600">
              Usa los accesos sugeridos para investigar, carga los links manuales encontrados y selecciona lo que quieras pasar a Gestion.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">Accesos</div>
                <div className="text-lg font-semibold text-slate-900">{portalSearchLinks.length + analisisExtraLinks.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">Links</div>
                <div className="text-lg font-semibold text-slate-900">{Array.isArray(resultado?.webMatches) ? resultado.webMatches.length : 0}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">CRM</div>
                <div className="text-lg font-semibold text-slate-900">{Array.isArray(resultado?.matches) ? resultado.matches.length : 0}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">Seleccionadas</div>
                <div className="text-lg font-semibold text-slate-900">{seleccionadas.size + manualLinksSeleccionados.size}</div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              Analisis completado.
              {clienteLabel ? (
                <span className="ml-1">Cliente: <span className="font-semibold">{clienteLabel}</span>.</span>
              ) : null}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                disabled={!clienteId}
                onClick={() => {
                  if (!clienteId) return
                  window.location.href = `/gestion?clienteId=${clienteId}`
                }}
              >
                Ir a Gestion del Cliente
              </Button>
              {(manualLinksSeleccionados.size > 0 || seleccionadas.size > 0) && (
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={guardarBusqueda}
                >
                  Guardar seleccion y pasar a Gestion
                </Button>
              )}
            </div>

            <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-800">Investigacion externa guiada</div>
                <div className="text-xs text-slate-500">
                  Paso 1: abre portales con filtros. Paso 2: revisa fuentes complementarias. Paso 3: elige inmobiliarias de Santa Fe. Paso 4: pega abajo los links encontrados.
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <div className="text-sm font-semibold text-slate-800 mb-2">
                    Paso 1 · Portales principales
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {portalSearchLinks.map((link: any) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Paso 2 · Fuentes complementarias</div>
                    <div className="text-xs text-slate-500">No reemplaza al CRM: sirve para ampliar investigacion.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analisisExtraLinks.map((link: any) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2">Paso 3 · Inmobiliarias Santa Fe</div>
                    <div className="text-xs text-slate-500 mb-2">Elegí una inmobiliaria: si tiene sitio oficial va directo, sino busca en Mercado Único.</div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                    <select
                      value={inmoMercadoUnico}
                      onChange={(e) => setInmoMercadoUnico(e.target.value)}
                      className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                    >
                      <option value="">Elegir inmobiliaria...</option>
                      {MERCADO_UNICO_INMOBILIARIAS.map((inmo) => (
                        <option key={inmo} value={inmo}>
                          {inmo}
                          {hasSitioOficialInmo(inmo) ? ' ✓ sitio oficial' : ''}
                        </option>
                      ))}
                    </select>
                    <a
                      href={inmoPrimaryUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!inmoPrimaryUrl}
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold ${
                        !inmoPrimaryUrl
                          ? 'border-slate-200 bg-slate-100 text-slate-400 pointer-events-none'
                          : hasSitioOficialInmo(inmoMercadoUnico)
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100'
                      }`}
                    >
                      {inmoPrimaryLabel || 'Elegí inmobiliaria'}
                    </a>
                    <a
                      href={inmoSitioOficialUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!inmoSitioOficialUrl}
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold ${
                        inmoSitioOficialUrl
                          ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                          : 'border-slate-200 bg-slate-100 text-slate-400 pointer-events-none'
                      }`}
                    >
                      Buscar sitio web
                    </a>
                    <a
                      href="https://www.mercado-unico.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Directorio MU
                    </a>
                  </div>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                  El flujo ya no depende del scraping en vivo. Abrí los portales sugeridos, copiá los links reales que encuentres y cargalos manualmente abajo.
                </div>
              </div>

            <Card>
              <CardHeader>
                <CardTitle>Link externo manual</CardTitle>
                <p className="text-sm text-slate-600">
                  Agrega los links externos que necesites, marcarlos y guardalos en la gestion del cliente.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {manualLinksOrdenados.map((manualLink, index) => {
                  const disabledSelect = !manualLink.url.trim()
                  const isSelected = manualLinksSeleccionados.has(manualLink.id)
                  const preview = getManualLinkPreview(manualLink)
                  const portalColors = getPortalColorClasses(preview.portal.badge)
                  const originalIndex = manualLinks.findIndex((item) => item.id === manualLink.id)
                  return (
                    <div key={manualLink.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-600">Link #{originalIndex + 1}</div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={originalIndex === 0}
                            onClick={() => moveManualLink(manualLink.id, 'up')}
                          >
                            Subir
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={originalIndex === manualLinks.length - 1}
                            onClick={() => moveManualLink(manualLink.id, 'down')}
                          >
                            Bajar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={disabledSelect}
                            onClick={() => toggleManualLinkSeleccionado(manualLink.id)}
                          >
                            {isSelected ? 'Quitar seleccion' : 'Seleccionar link'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={manualLinks.length === 1}
                            onClick={() => removeManualLink(manualLink.id)}
                          >
                            Quitar
                          </Button>
                        </div>
                      </div>
                      <Input
                        placeholder="Titulo visible (ej: Casa 3D Guadalupe)"
                        value={manualLink.titulo}
                        onChange={(e) => updateManualLink(manualLink.id, 'titulo', e.target.value)}
                      />
                      <Input
                        placeholder="Pega URL completa (https://...)"
                        value={manualLink.url}
                        onChange={(e) => updateManualLink(manualLink.id, 'url', e.target.value)}
                      />
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (!disabledSelect) toggleManualLinkSeleccionado(manualLink.id)
                        }}
                        onKeyDown={(e) => {
                          if (disabledSelect) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleManualLinkSeleccionado(manualLink.id)
                          }
                        }}
                        className={`rounded-lg border p-3 transition cursor-pointer ${
                        isSelected
                          ? portalColors.card
                          : 'border-slate-200 bg-white'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex h-6 min-w-9 items-center justify-center rounded border px-2 text-[10px] font-semibold ${portalColors.chip}`}>
                                {preview.portal.badge}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">{preview.portal.nombre}</span>
                              {isSelected && (
                                <span className="text-[10px] font-semibold text-emerald-700">Seleccionado</span>
                              )}
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900 break-words">
                              {preview.titulo}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 break-all">
                              {manualLink.url.trim() || preview.subtitulo}
                            </div>
                          </div>
                          <div className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}>
                            OK
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-sm text-green-700">
                          Link seleccionado: {preview.titulo} - {manualLink.url.trim()}
                        </div>
                      )}
                    </div>
                  )
                })}
                <Button type="button" variant="outline" onClick={addManualLink}>
                  + Agregar otro link
                </Button>
              </CardContent>
            </Card>

            {Array.isArray(resultado?.matches) && resultado.matches.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-800">
                  Propiedades del CRM ({resultado.matches.length})
                </div>
                <div className="space-y-2">
                  {resultado.matches.map((m: any, idx: number) => (
                    <div key={`${m?.id || idx}`} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <input
                          type="checkbox"
                          checked={seleccionadas.has(`match:${idx}`)}
                          onChange={() => toggleSeleccion(`match:${idx}`)}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {m?.titulo || m?.propiedad?.titulo || 'Propiedad'}
                          </div>
                          <div className="text-xs text-slate-600 line-clamp-1">
                            {m?.ubicacion || m?.propiedad?.ubicacion || '-'}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                          {m?.precio ? `${m?.moneda || ''} ${m?.precio}` : (m?.propiedad?.precio ? `${m?.propiedad?.moneda || ''} ${m?.propiedad?.precio}` : '-')}
                        </div>
                      </div>
                      {(m?.id || m?.propiedad?.id) && (
                        <div className="mt-2 pl-6">
                          <a
                            href={`/propiedades/${m?.id || m?.propiedad?.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Ver propiedad
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ParsearBusquedaPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <ParsearBusquedaContent />
    </Suspense>
  )
}
