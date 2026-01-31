'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Cliente {
  id: string
  nombreCompleto: string
  telefono?: string
  email?: string
  busquedas?: Busqueda[]
}

interface Busqueda {
  id: string
  clienteId: string
  origen: string
  presupuestoTexto?: string
  presupuestoValor?: number
  moneda?: string
  tipoPropiedad?: string
  ubicacionPreferida?: string
  dormitoriosMin?: number
  cochera?: string
  finalidad?: string
  estado: string
  observaciones?: string
  planillaRef?: string
  createdAt: string
  updatedAt: string
  matchesPropiedades?: MatchBusquedaPropiedad[]
  usuario?: {
    id: string
    nombre: string
  }
}

interface MatchBusquedaPropiedad {
  id: string
  busquedaId: string
  propiedadId: string
  estado: string
  notas?: string
  fecha: string
  propiedad: Propiedad
}

interface Propiedad {
  id: string
  titulo?: string
  tipo: string
  ubicacion: string
  zona?: string
  precio?: number
  moneda?: string
  dormitorios?: number
  aptaCredito: boolean
  urlMls?: string
}

interface Envio {
  id: string
  propiedadId?: string
  propiedad?: Propiedad
  urlExterna?: string
  tituloExterno?: string
  canal: string
  respuesta?: string
  fechaEnvio: string
}

interface Comunicacion {
  id: string
  tipo: string
  direccion: string
  resumen: string
  resultado?: string
  fecha: string
}

interface Sugerencias {
  busqueda: any
  sugerencias: Propiedad[]
  adicionales: Propiedad[]
  propiedadesEnviadasCount: number
}

