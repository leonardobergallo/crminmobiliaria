'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Operacion {
  id: string
  nro: number | null
  descripcion: string
  direccion: string | null
  precioVenta: number | null
  tipoPunta: 'UNA' | 'DOS'
  porcentajeComision: number | null
  comisionBruta: number | null
  porcentajeAgente: number | null
  comisionAgente: number | null
  estado: 'PENDIENTE' | 'COBRADA' | 'CANCELADA'
  fechaOperacion: string
  fechaCobro: string | null
  observaciones: string | null
  clienteId?: string | null
  cliente: { id?: string; nombreCompleto: string } | null
  usuario: { nombre: string } | null
}

interface CurrentUser {
  id: string
  nombre: string
  rol: string
  inmobiliariaId: string | null
}


interface FormState {
  descripcion: string
  direccion: string
  precioVenta: string
  tipoPunta: 'UNA' | 'DOS'
  clienteId: string
  observaciones: string
  estado: 'PENDIENTE' | 'COBRADA' | 'CANCELADA'
}

const INITIAL_FORM: FormState = {
  descripcion: '',
  direccion: '',
  precioVenta: '',
  tipoPunta: 'UNA',
  clienteId: '',
  observaciones: '',
  estado: 'PENDIENTE',
}

export default function OperacionesPage() {
  const router = useRouter()
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM)

  const isCarliEsquivel = String(currentUser?.nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes('carli')

  const precioVenta = parseFloat(formData.precioVenta) || 0
  const porcentajeComision = formData.tipoPunta === 'DOS' ? 6 : 3
  const comisionBruta = precioVenta * (porcentajeComision / 100)
  const porcentajeAgenteBruto = isCarliEsquivel ? 45 : 50
  const porcentajeAgente = isCarliEsquivel
    ? Number((porcentajeAgenteBruto * 0.8).toFixed(2))
    : porcentajeAgenteBruto
  const porcentajeAyudante = isCarliEsquivel
    ? Number((porcentajeAgenteBruto * 0.2).toFixed(2))
    : 0
  const porcentajeInmobiliaria = isCarliEsquivel ? 55 : 50
  const comisionAgente = comisionBruta * (porcentajeAgente / 100)
  const comisionAyudantePreview = isCarliEsquivel
    ? comisionBruta * (porcentajeAyudante / 100)
    : 0
  const comisionInmobiliariaPreview = comisionBruta * (porcentajeInmobiliaria / 100)

  const totalComisionesBrutas = useMemo(
    () => operaciones.reduce((sum, op) => sum + (op.comisionBruta || 0), 0),
    [operaciones]
  )

  const totalComisionesAgente = useMemo(
    () => operaciones.reduce((sum, op) => sum + (op.comisionAgente || 0), 0),
    [operaciones]
  )

  const operacionesPendientes = useMemo(
    () => operaciones.filter((op) => op.estado === 'PENDIENTE').length,
    [operaciones]
  )

  const totalAyudante = useMemo(() => {
    if (!isCarliEsquivel) return 0
    return operaciones.reduce((sum, op) => {
      const bruta = Number(op.comisionBruta || 0)
      return sum + bruta * 0.09
    }, 0)
  }, [operaciones, isCarliEsquivel])

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (!currentUser) return

    fetchOperaciones()
    fetchClientes()
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setCurrentUser(data.user)
    } catch {
      router.push('/login')
    }
  }

  const fetchOperaciones = async () => {
    try {
      const response = await fetch('/api/operaciones')
      if (response.ok) {
        const data = await response.json()
        setOperaciones(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error operaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const data = await response.json()
        setClientes(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error clientes:', error)
    }
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const startCreate = () => {
    setEditingId(null)
    setFormData(INITIAL_FORM)
    setShowForm(true)
  }

  const startEdit = (op: Operacion) => {
    setEditingId(op.id)
    setFormData({
      descripcion: op.descripcion || '',
      direccion: op.direccion || '',
      precioVenta: String(op.precioVenta || ''),
      tipoPunta: op.tipoPunta === 'DOS' ? 'DOS' : 'UNA',
      clienteId: op.clienteId || '',
      observaciones: op.observaciones || '',
      estado: op.estado || 'PENDIENTE',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        precioVenta: parseFloat(formData.precioVenta) || 0,
        porcentajeComision,
        comisionBruta,
        porcentajeAgente,
        comisionAgente,
      }

      const isEdit = Boolean(editingId)
      const url = isEdit ? `/api/operaciones/${editingId}` : '/api/operaciones'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err?.error || 'No se pudo guardar la operacion')
        return
      }

      await fetchOperaciones()
      resetForm()
    } catch (error) {
      console.error('Error guardando operacion:', error)
      alert('Error al guardar operacion')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = confirm('Eliminar esta operacion? Esta accion no se puede deshacer.')
    if (!ok) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/operaciones/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        alert(err?.error || 'No se pudo eliminar la operacion')
        return
      }

      await fetchOperaciones()
    } catch (error) {
      console.error('Error eliminando operacion:', error)
      alert('Error al eliminar operacion')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Comisiones</h1>
          <p className="text-slate-500 mt-1">Sistema de puntas argentino</p>
        </div>
        <Button onClick={showForm ? resetForm : startCreate}>
          {showForm ? 'Cancelar' : '+ Nueva Operacion'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-sky-200 bg-sky-50/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Editar Operacion' : 'Registrar Nueva Operacion'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripcion
                  </label>
                  <Input
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Ej: Venta depto 2 amb"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Direccion
                  </label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Ej: Av. Rivadavia 1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cliente
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Sin cliente asociado</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Precio de Venta (USD)
                  </label>
                  <Input
                    type="number"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    placeholder="100000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Operacion
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label
                      className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.tipoPunta === 'UNA'
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoPunta"
                        value="UNA"
                        checked={formData.tipoPunta === 'UNA'}
                        onChange={(e) =>
                          setFormData({ ...formData, tipoPunta: e.target.value as 'UNA' | 'DOS' })
                        }
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">1 Punta</div>
                        <div className="text-sm text-slate-500">3% comision</div>
                      </div>
                    </label>

                    <label
                      className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.tipoPunta === 'DOS'
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoPunta"
                        value="DOS"
                        checked={formData.tipoPunta === 'DOS'}
                        onChange={(e) =>
                          setFormData({ ...formData, tipoPunta: e.target.value as 'UNA' | 'DOS' })
                        }
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">2 Puntas</div>
                        <div className="text-sm text-slate-500">6% comision</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado: e.target.value as 'PENDIENTE' | 'COBRADA' | 'CANCELADA',
                      })
                    }
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="COBRADA">COBRADA</option>
                    <option value="CANCELADA">CANCELADA</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Observaciones
                  </label>
                  <Input
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas adicionales"
                  />
                </div>
              </div>

              {precioVenta > 0 && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3">Calculo de Comisiones</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-sm text-slate-500">Precio Venta</div>
                      <div className="text-xl font-bold text-slate-900">${precioVenta.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Comision ({porcentajeComision}%)</div>
                      <div className="text-xl font-bold text-blue-600">${comisionBruta.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Tu parte neta ({porcentajeAgente}%)</div>
                      <div className="text-xl font-bold text-green-600">${comisionAgente.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">
                        Inmobiliaria ({porcentajeInmobiliaria.toFixed(2)}%)
                      </div>
                      <div className="text-xl font-bold text-slate-600">
                        ${comisionInmobiliariaPreview.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {isCarliEsquivel && (
                    <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                      Ayudante Carli: {porcentajeAyudante.toFixed(2)}% de la comision
                      (${comisionAyudantePreview.toLocaleString()}) = 20% sobre el 45% del agente.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? 'Actualizar Operacion' : 'Guardar Operacion'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Operaciones</p>
                <p className="text-2xl font-bold text-slate-900">{operaciones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Comisiones</p>
                <p className="text-2xl font-bold text-green-600">${totalComisionesBrutas.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tu Ganancia</p>
                <p className="text-2xl font-bold text-purple-600">${totalComisionesAgente.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{operacionesPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isCarliEsquivel && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ayudante (20%)</p>
                  <p className="text-2xl font-bold text-amber-700">${totalAyudante.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Operaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Puntas</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Comision</TableHead>
                <TableHead className="text-right">Tu parte</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No hay operaciones registradas</p>
                      <Button variant="outline" size="sm" onClick={startCreate}>
                        Registrar primera operacion
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                operaciones.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-semibold">{op.nro || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{op.descripcion}</div>
                        {op.direccion && <div className="text-sm text-slate-500">{op.direccion}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{op.cliente?.nombreCompleto || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          op.tipoPunta === 'DOS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {op.tipoPunta === 'DOS' ? '2 Puntas' : '1 Punta'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">${op.precioVenta?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-right text-blue-600">${op.comisionBruta?.toLocaleString() || '0'}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ${op.comisionAgente?.toLocaleString() || '0'}
                      {isCarliEsquivel && (
                        <div className="text-[11px] font-normal text-amber-700">
                          Ayudante (9%): ${(Number(op.comisionBruta || 0) * 0.09).toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          op.estado === 'COBRADA'
                            ? 'bg-green-100 text-green-700'
                            : op.estado === 'CANCELADA'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {op.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(op)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(op.id)}
                        disabled={deletingId === op.id}
                      >
                        {deletingId === op.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
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



