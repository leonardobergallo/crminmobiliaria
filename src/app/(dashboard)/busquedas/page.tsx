'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Busqueda {
  id: string
  cliente: { 
    id: string
    nombreCompleto: string
    usuario?: { id: string; nombre: string } | null
  }
  usuario?: { id: string; nombre: string } | null
  origen: string
  presupuestoTexto?: string | null
  tipoPropiedad?: string | null
  ubicacionPreferida?: string | null
  dormitoriosMin?: number | null
  observaciones?: string | null
  planillaRef?: string | null
  estado: string
  createdAt: string
}

interface CurrentUser {
  id: string
  nombre: string
  rol: string
}

type ManualLinkDraft = {
  id: string
  titulo: string
  url: string
}

type PrioridadNivel = 'ALTA' | 'MEDIA' | 'BAJA'
const PRIORIDAD_TOKEN_REGEX = /(?:^|\|)PRIORIDAD:(ALTA|MEDIA|BAJA)(?:\||$)/i

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

export default function BusquedasPage() {
  const router = useRouter()
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState<'TODAS' | PrioridadNivel>('TODAS')
  const [ordenarPorPrioridad, setOrdenarPorPrioridad] = useState(true)
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoBusquedaId, setEditandoBusquedaId] = useState<string | null>(null)
  const [guardandoBusqueda, setGuardandoBusqueda] = useState(false)
  const [eliminandoBusquedaId, setEliminandoBusquedaId] = useState<string | null>(null)
  const [busquedaEnVista, setBusquedaEnVista] = useState<Busqueda | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [analisisResultado, setAnalisisResultado] = useState<any>(null)
  const [analisisError, setAnalisisError] = useState<string | null>(null)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [manualLinks, setManualLinks] = useState<ManualLinkDraft[]>([{ id: 'manual-1', titulo: '', url: '' }])
  const [manualLinksSeleccionados, setManualLinksSeleccionados] = useState<Set<string>>(new Set())
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [inmoMercadoUnico, setInmoMercadoUnico] = useState('')

  const [formData, setFormData] = useState({
    clienteId: '',
    usuarioId: '',
    origen: 'ACTIVA',
    prioridad: 'MEDIA' as PrioridadNivel,
    planillaRefRaw: '',
    moneda: 'USD',
    presupuestoDesde: '',
    presupuestoHasta: '',
    tipoPropiedad: '',
    provincia: 'Santa Fe',
    ciudad: 'Santa Fe Capital',
    barrio: '',
    dormitoriosMin: '',
    observaciones: '',
  })

  const [clientes, setClientes] = useState<any[]>([])
  const [buscandoPropiedadesId, setBuscandoPropiedadesId] = useState<string | null>(null)

  const resetBusquedaForm = () => {
    setFormData({
      clienteId: '',
      usuarioId: '',
      origen: 'ACTIVA',
      prioridad: 'MEDIA',
      planillaRefRaw: '',
      moneda: 'USD',
      presupuestoDesde: '',
      presupuestoHasta: '',
      tipoPropiedad: '',
      provincia: 'Santa Fe',
      ciudad: 'Santa Fe Capital',
      barrio: '',
      dormitoriosMin: '',
      observaciones: '',
    })
    setEditandoBusquedaId(null)
  }

  const parseUbicacion = (ubicacion?: string | null) => {
    const raw = String(ubicacion || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    const provincia = raw.find((part) => part.toLowerCase().includes('santa fe')) || 'Santa Fe'
    const ciudad = raw.find((part) => part.toLowerCase().includes('capital') || part.toLowerCase().includes('tome') || part.toLowerCase().includes('recreo') || part.toLowerCase().includes('sauce')) || 'Santa Fe Capital'
    const barrio = raw.find((part) => part !== provincia && part !== ciudad) || ''
    return { provincia, ciudad, barrio }
  }

  const parsePresupuesto = (presupuestoTexto?: string | null) => {
    const text = String(presupuestoTexto || '')
    const moneda = text.toUpperCase().includes('ARS') ? 'ARS' : 'USD'
    const values = text.match(/\d[\d.,]*/g)?.map((v) => parseInt(v.replace(/[^\d]/g, ''), 10)).filter((n) => !Number.isNaN(n)) || []
    if (values.length >= 2) {
      return { moneda, desde: String(values[0]), hasta: String(values[1]) }
    }
    if (values.length === 1) {
      return { moneda, desde: '', hasta: String(values[0]) }
    }
    return { moneda, desde: '', hasta: '' }
  }

  const upsertPrioridadEnPlanillaRef = (raw: string, prioridad: PrioridadNivel) => {
    const parts = String(raw || '')
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !/^PRIORIDAD:/i.test(p))
    parts.push(`PRIORIDAD:${prioridad}`)
    return parts.join('|')
  }

  const abrirEdicion = (busqueda: Busqueda) => {
    const { provincia, ciudad, barrio } = parseUbicacion(busqueda.ubicacionPreferida)
    const { moneda, desde, hasta } = parsePresupuesto(busqueda.presupuestoTexto)
    const matchPrioridad = String(busqueda.planillaRef || '').match(PRIORIDAD_TOKEN_REGEX)
    const prioridadManual = (matchPrioridad?.[1]?.toUpperCase() || 'MEDIA') as PrioridadNivel
    setFormData({
      clienteId: busqueda.cliente.id || '',
      usuarioId: busqueda.cliente.usuario?.id || busqueda.usuario?.id || '',
      origen: busqueda.origen || 'ACTIVA',
      prioridad: prioridadManual,
      planillaRefRaw: busqueda.planillaRef || '',
      moneda,
      presupuestoDesde: desde,
      presupuestoHasta: hasta,
      tipoPropiedad: busqueda.tipoPropiedad || '',
      provincia,
      ciudad,
      barrio,
      dormitoriosMin: typeof busqueda.dormitoriosMin === 'number' ? String(busqueda.dormitoriosMin) : '',
      observaciones: busqueda.observaciones || '',
    })
    setEditandoBusquedaId(busqueda.id)
    setMostrarForm(true)
    setBusquedaEnVista(busqueda)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const buscarPropiedades = async (busqueda: Busqueda) => {
    setBuscandoPropiedadesId(busqueda.id)
    setAnalisisError(null)
    setSeleccionadas(new Set())
    setManualLinks([{ id: 'manual-1', titulo: '', url: '' }])
    setManualLinksSeleccionados(new Set())
    try {
      const mensaje = buildMensajeFromBusqueda(busqueda)
      const response = await fetch('/api/parsear-busqueda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, guardar: false, clienteId: null }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        setAnalisisError(err?.error || 'Error al buscar propiedades')
        return
      }
      const data = await response.json()
      setAnalisisResultado({
        busquedaId: busqueda.id,
        clienteId: busqueda.cliente.id,
        data,
      })
      setBusquedaEnVista(busqueda)
    } catch (error: any) {
      setAnalisisError(`Error de conexion: ${error?.message || 'desconocido'}`)
    } finally {
      setBuscandoPropiedadesId(null)
    }
  }

  const eliminarBusqueda = async (busqueda: Busqueda) => {
    if (!confirm(`¿Eliminar la busqueda de ${busqueda.cliente.nombreCompleto}?`)) return
    setEliminandoBusquedaId(busqueda.id)
    try {
      const response = await fetch(`/api/busquedas/${busqueda.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        alert(errorData?.error || 'No se pudo eliminar la busqueda')
        return
      }
      if (busquedaEnVista?.id === busqueda.id) {
        setBusquedaEnVista(null)
      }
      if (editandoBusquedaId === busqueda.id) {
        setMostrarForm(false)
        resetBusquedaForm()
      }
      await fetchBusquedas()
    } catch (error: any) {
      alert(`Error de conexion: ${error?.message || 'No se pudo conectar al servidor'}`)
    } finally {
      setEliminandoBusquedaId(null)
    }
  }

  const CIUDADES_SANTA_FE = [
    'Santa Fe Capital',
    'Santa Fe y alrededores',
    'Recreo',
    'Santo Tome',
    'Sauce Viejo',
    'Arroyo Leyes',
    'Colastine',
  ]

  const BARRIOS_SANTA_FE_CAPITAL = [
    'Centro',
    'Microcentro',
    'Barrio Norte',
    'Barrio Sur',
    'Candioti',
    'Candioti Norte',
    'Candioti Sur',
    '7 Jefes',
    'Bulevar',
    'Constituyentes',
    'Guadalupe',
    'Guadalupe Este',
    'Guadalupe Oeste',
    'Recoleta',
    'Mayoraz',
    'Roma',
    'Las Flores',
    'Fomento 9 de Julio',
    'Barranquitas',
    'Los Hornos',
    'Ciudadela',
    'San Martin',
    'Puerto',
    'Costanera',
    'Villa Setubal',
    'Sargento Cabral',
    'Maria Selva',
    'Dentro de Bulevares',
  ]

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      Promise.all([fetchBusquedas(), fetchClientes()])
      if (currentUser.rol === 'admin' || currentUser.rol === 'superadmin') {
        fetchUsuarios()
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    try {
      const raw = localStorage.getItem(BUSQUEDA_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)

      setFormData((prev) => ({
        ...prev,
        clienteId: typeof draft.clienteId === 'string' ? draft.clienteId : prev.clienteId,
        origen: typeof draft.origen === 'string' ? draft.origen : prev.origen,
        prioridad:
          draft.prioridad === 'ALTA' || draft.prioridad === 'MEDIA' || draft.prioridad === 'BAJA'
            ? draft.prioridad
            : prev.prioridad,
        moneda: typeof draft.moneda === 'string' ? draft.moneda : prev.moneda,
        presupuestoDesde: typeof draft.presupuestoDesde === 'string' ? draft.presupuestoDesde : prev.presupuestoDesde,
        presupuestoHasta: typeof draft.presupuestoHasta === 'string' ? draft.presupuestoHasta : prev.presupuestoHasta,
        tipoPropiedad: typeof draft.tipoPropiedad === 'string' ? draft.tipoPropiedad : prev.tipoPropiedad,
        provincia: typeof draft.provincia === 'string' ? draft.provincia : prev.provincia,
        ciudad: typeof draft.ciudad === 'string' ? draft.ciudad : prev.ciudad,
        barrio: typeof draft.barrio === 'string' ? draft.barrio : prev.barrio,
        dormitoriosMin: typeof draft.dormitoriosMin === 'string' ? draft.dormitoriosMin : prev.dormitoriosMin,
        observaciones: typeof draft.observaciones === 'string' ? draft.observaciones : prev.observaciones,
      }))
      setMostrarForm(true)
      localStorage.removeItem(BUSQUEDA_DRAFT_KEY)
    } catch {
      localStorage.removeItem(BUSQUEDA_DRAFT_KEY)
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
      } else {
        // Si no estÃƒÂ¡ autenticado, redirigir al login
        if (res.status === 401) {
          router.push('/login')
        } else {
          console.error('Error obteniendo usuario actual:', res.status)
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error)
      // En caso de error de red, tambiÃƒÂ©n redirigir al login
      router.push('/login')
      setLoading(false)
    }
  }

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/auth/usuarios')
      if (response.ok) {
        const data = await response.json()
        // Asegurarse de que data sea un array
        if (Array.isArray(data)) {
          setUsuarios(data)
        } else {
          console.error('Respuesta invalida del servidor:', data)
          setUsuarios([])
        }
      } else {
        console.error('Error al obtener usuarios:', response.status)
        setUsuarios([])
      }
    } catch (error) {
      console.error('Error:', error)
      setUsuarios([])
    }
  }

  const fetchBusquedas = async () => {
    try {
      const response = await fetch('/api/busquedas')
      if (!response.ok) {
        // Si hay error de autenticaciÃƒÂ³n, redirigir al login
        if (response.status === 401) {
          router.push('/login')
          return
        }
        console.error('Error al obtener bÃƒÂºsquedas:', response.status)
        setBusquedas([]) // Establecer array vacÃƒÂ­o en caso de error
        setLoading(false)
        return
      }
      
      const data = await response.json()
      // Asegurarse de que data sea un array
      if (Array.isArray(data)) {
        setBusquedas(data)
      } else {
        console.error('Respuesta invalida del servidor:', data)
        setBusquedas([])
      }
    } catch (error) {
      console.error('Error:', error)
      setBusquedas([]) // Establecer array vacÃƒÂ­o en caso de error
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        console.error('Error al obtener clientes:', response.status)
        setClientes([])
        return
      }

      if (response.ok) {
        const data = await response.json()
        // Asegurarse de que data sea un array
        if (Array.isArray(data)) {
          setClientes(data)
        } else {
          console.error('Respuesta invalida del servidor:', data)
          setClientes([])
        }
      } else {
        console.error('Error al obtener clientes:', response.status)
        setClientes([])
      }
    } catch (error) {
      console.error('Error:', error)
      setClientes([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que se haya seleccionado un cliente
    if (!formData.clienteId) {
      alert('Por favor selecciona un cliente')
      return
    }

    try {
      setGuardandoBusqueda(true)
      // Validar que clienteId estÃƒÂ© presente y sea vÃƒÂ¡lido
      if (!formData.clienteId || formData.clienteId.trim() === '') {
        alert('Por favor selecciona un cliente')
        return
      }

      // Preparar los datos para enviar - solo incluir campos con valores
      const payload: any = {
        clienteId: formData.clienteId.trim(),
        origen: (formData.origen || 'ACTIVA').trim(),
        planillaRef: upsertPrioridadEnPlanillaRef(
          formData.planillaRefRaw,
          (formData.prioridad || 'MEDIA') as PrioridadNivel
        ),
      }

      // Presupuesto (rango)
      const desde = formData.presupuestoDesde ? parseInt(formData.presupuestoDesde) : NaN
      const hasta = formData.presupuestoHasta ? parseInt(formData.presupuestoHasta) : NaN

      if (!isNaN(desde) || !isNaN(hasta)) {
        payload.moneda = formData.moneda

        if (!isNaN(desde) && !isNaN(hasta)) {
          payload.presupuestoTexto = `${formData.moneda} ${desde}-${hasta}`
          payload.presupuestoValor = hasta
        } else if (!isNaN(hasta)) {
          payload.presupuestoTexto = `${formData.moneda} ${hasta}`
          payload.presupuestoValor = hasta
        } else if (!isNaN(desde)) {
          payload.presupuestoTexto = `${formData.moneda} desde ${desde}`
        }
      }

      if (formData.tipoPropiedad && formData.tipoPropiedad.trim() !== '') {
        payload.tipoPropiedad = formData.tipoPropiedad.trim()
      }

      // UbicaciÃƒÂ³n (Santa Fe)
      const ubicacionPartes: string[] = []
      if (formData.barrio) ubicacionPartes.push(formData.barrio)
      if (formData.ciudad) ubicacionPartes.push(formData.ciudad)
      if (formData.provincia) ubicacionPartes.push(formData.provincia)
      const ubicacionPreferida = ubicacionPartes.join(', ')
      if (ubicacionPreferida) {
        payload.ubicacionPreferida = ubicacionPreferida
      }

      if (formData.observaciones && formData.observaciones.trim() !== '') {
        payload.observaciones = formData.observaciones.trim()
      }
      if ((currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin') && formData.usuarioId) {
        payload.usuarioId = formData.usuarioId
      }

      // Manejar dormitoriosMin correctamente
      if (formData.dormitoriosMin && formData.dormitoriosMin.trim() !== '') {
        const parsed = parseInt(formData.dormitoriosMin)
        if (!isNaN(parsed) && parsed > 0) {
          payload.dormitoriosMin = parsed
        }
      }

      const isEdit = Boolean(editandoBusquedaId)
      const endpoint = isEdit ? `/api/busquedas/${editandoBusquedaId}` : '/api/busquedas'
      const method = isEdit ? 'PATCH' : 'POST'
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMostrarForm(false)
        resetBusquedaForm()
        await fetchBusquedas()
      } else {
        const errorData = await response.json().catch(() => null)
        alert(errorData?.error || (isEdit ? 'Error al actualizar busqueda' : 'Error al crear busqueda'))
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error de conexion: ${error.message || 'No se pudo conectar al servidor'}`)
    } finally {
      setGuardandoBusqueda(false)
    }
  }

  const getAgenteNombre = (busqueda: Busqueda): string => {
    return busqueda.usuario?.nombre || 
           busqueda.cliente.usuario?.nombre || 
           'Sin asignar'
  }

  const getPrioridadManual = (busqueda: Busqueda): PrioridadNivel | null => {
    const match = String(busqueda.planillaRef || '').match(PRIORIDAD_TOKEN_REGEX)
    const nivel = match?.[1]?.toUpperCase()
    if (nivel === 'ALTA' || nivel === 'MEDIA' || nivel === 'BAJA') return nivel
    return null
  }

  const canEditBusqueda = (busqueda: Busqueda): boolean => {
    if (!currentUser) return false
    if (currentUser.rol === 'admin' || currentUser.rol === 'superadmin') return true
    return busqueda.usuario?.id === currentUser.id || busqueda.cliente.usuario?.id === currentUser.id
  }

  const getPrioridadBusqueda = (busqueda: Busqueda): { nivel: PrioridadNivel; score: number; motivo: string } => {
    const manual = getPrioridadManual(busqueda)
    if (manual) {
      const score = manual === 'ALTA' ? 100 : manual === 'MEDIA' ? 60 : 20
      return { nivel: manual, score, motivo: 'Prioridad manual' }
    }

    let score = 0
    const motivos: string[] = []

    const estado = String(busqueda.estado || '').toUpperCase()
    if (estado === 'NUEVO') {
      score += 4
      motivos.push('Nuevo ingreso')
    } else if (estado === 'CALIFICADO') {
      score += 3
      motivos.push('Calificado')
    } else if (estado === 'VISITA') {
      score += 2
      motivos.push('En seguimiento')
    } else if (estado === 'RESERVA' || estado === 'CERRADO' || estado === 'PERDIDO') {
      score -= 10
    }

    const createdAtTs = new Date(busqueda.createdAt).getTime()
    if (!Number.isNaN(createdAtTs)) {
      const dias = Math.floor((Date.now() - createdAtTs) / (1000 * 60 * 60 * 24))
      if (dias <= 3) {
        score += 3
        motivos.push('Muy reciente')
      } else if (dias <= 7) {
        score += 2
        motivos.push('Reciente')
      } else if (dias <= 14) {
        score += 1
      }
    }

    if (busqueda.presupuestoTexto) {
      score += 1
      motivos.push('Con presupuesto')
    }

    if (busqueda.tipoPropiedad && busqueda.ubicacionPreferida) {
      score += 1
    }

    const notas = String(busqueda.observaciones || '').toLowerCase()
    if (/(urgente|ya|hoy|esta semana|cerrar|seña|reserva|aprobado|preaprobado)/.test(notas)) {
      score += 2
      motivos.push('Señal de urgencia')
    }

    const nivel: PrioridadNivel = score >= 7 ? 'ALTA' : score >= 4 ? 'MEDIA' : 'BAJA'
    return {
      nivel,
      score,
      motivo: motivos.slice(0, 2).join(' · ') || 'Sin señales fuertes',
    }
  }

  const buildMensajeFromBusqueda = (b: Busqueda) => {
    const partes: string[] = []
    if (b.tipoPropiedad) partes.push(`Busco ${b.tipoPropiedad}`)
    if (b.ubicacionPreferida) partes.push(`en ${b.ubicacionPreferida}`)

    const parseNum = (value: string) => Number.parseInt(value.replace(/[^\d]/g, ''), 10)
    const moneda = (b as any).moneda || 'USD'
    const desdeMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/desde\s+(?:u\$s|u\$d|usd|ars|\$)?\s*([\d.,]+)/i) : null
    const rangoMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/(?:u\$s|u\$d|usd|ars|\$)?\s*([\d.,]+)\s*[-\u2013]\s*(?:u\$s|u\$d|usd|ars|\$)?\s*([\d.,]+)/i) : null

    if (rangoMatch) {
      const d = parseNum(rangoMatch[1])
      const h = parseNum(rangoMatch[2])
      if (!isNaN(d) && !isNaN(h)) partes.push(`presupuesto entre ${moneda} ${d} y ${h}`)
    } else if (desdeMatch) {
      const d = parseNum(desdeMatch[1])
      if (!isNaN(d)) partes.push(`presupuesto desde ${moneda} ${d}`)
    } else if (typeof b.presupuestoTexto === 'string' && b.presupuestoTexto.trim()) {
      partes.push(`presupuesto hasta ${b.presupuestoTexto}`)
    }

    if (typeof b.dormitoriosMin === 'number' && b.dormitoriosMin > 0) {
      partes.push(`${b.dormitoriosMin} dormitorios minimo`)
    }
    partes.push('Enviar opciones')
    return partes.join('. ') + '.'
  }

  const generarTextoCompartir = () => {
    const criterios = analisisResultado?.data?.busquedaParseada
    const manuales = manualLinks
      .filter((link) => manualLinksSeleccionados.has(link.id) && link.url.trim())
      .map((link) => ({
        titulo: link.titulo.trim() || getManualLinkPreview(link).titulo,
        url: link.url.trim(),
      }))
    if (!criterios && manuales.length === 0) return ''

    const titulo = analisisResultado?.data?.titulo || [
      criterios?.tipoPropiedad !== 'OTRO' ? criterios?.tipoPropiedad?.toLowerCase() : null,
      criterios?.operacion === 'ALQUILER' ? 'en alquiler' : 'en venta',
      criterios?.zonas?.[0] ? `en ${criterios.zonas[0]}` : null,
      criterios?.presupuestoMax ? `hasta ${criterios.moneda} ${criterios.presupuestoMax?.toLocaleString()}` : null,
    ].filter(Boolean).join(' - ')

    const partes: string[] = [`*Busqueda: ${titulo}*`, '']

    manuales.forEach((item: any, i: number) => {
      partes.push(`${i + 1}. *${item.titulo}*`)
      if (item.url) partes.push(`   ${item.url}`)
      partes.push('')
    })

    return partes.join('\n').trim()
  }

  const compartirPorWhatsApp = () => {
    const texto = generarTextoCompartir()
    if (!texto) return
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  const copiarResultados = async () => {
    const texto = generarTextoCompartir()
    if (!texto) return
    try {
      await navigator.clipboard.writeText(texto)
      alert('Copiado al portapapeles')
    } catch {
      alert('Error al copiar')
    }
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

  const toggleSeleccion = (key: string) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const seleccionarTodasPropiedades = () => {
    const matches = Array.isArray(analisisResultado?.data?.matches) ? analisisResultado.data.matches : []
    const next = new Set<string>()
    matches.forEach((_: unknown, idx: number) => next.add(`match:${idx}`))
    setSeleccionadas(next)
  }

  const limpiarSeleccionPropiedades = () => {
    setSeleccionadas(new Set())
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

  const manualLinksOrdenados = [...manualLinks].sort((a, b) => {
    const aSelected = manualLinksSeleccionados.has(a.id) ? 1 : 0
    const bSelected = manualLinksSeleccionados.has(b.id) ? 1 : 0
    if (aSelected !== bSelected) return bSelected - aSelected
    return manualLinks.findIndex((item) => item.id === a.id) - manualLinks.findIndex((item) => item.id === b.id)
  })

  const guardarBusqueda = () => {
    if (!analisisResultado?.clienteId) return
    const items = Array.from(seleccionadas).map((k) => {
      const [tipo, idx] = k.split(':')
      const i = parseInt(idx, 10)
      if (tipo === 'match' && analisisResultado?.data?.matches?.[i]) {
        return { tipo: 'match', item: analisisResultado.data.matches[i] }
      }
      if (tipo === 'web' && analisisResultado?.data?.webMatches?.[i]) {
        const w = analisisResultado.data.webMatches[i]
        return { tipo: 'externo', item: { url: w.url, titulo: w.titulo || w.sitio || 'Link sugerido' } }
      }
      return null
    }).filter(Boolean)

    const manualLinksValidos = manualLinks
      .filter((link) => manualLinksSeleccionados.has(link.id))
      .map((link) => link.url.trim() ? ({
        tipo: 'externo',
        item: { url: link.url.trim(), titulo: getManualLinkPreview(link).titulo || 'Link externo' },
      }) : null)
      .filter(Boolean)

    if (manualLinksValidos.length > 0) items.push(...manualLinksValidos)

    const params = new URLSearchParams()
    params.set('clienteId', analisisResultado.clienteId)
    params.set('propSeleccionadas', JSON.stringify(items))
    window.location.href = `/gestion?${params.toString()}`
  }

  const filtrados = Array.isArray(busquedas)
    ? busquedas
        .filter((b) => {
          if (!b || !b.cliente || !b.cliente.nombreCompleto) return false

          const matchTexto = b.cliente.nombreCompleto
            .toLowerCase()
            .includes(filtro.toLowerCase())
          const matchEstado = !filtroEstado || b.estado === filtroEstado
          const matchAgente =
            !filtroAgente ||
            b.usuario?.id === filtroAgente ||
            b.cliente.usuario?.id === filtroAgente
          const prioridad = getPrioridadBusqueda(b)
          const matchPrioridad = filtroPrioridad === 'TODAS' || prioridad.nivel === filtroPrioridad

          return matchTexto && matchEstado && matchAgente && matchPrioridad
        })
        .sort((a, b) => {
          if (!ordenarPorPrioridad) return 0
          const pa = getPrioridadBusqueda(a)
          const pb = getPrioridadBusqueda(b)
          if (pb.score !== pa.score) return pb.score - pa.score
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    : []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <svg className="animate-spin h-8 w-8 text-sky-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-medium">Cargando búsquedas...</span>
      </div>
    </div>
  )

  const propiedadesSeleccionadas = Array.from(seleccionadas).filter((item) => item.startsWith('match:')).length
  const externasSeleccionadas = Array.from(seleccionadas).filter((item) => item.startsWith('web:')).length
  const totalSeleccionadas = propiedadesSeleccionadas + externasSeleccionadas + manualLinksSeleccionados.size
  const portalSearchLinks = getPortalSearchLinks(analisisResultado?.data?.busquedaParseada)
  const analisisExtraLinks = getAnalisisExtraLinks(analisisResultado?.data?.busquedaParseada)
  const inmoMercadoUnicoUrl = inmoMercadoUnico
    ? buildMercadoUnicoSearchUrl(inmoMercadoUnico)
    : null
  const inmoSitioOficialUrl = inmoMercadoUnico ? getSitioOficialInmo(inmoMercadoUnico) : null
  const inmoPrimaryUrl = inmoMercadoUnico ? getInmoPrimaryUrl(inmoMercadoUnico) : null
  const inmoPrimaryLabel = inmoMercadoUnico ? getInmoPrimaryLabel(inmoMercadoUnico) : ''

  // KPI computations
  const kpiTotal = filtrados.length
  const kpiActivas = filtrados.filter(b => !['CERRADO', 'PERDIDO'].includes(b.estado)).length
  const kpiVisita = filtrados.filter(b => b.estado === 'VISITA').length
  const kpiCerradas = filtrados.filter(b => b.estado === 'CERRADO').length
  const kpiPerdidas = filtrados.filter(b => b.estado === 'PERDIDO').length
  const kpiNuevas = filtrados.filter(b => b.estado === 'NUEVO').length

  const kpis = [
    { label: 'Total', value: kpiTotal, icon: '📋', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { label: 'Activas', value: kpiActivas, icon: '🟢', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { label: 'Nuevas', value: kpiNuevas, icon: '✨', color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    { label: 'En visita', value: kpiVisita, icon: '👁️', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { label: 'Cerradas', value: kpiCerradas, icon: '🏆', color: 'from-sky-500 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    { label: 'Perdidas', value: kpiPerdidas, icon: '❌', color: 'from-red-400 to-red-500', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  ]

  const sugeridasPrioridad = filtrados
    .map((busqueda) => ({ busqueda, prioridad: getPrioridadBusqueda(busqueda) }))
    .filter((item) => item.prioridad.nivel !== 'BAJA' && !['CERRADO', 'PERDIDO'].includes(item.busqueda.estado))
    .sort((a, b) => b.prioridad.score - a.prioridad.score)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">🔍</span>
            Tablero de Búsquedas
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-11">
            {filtrados.length} búsqueda{filtrados.length !== 1 ? 's' : ''} · Seguimiento y gestión de requerimientos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/gestion')}
            className="border-slate-300 hover:bg-slate-50"
          >
            Ir a Gestión
          </Button>
          <Button
            onClick={() => {
              if (mostrarForm) resetBusquedaForm()
              setMostrarForm(!mostrarForm)
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200"
          >
            + Nueva Búsqueda
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in-up stagger-1">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`relative overflow-hidden rounded-xl border ${kpi.border} ${kpi.bg} p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{kpi.icon}</span>
              <span className={`text-2xl font-bold ${kpi.text}`}>{kpi.value}</span>
            </div>
            <p className={`text-xs font-medium ${kpi.text} mt-1 opacity-80`}>{kpi.label}</p>
            <div className={`absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-gradient-to-br ${kpi.color} opacity-10`} />
          </div>
        ))}
      </div>

      {/* Guide steps */}
      <Card className="border-slate-200 bg-white/80 backdrop-blur-sm animate-fade-in-up stagger-2">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap">
            {[
              { step: 1, text: 'Crear búsqueda' },
              { step: 2, text: 'Revisar detalle' },
              { step: 3, text: 'Editar si hace falta' },
              { step: 4, text: 'Eliminar si ya no corresponde' },
            ].map((item, i) => (
              <span key={item.step} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-300">→</span>}
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700 text-xs font-bold shadow-sm">{item.step}</span>
                <span>{item.text}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {mostrarForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editandoBusquedaId ? 'Editar Busqueda' : 'Crear Nueva Busqueda'}</CardTitle>
            <p className="text-sm text-slate-600">
              Completa los datos base del requerimiento del cliente.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={formData.clienteId}
                  onChange={(e) =>
                    setFormData({ ...formData, clienteId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreCompleto || c.nombre || c.id}
                    </option>
                  ))}
                </select>
              </div>

              {(currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Asignar a agente
                  </label>
                  <select
                    value={formData.usuarioId}
                    onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="">Sin asignar (usa el agente del cliente)</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Origen
                </label>
                <select
                  value={formData.origen}
                  onChange={(e) =>
                    setFormData({ ...formData, origen: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="ACTIVA">Activa</option>
                  <option value="PERSONALIZADA">Personalizada</option>
                  <option value="CALIFICADA_EFECTIVO">Calificada (Efectivo)</option>
                  <option value="CALIFICADA_CREDITO">Calificada (Credito)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={formData.prioridad}
                  onChange={(e) =>
                    setFormData({ ...formData, prioridad: e.target.value as PrioridadNivel })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Media</option>
                  <option value="BAJA">Baja</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Presupuesto
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={formData.moneda}
                      onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                    </select>
                    <Input
                      type="number"
                      value={formData.presupuestoDesde}
                      onChange={(e) => setFormData({ ...formData, presupuestoDesde: e.target.value })}
                      placeholder="Desde"
                    />
                    <Input
                      type="number"
                      value={formData.presupuestoHasta}
                      onChange={(e) => setFormData({ ...formData, presupuestoHasta: e.target.value })}
                      placeholder="Hasta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Propiedad
                  </label>
                  <select
                    value={formData.tipoPropiedad}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipoPropiedad: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="">Seleccionar</option>
                    <option value="DEPARTAMENTO">Departamento</option>
                    <option value="CASA">Casa</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Provincia
                  </label>
                  <Input value={formData.provincia} disabled />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Dormitorios Minimo
                  </label>
                  <Input
                    type="number"
                    value={formData.dormitoriosMin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dormitoriosMin: e.target.value,
                      })
                    }
                    placeholder="Ej: 2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ciudad
                  </label>
                  <select
                    value={formData.ciudad}
                    onChange={(e) => {
                      const nuevaCiudad = e.target.value
                      setFormData({
                        ...formData,
                        ciudad: nuevaCiudad,
                        barrio: nuevaCiudad === 'Santa Fe Capital' ? formData.barrio : '',
                      })
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                  >
                    {CIUDADES_SANTA_FE.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Barrio
                  </label>
                  <select
                    value={formData.barrio}
                    onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                    disabled={formData.ciudad !== 'Santa Fe Capital'}
                  >
                    <option value="">(opcional)</option>
                    {BARRIOS_SANTA_FE_CAPITAL.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Observaciones
                </label>
                <Input
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      observaciones: e.target.value,
                    })
                  }
                  placeholder="Notas adicionales"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={guardandoBusqueda}>
                  {guardandoBusqueda ? 'Guardando...' : editandoBusquedaId ? 'Guardar cambios' : 'Guardar'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setMostrarForm(false)
                    resetBusquedaForm()
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {busquedaEnVista && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle>Detalle de busqueda</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="font-semibold">Cliente:</span> {busquedaEnVista.cliente.nombreCompleto}</div>
            <div><span className="font-semibold">Origen:</span> {busquedaEnVista.origen || '-'}</div>
            <div><span className="font-semibold">Presupuesto:</span> {busquedaEnVista.presupuestoTexto || '-'}</div>
            <div><span className="font-semibold">Tipo:</span> {busquedaEnVista.tipoPropiedad || '-'}</div>
            <div><span className="font-semibold">Ubicacion:</span> {busquedaEnVista.ubicacionPreferida || '-'}</div>
            <div><span className="font-semibold">Dormitorios min:</span> {busquedaEnVista.dormitoriosMin ?? '-'}</div>
            <div className="md:col-span-2"><span className="font-semibold">Observaciones:</span> {busquedaEnVista.observaciones || '-'}</div>
            <div className="md:col-span-2 flex gap-2">
              {canEditBusqueda(busquedaEnVista) && (
                <Button size="sm" variant="outline" onClick={() => abrirEdicion(busquedaEnVista)}>
                  Editar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => eliminarBusqueda(busquedaEnVista)}
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={eliminandoBusquedaId === busquedaEnVista.id || !canEditBusqueda(busquedaEnVista)}
              >
                {eliminandoBusquedaId === busquedaEnVista.id ? 'Eliminando...' : 'Eliminar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBusquedaEnVista(null)}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sugeridasPrioridad.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Sugerencias de prioridad</CardTitle>
            <p className="text-sm text-slate-700">
              Estas busquedas deberian atenderse primero por estado, fecha y señales comerciales.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sugeridasPrioridad.map(({ busqueda, prioridad }) => (
              <div key={busqueda.id} className="rounded-md border border-amber-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">{busqueda.cliente.nombreCompleto}</div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    prioridad.nivel === 'ALTA'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {prioridad.nivel}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {busqueda.tipoPropiedad || '-'} · {busqueda.presupuestoTexto || '-'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {prioridad.motivo}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setBusquedaEnVista(busqueda)}>
                    Ver
                  </Button>
                  {canEditBusqueda(busqueda) && (
                    <Button size="sm" variant="outline" onClick={() => abrirEdicion(busqueda)}>
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros de Seguimiento */}
      <Card className="border-slate-200 bg-white animate-fade-in-up stagger-3">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-sm">⚙️</span>
            <h3 className="text-sm font-semibold text-slate-700">Filtros de Seguimiento</h3>
            {(filtro || filtroEstado || filtroAgente || filtroPrioridad !== 'TODAS') && (
              <button
                onClick={() => { setFiltro(''); setFiltroEstado(''); setFiltroAgente(''); setFiltroPrioridad('TODAS') }}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {currentUser?.rol === 'admin' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">Agente</label>
                <select
                  value={filtroAgente}
                  onChange={(e) => setFiltroAgente(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                >
                  <option value="">Todos los agentes</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
              >
                <option value="">Todos los estados</option>
                <option value="NUEVO">Nuevo</option>
                <option value="CALIFICADO">Calificado</option>
                <option value="VISITA">Visita</option>
                <option value="RESERVA">Reserva</option>
                <option value="CERRADO">Cerrado</option>
                <option value="PERDIDO">Perdido</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Prioridad</label>
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value as 'TODAS' | PrioridadNivel)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
              >
                <option value="TODAS">Todas las prioridades</option>
                <option value="ALTA">🔴 Alta</option>
                <option value="MEDIA">🟡 Media</option>
                <option value="BAJA">⚪ Baja</option>
              </select>
            </div>
            <div className={currentUser?.rol === 'admin' ? '' : 'lg:col-span-2'}>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Buscar</label>
              <Input
                type="text"
                placeholder="Buscar cliente / tipo / ubicación..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="py-2.5 border-slate-200 rounded-lg hover:border-slate-300 focus:border-blue-400"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors w-full justify-center">
                <input
                  type="checkbox"
                  checked={ordenarPorPrioridad}
                  onChange={(e) => setOrdenarPorPrioridad(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-xs font-medium">Ordenar por prioridad</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Búsquedas */}
      <Card className="animate-fade-in-up stagger-4 border-slate-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-sm">📝</span>
              <CardTitle className="text-lg">Listado de Búsquedas</CardTitle>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{filtrados.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Cliente</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Presupuesto</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Tipo</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Origen</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Prioridad</TableHead>
                {currentUser?.rol === 'admin' && <TableHead className="text-xs uppercase tracking-wider font-semibold text-slate-500">Agente</TableHead>}
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold text-slate-500">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={currentUser?.rol === 'admin' ? 7 : 6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </div>
                      <p className="text-slate-600 font-semibold">No hay búsquedas</p>
                      <p className="text-sm text-slate-400">Creá una nueva búsqueda o ajustá los filtros</p>
                      <Button
                        size="sm"
                        onClick={() => { setMostrarForm(true); resetBusquedaForm() }}
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                      >
                        + Crear búsqueda
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((busqueda) => {
                  const prioridad = getPrioridadBusqueda(busqueda)
                  const estadoColors: Record<string, string> = {
                    'NUEVO': 'bg-blue-50 text-blue-700 border-blue-200',
                    'CALIFICADO': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    'VISITA': 'bg-amber-50 text-amber-700 border-amber-200',
                    'RESERVA': 'bg-violet-50 text-violet-700 border-violet-200',
                    'CERRADO': 'bg-slate-100 text-slate-600 border-slate-200',
                    'PERDIDO': 'bg-red-50 text-red-600 border-red-200',
                  }
                  return (
                    <TableRow key={busqueda.id} className="hover:bg-blue-50/30 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            prioridad.nivel === 'ALTA' ? 'bg-red-500' :
                            prioridad.nivel === 'MEDIA' ? 'bg-amber-500' : 'bg-slate-300'
                          }`} />
                          <div>
                            <button
                              onClick={() => window.location.href = `/gestion?clienteId=${busqueda.cliente.id || ''}`}
                              className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {busqueda.cliente.nombreCompleto}
                            </button>
                            <p className="text-xs text-slate-400">
                              {new Date(busqueda.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700">{busqueda.presupuestoTexto || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          estadoColors[busqueda.tipoPropiedad || ''] || 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {busqueda.tipoPropiedad || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          estadoColors[busqueda.estado] || 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {busqueda.origen}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                            prioridad.nivel === 'ALTA'
                              ? 'bg-red-100 text-red-700'
                              : prioridad.nivel === 'MEDIA'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                          title={prioridad.motivo}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            prioridad.nivel === 'ALTA' ? 'bg-red-500' :
                            prioridad.nivel === 'MEDIA' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          {prioridad.nivel}
                        </span>
                      </TableCell>
                      {currentUser?.rol === 'admin' && (
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                              {getAgenteNombre(busqueda).charAt(0)}
                            </span>
                            <span className="text-sm text-slate-600">{getAgenteNombre(busqueda)}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => buscarPropiedades(busqueda)}
                            className="h-7 px-2.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                            disabled={buscandoPropiedadesId === busqueda.id}
                          >
                            {buscandoPropiedadesId === busqueda.id ? '...' : 'Links'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setBusquedaEnVista(busqueda); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                            className="h-7 px-2.5 text-xs border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirEdicion(busqueda)}
                            className="h-7 px-2.5 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                            disabled={!canEditBusqueda(busqueda)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => eliminarBusqueda(busqueda)}
                            className="h-7 px-2.5 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                            disabled={eliminandoBusquedaId === busqueda.id || !canEditBusqueda(busqueda)}
                          >
                            {eliminandoBusquedaId === busqueda.id ? '...' : 'Eliminar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(analisisError || analisisResultado) && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado del analisis</CardTitle>
            <p className="text-sm text-slate-600">
              Abrí portales con filtros, pegá links manuales en cards y elegí qué enviar a Gestión del Cliente.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {analisisError && (
              <div className="text-sm text-red-600">{analisisError}</div>
            )}
            {analisisResultado && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  Analisis completado. Este paso usa flujo manual: el sistema arma accesos con filtros y vos elegís los links reales.
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!analisisResultado?.clienteId}
                    onClick={() => {
                      const clienteId = analisisResultado?.clienteId
                      if (!clienteId) return
                      window.location.href = `/gestion?clienteId=${clienteId}`
                    }}
                  >
                    Ir a Gestion del Cliente
                  </Button>
                  {(totalSeleccionadas > 0) && (
                    <Button
                      type="button"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={guardarBusqueda}
                    >
                      Guardar en Gestion del Cliente ({totalSeleccionadas})
                    </Button>
                  )}
                  {manualLinksSeleccionados.size > 0 && (
                    <>
                      <Button type="button" variant="outline" onClick={compartirPorWhatsApp}>
                        WhatsApp
                      </Button>
                      <Button type="button" variant="outline" onClick={copiarResultados}>
                        Copiar
                      </Button>
                    </>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Investigacion guiada</CardTitle>
                    <p className="text-sm text-slate-600">
                      Paso 1: abrí portales con filtros. Paso 2: revisá fuentes extra. Paso 3: elegí inmobiliarias. Paso 4: pegá abajo los links reales.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="text-sm font-semibold text-slate-800 mb-2">Portales principales</div>
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
                        <div className="text-xs font-semibold text-slate-700">Fuentes complementarias</div>
                        <div className="text-xs text-slate-500">Sirven para ampliar la busqueda sin depender del scraping.</div>
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
                        <div className="text-xs font-semibold text-slate-700 mb-2">Inmobiliarias Santa Fe</div>
                        <div className="text-xs text-slate-500 mb-2">Si hay sitio oficial va directo; si no, busca en Mercado Unico.</div>
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
                      El sistema no intenta extraer publicaciones en vivo. En su lugar, te deja navegar con filtros y armar la seleccion final con links manuales.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Links manuales para continuar el flujo</CardTitle>
                    <p className="text-sm text-slate-600">
                      Cada link se convierte en una card. El sistema detecta el portal desde la URL, arma un titulo inicial y te deja ordenar y seleccionar antes de pasar a Gestion.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {manualLinksOrdenados.map((manualLink, index) => {
                        const disabledSelect = !manualLink.url.trim()
                        const isSelected = manualLinksSeleccionados.has(manualLink.id)
                        const preview = getManualLinkPreview(manualLink)
                        const portalColors = getPortalColorClasses(preview.portal.badge)
                        const originalIndex = manualLinks.findIndex((item) => item.id === manualLink.id)

                        return (
                          <div
                            key={manualLink.id}
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
                            className={`rounded-xl border p-4 space-y-3 transition ${
                              isSelected
                                ? `${portalColors.card} shadow-sm`
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold text-slate-500">Card #{originalIndex + 1}</div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={`inline-flex h-6 min-w-9 items-center justify-center rounded border px-2 text-[10px] font-semibold ${portalColors.chip}`}>
                                    {preview.portal.badge}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-600">{preview.portal.nombre}</span>
                                  {isSelected && (
                                    <span className="text-[10px] font-semibold text-emerald-700">Seleccionada</span>
                                  )}
                                </div>
                              </div>
                              <div className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300 bg-white text-transparent'
                              }`}>
                                OK
                              </div>
                            </div>

                            <Input
                              placeholder="Titulo visible (opcional)"
                              value={manualLink.titulo}
                              onChange={(e) => updateManualLink(manualLink.id, 'titulo', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Input
                              placeholder="Pega URL completa (https://...)"
                              value={manualLink.url}
                              onChange={(e) => updateManualLink(manualLink.id, 'url', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />

                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <div className="text-sm font-semibold text-slate-900 break-words">
                                {preview.titulo}
                              </div>
                              <div className="mt-1 text-xs text-slate-500 break-all">
                                {manualLink.url.trim() || preview.subtitulo}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={originalIndex === 0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveManualLink(manualLink.id, 'up')
                                }}
                              >
                                Subir
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={originalIndex === manualLinks.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveManualLink(manualLink.id, 'down')
                                }}
                              >
                                Bajar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disabledSelect}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleManualLinkSeleccionado(manualLink.id)
                                }}
                              >
                                {isSelected ? 'Quitar seleccion' : 'Seleccionar'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={manualLinks.length === 1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeManualLink(manualLink.id)
                                }}
                              >
                                Quitar
                              </Button>
                              {manualLink.url.trim() && (
                                <a
                                  href={manualLink.url.trim()}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                >
                                  Abrir
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Button type="button" variant="outline" onClick={addManualLink}>
                      + Agregar otra card
                    </Button>
                  </CardContent>
                </Card>

                {Array.isArray(analisisResultado?.data?.matches) && analisisResultado.data.matches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle>Propiedades del CRM ({analisisResultado.data.matches.length})</CardTitle>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={seleccionarTodasPropiedades}>
                            Seleccionar todas
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={limpiarSeleccionPropiedades}>
                            Limpiar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-2">
                        {analisisResultado.data.matches.map((m: any, idx: number) => (
                          <button
                            key={`${m?.id || idx}`}
                            type="button"
                            onClick={() => toggleSeleccion(`match:${idx}`)}
                            className={`w-full p-3 rounded-lg border text-left transition ${
                              seleccionadas.has(`match:${idx}`)
                                ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span
                                className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${
                                  seleccionadas.has(`match:${idx}`)
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-slate-300 bg-white text-transparent'
                                }`}
                              >
                                OK
                              </span>
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
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAnalisisError(null)
                    setAnalisisResultado(null)
                    setSeleccionadas(new Set())
                    setManualLinks([{ id: 'manual-1', titulo: '', url: '' }])
                    setManualLinksSeleccionados(new Set())
                  }}
                >
                  Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