export default function GestionClientePage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])
  const [comunicaciones, setComunicaciones] = useState<Comunicacion[]>([])
  const [sugerencias, setSugerencias] = useState<Sugerencias | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'busquedas' | 'envios' | 'comunicaciones' | 'sugerencias'>('busquedas')
  
  // Forms
  const [mostrarFormBusqueda, setMostrarFormBusqueda] = useState(false)
  const [mostrarFormEnvio, setMostrarFormEnvio] = useState(false)
  const [mostrarFormCom, setMostrarFormCom] = useState(false)
  const [formBusqueda, setFormBusqueda] = useState({
    origen: 'ACTIVA',
    presupuestoTexto: '',
    presupuestoValor: '',
    moneda: 'USD',
    tipoPropiedad: '',
    ubicacionPreferida: '',
    dormitoriosMin: '',
    cochera: '',
    finalidad: '',
    observaciones: '',
  })
  const [formEnvio, setFormEnvio] = useState({ urlExterna: '', tituloExterno: '', mensaje: '' })
  const [formCom, setFormCom] = useState({ 
    tipo: 'WHATSAPP', 
    direccion: 'SALIENTE', 
    resumen: '', 
    resultado: '' 
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  useEffect(() => {
    if (clienteSeleccionado) {
      fetchBusquedas()
      fetchEnvios()
      fetchComunicaciones()
      fetchSugerencias()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSeleccionado])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBusquedas = async () => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch(`/api/busquedas?clienteId=${clienteSeleccionado.id}`)
      if (response.ok) {
        const data = await response.json()
        setBusquedas(Array.isArray(data) ? data : [])
      } else {
        setBusquedas([])
      }
    } catch (error) {
      console.error('Error:', error)
      setBusquedas([])
    }
  }

  const fetchEnvios = async () => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch(`/api/envios?clienteId=${clienteSeleccionado.id}`)
      const data = await response.json()
      setEnvios(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchComunicaciones = async () => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch(`/api/comunicaciones?clienteId=${clienteSeleccionado.id}`)
      const data = await response.json()
      setComunicaciones(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchSugerencias = async () => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch(`/api/sugerencias?clienteId=${clienteSeleccionado.id}`)
      const data = await response.json()
      setSugerencias(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEnviarPropiedad = async (propiedad: Propiedad) => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch('/api/envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSeleccionado.id,
          propiedadId: propiedad.id,
          canal: 'WHATSAPP',
        }),
      })

      if (response.ok) {
        // Abrir WhatsApp con el link
        const mensaje = `Hola ${clienteSeleccionado.nombreCompleto}! Te comparto esta propiedad:\n\n${propiedad.titulo || propiedad.ubicacion}\n${propiedad.tipo} - ${propiedad.moneda || 'USD'} ${propiedad.precio?.toLocaleString() || 'Consultar'}\n${propiedad.urlMls || ''}`
        const telefono = clienteSeleccionado.telefono?.replace(/\D/g, '') || ''
        if (telefono) {
          window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank')
        }
        fetchEnvios()
        fetchSugerencias()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al registrar envío')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEnvioExterno = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSeleccionado) return
    try {
      const response = await fetch('/api/envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSeleccionado.id,
          urlExterna: formEnvio.urlExterna,
          tituloExterno: formEnvio.tituloExterno,
          mensaje: formEnvio.mensaje,
          canal: 'WHATSAPP',
        }),
      })

      if (response.ok) {
        setFormEnvio({ urlExterna: '', tituloExterno: '', mensaje: '' })
        setMostrarFormEnvio(false)
        fetchEnvios()
        
        // Abrir WhatsApp
        const telefono = clienteSeleccionado.telefono?.replace(/\D/g, '') || ''
        if (telefono && formEnvio.urlExterna) {
          const mensaje = `${formEnvio.mensaje || 'Te comparto esta propiedad:'}\n${formEnvio.urlExterna}`
          window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank')
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleNuevaComunicacion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSeleccionado) return
    try {
      const response = await fetch('/api/comunicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSeleccionado.id,
          ...formCom,
        }),
      })

      if (response.ok) {
        setFormCom({ tipo: 'WHATSAPP', direccion: 'SALIENTE', resumen: '', resultado: '' })
        setMostrarFormCom(false)
        fetchComunicaciones()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleActualizarRespuesta = async (envioId: string, respuesta: string) => {
    try {
      await fetch(`/api/envios/${envioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta }),
      })
      fetchEnvios()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const abrirWhatsApp = () => {
    if (!clienteSeleccionado?.telefono) return
    const telefono = clienteSeleccionado.telefono.replace(/\D/g, '')
    window.open(`https://wa.me/${telefono}`, '_blank')
  }

  const handleCrearBusqueda = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clienteSeleccionado) return
    
    try {
      const payload: any = {
        clienteId: clienteSeleccionado.id,
        origen: formBusqueda.origen,
        presupuestoTexto: formBusqueda.presupuestoTexto || null,
        moneda: formBusqueda.moneda || null,
        tipoPropiedad: formBusqueda.tipoPropiedad || null,
        ubicacionPreferida: formBusqueda.ubicacionPreferida || null,
        dormitoriosMin: formBusqueda.dormitoriosMin ? parseInt(formBusqueda.dormitoriosMin) : null,
        cochera: formBusqueda.cochera || null,
        finalidad: formBusqueda.finalidad || null,
        observaciones: formBusqueda.observaciones || null,
      }

      if (formBusqueda.presupuestoValor) {
        payload.presupuestoValor = parseInt(formBusqueda.presupuestoValor)
      }

      const response = await fetch('/api/busquedas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setFormBusqueda({
          origen: 'ACTIVA',
          presupuestoTexto: '',
          presupuestoValor: '',
          moneda: 'USD',
          tipoPropiedad: '',
          ubicacionPreferida: '',
          dormitoriosMin: '',
          cochera: '',
          finalidad: '',
          observaciones: '',
        })
        setMostrarFormBusqueda(false)
        fetchBusquedas()
        fetchSugerencias() // Actualizar sugerencias con la nueva búsqueda
        alert('Búsqueda creada correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear búsqueda')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear búsqueda')
    }
  }

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">📱 Gestión de Cliente</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Lista de Clientes */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {clientes.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setClienteSeleccionado(cliente)}
                  className={`w-full px-4 py-3 text-left border-b hover:bg-slate-50 transition-colors ${
                    clienteSeleccionado?.id === cliente.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="font-medium">{cliente.nombreCompleto}</div>
                  {cliente.telefono && (
                    <div className="text-sm text-slate-500">{cliente.telefono}</div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main: Detalle del Cliente */}
        <div className="lg:col-span-3">
          {!clienteSeleccionado ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                👈 Selecciona un cliente para ver su historial
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Header del Cliente */}
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">{clienteSeleccionado.nombreCompleto}</h2>
                      <div className="flex gap-4 mt-1 text-blue-100">
                        {clienteSeleccionado.telefono && (
                          <span>📞 {clienteSeleccionado.telefono}</span>
                        )}
                        {clienteSeleccionado.email && (
                          <span>✉️ {clienteSeleccionado.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {clienteSeleccionado.telefono && (
                        <Button 
                          onClick={abrirWhatsApp}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          💬 WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="flex gap-6 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{busquedas.length}</div>
                      <div className="text-xs text-blue-100">Búsquedas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{envios.length}</div>
                      <div className="text-xs text-blue-100">Props Enviadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{comunicaciones.length}</div>
                      <div className="text-xs text-blue-100">Comunicaciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{sugerencias?.sugerencias.length || 0}</div>
                      <div className="text-xs text-blue-100">Sugerencias</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={tab === 'busquedas' ? 'default' : 'outline'}
                  onClick={() => setTab('busquedas')}
                  size="sm"
                >
                  🔍 Búsquedas ({busquedas.length})
                </Button>
                <Button
                  variant={tab === 'sugerencias' ? 'default' : 'outline'}
                  onClick={() => setTab('sugerencias')}
                  size="sm"
                >
                  🎯 Sugerencias
                </Button>
                <Button
                  variant={tab === 'envios' ? 'default' : 'outline'}
                  onClick={() => setTab('envios')}
                  size="sm"
                >
                  📤 Enviados ({envios.length})
                </Button>
                <Button
                  variant={tab === 'comunicaciones' ? 'default' : 'outline'}
                  onClick={() => setTab('comunicaciones')}
                  size="sm"
                >
                  💬 Historial
                </Button>
              </div>

              {/* Tab: Búsquedas */}
              {tab === 'busquedas' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>🔍 Búsquedas del Cliente</CardTitle>
                      <Button 
                        size="sm" 
                        onClick={() => setMostrarFormBusqueda(!mostrarFormBusqueda)}
                        className="bg-blue-600"
                      >
                        + Nueva Búsqueda
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Form nueva búsqueda */}
                    {mostrarFormBusqueda && (
                      <form onSubmit={handleCrearBusqueda} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Origen *</label>
                            <select
                              value={formBusqueda.origen}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, origen: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                              required
                            >
                              <option value="ACTIVA">Activa</option>
                              <option value="PERSONALIZADA">Personalizada</option>
                              <option value="CALIFICADA_EFECTIVO">Calificada (Efectivo)</option>
                              <option value="CALIFICADA_CREDITO">Calificada (Crédito)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Tipo de Propiedad</label>
                            <select
                              value={formBusqueda.tipoPropiedad}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, tipoPropiedad: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="">Seleccionar</option>
                              <option value="DEPARTAMENTO">Departamento</option>
                              <option value="CASA">Casa</option>
                              <option value="OTRO">Otro</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Presupuesto (texto)</label>
                            <Input
                              value={formBusqueda.presupuestoTexto}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, presupuestoTexto: e.target.value })}
                              placeholder="Ej: 75 MIL DOLARES"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Presupuesto (valor)</label>
                            <Input
                              type="number"
                              value={formBusqueda.presupuestoValor}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, presupuestoValor: e.target.value })}
                              placeholder="75000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Moneda</label>
                            <select
                              value={formBusqueda.moneda}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, moneda: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="USD">USD</option>
                              <option value="ARS">ARS</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Ubicación Preferida</label>
                            <Input
                              value={formBusqueda.ubicacionPreferida}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, ubicacionPreferida: e.target.value })}
                              placeholder="Zona/Barrio"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Dormitorios Mínimo</label>
                            <Input
                              type="number"
                              value={formBusqueda.dormitoriosMin}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, dormitoriosMin: e.target.value })}
                              placeholder="2"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Cochera</label>
                            <Input
                              value={formBusqueda.cochera}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, cochera: e.target.value })}
                              placeholder="SI / NO"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Finalidad</label>
                            <select
                              value={formBusqueda.finalidad}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, finalidad: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="">Seleccionar</option>
                              <option value="INVERSION">Inversión</option>
                              <option value="VIVIENDA">Vivienda</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Observaciones</label>
                          <textarea
                            value={formBusqueda.observaciones}
                            onChange={(e) => setFormBusqueda({ ...formBusqueda, observaciones: e.target.value })}
                            placeholder="Notas adicionales..."
                            className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="bg-green-600">Guardar</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setMostrarFormBusqueda(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Lista de búsquedas */}
                    {busquedas.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">
                        No hay búsquedas registradas. Crea una nueva búsqueda para comenzar.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {busquedas.map((busqueda) => (
                          <div key={busqueda.id} className="p-4 border rounded-lg bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">
                                    {busqueda.tipoPropiedad || 'Propiedad'} - {busqueda.presupuestoTexto || 'Sin presupuesto'}
                                  </h3>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    busqueda.estado === 'NUEVO' ? 'bg-blue-100 text-blue-700' :
                                    busqueda.estado === 'CALIFICADO' ? 'bg-purple-100 text-purple-700' :
                                    busqueda.estado === 'VISITA' ? 'bg-orange-100 text-orange-700' :
                                    busqueda.estado === 'RESERVA' ? 'bg-green-100 text-green-700' :
                                    busqueda.estado === 'CERRADO' ? 'bg-gray-100 text-gray-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {busqueda.estado}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                  <p><strong>Origen:</strong> {busqueda.origen}</p>
                                  {busqueda.ubicacionPreferida && (
                                    <p><strong>Zona:</strong> {busqueda.ubicacionPreferida}</p>
                                  )}
                                  {busqueda.dormitoriosMin && (
                                    <p><strong>Dormitorios mín:</strong> {busqueda.dormitoriosMin}</p>
                                  )}
                                  {busqueda.observaciones && (
                                    <p><strong>Observaciones:</strong> {busqueda.observaciones}</p>
                                  )}
                                  <p className="text-xs text-slate-500">
                                    Creada: {new Date(busqueda.createdAt).toLocaleDateString('es-AR')}
                                    {busqueda.usuario && ` • Por: ${busqueda.usuario.nombre}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Propiedades relacionadas */}
                            {busqueda.matchesPropiedades && busqueda.matchesPropiedades.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <h4 className="font-medium text-sm mb-2 text-slate-700">
                                  Propiedades Sugeridas ({busqueda.matchesPropiedades.length})
                                </h4>
                                <div className="space-y-2">
                                  {busqueda.matchesPropiedades.slice(0, 5).map((match) => (
                                    <div key={match.id} className="p-2 bg-slate-50 rounded text-sm">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="font-medium">
                                            {match.propiedad.titulo || match.propiedad.ubicacion}
                                          </div>
                                          <div className="text-xs text-slate-600">
                                            {match.propiedad.tipo} • {match.propiedad.zona || match.propiedad.ubicacion}
                                            {match.propiedad.dormitorios && ` • ${match.propiedad.dormitorios} dorm`}
                                            {match.propiedad.precio && ` • ${match.propiedad.moneda} ${match.propiedad.precio.toLocaleString()}`}
                                          </div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          match.estado === 'ENVIADA' ? 'bg-green-100 text-green-700' :
                                          match.estado === 'VISITA' ? 'bg-blue-100 text-blue-700' :
                                          match.estado === 'DESCARTADA' ? 'bg-red-100 text-red-700' :
                                          'bg-slate-200 text-slate-700'
                                        }`}>
                                          {match.estado}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  {busqueda.matchesPropiedades.length > 5 && (
                                    <p className="text-xs text-slate-500 text-center">
                                      ... y {busqueda.matchesPropiedades.length - 5} más
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab: Sugerencias */}
              {tab === 'sugerencias' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>🎯 Propiedades para Enviar</CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setMostrarFormEnvio(true)}
                      >
                        + Link Externo
                      </Button>
                    </div>
                    {sugerencias?.busqueda && (
                      <p className="text-sm text-slate-600">
                        Búsqueda: {sugerencias.busqueda.tipoPropiedad || 'Cualquier'} | 
                        Presupuesto: {sugerencias.busqueda.presupuestoTexto || 'No especificado'} |
                        Zona: {sugerencias.busqueda.ubicacionPreferida || 'Cualquiera'}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {/* Form para link externo */}
                    {mostrarFormEnvio && (
                      <form onSubmit={handleEnvioExterno} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">URL del Link</label>
                          <Input
                            value={formEnvio.urlExterna}
                            onChange={(e) => setFormEnvio({ ...formEnvio, urlExterna: e.target.value })}
                            placeholder="https://www.argenprop.com/..."
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Descripción</label>
                          <Input
                            value={formEnvio.tituloExterno}
                            onChange={(e) => setFormEnvio({ ...formEnvio, tituloExterno: e.target.value })}
                            placeholder="Depto 3 amb en Palermo"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="bg-green-600">
                            Registrar y Enviar
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setMostrarFormEnvio(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Lista de sugerencias */}
                    <div className="space-y-3">
                      {sugerencias?.sugerencias.length === 0 && sugerencias?.adicionales.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">
                          No hay propiedades nuevas para sugerir
                        </p>
                      ) : (
                        <>
                          {[...(sugerencias?.sugerencias || []), ...(sugerencias?.adicionales || [])].map((prop) => (
                            <div key={prop.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                              <div className="flex-1">
                                <div className="font-medium">{prop.titulo || prop.ubicacion}</div>
                                <div className="text-sm text-slate-600">
                                  {prop.tipo} • {prop.zona || prop.ubicacion} • 
                                  {prop.dormitorios && ` ${prop.dormitorios} dorm •`}
                                  {prop.precio && ` ${prop.moneda} ${prop.precio.toLocaleString()}`}
                                  {prop.aptaCredito && <span className="ml-2 text-green-600">✓ Crédito</span>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {prop.urlMls && (
                                  <a href={prop.urlMls} target="_blank" rel="noopener" className="text-blue-600 text-sm hover:underline">
                                    Ver
                                  </a>
                                )}
                                <Button 
                                  size="sm" 
                                  onClick={() => handleEnviarPropiedad(prop)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  📤 Enviar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tab: Enviados */}
              {tab === 'envios' && (
                <Card>
                  <CardHeader>
                    <CardTitle>📤 Propiedades Enviadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {envios.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">
                        No hay envíos registrados
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {envios.map((envio) => (
                          <div key={envio.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  {envio.propiedad?.titulo || envio.propiedad?.ubicacion || envio.tituloExterno || envio.urlExterna}
                                </div>
                                <div className="text-sm text-slate-600">
                                  📅 {new Date(envio.fechaEnvio).toLocaleDateString('es-AR')} • 
                                  {envio.canal}
                                </div>
                                {envio.urlExterna && (
                                  <a href={envio.urlExterna} target="_blank" rel="noopener" className="text-blue-600 text-sm">
                                    {envio.urlExterna}
                                  </a>
                                )}
                              </div>
                              <div>
                                <select
                                  value={envio.respuesta || ''}
                                  onChange={(e) => handleActualizarRespuesta(envio.id, e.target.value)}
                                  className={`text-sm px-2 py-1 rounded border ${
                                    envio.respuesta === 'INTERESADO' ? 'bg-green-100 text-green-700' :
                                    envio.respuesta === 'NO_INTERESADO' ? 'bg-red-100 text-red-700' :
                                    envio.respuesta === 'VISITA_PROGRAMADA' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100'
                                  }`}
                                >
                                  <option value="">Sin respuesta</option>
                                  <option value="INTERESADO">✓ Interesado</option>
                                  <option value="NO_INTERESADO">✗ No interesado</option>
                                  <option value="VISITA_PROGRAMADA">📅 Visita programada</option>
                                  <option value="SIN_RESPUESTA">⏳ Sin respuesta</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab: Comunicaciones */}
              {tab === 'comunicaciones' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>💬 Historial de Comunicaciones</CardTitle>
                      <Button 
                        size="sm" 
                        onClick={() => setMostrarFormCom(!mostrarFormCom)}
                        className="bg-blue-600"
                      >
                        + Nueva
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Form nueva comunicación */}
                    {mostrarFormCom && (
                      <form onSubmit={handleNuevaComunicacion} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Tipo</label>
                            <select
                              value={formCom.tipo}
                              onChange={(e) => setFormCom({ ...formCom, tipo: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="WHATSAPP">WhatsApp</option>
                              <option value="LLAMADA">Llamada</option>
                              <option value="EMAIL">Email</option>
                              <option value="VISITA">Visita</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Dirección</label>
                            <select
                              value={formCom.direccion}
                              onChange={(e) => setFormCom({ ...formCom, direccion: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="SALIENTE">Saliente (yo inicié)</option>
                              <option value="ENTRANTE">Entrante (él/ella inició)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Resumen</label>
                          <textarea
                            value={formCom.resumen}
                            onChange={(e) => setFormCom({ ...formCom, resumen: e.target.value })}
                            placeholder="¿De qué hablaron?"
                            className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Resultado</label>
                          <select
                            value={formCom.resultado}
                            onChange={(e) => setFormCom({ ...formCom, resultado: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="">Sin especificar</option>
                            <option value="CONTACTADO">Contactado</option>
                            <option value="NO_CONTESTO">No contestó</option>
                            <option value="CITA_AGENDADA">Cita agendada</option>
                            <option value="INTERESADO">Interesado</option>
                            <option value="NO_INTERESADO">No interesado</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="bg-green-600">Guardar</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setMostrarFormCom(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Lista de comunicaciones */}
                    {comunicaciones.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">
                        No hay comunicaciones registradas
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {comunicaciones.map((com) => (
                          <div key={com.id} className="p-3 border-l-4 border-l-blue-500 bg-slate-50 rounded-r-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex gap-2 items-center">
                                  <span className="text-lg">
                                    {com.tipo === 'WHATSAPP' ? '💬' : 
                                     com.tipo === 'LLAMADA' ? '📞' : 
                                     com.tipo === 'EMAIL' ? '✉️' : 
                                     com.tipo === 'VISITA' ? '🏠' : '📝'}
                                  </span>
                                  <span className="font-medium">{com.tipo}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    com.direccion === 'SALIENTE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {com.direccion === 'SALIENTE' ? '→ Saliente' : '← Entrante'}
                                  </span>
                                  {com.resultado && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200">
                                      {com.resultado}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-slate-700">{com.resumen}</p>
                              </div>
                              <div className="text-sm text-slate-500">
                                {new Date(com.fecha).toLocaleDateString('es-AR')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
