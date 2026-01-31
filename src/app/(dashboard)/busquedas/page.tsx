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

export default function BusquedasPage() {
  const router = useRouter()
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroAgente, setFiltroAgente] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [selectedBusqueda, setSelectedBusqueda] = useState<Busqueda | null>(null)
  const [usuarios, setUsuarios] = useState<any[]>([])

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

      // Campos opcionales - solo agregar si tienen valor
      if (formData.presupuestoTexto && formData.presupuestoTexto.trim() !== '') {
        payload.presupuestoTexto = formData.presupuestoTexto.trim()
      }

      if (formData.tipoPropiedad && formData.tipoPropiedad.trim() !== '') {
        payload.tipoPropiedad = formData.tipoPropiedad.trim()
      }

      if (formData.ubicacionPreferida && formData.ubicacionPreferida.trim() !== '') {
        payload.ubicacionPreferida = formData.ubicacionPreferida.trim()
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

      console.log('Enviando payload a /api/busquedas:', JSON.stringify(payload, null, 2))

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
          presupuestoTexto: '',
          tipoPropiedad: '',
          ubicacionPreferida: '',
          dormitoriosMin: '',
          observaciones: '',
        })
        fetchBusquedas()
        alert('Búsqueda creada correctamente')
      } else {
        // Obtener el mensaje de error del servidor
        let errorMessage = 'Error desconocido'
        let errorDetails: any = null
        
        try {
          const text = await response.text()
          console.error('Error al crear búsqueda - Respuesta raw:', text)
          console.error('Error al crear búsqueda - Status:', response.status)
          
          if (text) {
            try {
              const errorData = JSON.parse(text)
              console.error('Error al crear búsqueda - JSON parseado:', errorData)
              errorDetails = errorData
              
              // Construir mensaje de error más descriptivo
              if (errorData.error) {
                errorMessage = errorData.error
              } else if (errorData.details) {
                if (typeof errorData.details === 'string') {
                  errorMessage = errorData.details
                } else if (errorData.details.message) {
                  errorMessage = errorData.details.message
                }
              } else if (errorData.message) {
                errorMessage = errorData.message
              }
            } catch (parseError) {
              console.error('Error al parsear JSON de error:', parseError)
              errorMessage = text || `Error ${response.status}: ${response.statusText}`
            }
          } else {
            errorMessage = `Error ${response.status}: ${response.statusText || 'Sin respuesta del servidor'}`
          }
        } catch (e) {
          console.error('Error al leer respuesta de error:', e)
          errorMessage = `Error ${response.status}: No se pudo leer la respuesta del servidor`
        }
        
        // Mostrar error con detalles si están disponibles
        if (errorDetails?.details && process.env.NODE_ENV === 'development') {
          console.error('Detalles del error:', errorDetails.details)
          alert(`Error al crear búsqueda: ${errorMessage}\n\nDetalles: ${JSON.stringify(errorDetails.details, null, 2)}`)
        } else {
          alert(`Error al crear búsqueda: ${errorMessage}`)
        }
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
                    {currentUser?.rol === 'admin' && (
                      <TableCell className="text-sm text-slate-600">
                        {getAgenteNombre(busqueda)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <button 
                        onClick={() => setSelectedBusqueda(busqueda)}
                        className="text-blue-600 hover:underline"
                      >
                        Ver
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      {selectedBusqueda && (
        <BusquedaDetailModal
          busqueda={selectedBusqueda}
          currentUser={currentUser}
          onClose={() => setSelectedBusqueda(null)}
          onUpdate={fetchBusquedas}
        />
      )}
    </div>
  )
}

// Componente Modal de Detalle
function BusquedaDetailModal({
  busqueda,
  currentUser,
  onClose,
  onUpdate,
}: {
  busqueda: Busqueda
  currentUser: CurrentUser | null
  onClose: () => void
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    estado: busqueda.estado,
    presupuestoTexto: busqueda.presupuestoTexto || '',
    tipoPropiedad: busqueda.tipoPropiedad || '',
    ubicacionPreferida: busqueda.ubicacionPreferida || '',
    dormitoriosMin: busqueda.dormitoriosMin?.toString() || '',
    observaciones: busqueda.observaciones || '',
    origen: busqueda.origen,
  })

  // Verificar si el usuario puede editar esta búsqueda
  const canEdit = currentUser?.rol === 'admin' || 
                  busqueda.usuario?.id === currentUser?.id ||
                  busqueda.cliente.usuario?.id === currentUser?.id

  const handleSave = async () => {
    if (!canEdit) return

    setSaving(true)
    try {
      const payload: any = {
        presupuestoTexto: formData.presupuestoTexto || null,
        tipoPropiedad: formData.tipoPropiedad || null,
        ubicacionPreferida: formData.ubicacionPreferida || null,
        dormitoriosMin: formData.dormitoriosMin ? parseInt(formData.dormitoriosMin) : null,
        observaciones: formData.observaciones || null,
        origen: formData.origen,
      }

      // Solo admin puede cambiar el estado
      if (currentUser?.rol === 'admin') {
        payload.estado = formData.estado
      }

      const response = await fetch(`/api/busquedas/${busqueda.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsEditing(false)
        onUpdate()
        alert('Búsqueda actualizada correctamente')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Error al actualizar búsqueda')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar búsqueda')
    } finally {
      setSaving(false)
    }
  }

  const handleEstadoChange = async (newEstado: string) => {
    if (!currentUser || currentUser.rol !== 'admin') return

    setFormData({ ...formData, estado: newEstado })
    // Guardar automáticamente cuando admin cambia el estado
    setSaving(true)
    try {
      const response = await fetch(`/api/busquedas/${busqueda.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      })

      if (response.ok) {
        onUpdate()
      } else {
        alert('Error al actualizar estado')
        setFormData({ ...formData, estado: busqueda.estado })
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar estado')
      setFormData({ ...formData, estado: busqueda.estado })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detalle de Búsqueda</CardTitle>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información del Cliente (solo lectura) */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Cliente</h3>
            <p className="text-slate-900">{busqueda.cliente.nombreCompleto}</p>
            {busqueda.cliente.usuario && (
              <p className="text-sm text-slate-600">
                Agente asignado: {busqueda.cliente.usuario.nombre}
              </p>
            )}
            {busqueda.usuario && (
              <p className="text-sm text-slate-600">
                Creado por: {busqueda.usuario.nombre}
              </p>
            )}
          </div>

          {/* Campos editables */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Presupuesto
              </label>
              {isEditing ? (
                <Input
                  value={formData.presupuestoTexto}
                  onChange={(e) => setFormData({ ...formData, presupuestoTexto: e.target.value })}
                  placeholder="Ej: 75 MIL DOLARES"
                />
              ) : (
                <p className="text-slate-900">{formData.presupuestoTexto || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Propiedad
              </label>
              {isEditing ? (
                <select
                  value={formData.tipoPropiedad}
                  onChange={(e) => setFormData({ ...formData, tipoPropiedad: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="">Seleccionar</option>
                  <option value="DEPARTAMENTO">Departamento</option>
                  <option value="CASA">Casa</option>
                  <option value="OTRO">Otro</option>
                </select>
              ) : (
                <p className="text-slate-900">{formData.tipoPropiedad || '-'}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ubicación Preferida
              </label>
              {isEditing ? (
                <Input
                  value={formData.ubicacionPreferida}
                  onChange={(e) => setFormData({ ...formData, ubicacionPreferida: e.target.value })}
                  placeholder="Zona/Barrio"
                />
              ) : (
                <p className="text-slate-900">{formData.ubicacionPreferida || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dormitorios Mínimo
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.dormitoriosMin}
                  onChange={(e) => setFormData({ ...formData, dormitoriosMin: e.target.value })}
                  placeholder="Ej: 2"
                />
              ) : (
                <p className="text-slate-900">{formData.dormitoriosMin || '-'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Origen
            </label>
            {isEditing ? (
              <select
                value={formData.origen}
                onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="ACTIVA">Activa</option>
                <option value="PERSONALIZADA">Personalizada</option>
                <option value="CALIFICADA_EFECTIVO">Calificada (Efectivo)</option>
                <option value="CALIFICADA_CREDITO">Calificada (Crédito)</option>
              </select>
            ) : (
              <p className="text-slate-900">{formData.origen}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observaciones
            </label>
            {isEditing ? (
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales"
                className="w-full px-3 py-2 border border-slate-300 rounded-md min-h-[80px]"
              />
            ) : (
              <p className="text-slate-900 whitespace-pre-wrap">{formData.observaciones || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estado
            </label>
            {currentUser?.rol === 'admin' ? (
              <select
                value={formData.estado}
                onChange={(e) => handleEstadoChange(e.target.value)}
                disabled={saving || isEditing}
                className="px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="NUEVO">Nuevo</option>
                <option value="CALIFICADO">Calificado</option>
                <option value="VISITA">Visita</option>
                <option value="RESERVA">Reserva</option>
                <option value="CERRADO">Cerrado</option>
                <option value="PERDIDO">Perdido</option>
              </select>
            ) : (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200">
                {formData.estado}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            {canEdit && (
              <>
                {isEditing ? (
                  <>
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEditing(false)
                        // Restaurar valores originales
                        setFormData({
                          estado: busqueda.estado,
                          presupuestoTexto: busqueda.presupuestoTexto || '',
                          tipoPropiedad: busqueda.tipoPropiedad || '',
                          ubicacionPreferida: busqueda.ubicacionPreferida || '',
                          dormitoriosMin: busqueda.dormitoriosMin?.toString() || '',
                          observaciones: busqueda.observaciones || '',
                          origen: busqueda.origen,
                        })
                      }} 
                      variant="outline"
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Editar
                  </Button>
                )}
              </>
            )}
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
