'use client'

import { useEffect, useState } from 'react'
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

interface Cliente {
  id: string
  nombreCompleto: string
  telefono?: string
  email?: string
  notas?: string
  busquedas?: any[]
  operaciones?: any[]
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detalleCliente, setDetalleCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    email: '',
    notas: '',
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      console.error('Error fetching clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/clientes/${editingId}` : '/api/clientes'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        resetForm()
        setMostrarForm(false)
        fetchClientes()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setFormData({ nombreCompleto: '', telefono: '', email: '', notas: '' })
    setEditingId(null)
  }

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      nombreCompleto: cliente.nombreCompleto,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      notas: cliente.notas || '',
    })
    setEditingId(cliente.id)
    setMostrarForm(true)
    setDetalleCliente(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente? Se eliminarán también sus búsquedas.')) return
    try {
      const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchClientes()
        setDetalleCliente(null)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleVerDetalle = async (cliente: Cliente) => {
    try {
      const response = await fetch(`/api/clientes/${cliente.id}`)
      const data = await response.json()
      setDetalleCliente(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filtrados = clientes.filter((c) =>
    c.nombreCompleto.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
        <Button
          onClick={() => { resetForm(); setMostrarForm(!mostrarForm); setDetalleCliente(null) }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Nuevo Cliente
        </Button>
      </div>

      {/* Detalle de Cliente */}
      {detalleCliente && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{detalleCliente.nombreCompleto}</CardTitle>
                <div className="text-sm text-slate-600 mt-1">
                  {detalleCliente.telefono && <span className="mr-4">📞 {detalleCliente.telefono}</span>}
                  {detalleCliente.email && <span>✉️ {detalleCliente.email}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(detalleCliente)}>
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDetalleCliente(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {detalleCliente.notas && (
              <p className="text-sm text-slate-700 mb-4">📝 {detalleCliente.notas}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">🔍 Búsquedas ({detalleCliente.busquedas?.length || 0})</h4>
                {detalleCliente.busquedas?.length ? (
                  <ul className="text-sm space-y-1">
                    {detalleCliente.busquedas.slice(0, 5).map((b: any) => (
                      <li key={b.id} className="flex justify-between">
                        <span>{b.tipoPropiedad || 'Propiedad'}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded">{b.estado}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-500">Sin búsquedas</p>}
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">💰 Operaciones ({detalleCliente.operaciones?.length || 0})</h4>
                {detalleCliente.operaciones?.length ? (
                  <ul className="text-sm space-y-1">
                    {detalleCliente.operaciones.slice(0, 5).map((o: any) => (
                      <li key={o.id}>{o.descripcion}</li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-500">Sin operaciones</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {mostrarForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <Input
                  value={formData.nombreCompleto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nombreCompleto: e.target.value,
                    })
                  }
                  placeholder="Ej: CRISTIAN"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    placeholder="11 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="correo@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notas
                </label>
                <Input
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button
                  type="button"
                  onClick={() => { resetForm(); setMostrarForm(false) }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Buscador */}
      <div>
        <Input
          type="text"
          placeholder="Buscar cliente..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No hay clientes
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.nombreCompleto}
                    </TableCell>
                    <TableCell>{cliente.telefono || '-'}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerDetalle(cliente)}
                          className="h-8 px-3 border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cliente)}
                          className="h-8 px-3 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(cliente.id)}
                          className="h-8 px-3 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                        >
                          Eliminar
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
    </div>
  )
}
