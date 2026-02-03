'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Cliente {
  id: string
  nombreCompleto: string
}

interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  fechaVencimiento?: string
  estado: string
  prioridad: string
  tipo: string
  cliente?: { nombreCompleto: string }
  propiedad?: { titulo: string; direccion: string; zona: string }
  createdAt: string
}

const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA']
const TIPOS_TAREA = ['GENERAL', 'VISITA', 'LLAMADA']

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>('PENDIENTE')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroRango, setFiltroRango] = useState<string>('semana')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // WhatsApp Parsing State
  const [wsInput, setWsInput] = useState('')
  const [parsingWs, setParsingWs] = useState(false)

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaVencimiento: '',
    prioridad: 'MEDIA',
    tipo: 'GENERAL',
    clienteId: '',
    propiedadId: '',
  })

  useEffect(() => {
    fetchTareas()
    fetchClientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroTipo, filtroRango])

  const fetchTareas = async () => {
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.append('estado', filtroEstado)
      if (filtroTipo) params.append('tipo', filtroTipo)
      if (filtroRango) params.append('rango', filtroRango)
      
      const url = `/api/tareas?${params.toString()}`
      const response = await fetch(url)
      const data = await response.json()
      setTareas(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fechaVencimiento: '',
      prioridad: 'MEDIA',
      tipo: 'GENERAL',
      clienteId: '',
      propiedadId: '',
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        clienteId: formData.clienteId || null,
        fechaVencimiento: formData.fechaVencimiento || null,
      }

      const url = editingId ? `/api/tareas/${editingId}` : '/api/tareas'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        resetForm()
        setMostrarForm(false)
        fetchTareas()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleToggleEstado = async (tarea: Tarea) => {
    try {
      const nuevoEstado = tarea.estado === 'PENDIENTE' ? 'HECHA' : 'PENDIENTE'
      await fetch(`/api/tareas/${tarea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      fetchTareas()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (tarea: Tarea) => {
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      fechaVencimiento: tarea.fechaVencimiento 
        ? new Date(tarea.fechaVencimiento).toISOString().split('T')[0] 
        : '',
      prioridad: tarea.prioridad,
      clienteId: '',
    })
    setEditingId(tarea.id)
    setMostrarForm(true)
  }

  const handleShareWhatsApp = (tarea: Tarea) => {
    const fecha = tarea.fechaVencimiento 
      ? new Date(tarea.fechaVencimiento).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
      : 'Sin fecha'
    
    const text = `📌 *RECORDATORIO DE AGENDA*\n\n` +
                 `🔹 *Tarea:* ${tarea.titulo}\n` +
                 `📅 *Fecha:* ${fecha}\n` +
                 (tarea.descripcion ? `📝 *Notas:* ${tarea.descripcion}\n` : '') +
                 (tarea.propiedad ? `🏠 *Propiedad:* ${tarea.propiedad.titulo || tarea.propiedad.direccion}\n` : '') +
                 (tarea.cliente ? `👤 *Cliente:* ${tarea.cliente.nombreCompleto}\n` : '') +
                 `\n_Enviado desde CRM Inmobiliario_`
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleParseWhatsApp = async () => {
    if (!wsInput.trim()) return
    setParsingWs(true)

    try {
      const msg = wsInput.toLowerCase()
      
      // Heurística de detección simple
      let tipo = 'GENERAL'
      if (msg.includes('visita') || msg.includes('ver')) tipo = 'VISITA'
      if (msg.includes('llamar') || msg.includes('hablar') || msg.includes('telefono')) tipo = 'LLAMADA'

      let titulo = wsInput.length > 50 ? wsInput.substring(0, 47) + '...' : wsInput
      
      // Detectar fecha relativa/absoluta simple
      const hoy = new Date()
      let fechaDetectada = new Date()

      if (msg.includes('mañana')) {
        fechaDetectada.setDate(hoy.getDate() + 1)
      } else if (msg.includes('pasado mañana')) {
        fechaDetectada.setDate(hoy.getDate() + 2)
      } else if (msg.includes('lunes')) {
        fechaDetectada.setDate(hoy.getDate() + (1 + 7 - hoy.getDay()) % 7 || 7)
      } else if (msg.includes('martes')) {
        fechaDetectada.setDate(hoy.getDate() + (2 + 7 - hoy.getDay()) % 7 || 7)
      } else if (msg.includes('miercoles') || msg.includes('miércoles')) {
        fechaDetectada.setDate(hoy.getDate() + (3 + 7 - hoy.getDay()) % 7 || 7)
      }

      setFormData({
        ...formData,
        titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
        tipo,
        descripcion: wsInput,
        fechaVencimiento: fechaDetectada.toISOString().split('T')[0]
      })
      
      setMostrarForm(true)
      setWsInput('')
      alert('Detectamos una posible ' + tipo + '. Por favor revisá los datos antes de guardar.')
    } catch (e) {
      console.error(e)
    } finally {
      setParsingWs(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    try {
      await fetch(`/api/tareas/${id}`, { method: 'DELETE' })
      fetchTareas()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'ALTA': return 'bg-red-100 text-red-700'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-700'
      case 'BAJA': return 'bg-green-100 text-green-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const isVencida = (fecha?: string) => {
    if (!fecha) return false
    return new Date(fecha) < new Date()
  }

  const pendientes = tareas.filter(t => t.estado === 'PENDIENTE')
  const hechas = tareas.filter(t => t.estado === 'HECHA')

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📅 Agenda Semanal</h1>
          <p className="text-slate-500 text-sm">Organiza tus visitas y seguimientos de la semana</p>
        </div>
        <Button
          onClick={() => { resetForm(); setMostrarForm(!mostrarForm) }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {mostrarForm ? 'Cerrar' : '+ Nueva Actividad'}
        </Button>
      </div>

      {/* Agendar con WhatsApp (Nuevo) */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-green-700">
            🟢 Agendar rápido desde WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <textarea
              className="flex-1 p-3 border rounded-md text-sm min-h-[60px]"
              placeholder="Pegá aquí el mensaje de WhatsApp. Ej: 'Visita con Maria el lunes por depto Candioti'"
              value={wsInput}
              onChange={(e) => setWsInput(e.target.value)}
            />
            <Button 
              onClick={handleParseWhatsApp} 
              disabled={parsingWs || !wsInput}
              className="bg-green-600 hover:bg-green-700 h-auto"
            >
              {parsingWs ? 'Procesando...' : 'Agendar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{hechas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Alta Prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {pendientes.filter(t => t.prioridad === 'ALTA').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Tarea' : 'Nueva Tarea'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Llamar a cliente por visita"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
                  <Input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    {TIPOS_TAREA.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente (opcional)</label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="">Sin cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombreCompleto}</option>)}
                  </select>
                </div>
              </div>

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
      <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-lg border">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Tiempo</label>
          <div className="flex gap-2">
            <Button
              variant={filtroRango === '' ? 'default' : 'outline'}
              onClick={() => setFiltroRango('')}
              size="sm"
            >
              Histórico
            </Button>
            <Button
              variant={filtroRango === 'hoy' ? 'default' : 'outline'}
              onClick={() => setFiltroRango('hoy')}
              size="sm"
            >
              Hoy
            </Button>
            <Button
              variant={filtroRango === 'semana' ? 'default' : 'outline'}
              onClick={() => setFiltroRango('semana')}
              size="sm"
            >
              Esta Semana
            </Button>
            <Button
              variant={filtroRango === 'vencidas' ? 'default' : 'outline'}
              onClick={() => setFiltroRango('vencidas')}
              size="sm"
            >
              Vencidas
            </Button>
          </div>
        </div>

        <div className="space-y-2 border-l pl-4">
          <label className="text-xs font-semibold text-slate-500 uppercase">Estado</label>
          <div className="flex gap-2">
            <Button
              variant={filtroEstado === '' ? 'default' : 'outline'}
              onClick={() => setFiltroEstado('')}
              size="sm"
            >
              Todas
            </Button>
            <Button
              variant={filtroEstado === 'PENDIENTE' ? 'default' : 'outline'}
              onClick={() => setFiltroEstado('PENDIENTE')}
              size="sm"
            >
              Pendientes
            </Button>
            <Button
              variant={filtroEstado === 'HECHA' ? 'default' : 'outline'}
              onClick={() => setFiltroEstado('HECHA')}
              size="sm"
            >
              Completadas
            </Button>
          </div>
        </div>

        <div className="space-y-2 border-l pl-4">
          <label className="text-xs font-semibold text-slate-500 uppercase">Tipo</label>
          <div className="flex gap-2">
            <Button
              variant={filtroTipo === '' ? 'default' : 'outline'}
              onClick={() => setFiltroTipo('')}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={filtroTipo === 'VISITA' ? 'default' : 'outline'}
              onClick={() => setFiltroTipo('VISITA')}
              size="sm"
            >
              Visitas
            </Button>
            <Button
              variant={filtroTipo === 'LLAMADA' ? 'default' : 'outline'}
              onClick={() => setFiltroTipo('LLAMADA')}
              size="sm"
            >
              Llamadas
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-3">
        {tareas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No hay tareas. ¡Crea una nueva!
            </CardContent>
          </Card>
        ) : (
          tareas.map((tarea) => (
            <Card key={tarea.id} className={tarea.estado === 'HECHA' ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleEstado(tarea)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      tarea.estado === 'HECHA' 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : 'border-slate-300 hover:border-green-500'
                    }`}
                  >
                    {tarea.estado === 'HECHA' && '✓'}
                  </button>

                  {/* Contenido */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${tarea.estado === 'HECHA' ? 'line-through text-slate-500' : ''}`}>
                        {tarea.titulo}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${tarea.tipo === 'VISITA' ? 'bg-purple-100 text-purple-700' : (tarea.tipo === 'LLAMADA' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')}`}>
                        {tarea.tipo}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getPrioridadColor(tarea.prioridad)}`}>
                        {tarea.prioridad}
                      </span>
                    </div>
                    
                    {tarea.descripcion && (
                      <p className="text-sm text-slate-600 mt-1">{tarea.descripcion}</p>
                    )}

                    {tarea.propiedad && (
                      <div className="mt-2 p-2 bg-slate-50 border rounded-md text-sm flex items-center gap-2">
                        <span className="text-slate-400">🏠 Propiedad:</span>
                        <span className="font-medium text-slate-700">{tarea.propiedad.titulo || tarea.propiedad.direccion}</span>
                        {tarea.propiedad.zona && <span className="text-slate-400">({tarea.propiedad.zona})</span>}
                      </div>
                    )}
                    
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      {tarea.fechaVencimiento && (
                        <span className={isVencida(tarea.fechaVencimiento) && tarea.estado !== 'HECHA' ? 'text-red-600 font-medium' : ''}>
                          📅 {new Date(tarea.fechaVencimiento).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                          {isVencida(tarea.fechaVencimiento) && tarea.estado !== 'HECHA' && ' (VENCIDA)'}
                        </span>
                      )}
                      {tarea.cliente && (
                        <span>👤 {tarea.cliente.nombreCompleto}</span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button                      onClick={() => handleShareWhatsApp(tarea)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Compartir por WhatsApp"
                    >
                      📱
                    </button>
                    <button                      onClick={() => handleEdit(tarea)}
                      className="text-amber-600 hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(tarea.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
