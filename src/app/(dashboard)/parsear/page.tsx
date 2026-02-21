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
  `https://www.google.com/search?q=${encodeURIComponent(`"${inmo}" inmobiliaria santa fe sitio oficial`)}`

const getSitioOficialInmo = (inmo: string) => {
  const key = normalizeInmoName(inmo)
  return MERCADO_UNICO_SITIOS_OFICIALES[key] || buildSitioOficialSearchUrl(inmo)
}

const hasSitioOficialInmo = (inmo: string) => {
  const key = normalizeInmoName(inmo)
  return Boolean(MERCADO_UNICO_SITIOS_OFICIALES[key])
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
  const [linkExterno, setLinkExterno] = useState('')
  const [linkExternoTitulo, setLinkExternoTitulo] = useState('')
  const [linkSeleccionado, setLinkSeleccionado] = useState<string | null>(null)
  const [inmoMercadoUnico, setInmoMercadoUnico] = useState('')
  const [scrapedPage, setScrapedPage] = useState(1)
  const SCRAPED_PAGE_SIZE = 10

  const getPortalBadge = (sitio?: string | null): string => {
    const s = (sitio || '').toLowerCase()
    if (s.includes('zonaprop')) return 'ZP'
    if (s.includes('argenprop')) return 'AP'
    if (s.includes('mercado')) return 'ML'
    if (s.includes('remax')) return 'RX'
    if (s.includes('google')) return 'GO'
    if (s.includes('century')) return 'C21'
    if (s.includes('busca')) return 'BI'
    return 'WEB'
  }

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
    () =>
      inmoMercadoUnico
        ? `https://www.google.com/search?q=${encodeURIComponent(`site:mercado-unico.com \"${inmoMercadoUnico}\" santa fe ver propiedades`)}`
        : null,
    [inmoMercadoUnico]
  )
  const inmoSitioOficialUrl = useMemo(
    () => (inmoMercadoUnico ? getSitioOficialInmo(inmoMercadoUnico) : null),
    [inmoMercadoUnico]
  )
  const scrapedItemsConIndice = useMemo(() => {
    const items = Array.isArray(resultado?.scrapedItems) ? resultado.scrapedItems : []
    return items.map((item: any, idx: number) => ({ item, idx }))
  }, [resultado])
  const scrapedTotalPages = Math.max(1, Math.ceil(scrapedItemsConIndice.length / SCRAPED_PAGE_SIZE))
  const scrapedItemsPaginados = scrapedItemsConIndice.slice(
    (scrapedPage - 1) * SCRAPED_PAGE_SIZE,
    scrapedPage * SCRAPED_PAGE_SIZE
  )

  useEffect(() => {
    setScrapedPage(1)
  }, [scrapedItemsConIndice.length])

  const busquedaSeleccionada = useMemo(() => {
    return busquedasOrdenadas.find((b) => b.id === busquedaId) || null
  }, [busquedasOrdenadas, busquedaId])

  const buildBusquedaLabel = (b: Busqueda) => {
    const parts = [b.tipoPropiedad || 'Propiedad']
    if (b.ubicacionPreferida) parts.push(b.ubicacionPreferida)
    if (b.presupuestoTexto) parts.push(b.presupuestoTexto)
    return parts.join(' - ')
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

  const guardarBusqueda = () => {
    if (!clienteId) return
    const items = Array.from(seleccionadas).map((k) => {
      const [tipo, idx] = k.split(':')
      const i = parseInt(idx, 10)
      if (tipo === 'web' && resultado?.webMatches?.[i]) {
        const w = resultado.webMatches[i]
        return { tipo: 'externo', item: { url: w.url, titulo: w.titulo || w.sitio || 'Link sugerido' } }
      }
      if (tipo === 'scraped' && resultado?.scrapedItems?.[i]) {
        const s = resultado.scrapedItems[i]
        return { tipo: 'externo', item: { url: s.url, titulo: s.titulo || s.sitio || 'Portal' } }
      }
      if (tipo === 'match' && resultado?.matches?.[i]) return { tipo: 'match', item: resultado.matches[i] }
      return null
    }).filter(Boolean)

    if (linkSeleccionado) {
      items.push({ tipo: 'externo', item: { url: linkSeleccionado, titulo: linkExternoTitulo || 'Link externo' } })
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
          <h1 className="text-2xl font-bold text-slate-900">Buscar con IA</h1>
          <p className="text-sm text-slate-600 mt-1">Selecciona una busqueda y analiza portales + CRM en un click.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/busquedas')}>Volver</Button>
      </div>
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-4">
          <div className="text-sm text-slate-700">
            Guia rapida: `1)` elegir cliente, `2)` elegir busqueda, `3)` analizar, `4)` marcar propiedades/links, `5)` guardar y pasar a Gestion.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cliente y busquedas</CardTitle>
          <p className="text-sm text-slate-600">
            Este bloque define el contexto del analisis. Todo lo que selecciones se podra enviar al cliente desde Gestion.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              {clienteId && (
                <div className="text-sm text-slate-600">Seleccionado: {clienteLabel}</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtrar busquedas</div>
              <Input
                value={busquedaFiltro}
                onChange={(e) => setBusquedaFiltro(e.target.value)}
                placeholder="Filtra por tipo, ubicacion, presupuesto o estado..."
                disabled={!clienteId}
              />
              <div className="text-xs text-slate-500">
                {clienteId ? `${busquedasFiltradas.length} busquedas encontradas` : 'Primero selecciona un cliente'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Busqueda activa</div>
            <select
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              disabled={!clienteId || !busquedasFiltradas.length}
            >
              <option value="">Seleccionar busqueda...</option>
              {busquedasFiltradas.map((b) => (
                <option key={b.id} value={b.id}>
                  {buildBusquedaLabel(b)}
                </option>
              ))}
            </select>
          </div>

          {!!busquedasFiltradas.length && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ultimas busquedas</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {busquedasFiltradas.slice(0, 6).map((b) => {
                  const isActive = b.id === busquedaId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBusquedaId(b.id)}
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        isActive
                          ? 'border-sky-300 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{b.tipoPropiedad || 'Propiedad'}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{b.ubicacionPreferida || 'Sin ubicacion'}</div>
                      <div className="text-xs text-slate-500 mt-1">{b.presupuestoTexto || 'Sin presupuesto'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {busquedaSeleccionada && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input readOnly value={`Tipo: ${busquedaSeleccionada.tipoPropiedad || '-'}`} />
              <Input readOnly value={`Ubicacion: ${busquedaSeleccionada.ubicacionPreferida || '-'}`} />
              <Input readOnly value={`Presupuesto: ${busquedaSeleccionada.presupuestoTexto || '-'}`} />
              <Input readOnly value={`Dormitorios min: ${busquedaSeleccionada.dormitoriosMin ?? '-'}`} />
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
              Revisa oportunidades de portales, links y propiedades del CRM. Usa checks para elegir que enviar.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">Portales</div>
                <div className="text-lg font-semibold text-slate-900">{Array.isArray(resultado?.scrapedItems) ? resultado.scrapedItems.length : 0}</div>
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
                <div className="text-lg font-semibold text-slate-900">{seleccionadas.size + (linkSeleccionado ? 1 : 0)}</div>
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
              {(linkSeleccionado || seleccionadas.size > 0) && (
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
                <div className="text-sm font-semibold text-slate-800">
                  Oportunidades en Portales ({scrapedItemsConIndice.length})
                </div>
                <div className="text-xs text-slate-500">
                  Paso 1: abre portales con filtros. Paso 2: compara fuentes. Paso 3: usa inmobiliarias de Santa Fe.
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
                    <div className="text-xs text-slate-500 mb-2">Elegi una inmobiliaria para abrir directorio, busqueda o sitio oficial.</div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                    <select
                      value={inmoMercadoUnico}
                      onChange={(e) => setInmoMercadoUnico(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                    >
                      <option value="">Elegir inmobiliaria (Mercado Unico)</option>
                      {MERCADO_UNICO_INMOBILIARIAS.map((inmo) => (
                        <option key={inmo} value={inmo}>
                          {inmo}
                          {hasSitioOficialInmo(inmo) ? ' (sitio oficial)' : ''}
                        </option>
                      ))}
                    </select>
                    <a
                      href="https://www.mercado-unico.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Abrir directorio MU
                    </a>
                    <a
                      href={inmoMercadoUnicoUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!inmoMercadoUnicoUrl}
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold ${
                        inmoMercadoUnicoUrl
                          ? 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100'
                          : 'border-slate-200 bg-slate-100 text-slate-400 pointer-events-none'
                      }`}
                    >
                      Buscar en directorio
                    </a>
                    <a
                      href={inmoSitioOficialUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!inmoSitioOficialUrl}
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold ${
                        inmoSitioOficialUrl
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-100 text-slate-400 pointer-events-none'
                      }`}
                    >
                      Sitio oficial
                    </a>
                  </div>
                </div>
                {scrapedItemsConIndice.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Mostrando {(scrapedPage - 1) * SCRAPED_PAGE_SIZE + 1}-
                        {Math.min(scrapedPage * SCRAPED_PAGE_SIZE, scrapedItemsConIndice.length)} de {scrapedItemsConIndice.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setScrapedPage((p) => Math.max(1, p - 1))}
                          disabled={scrapedPage <= 1}
                        >
                          Anterior
                        </Button>
                        <span>Pagina {scrapedPage} de {scrapedTotalPages}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setScrapedPage((p) => Math.min(scrapedTotalPages, p + 1))}
                          disabled={scrapedPage >= scrapedTotalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {scrapedItemsPaginados.map(({ item, idx }: any) => (
                        <div key={`${item?.url || idx}`} className="flex gap-3 p-3 bg-white border rounded-lg">
                          {item?.img ? (
                            <img
                              src={item.img}
                              alt={item?.titulo || 'propiedad'}
                              className="w-20 h-20 object-cover rounded"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded bg-slate-100" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-500">
                              {item?.sitio || 'Portal'}
                            </div>
                            <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                              {item?.titulo || '-'}
                            </div>
                            <div className="text-sm font-bold text-slate-900 mt-1">
                              {item?.precio || '-'}
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-1">
                              {item?.ubicacion || '-'}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={seleccionadas.has(`scraped:${idx}`)}
                                onChange={() => toggleSeleccion(`scraped:${idx}`)}
                              />
                              {item?.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-sky-200 text-xs font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                                >
                                  Ver portal
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    No se pudieron extraer publicaciones en tiempo real. Usa los botones de portales para abrir ZonaProp/ArgenProp/MercadoLibre con filtros.
                  </div>
                )}
              </div>

            <Card>
              <CardHeader>
                <CardTitle>Link externo manual</CardTitle>
                <p className="text-sm text-slate-600">
                  Agrega una propiedad/link manual y seleccionalo para guardarlo en la gestion del cliente.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Titulo visible (ej: Casa 3D Guadalupe)"
                  value={linkExternoTitulo}
                  onChange={(e) => setLinkExternoTitulo(e.target.value)}
                />
                <Input
                  placeholder="Pega URL completa (https://...)"
                  value={linkExterno}
                  onChange={(e) => setLinkExterno(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!linkExterno.trim()}
                  onClick={() => setLinkSeleccionado(linkExterno.trim())}
                >
                  Seleccionar link
                </Button>
                {linkSeleccionado && (
                  <div className="text-sm text-green-700">
                    Link seleccionado: {linkExternoTitulo || 'Sin titulo'} - {linkSeleccionado}
                  </div>
                )}
              </CardContent>
            </Card>

            {false && Array.isArray(resultado?.webMatches) && resultado.webMatches.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-800">
                  Links sugeridos ({resultado.webMatches.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {resultado.webMatches.map((w: any, idx: number) => (
                    <div key={`${w?.url || idx}`} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm">
                      <input
                        type="checkbox"
                        checked={seleccionadas.has(`web:${idx}`)}
                        onChange={() => toggleSeleccion(`web:${idx}`)}
                        className="mt-1"
                      />
                      <div className="inline-flex h-6 min-w-9 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 text-[10px] text-slate-600">
                        {getPortalBadge(w?.sitio)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {w?.sitio || 'Link'}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1">
                          {w?.titulo || w?.url}
                        </div>
                      </div>
                      {w?.url && (
                        <a
                          href={w.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-sky-200 text-xs font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                        >
                          Ver
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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


