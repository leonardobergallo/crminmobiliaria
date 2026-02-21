'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

function GestionClienteContent() {
  const searchParams = useSearchParams()
  const clienteIdFromUrl = searchParams.get('clienteId')
  const propSeleccionadasFromUrl = searchParams.get('propSeleccionadas')
  const tabFromUrl = searchParams.get('tab') as 'busquedas' | 'envios' | 'comunicaciones' | 'sugerencias' | null
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])
  const [comunicaciones, setComunicaciones] = useState<Comunicacion[]>([])
  const [sugerencias, setSugerencias] = useState<Sugerencias | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'busquedas' | 'envios' | 'comunicaciones' | 'sugerencias'>(tabFromUrl || 'busquedas')
  
  // Estados para eliminación
  const [clientesAEliminar, setClientesAEliminar] = useState<Set<string>>(new Set())
  const [busquedasAEliminar, setBusquedasAEliminar] = useState<Set<string>>(new Set())
  const [enviosAEliminar, setEnviosAEliminar] = useState<Set<string>>(new Set())
  const [comunicacionesAEliminar, setComunicacionesAEliminar] = useState<Set<string>>(new Set())

  const handleClienteNoEncontrado = () => {
    setClienteSeleccionado(null)
    setBusquedas([])
    setEnvios([])
    setComunicaciones([])
    setSugerencias(null)
    window.history.replaceState({}, '', '/gestion')
  }
  
  // Funciones de eliminación
  const eliminarSeleccionados = async (tipo: 'clientes' | 'busquedas' | 'envios' | 'comunicaciones') => {
    if (!confirm('¿Estás seguro de eliminar los elementos seleccionados?')) return
    
    try {
      let endpoint = ''
      let ids: string[] = []
      
      switch (tipo) {
        case 'clientes':
          endpoint = '/api/clientes/eliminar-masivo'
          ids = Array.from(clientesAEliminar)
          break
        case 'busquedas':
          endpoint = '/api/busquedas/eliminar-masivo'
          ids = Array.from(busquedasAEliminar)
          break
        case 'envios':
          endpoint = '/api/envios/eliminar-masivo'
          ids = Array.from(enviosAEliminar)
          break
        case 'comunicaciones':
          endpoint = '/api/comunicaciones/eliminar-masivo'
          ids = Array.from(comunicacionesAEliminar)
          break
      }
      
      if (ids.length === 0) {
        alert('No hay elementos seleccionados para eliminar')
        return
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.mensaje || 'Eliminados correctamente')
        
        // Limpiar selección
        switch (tipo) {
          case 'clientes':
            setClientesAEliminar(new Set())
            await fetchClientes()
            break
          case 'busquedas':
            setBusquedasAEliminar(new Set())
            await fetchBusquedas()
            break
          case 'envios':
            setEnviosAEliminar(new Set())
            await fetchEnvios()
            break
          case 'comunicaciones':
            setComunicacionesAEliminar(new Set())
            await fetchComunicaciones()
            break
        }
      } else {
        const error = await response.json()
        if (error?.error === 'Cliente no encontrado') {
          handleClienteNoEncontrado()
          return
        }
        alert(error.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error de conexión')
    }
  }
  
  // Procesar propiedades seleccionadas desde URL
  useEffect(() => {
    if (propSeleccionadasFromUrl && clienteSeleccionado) {
      try {
        const propiedades = JSON.parse(decodeURIComponent(propSeleccionadasFromUrl))
        
        // Crear envíos para cada propiedad seleccionada
        const crearEnvios = async () => {
          for (const prop of propiedades) {
            try {
              const payload: any = {
                clienteId: clienteSeleccionado.id,
                canal: 'WHATSAPP',
              }
              
              if (prop.tipo === 'externo') {
                payload.urlExterna = prop.item.url
                payload.tituloExterno = prop.item.titulo
                payload.mensaje = `Propiedad externa seleccionada desde analisis: ${prop.item.titulo}`
              } else if (prop.item.id) {
                payload.propiedadId = prop.item.id
              }
              
              await fetch('/api/envios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              })
            } catch (error) {
              console.error('Error al crear envío:', error)
            }
          }
          
          // Recargar envíos después de crearlos
          await fetchEnvios()
          
          // Limpiar URL para no procesar nuevamente
          window.history.replaceState({}, '', `/gestion?clienteId=${clienteSeleccionado.id}`)
        }
        
        crearEnvios()
      } catch (error) {
        console.error('Error al procesar propiedades seleccionadas:', error)
      }
    }
  }, [propSeleccionadasFromUrl, clienteSeleccionado])
  
  const enviarPropiedadesWhatsApp = (items: any[], tipo: 'enviados' | 'sugerencias') => {
    if (!items || items.length === 0 || !clienteSeleccionado) return

    let tituloBusqueda = 'Propiedades Seleccionadas'
    const b = sugerencias?.busqueda
    if (b) {
      const partes: string[] = []
      if (b.tipoPropiedad) partes.push(b.tipoPropiedad.toLowerCase())
      if (b.ubicacionPreferida) partes.push(`en ${b.ubicacionPreferida}`)
      if (b.moneda && b.presupuestoValor) {
        partes.push(`hasta ${b.moneda} ${b.presupuestoValor.toLocaleString('es-AR')}`)
      }
      if (partes.length > 0) tituloBusqueda = partes.join(' - ')
    }

    const tituloDesdeUrl = (url: string): string => {
      try {
        const clean = decodeURIComponent(String(url || '').split('?')[0])
        const last = clean.split('/').filter(Boolean).pop() || ''
        const slug = last
          .replace(/\.html?$/i, '')
          .replace(/^[a-z0-9]+-/i, '')
          .replace(/[-_]+/g, ' ')
          .trim()
        if (!slug) return 'Propiedad'
        return slug.charAt(0).toUpperCase() + slug.slice(1)
      } catch {
        return 'Propiedad'
      }
    }

    let texto = `*Busqueda: ${tituloBusqueda}*\n\n`
    texto += `*Oportunidades Encontradas para ${clienteSeleccionado.nombreCompleto}*\n\n`

    items.forEach((item) => {
      const prop = tipo === 'sugerencias' ? item : item.propiedad
      const url = prop ? (prop.urlMls || '') : (item.urlExterna || '')
      const titulo = prop
        ? (prop.titulo || prop.ubicacion || 'Propiedad')
        : (item.tituloExterno || (url ? tituloDesdeUrl(url) : 'Propiedad'))
      const precioExacto = prop && typeof prop.precio === 'number' && Number.isFinite(prop.precio)
      const precio = precioExacto ? `${prop.moneda || 'USD'} ${prop.precio.toLocaleString()}` : null
      const ubicacion = prop ? (prop.zona || prop.ubicacion) : 'Ver en el link'

      texto += `*${titulo}*\n`
      if (precio) texto += `Precio: ${precio}\n`
      texto += `Ubicacion: ${ubicacion}\n`
      if (url) texto += `Link: ${url}\n`
      texto += `\n`
    })

    const mensajeFinal = texto.trim()
    const telefono = clienteSeleccionado.telefono?.replace(/\D/g, '') || ''

    if (telefono) {
      window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensajeFinal)}`, '_blank')
    } else {
      navigator.clipboard.writeText(mensajeFinal)
      alert('Lista armada y copiada! (Cliente sin telefono registrado)')
    }
  }

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
    // Si hay clienteId en la URL, seleccionarlo automáticamente
    if (clienteIdFromUrl && clientes.length > 0) {
      const cliente = clientes.find(c => c.id === clienteIdFromUrl)
      if (cliente && !clienteSeleccionado) {
        setClienteSeleccionado(cliente)
      } else if (!cliente && !clienteSeleccionado) {
        window.history.replaceState({}, '', '/gestion')
      }
    }
  }, [clienteIdFromUrl, clientes, clienteSeleccionado])

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
        if (response.status === 404) {
          const err = await response.json().catch(() => null)
          if (err?.error === 'Cliente no encontrado') {
            handleClienteNoEncontrado()
            return
          }
        }
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
      if (response.ok) {
        const data = await response.json()
        setEnvios(data)
      } else {
        if (response.status === 404) {
          const err = await response.json().catch(() => null)
          if (err?.error === 'Cliente no encontrado') {
            handleClienteNoEncontrado()
            return
          }
        }
        setEnvios([])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchComunicaciones = async () => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch(`/api/comunicaciones?clienteId=${clienteSeleccionado.id}`)
      if (response.ok) {
        const data = await response.json()
        setComunicaciones(data)
      } else {
        if (response.status === 404) {
          const err = await response.json().catch(() => null)
          if (err?.error === 'Cliente no encontrado') {
            handleClienteNoEncontrado()
            return
          }
        }
        setComunicaciones([])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchSugerencias = async () => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch(`/api/sugerencias?clienteId=${clienteSeleccionado.id}`)
      if (response.ok) {
        const data = await response.json()
        setSugerencias(data)
      } else {
        if (response.status === 404) {
          const err = await response.json().catch(() => null)
          if (err?.error === 'Cliente no encontrado') {
            handleClienteNoEncontrado()
            return
          }
        }
        setSugerencias(null)
      }
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
        if (response.status === 404) {
          handleClienteNoEncontrado()
          return
        }
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

  const handleCrearBusqueda = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente')
      return
    }
    
    try {
      const payload: any = {
        clienteId: clienteSeleccionado.id,
        origen: formBusqueda.origen,
      }

      if (formBusqueda.tipoPropiedad) payload.tipoPropiedad = formBusqueda.tipoPropiedad
      if (formBusqueda.presupuestoTexto) payload.presupuestoTexto = formBusqueda.presupuestoTexto
      if (formBusqueda.presupuestoValor) payload.presupuestoValor = parseInt(formBusqueda.presupuestoValor)
      if (formBusqueda.moneda) payload.moneda = formBusqueda.moneda
      if (formBusqueda.ubicacionPreferida) payload.ubicacionPreferida = formBusqueda.ubicacionPreferida
      if (formBusqueda.dormitoriosMin) payload.dormitoriosMin = parseInt(formBusqueda.dormitoriosMin)
      if (formBusqueda.cochera) payload.cochera = formBusqueda.cochera
      if (formBusqueda.finalidad) payload.finalidad = formBusqueda.finalidad
      if (formBusqueda.observaciones) payload.observaciones = formBusqueda.observaciones

      const response = await fetch('/api/busquedas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const nuevaBusqueda = await response.json()
        
        // Resetear formulario
        setFormBusqueda({
          origen: 'ACTIVA',
          tipoPropiedad: '',
          presupuestoTexto: '',
          presupuestoValor: '',
          moneda: '',
          ubicacionPreferida: '',
          dormitoriosMin: '',
          cochera: '',
          finalidad: '',
          observaciones: '',
        })
        setMostrarFormBusqueda(false)
        
        // Recargar búsquedas
        await fetchBusquedas()
        
        // Redirigir a Buscar con IA con la nueva búsqueda
        if (clienteSeleccionado) {
          window.location.href = `/parsear?clienteId=${clienteSeleccionado.id}&busquedaId=${nuevaBusqueda.id}`
        }
      } else {
        const errorData = await response.json().catch(() => null)
        if (errorData?.error === 'Cliente no encontrado') {
          handleClienteNoEncontrado()
          return
        }
        alert(errorData?.error || 'Error al crear búsqueda')
      }
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error de conexión: ${error.message || 'No se pudo conectar al servidor'}`)
    }
  }

  const abrirWhatsApp = () => {
    if (!clienteSeleccionado?.telefono) return
    
    const propsParaCompartir = [...(sugerencias?.sugerencias || []), ...(sugerencias?.adicionales || [])]
    
    if (propsParaCompartir.length > 0) {
      // Si hay sugerencias, armar el mensaje completo
      enviarPropiedadesWhatsApp(propsParaCompartir, 'sugerencias')
    } else if (envios.length > 0) {
      // Si no hay sugerencias pero hay envíos, armar el historial
      enviarPropiedadesWhatsApp(envios, 'enviados')
    } else {
      // Si no hay nada, solo abrir el chat
      if (clienteSeleccionado?.telefono) {
        const telefono = clienteSeleccionado.telefono.replace(/\D/g, '')
        window.open(`https://wa.me/${telefono}`, '_blank')
      }
    }
  }

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Gestion de Cliente</h1>
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-4">
          <div className="text-sm text-slate-700">
            Flujo sugerido: `1)` elegir cliente, `2)` revisar/crear busqueda, `3)` enviar sugerencias o links, `4)` registrar comunicaciones y respuestas.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Lista de Clientes */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clientes</CardTitle>
              <p className="text-sm text-slate-600">
                Selecciona un cliente para abrir su historial completo.
              </p>
              <div className="flex gap-2">
                {clientesAEliminar.size > 0 && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => eliminarSeleccionados('clientes')}
                  >
                    Eliminar ({clientesAEliminar.size})
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setClientesAEliminar(new Set())
                  }}
                >
                  Limpiar selección
                </Button>
              </div>
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
                  <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={clientesAEliminar.has(cliente.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setClientesAEliminar(prev => new Set(prev).add(cliente.id))
                      } else {
                        setClientesAEliminar(prev => {
                          const next = new Set(prev)
                          next.delete(cliente.id)
                          return next
                        })
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{cliente.nombreCompleto}</div>
                    {cliente.telefono && (
                      <div className="text-sm text-slate-500">{cliente.telefono}</div>
                    )}
                  </div>
                </div>
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
                Selecciona un cliente para ver su historial
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
                          <span>{clienteSeleccionado.telefono}</span>
                        )}
                        {clienteSeleccionado.email && (
                          <span>{clienteSeleccionado.email}</span>
                        )}
                      </div>
                      {propSeleccionadasFromUrl && (
                        <div className="mt-2 text-sm text-blue-200">
                          Se han registrado {propSeleccionadasFromUrl ? 'propiedades seleccionadas' : ''} desde el analisis
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {clienteSeleccionado.telefono && (
                        <Button 
                          onClick={abrirWhatsApp}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="flex gap-6 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{busquedas.length}</div>
                      <div className="text-xs text-blue-100">Busquedas</div>
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
                    {propSeleccionadasFromUrl && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-300"></div>
                        <div className="text-xs text-yellow-200">Nuevas</div>
                      </div>
                    )}
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
                  Busquedas ({busquedas.length})
                </Button>
                <Button
                  variant={tab === 'sugerencias' ? 'default' : 'outline'}
                  onClick={() => setTab('sugerencias')}
                  size="sm"
                >
                  Sugerencias ({((sugerencias?.sugerencias?.length || 0) + (sugerencias?.adicionales?.length || 0))})
                </Button>
                <Button
                  variant={tab === 'envios' ? 'default' : 'outline'}
                  onClick={() => setTab('envios')}
                  size="sm"
                >
                  Historial de Propiedades ({envios.length})
                </Button>
                <Button
                  variant={tab === 'comunicaciones' ? 'default' : 'outline'}
                  onClick={() => setTab('comunicaciones')}
                  size="sm"
                >
                  Notas / Coms ({comunicaciones.length})
                </Button>
              </div>

              {propSeleccionadasFromUrl && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span className="text-xl"></span>
                    <div>
                      <h3 className="font-semibold">Propiedades seleccionadas desde analisis</h3>
                      <p className="text-sm">Se han registrado automáticamente las propiedades que seleccionaste en el analisis de búsqueda.</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Tab: Busquedas */}
              {tab === 'busquedas' && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <CardTitle>Busquedas del Cliente ({busquedas.length})</CardTitle>
                      <div className="flex gap-2">
                        {busquedasAEliminar.size > 0 && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => eliminarSeleccionados('busquedas')}
                          >
                            Eliminar ({busquedasAEliminar.size})
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setBusquedasAEliminar(new Set())}
                        >
                          Limpiar
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => window.location.href = `/parsear?clienteId=${clienteSeleccionado.id}`}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Buscar con IA
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setMostrarFormBusqueda(!mostrarFormBusqueda)}
                          className="bg-blue-600"
                        >
                          + Nueva Búsqueda Manual
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Desde aqui podes crear nuevas busquedas y ver el historial con sus propiedades sugeridas.
                    </p>
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
                              <option value="CALIFICADA_CREDITO">Calificada (Credito)</option>
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
                              placeholder="Zona, barrio o ciudad preferida"
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
                        {busquedas.map((busqueda) => {
                          // Extraer mensaje original de observaciones si existe
                          const observaciones = busqueda.observaciones || ''
                          const mensajeOriginal = observaciones.includes('--- Mensaje original ---')
                            ? observaciones.split('--- Mensaje original ---')[1]?.trim() || ''
                            : null
                          const observacionesSinMensaje = mensajeOriginal
                            ? observaciones.split('--- Mensaje original ---')[0]?.trim() || ''
                            : observaciones

                          return (
                          <div key={busqueda.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={busquedasAEliminar.has(busqueda.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setBusquedasAEliminar(prev => new Set(prev).add(busqueda.id))
                                    } else {
                                      setBusquedasAEliminar(prev => {
                                        const next = new Set(prev)
                                        next.delete(busqueda.id)
                                        return next
                                      })
                                    }
                                  }}
                                  className="w-4 h-4 mt-1"
                                />
                                <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                                  <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                                    {busqueda.origen}
                                  </span>
                                </div>

                                {/* Mensaje original destacado si existe */}
                                {mensajeOriginal && (
                                  <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r shadow-sm">
                                    <div className="flex items-start gap-2">
                                      <span className="text-xl"></span>
                                      <div className="flex-1">
                                        <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Mensaje Original de WhatsApp:</p>
                                        <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-blue-200">{mensajeOriginal}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Resumen de la búsqueda */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  {busqueda.ubicacionPreferida && (
                                    <div className="bg-slate-50 p-2 rounded">
                                      <p className="text-xs text-slate-500 mb-0.5">Zona</p>
                                      <p className="text-sm font-medium text-slate-900">{busqueda.ubicacionPreferida}</p>
                                    </div>
                                  )}
                                  {busqueda.dormitoriosMin && (
                                    <div className="bg-slate-50 p-2 rounded">
                                      <p className="text-xs text-slate-500 mb-0.5">Dormitorios</p>
                                      <p className="text-sm font-medium text-slate-900">{busqueda.dormitoriosMin}+</p>
                                    </div>
                                  )}
                                  {busqueda.cochera && (
                                    <div className="bg-slate-50 p-2 rounded">
                                      <p className="text-xs text-slate-500 mb-0.5">Cochera</p>
                                      <p className="text-sm font-medium text-slate-900">{busqueda.cochera}</p>
                                    </div>
                                  )}
                                  {busqueda.moneda && busqueda.presupuestoValor && (
                                    <div className="bg-slate-50 p-2 rounded">
                                      <p className="text-xs text-slate-500 mb-0.5">Presupuesto</p>
                                      <p className="text-sm font-medium text-slate-900">{busqueda.moneda} {busqueda.presupuestoValor.toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Observaciones (sin mensaje original) */}
                                {observacionesSinMensaje && (
                                  <div className="mb-2">
                                    <p className="text-xs font-semibold text-slate-500 mb-1">Detalles:</p>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{observacionesSinMensaje}</p>
                                  </div>
                                )}

                                <p className="text-xs text-slate-500 mt-2">
                                  Creada: {new Date(busqueda.createdAt).toLocaleDateString('es-AR')}
                                  {busqueda.usuario && `  -  Por: ${busqueda.usuario.nombre}`}
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
                                            {match.propiedad.tipo}  -  {match.propiedad.zona || match.propiedad.ubicacion}
                                            {match.propiedad.dormitorios && `  -  ${match.propiedad.dormitorios} dorm`}
                                            {match.propiedad.precio && `  -  ${match.propiedad.moneda} ${match.propiedad.precio.toLocaleString()}`}
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
                        )})}
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
                      <CardTitle>Propiedades para Enviar</CardTitle>
                      <div className="flex gap-2">
                        {((sugerencias?.sugerencias?.length || 0) + (sugerencias?.adicionales?.length || 0)) > 0 && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            onClick={() => enviarPropiedadesWhatsApp([...(sugerencias?.sugerencias || []), ...(sugerencias?.adicionales || [])], 'sugerencias')}
                          >
                            Enviar todo por WhatsApp
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setMostrarFormEnvio(true)}
                        >
                          + Link Externo
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Envia propiedades al cliente y registra su interes. Tambien podes sumar links externos manuales.
                    </p>
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
                            placeholder="URL completa del portal o inmobiliaria (https://...)"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Descripción</label>
                          <Input
                            value={formEnvio.tituloExterno}
                            onChange={(e) => setFormEnvio({ ...formEnvio, tituloExterno: e.target.value })}
                            placeholder="Titulo corto para identificar el link"
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
                      {(sugerencias?.sugerencias?.length || 0) === 0 && (sugerencias?.adicionales?.length || 0) === 0 ? (
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
                                  {prop.tipo}  -  {prop.zona || prop.ubicacion}  -  
                                  {prop.dormitorios && ` ${prop.dormitorios} dorm  - `}
                                  {prop.precio && ` ${prop.moneda} ${prop.precio.toLocaleString()}`}
                                  {prop.aptaCredito && <span className="ml-2 text-green-600">Credito</span>}
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
                                  Enviar
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
                    <div className="flex justify-between items-center">
                      <CardTitle>Propiedades Enviadas</CardTitle>
                      <div className="flex gap-2">
                        {enviosAEliminar.size > 0 && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => eliminarSeleccionados('envios')}
                          >
                            Eliminar ({enviosAEliminar.size})
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEnviosAEliminar(new Set())}
                        >
                          Limpiar
                        </Button>
                        {envios.length > 0 && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            onClick={() => enviarPropiedadesWhatsApp(envios, 'enviados')}
                          >
                            Re-enviar Historial
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Cambia la respuesta del cliente para llevar el seguimiento comercial sin salir de esta vista.
                    </p>
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
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={enviosAEliminar.has(envio.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEnviosAEliminar(prev => new Set(prev).add(envio.id))
                                    } else {
                                      setEnviosAEliminar(prev => {
                                        const next = new Set(prev)
                                        next.delete(envio.id)
                                        return next
                                      })
                                    }
                                  }}
                                  className="w-4 h-4 mt-1"
                                />
                                <div className="flex-1">
                                <div className="font-medium">
                                  {envio.propiedad?.titulo || envio.propiedad?.ubicacion || envio.tituloExterno || envio.urlExterna}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {new Date(envio.fechaEnvio).toLocaleDateString('es-AR')}  -  
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
                                  <option value="INTERESADO">Interesado</option>
                                  <option value="NO_INTERESADO">No interesado</option>
                                  <option value="VISITA_PROGRAMADA">Visita programada</option>
                                  <option value="SIN_RESPUESTA">â³ Sin respuesta</option>
                                </select></div>
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
                      <CardTitle>Historial de Comunicaciones</CardTitle>
                      <div className="flex gap-2">
                        {comunicacionesAEliminar.size > 0 && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => eliminarSeleccionados('comunicaciones')}
                          >
                            Eliminar ({comunicacionesAEliminar.size})
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setComunicacionesAEliminar(new Set())}
                        >
                          Limpiar
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setMostrarFormCom(!mostrarFormCom)}
                          className="bg-blue-600"
                        >
                          + Nueva
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      Registra llamadas, WhatsApp y resultados para no perder contexto entre agentes.
                    </p>
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
                            placeholder="Resumen claro: que pidio el cliente, que se acordo y proximo paso"
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
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={comunicacionesAEliminar.has(com.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setComunicacionesAEliminar(prev => new Set(prev).add(com.id))
                                    } else {
                                      setComunicacionesAEliminar(prev => {
                                        const next = new Set(prev)
                                        next.delete(com.id)
                                        return next
                                      })
                                    }
                                  }}
                                  className="w-4 h-4 mt-1"
                                />
                                <div className="flex-1">
                                <div className="flex gap-2 items-center">
                                  <span className="text-lg">
                                    {com.tipo === 'WHATSAPP' ? 'WA' :
                                     com.tipo === 'LLAMADA' ? 'TEL' :
                                     com.tipo === 'EMAIL' ? 'MAIL' :
                                     com.tipo === 'VISITA' ? 'VISITA' : 'NOTA'}
                                  </span>
                                  <span className="font-medium">{com.tipo}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    com.direccion === 'SALIENTE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {com.direccion === 'SALIENTE' ? '-> Saliente' : '<- Entrante'}
                                  </span>
                                  {com.resultado && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200">
                                      {com.resultado}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-slate-700">{com.resumen}</p>
                              </div>
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

export default function GestionClientePage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8">
        <p className="text-slate-600">Cargando...</p>
      </div>
    }>
      <GestionClienteContent />
    </Suspense>
  )
}

























































