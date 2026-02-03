'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AgendaModal from '@/components/AgendaModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Propiedad {
  id: string
  titulo?: string
  tipo: string
  ubicacion: string
  zona?: string
  localidad?: string
  direccion?: string
  precio?: number
  moneda?: string
  descripcion?: string
  dormitorios?: number
  ambientes?: number
  banos?: number
  superficie?: number
  whatsapp?: string
  urlMls?: string
  aptaCredito: boolean
  estado?: string
  usuarioId?: string
  usuario?: { id: string; nombre: string } | null
  createdAt: string
}

interface CurrentUser {
  id: string
  nombre: string
  rol: string
}

const TIPOS_PROPIEDAD = ['DEPARTAMENTO', 'CASA', 'TERRENO', 'LOCAL', 'OFICINA', 'OTRO']
const ESTADOS_PROPIEDAD = ['BORRADOR', 'EN_ANALISIS', 'APROBADA', 'DESCARTADA']

export default function PropiedadesPage() {
  const router = useRouter()
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [soloAptaCredito, setSoloAptaCredito] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  
  // States for Agenda
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [selectedPropiedad, setSelectedPropiedad] = useState<Propiedad | undefined>(undefined)

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'DEPARTAMENTO',
    ubicacion: '',
    zona: '',
    localidad: '',
    direccion: '',
    precio: '',
    moneda: 'USD',
    descripcion: '',
    dormitorios: '',
    ambientes: '',
    banos: '',
    superficie: '',
    whatsapp: '',
    urlMls: '',
    aptaCredito: false,
    estado: 'BORRADOR',
  })

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchPropiedades()
    }
  }, [soloAptaCredito, filtroEstado, currentUser])

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

  const fetchPropiedades = async () => {
    if (!currentUser) return

    try {
      const params = new URLSearchParams()
      if (soloAptaCredito) params.append('aptaCredito', 'true')
      if (filtroEstado) params.append('estado', filtroEstado)
      
      const url = `/api/propiedades?${params.toString()}`
      const response = await fetch(url)
      const data = await response.json()
      setPropiedades(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'DEPARTAMENTO',
      ubicacion: '',
      zona: '',
      localidad: '',
      direccion: '',
      precio: '',
      moneda: 'USD',
      descripcion: '',
      dormitorios: '',
      ambientes: '',
      banos: '',
      superficie: '',
      whatsapp: '',
      urlMls: '',
      aptaCredito: false,
      estado: 'BORRADOR',
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        precio: formData.precio ? parseInt(formData.precio) : null,
        dormitorios: formData.dormitorios ? parseInt(formData.dormitorios) : null,
        ambientes: formData.ambientes ? parseInt(formData.ambientes) : null,
        banos: formData.banos ? parseInt(formData.banos) : null,
        superficie: formData.superficie ? parseInt(formData.superficie) : null,
      }

      const url = editingId ? `/api/propiedades/${editingId}` : '/api/propiedades'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        resetForm()
        setMostrarForm(false)
        fetchPropiedades()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (prop: Propiedad) => {
    // Verificar permisos: agente solo puede editar propiedades en BORRADOR
    if (currentUser?.rol === 'agente' && prop.estado && prop.estado !== 'BORRADOR') {
      alert('Solo puedes editar propiedades en estado BORRADOR')
      return
    }

    // Verificar que es el dueño (si es agente)
    if (currentUser?.rol === 'agente' && prop.usuarioId !== currentUser.id) {
      alert('No tienes permiso para editar esta propiedad')
      return
    }

    setFormData({
      titulo: prop.titulo || '',
      tipo: prop.tipo,
      ubicacion: prop.ubicacion,
      zona: prop.zona || '',
      localidad: prop.localidad || '',
      direccion: prop.direccion || '',
      precio: prop.precio?.toString() || '',
      moneda: prop.moneda || 'USD',
      descripcion: prop.descripcion || '',
      dormitorios: prop.dormitorios?.toString() || '',
      ambientes: prop.ambientes?.toString() || '',
      banos: prop.banos?.toString() || '',
      superficie: prop.superficie?.toString() || '',
      whatsapp: prop.whatsapp || '',
      urlMls: prop.urlMls || '',
      aptaCredito: prop.aptaCredito,
      estado: prop.estado || 'BORRADOR',
    })
    setEditingId(prop.id)
    setMostrarForm(true)
  }

  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case 'BORRADOR':
        return 'bg-slate-200 text-slate-700'
      case 'EN_ANALISIS':
        return 'bg-yellow-200 text-yellow-800'
      case 'APROBADA':
        return 'bg-green-200 text-green-800'
      case 'DESCARTADA':
        return 'bg-red-200 text-red-800'
      default:
        return 'bg-slate-200 text-slate-700'
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return
    try {
      const response = await fetch(`/api/propiedades/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchPropiedades()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filtrados = propiedades.filter((p) =>
    p.ubicacion.toLowerCase().includes(filtro.toLowerCase()) ||
    (p.zona?.toLowerCase().includes(filtro.toLowerCase())) ||
    (p.titulo?.toLowerCase().includes(filtro.toLowerCase()))
  )

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Propiedades</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => window.open('/api/export-properties', '_blank')}
            variant="outline"
          >
            📥 Exportar Excel
          </Button>
          <Button
            onClick={() => { resetForm(); setMostrarForm(!mostrarForm) }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Nueva Propiedad
          </Button>
        </div>
      </div>

      {/* Formulario Crear/Editar */}
      {mostrarForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Propiedad' : 'Nueva Propiedad'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Depto 2 amb en Palermo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    required
                  >
                    {TIPOS_PROPIEDAD.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación *</label>
                  <Input
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Ej: Av. Santa Fe 1234"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zona/Barrio</label>
                  <Input
                    value={formData.zona}
                    onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                    placeholder="Ej: Palermo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Localidad</label>
                  <Input
                    value={formData.localidad}
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                    placeholder="Ej: CABA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
                  <Input
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dormitorios</label>
                  <Input
                    type="number"
                    value={formData.dormitorios}
                    onChange={(e) => setFormData({ ...formData, dormitorios: e.target.value })}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ambientes</label>
                  <Input
                    type="number"
                    value={formData.ambientes}
                    onChange={(e) => setFormData({ ...formData, ambientes: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Baños</label>
                  <Input
                    type="number"
                    value={formData.banos}
                    onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Superficie (m²)</label>
                  <Input
                    type="number"
                    value={formData.superficie}
                    onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="5491112345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL MLS</label>
                  <Input
                    value={formData.urlMls}
                    onChange={(e) => setFormData({ ...formData, urlMls: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción de la propiedad..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.aptaCredito}
                    onChange={(e) => setFormData({ ...formData, aptaCredito: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">Apta Crédito Hipotecario</span>
                </label>
              </div>

              {currentUser?.rol === 'admin' && editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={formData.estado || 'BORRADOR'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    {ESTADOS_PROPIEDAD.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" onClick={() => { resetForm(); setMostrarForm(false) }} variant="outline">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Buscar por ubicación, zona o título..."
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
          {ESTADOS_PROPIEDAD.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={soloAptaCredito}
            onChange={(e) => setSoloAptaCredito(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700">Solo Apta a Crédito</span>
        </label>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-slate-600">
        <span>Total: <strong>{propiedades.length}</strong></span>
        <span>Apta Crédito: <strong>{propiedades.filter(p => p.aptaCredito).length}</strong></span>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propiedad</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Amb/Dorm</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Apta Crédito</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No hay propiedades
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((propiedad) => (
                  <TableRow key={propiedad.id}>
                    <TableCell>
                      <div className="font-medium">{propiedad.titulo || propiedad.ubicacion}</div>
                      {propiedad.titulo && <div className="text-sm text-slate-500">{propiedad.ubicacion}</div>}
                    </TableCell>
                    <TableCell>{propiedad.zona || propiedad.localidad || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">{propiedad.tipo}</span>
                    </TableCell>
                    <TableCell>
                      {propiedad.precio 
                        ? `${propiedad.moneda || 'USD'} ${propiedad.precio.toLocaleString()}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {propiedad.ambientes || '-'} amb / {propiedad.dormitorios || '-'} dorm
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(propiedad.estado)}`}>
                        {propiedad.estado || 'BORRADOR'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {propiedad.aptaCredito ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {propiedad.urlMls && (
                          <a
                            href={propiedad.urlMls}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            MLS
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPropiedad(propiedad)
                            setAgendaOpen(true)
                          }}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Agendar
                        </button>
                        <button
                          onClick={() => handleEdit(propiedad)}
                          className="text-amber-600 hover:underline text-sm"
                          disabled={currentUser?.rol === 'agente' && propiedad.estado !== 'BORRADOR' && propiedad.estado !== undefined}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(propiedad.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Agenda */}
      <AgendaModal
        isOpen={agendaOpen}
        onClose={() => setAgendaOpen(false)}
        propiedad={selectedPropiedad}
        onSuccess={() => {
          alert('Visita agendada con éxito')
        }}
      />
    </div>
  )
}
