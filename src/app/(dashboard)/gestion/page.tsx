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

interface CurrentUser {
  id: string
  nombre: string
  rol: string
}

interface UsuarioOption {
  id: string
  nombre: string
  rol?: string
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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([])
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
    usuarioId: '',
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
    fetchCurrentUser()
    fetchClientes()
  }, [])

  useEffect(() => {
    if (currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin') {
      fetchUsuarios()
    } else {
      setUsuarios([])
    }
  }, [currentUser])

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

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) return
      const data = await response.json()
      setCurrentUser(data?.user || null)
    } catch (error) {
      console.error('Error:', error)
      setCurrentUser(null)
    }
  }

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/auth/usuarios')
      if (!response.ok) {
        setUsuarios([])
        return
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        setUsuarios([])
        return
      }
      const agentes = data.filter((u: any) => {
        const rol = String(u?.rol || '').toLowerCase()
        return rol === 'agente' || rol === 'supervisor' || rol === 'admin'
      })
      setUsuarios(agentes.map((u: any) => ({ id: u.id, nombre: u.nombre, rol: u.rol })))
    } catch (error) {
      console.error('Error:', error)
      setUsuarios([])
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
      if (formBusqueda.usuarioId) payload.usuarioId = formBusqueda.usuarioId

      const response = await fetch('/api/busquedas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const nuevaBusqueda = await response.json()
        
        // Resetear formulario
        setFormBusqueda({
          usuarioId: '',
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <svg className="animate-spin h-8 w-8 text-sky-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-medium">Cargando gestión...</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Cliente</h1>
        <p className="text-sm text-slate-500 mt-0.5">Seguimiento completo: búsquedas, envíos y comunicaciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Lista de Clientes */}
        <div className="lg:col-span-1 animate-fade-in-up stagger-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Clientes</CardTitle>
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
              {clientes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-400 text-sm">No hay clientes</p>
                </div>
              ) : (
              clientes.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setClienteSeleccionado(cliente)}
                  className={`w-full px-4 py-3 text-left border-b hover:bg-slate-50 transition-all ${
                    clienteSeleccionado?.id === cliente.id ? 'bg-sky-50 border-l-4 border-l-sky-500' : 'border-l-4 border-l-transparent'
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
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {cliente.nombreCompleto?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{cliente.nombreCompleto}</div>
                    {cliente.telefono && (
                      <div className="text-xs text-slate-400">{cliente.telefono}</div>
                    )}
                  </div>
                  {cliente.busquedas && cliente.busquedas.length > 0 && (
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-medium">
                      {cliente.busquedas.length}
                    </span>
                  )}
                </div>
                </button>
              )))}
            </CardContent>
          </Card>
        </div>

        {/* Main: Detalle del Cliente */}
        <div className="lg:col-span-3 animate-fade-in-up stagger-2">
          {!clienteSeleccionado ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Seleccioná un cliente</p>
                    <p className="text-sm text-slate-400 mt-1">Elegí de la lista a la izquierda para ver su historial completo</p>
                  </div>
                </div>
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
              <div className="border-b border-slate-200 bg-white rounded-t-xl px-1">
                <div className="flex gap-0 -mb-px">
                  {[
                    { key: 'busquedas' as const, label: 'Búsquedas', count: busquedas.length },
                    { key: 'sugerencias' as const, label: 'Sugerencias', count: ((sugerencias?.sugerencias?.length || 0) + (sugerencias?.adicionales?.length || 0)) },
                    { key: 'envios' as const, label: 'Historial Props', count: envios.length },
                    { key: 'comunicaciones' as const, label: 'Notas / Coms', count: comunicaciones.length },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                        tab === t.key
                          ? 'border-sky-500 text-sky-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                      {t.count > 0 && (
                        <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                          tab === t.key ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {t.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
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
                        {(currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin') && (
                          <div>
                            <label className="block text-sm font-medium mb-1">Derivar a agente</label>
                            <select
                              value={formBusqueda.usuarioId}
                              onChange={(e) => setFormBusqueda({ ...formBusqueda, usuarioId: e.target.value })}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="">Sin derivar (queda para mi usuario)</option>
                              {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
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
                      <div className="flex flex-col items-center gap-3 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <p className="text-slate-500 font-medium">Sin búsquedas registradas</p>
                        <p className="text-sm text-slate-400">Creá una nueva búsqueda para comenzar el seguimiento</p>
                      </div>
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
                        <div className="flex flex-col items-center gap-3 py-8">
                          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                          <p className="text-slate-500 font-medium">Sin sugerencias nuevas</p>
                          <p className="text-sm text-slate-400">Las propiedades que coincidan aparecerán acá</p>
                        </div>
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
                          onClick={() => {
                            if (enviosAEliminar.size === envios.length) {
                              setEnviosAEliminar(new Set())
                            } else {
                              setEnviosAEliminar(new Set(envios.map(e => e.id)))
                            }
                          }}
                        >
                          {enviosAEliminar.size === envios.length && envios.length > 0 ? 'Deseleccionar todo' : 'Seleccionar todo'}
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
                      <div className="flex flex-col items-center gap-3 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <p className="text-slate-500 font-medium">Sin envíos registrados</p>
                        <p className="text-sm text-slate-400">Enviá propiedades al cliente desde la pestaña Sugerencias</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {(() => {
                          const getPortal = (envio: Envio): { nombre: string; color: string } => {
                            const url = (envio.urlExterna || envio.propiedad?.urlMls || '').toLowerCase()
                            if (url.includes('mercadolibre')) return { nombre: 'MercadoLibre', color: 'bg-yellow-100 text-yellow-800' }
                            if (url.includes('zonaprop')) return { nombre: 'ZonaProp', color: 'bg-purple-100 text-purple-800' }
                            if (url.includes('argenprop')) return { nombre: 'ArgenProp', color: 'bg-red-100 text-red-800' }
                            if (url.includes('buscainmueble')) return { nombre: 'Buscainmueble', color: 'bg-cyan-100 text-cyan-800' }
                            if (url.includes('remax')) return { nombre: 'Remax', color: 'bg-blue-100 text-blue-800' }
                            if (url.includes('properati')) return { nombre: 'Properati', color: 'bg-teal-100 text-teal-800' }
                            if (envio.urlExterna) return { nombre: 'Link externo', color: 'bg-orange-100 text-orange-800' }
                            if (envio.propiedad) return { nombre: 'CRM', color: 'bg-slate-200 text-slate-700' }
                            return { nombre: 'Manual', color: 'bg-gray-100 text-gray-700' }
                          }

                          const SESSION_GAP_MS = 10 * 60 * 1000
                          const sorted = [...envios].sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime())
                          const sessions: { label: string; fecha: Date; items: Envio[] }[] = []

                          for (const envio of sorted) {
                            const fecha = new Date(envio.fechaEnvio)
                            const lastSession = sessions[sessions.length - 1]
                            if (lastSession && Math.abs(lastSession.fecha.getTime() - fecha.getTime()) < SESSION_GAP_MS) {
                              lastSession.items.push(envio)
                            } else {
                              const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                              const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                              sessions.push({ label: `${fechaStr} - ${horaStr} hs`, fecha, items: [envio] })
                            }
                          }

                          return sessions.map((session, sIdx) => {
                            const portalesConteo = new Map<string, { count: number; color: string }>()
                            for (const e of session.items) {
                              const p = getPortal(e)
                              const existing = portalesConteo.get(p.nombre)
                              if (existing) existing.count++
                              else portalesConteo.set(p.nombre, { count: 1, color: p.color })
                            }

                            const sessionIds = session.items.map(e => e.id)
                            const allSelected = sessionIds.every(id => enviosAEliminar.has(id))

                            return (
                              <div key={sIdx} className="border rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={allSelected}
                                      onChange={() => {
                                        if (allSelected) {
                                          setEnviosAEliminar(prev => {
                                            const next = new Set(prev)
                                            sessionIds.forEach(id => next.delete(id))
                                            return next
                                          })
                                        } else {
                                          setEnviosAEliminar(prev => {
                                            const next = new Set(prev)
                                            sessionIds.forEach(id => next.add(id))
                                            return next
                                          })
                                        }
                                      }}
                                      className="w-4 h-4"
                                    />
                                    <span className="font-semibold text-slate-800 text-sm">{session.label}</span>
                                    <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border">
                                      {session.items.length} {session.items.length === 1 ? 'propiedad' : 'propiedades'}
                                    </span>
                                  </div>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {[...portalesConteo.entries()].map(([portal, info]) => (
                                      <span key={portal} className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>
                                        {portal} ({info.count})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="divide-y">
                                  {session.items.map((envio) => {
                                    const portal = getPortal(envio)
                                    return (
                                      <div key={envio.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start gap-2">
                                          <div className="flex items-start gap-3 flex-1 min-w-0">
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
                                              className="w-4 h-4 mt-1 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">
                                                  {envio.propiedad?.titulo || envio.propiedad?.ubicacion || envio.tituloExterno || 'Propiedad'}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${portal.color}`}>
                                                  {portal.nombre}
                                                </span>
                                              </div>
                                              {(envio.urlExterna || envio.propiedad?.urlMls) && (
                                                <a
                                                  href={envio.urlExterna || envio.propiedad?.urlMls}
                                                  target="_blank"
                                                  rel="noopener"
                                                  className="text-blue-600 text-xs hover:underline block mt-1 truncate"
                                                >
                                                  {envio.urlExterna || envio.propiedad?.urlMls}
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                          <select
                                            value={envio.respuesta || ''}
                                            onChange={(e) => handleActualizarRespuesta(envio.id, e.target.value)}
                                            className={`text-sm px-2 py-1 rounded border shrink-0 ${
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
                                            <option value="SIN_RESPUESTA">Sin respuesta</option>
                                          </select>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })
                        })()}
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
                      <div className="flex flex-col items-center gap-3 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        <p className="text-slate-500 font-medium">Sin comunicaciones</p>
                        <p className="text-sm text-slate-400">Registrá llamadas, WhatsApp y notas de seguimiento</p>
                      </div>
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
























































