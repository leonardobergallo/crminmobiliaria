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

const BUSQUEDA_DRAFT_KEY = 'busquedaDraftFromUltimaWeb'

export default function BusquedasPage() {
  const router = useRouter()
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroAgente, setFiltroAgente] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [analisisResultado, setAnalisisResultado] = useState<any>(null)
  const [analisisError, setAnalisisError] = useState<string | null>(null)
  const [analizandoId, setAnalizandoId] = useState<string | null>(null)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [linkExterno, setLinkExterno] = useState('')
  const [linkExternoTitulo, setLinkExternoTitulo] = useState('')
  const [linkSeleccionado, setLinkSeleccionado] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])

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

  const CIUDADES_SANTA_FE = [
    'Santa Fe Capital',
    'Santa Fe y alrededores',
    'Recreo',
    'Santo Tomé',
    'Sauce Viejo',
    'Arroyo Leyes',
    'Colastiné',
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
    'San Martín',
    'Puerto',
    'Costanera',
    'Villa Setubal',
    'Sargento Cabral',
    'María Selva',
    'Dentro de Bulevares',
  ]

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
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
        // Si no está autenticado, redirigir al login
        if (res.status === 401) {
          router.push('/login')
        } else {
          console.error('Error obteniendo usuario actual:', res.status)
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error)
      // En caso de error de red, también redirigir al login
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
          console.error('Respuesta inválida del servidor:', data)
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
        // Si hay error de autenticación, redirigir al login
        if (response.status === 401) {
          router.push('/login')
          return
        }
        console.error('Error al obtener búsquedas:', response.status)
        setBusquedas([]) // Establecer array vacío en caso de error
        setLoading(false)
        return
      }
      
      const data = await response.json()
      // Asegurarse de que data sea un array
      if (Array.isArray(data)) {
        setBusquedas(data)
      } else {
        console.error('Respuesta inválida del servidor:', data)
        setBusquedas([])
      }
    } catch (error) {
      console.error('Error:', error)
      setBusquedas([]) // Establecer array vacío en caso de error
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
          console.error('Respuesta inválida del servidor:', data)
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
      // Validar que clienteId esté presente y sea válido
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

      // Ubicación (Santa Fe)
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

      const response = await fetch('/api/busquedas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMostrarForm(false)
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
        await fetchBusquedas()
      } else {
        const errorData = await response.json().catch(() => null)
        alert(errorData?.error || 'Error al crear búsqueda')
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error de conexión: ${error.message || 'No se pudo conectar al servidor'}`)
    }
  }

  const getAgenteNombre = (busqueda: Busqueda): string => {
    return busqueda.usuario?.nombre || 
           busqueda.cliente.usuario?.nombre || 
           'Sin asignar'
  }

  const buildMensajeFromBusqueda = (b: Busqueda) => {
    const partes: string[] = []
    if (b.tipoPropiedad) partes.push(`Busco ${b.tipoPropiedad}`)
    if (b.ubicacionPreferida) partes.push(`en ${b.ubicacionPreferida}`)

    const moneda = (b as any).moneda || 'USD'
    const desdeMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/desde\s+(\d+)/i) : null
    const rangoMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/(\d+)\s*[-–]\s*(\d+)/) : null

    if (rangoMatch) {
      const d = parseInt(rangoMatch[1])
      const h = parseInt(rangoMatch[2])
      if (!isNaN(d) && !isNaN(h)) partes.push(`presupuesto entre ${moneda} ${d} y ${h}`)
    } else if (desdeMatch) {
      const d = parseInt(desdeMatch[1])
      if (!isNaN(d)) partes.push(`presupuesto desde ${moneda} ${d}`)
    } else if (typeof b.presupuestoTexto === 'string' && b.presupuestoTexto.trim()) {
      partes.push(`presupuesto hasta ${b.presupuestoTexto}`)
    }

    if (typeof b.dormitoriosMin === 'number' && b.dormitoriosMin > 0) {
      partes.push(`${b.dormitoriosMin} dormitorios mínimo`)
    }
    partes.push('Enviar opciones')
    return partes.join('. ') + '.'
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
    if (!analisisResultado?.clienteId) return
    const items = Array.from(seleccionadas).map((k) => {
      const [tipo, idx] = k.split(':')
      const i = parseInt(idx, 10)
      if (tipo === 'web' && analisisResultado?.data?.webMatches?.[i]) return { tipo: 'web', item: analisisResultado.data.webMatches[i] }
      if (tipo === 'match' && analisisResultado?.data?.matches?.[i]) return { tipo: 'match', item: analisisResultado.data.matches[i] }
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

  const analizarBusqueda = async (b: Busqueda) => {
    setAnalisisError(null)
    setAnalisisResultado(null)
    setAnalizandoId(b.id)
    try {
      const mensaje = buildMensajeFromBusqueda(b)
      const res = await fetch('/api/parsear-busqueda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, guardar: false, clienteId: null }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setAnalisisError(data?.error || 'Error al analizar')
        return
      }

      try {
        localStorage.setItem(
          'ultimaWebResult',
          JSON.stringify({
            savedAt: new Date().toISOString(),
            source: 'busquedas',
            busquedaId: b.id,
            clienteId: b.cliente?.id,
            clienteLabel: b.cliente?.nombreCompleto,
            data,
          })
        )
      } catch {
        // ignore
      }

      setAnalisisResultado({ busquedaId: b.id, clienteId: b.cliente?.id, clienteLabel: b.cliente?.nombreCompleto, data })
      setSeleccionadas(new Set())
      setLinkSeleccionado(null)
      setLinkExterno('')
      setLinkExternoTitulo('')
    } catch (e: any) {
      setAnalisisError(e?.message || 'Error de conexión')
    } finally {
      setAnalizandoId(null)
    }
  }

  // Asegurarse de que busquedas sea un array antes de filtrar
  const filtrados = Array.isArray(busquedas) ? busquedas.filter((b) => {
    // Validar que b tenga la estructura esperada
    if (!b || !b.cliente || !b.cliente.nombreCompleto) return false
    
    const matchTexto = b.cliente.nombreCompleto
      .toLowerCase()
      .includes(filtro.toLowerCase())
    const matchEstado =
      !filtroEstado || b.estado === filtroEstado
    const matchAgente = !filtroAgente || 
      b.usuario?.id === filtroAgente ||
      b.cliente.usuario?.id === filtroAgente
    return matchTexto && matchEstado && matchAgente
  }) : []

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Búsquedas</h1>
        <Button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Nueva Búsqueda
        </Button>
      </div>

      {mostrarForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Búsqueda</CardTitle>
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
                  <option value="CALIFICADA_CREDITO">Calificada (Crédito)</option>
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
                    Dormitorios Mínimo
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
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Guardar
                </Button>
                <Button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="Buscar por cliente..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
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
                    No hay búsquedas
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
                          onClick={() => analizarBusqueda(busqueda)}
                          className="h-8 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                          disabled={analizandoId === busqueda.id}
                        >
                          {analizandoId === busqueda.id ? 'Analizando...' : 'Analizar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/gestion?clienteId=${busqueda.cliente.id || ''}`}
                          className="h-8 px-3 border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                        >
                          Ir
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
            <CardTitle>Resultado del análisis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analisisError && (
              <div className="text-sm text-red-600">{analisisError}</div>
            )}
            {analisisResultado && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  Análisis completado.
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
                    Ir a Gestión del Cliente
                  </Button>
                  {(seleccionadas.size > 0 || linkSeleccionado) && (
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={guardarBusqueda}
                    >
                      Guardar búsqueda y pasar a Gestión del Cliente
                    </Button>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Link externo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Título del link..."
                      value={linkExternoTitulo}
                      onChange={(e) => setLinkExternoTitulo(e.target.value)}
                    />
                    <Input
                      placeholder="Pegá un link de afuera..."
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
                        ✅ Link seleccionado: {linkExternoTitulo || 'Sin título'} - {linkSeleccionado}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {Array.isArray(analisisResultado?.data?.scrapedItems) && analisisResultado.data.scrapedItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Oportunidades en Portales ({analisisResultado.data.scrapedItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-slate-600 mb-2">
                        (Para investigación, no es necesario seleccionar)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analisisResultado.data.scrapedItems.map((item: any, idx: number) => (
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
                              <div className="flex gap-2 mt-2">
                                {item?.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    Ver
                                  </a>
                                )}
                                <div className="text-xs text-slate-500">
                                  📍 {item?.url || '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {Array.isArray(analisisResultado?.data?.webMatches) && analisisResultado.data.webMatches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Links sugeridos ({analisisResultado.data.webMatches.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analisisResultado.data.webMatches.map((w: any, idx: number) => (
                          <div key={`${w?.url || idx}`} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm">
                            <input
                              type="checkbox"
                              checked={seleccionadas.has(`web:${idx}`)}
                              onChange={() => toggleSeleccion(`web:${idx}`)}
                              className="mt-1"
                            />
                            <div className="text-2xl">{w?.icon || '🌐'}</div>
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
                                  className="text-blue-600 hover:underline text-sm"
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
                      <CardTitle>Propiedades del CRM ({analisisResultado.data.matches.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-2">
                        {analisisResultado.data.matches.map((m: any, idx: number) => (
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
                          </div>
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
