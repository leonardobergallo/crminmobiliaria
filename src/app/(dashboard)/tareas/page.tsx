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
  cliente?: { nombreCompleto: string }
  createdAt: string
}

const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA']

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaVencimiento: '',
    prioridad: 'MEDIA',
    clienteId: '',
  })

  useEffect(() => {
    fetchTareas()
    fetchClientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado])

  const fetchTareas = async () => {
    try {
      const url = filtroEstado ? `/api/tareas?estado=${filtroEstado}` : '/api/tareas'
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
      clienteId: '',
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
        <h1 className="text-3xl font-bold text-slate-900">📋 Tareas</h1>
        <Button
          onClick={() => { resetForm(); setMostrarForm(!mostrarForm) }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Nueva Tarea
        </Button>
      </div>

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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
                  <Input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  />
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
      <div className="flex gap-4">
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
                      <span className={`px-2 py-0.5 rounded text-xs ${getPrioridadColor(tarea.prioridad)}`}>
                        {tarea.prioridad}
                      </span>
                    </div>
                    
                    {tarea.descripcion && (
                      <p className="text-sm text-slate-600 mt-1">{tarea.descripcion}</p>
                    )}
                    
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      {tarea.fechaVencimiento && (
                        <span className={isVencida(tarea.fechaVencimiento) && tarea.estado !== 'HECHA' ? 'text-red-600 font-medium' : ''}>
                          📅 {new Date(tarea.fechaVencimiento).toLocaleDateString('es-AR')}
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
                    <button
                      onClick={() => handleEdit(tarea)}
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
