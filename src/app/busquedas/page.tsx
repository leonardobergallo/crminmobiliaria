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

interface Busqueda {
  id: string
  cliente: { nombreCompleto: string }
  origen: string
  presupuestoTexto: string
  tipoPropiedad: string
  estado: string
  createdAt: string
}

export default function BusquedasPage() {
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  const [formData, setFormData] = useState({
    clienteId: '',
    origen: 'ACTIVA',
    presupuestoTexto: '',
    tipoPropiedad: '',
    ubicacionPreferida: '',
    dormitoriosMin: '',
    observaciones: '',
  })

  const [clientes, setClientes] = useState<any[]>([])

  useEffect(() => {
    Promise.all([fetchBusquedas(), fetchClientes()])
  }, [])

  const fetchBusquedas = async () => {
    try {
      const response = await fetch('/api/busquedas')
      const data = await response.json()
      setBusquedas(data)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/busquedas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dormitoriosMin: formData.dormitoriosMin
            ? parseInt(formData.dormitoriosMin)
            : null,
        }),
      })

      if (response.ok) {
        setMostrarForm(false)
        setFormData({
          clienteId: '',
          origen: 'ACTIVA',
          presupuestoTexto: '',
          tipoPropiedad: '',
          ubicacionPreferida: '',
          dormitoriosMin: '',
          observaciones: '',
        })
        fetchBusquedas()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filtrados = busquedas.filter((b) => {
    const matchTexto = b.cliente.nombreCompleto
      .toLowerCase()
      .includes(filtro.toLowerCase())
    const matchEstado =
      !filtroEstado || b.estado === filtroEstado
    return matchTexto && matchEstado
  })

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
                      {c.nombreCompleto}
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
                  <Input
                    value={formData.presupuestoTexto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        presupuestoTexto: e.target.value,
                      })
                    }
                    placeholder="Ej: 75 MIL DOLARES"
                  />
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
                    Ubicación Preferida
                  </label>
                  <Input
                    value={formData.ubicacionPreferida}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ubicacionPreferida: e.target.value,
                      })
                    }
                    placeholder="Zona/Barrio"
                  />
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
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No hay búsquedas
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((busqueda) => (
                  <TableRow key={busqueda.id}>
                    <TableCell className="font-medium">
                      {busqueda.cliente.nombreCompleto}
                    </TableCell>
                    <TableCell>{busqueda.presupuestoTexto || '-'}</TableCell>
                    <TableCell>{busqueda.tipoPropiedad || '-'}</TableCell>
                    <TableCell className="text-sm">{busqueda.origen}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200">
                        {busqueda.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="text-blue-600 hover:underline">Ver</button>
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
