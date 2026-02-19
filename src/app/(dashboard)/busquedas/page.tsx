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
  estado: string
  createdAt: string
}

interface CurrentUser {
  id: string
  nombre: string
  rol: string
}

type PrioridadNivel = 'ALTA' | 'MEDIA' | 'BAJA'

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
  const [linkExterno, setLinkExterno] = useState('')
  const [linkExternoTitulo, setLinkExternoTitulo] = useState('')
  const [linkSeleccionado, setLinkSeleccionado] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [filtrosPortales, setFiltrosPortales] = useState({
    moneda: '',
    precioDesde: '',
    precioHasta: '',
    dormitoriosMin: '',
    ambientesMin: '',
  })
  const [aplicandoFiltrosPortales, setAplicandoFiltrosPortales] = useState(false)
  const [inmoMercadoUnico, setInmoMercadoUnico] = useState('')
  const [scrapedPage, setScrapedPage] = useState(1)
  const SCRAPED_PAGE_SIZE = 10

  const [formData, setFormData] = useState({
    clienteId: '',
    origen: 'ACTIVA',
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

  const resetBusquedaForm = () => {
    setFormData({
      clienteId: '',
      origen: 'ACTIVA',
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

  const abrirEdicion = (busqueda: Busqueda) => {
    const { provincia, ciudad, barrio } = parseUbicacion(busqueda.ubicacionPreferida)
    const { moneda, desde, hasta } = parsePresupuesto(busqueda.presupuestoTexto)
    setFormData({
      clienteId: busqueda.cliente.id || '',
      origen: busqueda.origen || 'ACTIVA',
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
      if (currentUser.rol === 'admin') {
        router.replace('/admin/tablero-busquedas')
        return
      }
      Promise.all([fetchBusquedas(), fetchClientes()])
      if (currentUser.rol === 'admin') {
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

  const getPrioridadBusqueda = (busqueda: Busqueda): { nivel: PrioridadNivel; score: number; motivo: string } => {
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
      partes.push(`${b.dormitoriosMin} dormitorios mÃƒÂ­nimo`)
    }
    partes.push('Enviar opciones')
    return partes.join('. ') + '.'
  }

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

  const getPortalSearchLinks = (criterios: any, filtros: any) => {
    const op = criterios?.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    const moneda = String(filtros?.moneda || criterios?.moneda || 'USD').toUpperCase() === 'ARS' ? 'ARS' : 'USD'
    const precioDesde = Number(filtros?.precioDesde || criterios?.presupuestoMin || 0) || null
    const precioHasta = Number(filtros?.precioHasta || criterios?.presupuestoMax || 0) || null
    const dormMin = Number(filtros?.dormitoriosMin || criterios?.dormitoriosMin || filtros?.ambientesMin || criterios?.ambientesMin || 0) || null

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

  const getAnalisisExtraLinks = (criterios: any, filtros: any) => {
    const op = criterios?.operacion === 'ALQUILER' ? 'alquiler' : 'venta'
    const dormMin = Number(filtros?.dormitoriosMin || criterios?.dormitoriosMin || filtros?.ambientesMin || criterios?.ambientesMin || 0) || null
    const precioDesde = Number(filtros?.precioDesde || criterios?.presupuestoMin || 0) || null
    const precioHasta = Number(filtros?.precioHasta || criterios?.presupuestoMax || 0) || null
    const tipo = String(criterios?.tipoPropiedad || 'propiedad').toLowerCase()
    const q = `${tipo} ${op} santa fe capital ${dormMin ? `${dormMin} dormitorios` : ''} ${precioDesde ? `desde ${precioDesde}` : ''} ${precioHasta ? `hasta ${precioHasta}` : ''}`.trim()

    return [
      { id: 'google', label: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(q)}` },
      { id: 'site_zp', label: 'ZonaProp (sitio)', url: `https://www.google.com/search?q=${encodeURIComponent(`site:zonaprop.com.ar ${q}`)}` },
      { id: 'site_ap', label: 'ArgenProp (sitio)', url: `https://www.google.com/search?q=${encodeURIComponent(`site:argenprop.com ${q}`)}` },
      { id: 'site_ml', label: 'MercadoLibre (sitio)', url: `https://www.google.com/search?q=${encodeURIComponent(`site:inmuebles.mercadolibre.com.ar ${q}`)}` },
      { id: 'site_rx', label: 'Remax (sitio)', url: `https://www.google.com/search?q=${encodeURIComponent(`site:remax.com.ar ${q}`)}` },
      { id: 'site_c21', label: 'Century 21 (sitio)', url: `https://www.google.com/search?q=${encodeURIComponent(`site:century21.com.ar ${q}`)}` },
      { id: 'mercadounico', label: 'MercadoUnico', url: `https://www.google.com/search?q=${encodeURIComponent(`mercadounico inmobiliaria santa fe capital ${q}`)}` },
      { id: 'inmo_sf', label: 'Inmobiliarias Santa Fe', url: `https://www.google.com/search?q=${encodeURIComponent(`inmobiliarias en santa fe capital ${tipo}`)}` },
    ]
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
      if (tipo === 'scraped' && analisisResultado?.data?.scrapedItems?.[i]) {
        const s = analisisResultado.data.scrapedItems[i]
        return { tipo: 'externo', item: { url: s.url, titulo: s.titulo || s.sitio || 'Portal' } }
      }
      return null
    }).filter(Boolean)
    if (linkSeleccionado) {
      items.push({ tipo: 'externo', item: { url: linkSeleccionado, titulo: linkExternoTitulo || 'Link externo' } })
    }
    const params = new URLSearchParams()
    params.set('clienteId', analisisResultado.clienteId)
    params.set('propSeleccionadas', JSON.stringify(items))
    window.location.href = `/gestion?${params.toString()}`
  }

  // Asegurarse de que busquedas sea un array antes de filtrar
  const reanalizarPortalesConFiltros = async (resetear = false) => {
    if (!analisisResultado?.busquedaId) return
    const b = busquedas.find((it) => it.id === analisisResultado.busquedaId)
    if (!b) return

    setAplicandoFiltrosPortales(true)
    setScrapedPage(1)
    setAnalisisError(null)
    try {
      const mensaje = buildMensajeFromBusqueda(b)
      const filtros = resetear
        ? { moneda: '', precioDesde: '', precioHasta: '', dormitoriosMin: '', ambientesMin: '' }
        : filtrosPortales

      const res = await fetch('/api/parsear-busqueda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, guardar: false, clienteId: null, filtrosPortales: filtros }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setAnalisisError(data?.error || 'Error al actualizar portales')
        return
      }

      setAnalisisResultado((prev: any) => ({
        ...prev,
        data,
      }))
      setSeleccionadas(new Set())
      setLinkSeleccionado(null)
    } catch (e: any) {
      setAnalisisError(e?.message || 'Error de conexion')
    } finally {
      setAplicandoFiltrosPortales(false)
    }
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

  if (loading) return <div className="text-center py-8">Cargando...</div>

  const propiedadesSeleccionadas = Array.from(seleccionadas).filter((item) => item.startsWith('match:')).length
  const externasSeleccionadas = Array.from(seleccionadas).filter((item) => item.startsWith('web:') || item.startsWith('scraped:')).length
  const totalSeleccionadas = propiedadesSeleccionadas + externasSeleccionadas + (linkSeleccionado ? 1 : 0)
  const scrapedItems = Array.isArray(analisisResultado?.data?.scrapedItems) ? analisisResultado.data.scrapedItems : []
  const scrapedItemsFiltrados = scrapedItems.map((item: any, idx: number) => ({ item, idx }))
  const scrapedTotalPages = Math.max(1, Math.ceil(scrapedItemsFiltrados.length / SCRAPED_PAGE_SIZE))
  const scrapedItemsPaginados = scrapedItemsFiltrados.slice(
    (scrapedPage - 1) * SCRAPED_PAGE_SIZE,
    scrapedPage * SCRAPED_PAGE_SIZE
  )
  const portalSearchLinks = getPortalSearchLinks(analisisResultado?.data?.busquedaParseada, filtrosPortales)
  const analisisExtraLinks = getAnalisisExtraLinks(analisisResultado?.data?.busquedaParseada, filtrosPortales)
  const inmoMercadoUnicoUrl = inmoMercadoUnico
    ? `https://www.google.com/search?q=${encodeURIComponent(`site:mercado-unico.com \"${inmoMercadoUnico}\" santa fe ver propiedades`)}` 
    : null
  const inmoSitioOficialUrl = inmoMercadoUnico ? getSitioOficialInmo(inmoMercadoUnico) : null

  const tableroAgentes = currentUser?.rol === 'admin'
    ? Object.values(
        filtrados.reduce((acc, b) => {
          const agenteNombre = getAgenteNombre(b)
          if (!acc[agenteNombre]) {
            acc[agenteNombre] = { agente: agenteNombre, total: 0, activas: 0, visitas: 0, cerradas: 0 }
          }
          acc[agenteNombre].total++
          if (b.estado !== 'CERRADO' && b.estado !== 'PERDIDO') acc[agenteNombre].activas++
          if (b.estado === 'VISITA') acc[agenteNombre].visitas++
          if (b.estado === 'CERRADO') acc[agenteNombre].cerradas++
          return acc
        }, {} as Record<string, { agente: string; total: number; activas: number; visitas: number; cerradas: number }>)
      )
    : []

  const sugeridasPrioridad = filtrados
    .map((busqueda) => ({ busqueda, prioridad: getPrioridadBusqueda(busqueda) }))
    .filter((item) => item.prioridad.nivel !== 'BAJA' && !['CERRADO', 'PERDIDO'].includes(item.busqueda.estado))
    .sort((a, b) => b.prioridad.score - a.prioridad.score)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Busquedas</h1>
        {currentUser?.rol !== 'admin' && (
          <Button
            onClick={() => {
              if (mostrarForm) resetBusquedaForm()
              setMostrarForm(!mostrarForm)
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Nueva Busqueda
          </Button>
        )}
      </div>
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-4">
          <div className="text-sm text-slate-700">
            Flujo recomendado: `1)` crear busqueda, `2)` revisar detalle, `3)` editar si hace falta, `4)` eliminar si ya no corresponde.
          </div>
        </CardContent>
      </Card>

      {currentUser?.rol === 'admin' && (
        <Card className="border-sky-200 bg-sky-50">
          <CardHeader>
            <CardTitle>Tablero de Agentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sky-200 text-slate-700">
                    <th className="text-left py-2 pr-3">Agente</th>
                    <th className="text-left py-2 pr-3">Total</th>
                    <th className="text-left py-2 pr-3">Activas</th>
                    <th className="text-left py-2 pr-3">En visita</th>
                    <th className="text-left py-2 pr-3">Cerradas</th>
                  </tr>
                </thead>
                <tbody>
                  {tableroAgentes.map((row) => (
                    <tr key={row.agente} className="border-b border-sky-100">
                      <td className="py-2 pr-3 font-medium">{row.agente}</td>
                      <td className="py-2 pr-3">{row.total}</td>
                      <td className="py-2 pr-3">{row.activas}</td>
                      <td className="py-2 pr-3">{row.visitas}</td>
                      <td className="py-2 pr-3">{row.cerradas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Button size="sm" variant="outline" onClick={() => abrirEdicion(busquedaEnVista)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => eliminarBusqueda(busquedaEnVista)}
                className="border-red-300 text-red-700 hover:bg-red-50"
                disabled={eliminandoBusquedaId === busquedaEnVista.id}
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
                  <Button size="sm" variant="outline" onClick={() => abrirEdicion(busqueda)}>
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="Buscar por cliente (nombre completo)..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
        <select
          value={filtroPrioridad}
          onChange={(e) => setFiltroPrioridad(e.target.value as 'TODAS' | PrioridadNivel)}
          className="px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="TODAS">Todas las prioridades</option>
          <option value="ALTA">Solo ALTA</option>
          <option value="MEDIA">Solo MEDIA</option>
          <option value="BAJA">Solo BAJA</option>
        </select>
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-700">
          <input
            type="checkbox"
            checked={ordenarPorPrioridad}
            onChange={(e) => setOrdenarPorPrioridad(e.target.checked)}
          />
          Ordenar por prioridad
        </label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md"
        >
          <option value="">Todos los estados</option>
          <option value="NUEVO">Nuevo</option>
          <option value="CALIFICADO">Calificado</option>
          <option value="VISITA">Visita</option>
          <option value="RESERVA">Reserva</option>
          <option value="CERRADO">Cerrado</option>
        </select>
        {currentUser?.rol === 'admin' && (
          <select
            value={filtroAgente}
            onChange={(e) => setFiltroAgente(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md"
          >
            <option value="">Todos los agentes</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Usa estos filtros para encontrar rapido una busqueda y verla, editarla o eliminarla sin salir de esta pagina.
      </p>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
                {currentUser?.rol === 'admin' && <TableHead>Agente</TableHead>}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={currentUser?.rol === 'admin' ? 7 : 6} className="text-center py-8">
                    No hay busquedas
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((busqueda) => (
                  <TableRow key={busqueda.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => window.location.href = `/gestion?clienteId=${busqueda.cliente.id || ''}`}
                        className="text-blue-600 hover:underline"
                      >
                        {busqueda.cliente.nombreCompleto}
                      </button>
                    </TableCell>
                    <TableCell>{busqueda.presupuestoTexto || '-'}</TableCell>
                    <TableCell>{busqueda.tipoPropiedad || '-'}</TableCell>
                    <TableCell className="text-sm">{busqueda.origen}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200">
                        {busqueda.estado}
                      </span>
                    </TableCell>
                    {currentUser?.rol === 'admin' && (
                      <TableCell className="text-sm text-slate-600">
                        {getAgenteNombre(busqueda)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBusquedaEnVista(busqueda)}
                          className="h-8 px-3 border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirEdicion(busqueda)}
                          className="h-8 px-3 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => eliminarBusqueda(busqueda)}
                          className="h-8 px-3 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                          disabled={eliminandoBusquedaId === busqueda.id}
                        >
                          {eliminandoBusquedaId === busqueda.id ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
              Aqui ves resultados web + CRM. Marca checks en propiedades o links y guarda la seleccion en Gestion del Cliente.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {analisisError && (
              <div className="text-sm text-red-600">{analisisError}</div>
            )}
            {analisisResultado && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  Analisis completado.
                </div>
                {analisisResultado?.data?.portalStats && (
                  <div className="text-xs text-slate-600">
                    Portales: ZP {analisisResultado.data.portalStats.zonaprop || 0} Â· AP {analisisResultado.data.portalStats.argenprop || 0} Â· ML {analisisResultado.data.portalStats.mercadolibre || 0} Â· RX {analisisResultado.data.portalStats.remax || 0} Â· BI {analisisResultado.data.portalStats.buscainmueble || 0}
                  </div>
                )}

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
                </div>

                {scrapedItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Oportunidades en Portales ({scrapedItemsFiltrados.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
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
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                        <select
                          value={filtrosPortales.moneda}
                          onChange={(e) => setFiltrosPortales((p) => ({ ...p, moneda: e.target.value }))}
                          className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                        >
                          <option value="">Moneda</option>
                          <option value="USD">USD</option>
                          <option value="ARS">ARS</option>
                        </select>
                        <Input
                          type="number"
                          placeholder="Desde"
                          value={filtrosPortales.precioDesde}
                          onChange={(e) => setFiltrosPortales((p) => ({ ...p, precioDesde: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Hasta"
                          value={filtrosPortales.precioHasta}
                          onChange={(e) => setFiltrosPortales((p) => ({ ...p, precioHasta: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Dorm min"
                          value={filtrosPortales.dormitoriosMin}
                          onChange={(e) => setFiltrosPortales((p) => ({ ...p, dormitoriosMin: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Amb min"
                          value={filtrosPortales.ambientesMin}
                          onChange={(e) => setFiltrosPortales((p) => ({ ...p, ambientesMin: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            className="flex-1"
                            onClick={() => reanalizarPortalesConFiltros(false)}
                            disabled={aplicandoFiltrosPortales}
                          >
                            {aplicandoFiltrosPortales ? 'Buscando...' : 'Ver resultados'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setFiltrosPortales({
                                moneda: '',
                                precioDesde: '',
                                precioHasta: '',
                                dormitoriosMin: '',
                                ambientesMin: '',
                              })
                              reanalizarPortalesConFiltros(true)
                            }}
                            disabled={aplicandoFiltrosPortales}
                          >
                            Limpiar
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        Estos filtros rehacen la busqueda en portales (no solo visual).
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>
                          Mostrando {(scrapedPage - 1) * SCRAPED_PAGE_SIZE + 1}-
                          {Math.min(scrapedPage * SCRAPED_PAGE_SIZE, scrapedItemsFiltrados.length)} de {scrapedItemsFiltrados.length}
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
                        {scrapedItemsPaginados.map(({ item, idx }: any, pos: number) => (
                          <div key={`${item?.url || pos}`} className="flex gap-3 p-3 bg-white border rounded-lg">
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
                              <div className="flex gap-2 mt-2 items-center">
                                <button
                                  type="button"
                                  onClick={() => toggleSeleccion(`scraped:${idx}`)}
                                  className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-semibold ${
                                    seleccionadas.has(`scraped:${idx}`)
                                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                      : 'border-slate-300 bg-white text-slate-700'
                                  }`}
                                >
                                  {seleccionadas.has(`scraped:${idx}`) ? 'Seleccionado' : 'Seleccionar'}
                                </button>
                                {item?.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                                  >
                                    Ver
                                  </a>
                                )}
                                <div className="text-xs text-slate-500">
                                  URL: {item?.url || '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {scrapedItemsFiltrados.length === 0 && (
                        <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
                          No hay resultados con esos filtros. Proba ampliar el rango y tocar Ver resultados.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Link externo manual</CardTitle>
                    <p className="text-sm text-slate-600">
                      Si encontraste una opcion fuera del CRM, pegala aqui para incluirla en la gestion del cliente.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Titulo visible (ej: Depto 2D Candioti)"
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
                        OK Link seleccionado: {linkExternoTitulo || 'Sin titulo'} - {linkSeleccionado}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {false && Array.isArray(analisisResultado?.data?.webMatches) && analisisResultado.data.webMatches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Links sugeridos ({analisisResultado.data.webMatches.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-slate-600">
                        Selecciona links sugeridos para enviarlos a Gestion del Cliente.
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analisisResultado.data.webMatches.map((w: any, idx: number) => (
                          <div key={`${w?.url || idx}`} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm">
                            <input
                              type="checkbox"
                              checked={seleccionadas.has(`web:${idx}`)}
                              onChange={() => toggleSeleccion(`web:${idx}`)}
                              className="mt-0.5"
                            />
                            <span className="inline-flex h-5 min-w-8 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 text-[10px] text-slate-600">
                              {getPortalBadge(w?.sitio)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-slate-900">
                                {w?.sitio || 'Link'}
                              </div>
                              <div className="text-xs text-slate-600 line-clamp-1">
                                {w?.titulo || w?.url}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {w?.url && (
                                <a
                                  href={w.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center rounded-md border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                                >
                                  Ver
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                  setLinkSeleccionado(null)
                  setLinkExterno('')
                  setLinkExternoTitulo('')
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




