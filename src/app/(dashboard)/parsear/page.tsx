'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FiltrosAvanzados, { FiltrosBusqueda } from '@/components/busqueda/FiltrosAvanzados'
import { Checkbox } from '@/components/ui/checkbox'

interface PropiedadMatch {
  id: string
  titulo: string
  precio: number
  moneda: string
  ubicacion: string
  dormitorios: number
  inmobiliaria: {
    nombre: string
    email: string
    whatsapp: string
    slug: string | null
  } | null
}

interface WebMatch {
  sitio: string
  titulo: string
  url: string
  icon: string
  categoria?: string
}

interface ScrapedItem {
  sitio: string
  titulo: string
  precio: string
  ubicacion: string
  url: string
  img: string | null
}

interface BusquedaParseada {
  nombreCliente: string | null
  telefono: string | null
  tipoPropiedad: string
  operacion: string
  presupuestoMin: number | null
  presupuestoMax: number | null
  moneda: string
  zonas: string[]
  dormitoriosMin: number | null
  ambientesMin: number | null
  cochera: boolean
  caracteristicas: string[]
  notas: string
  confianza: number
}

interface ResultadoGuardado {
  clienteId: string
  clienteNombre: string
  busquedaId: string
}

interface Cliente {
  id: string
  nombreCompleto: string
  telefono?: string
  email?: string
}

interface BusquedaExistente {
  id: string
  tipoPropiedad?: string | null
  presupuestoTexto?: string | null
  presupuestoValor?: number | null
  moneda?: string | null
  dormitoriosMin?: number | null
  cochera?: string | null
  ubicacionPreferida?: string | null
  observaciones?: string | null
  createdAt: string
}

function ParsearBusquedaContent() {
  const searchParams = useSearchParams()
  const clienteIdFromUrl = searchParams.get('clienteId')

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(clienteIdFromUrl || '')
  const [busquedasCliente, setBusquedasCliente] = useState<BusquedaExistente[]>([])
  const [busquedaSeleccionada, setBusquedaSeleccionada] = useState<string>('')
  const [crearNuevoCliente, setCrearNuevoCliente] = useState(false)
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [resultado, setResultado] = useState<BusquedaParseada | null>(null)
  const [matches, setMatches] = useState<PropiedadMatch[]>([])
  const [webMatches, setWebMatches] = useState<WebMatch[]>([])
  const [scrapedItems, setScrapedItems] = useState<ScrapedItem[]>([])
  const [guardado, setGuardado] = useState<ResultadoGuardado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usandoIA, setUsandoIA] = useState<boolean>(false)

  // Estado para vinculación manual
  const [formManual, setFormManual] = useState({ titulo: '', url: '', nota: '' })
  const [mostrandoManual, setMostrandoManual] = useState(false)

  // Nuevos estados para filtros y selección
  const [propiedadesSeleccionadas, setPropiedadesSeleccionadas] = useState<Set<string>>(new Set())
  const [modoAvanzado, setModoAvanzado] = useState(true) // Por defecto en modo filtros

  useEffect(() => {
    fetchClientes()
  }, [])

  useEffect(() => {
    // Si hay clienteId en la URL, seleccionarlo automáticamente
    if (clienteIdFromUrl && clientes.length > 0 && !clienteSeleccionado) {
      setClienteSeleccionado(clienteIdFromUrl)
    }
  }, [clienteIdFromUrl, clientes, clienteSeleccionado])

  useEffect(() => {
    // Cargar búsquedas del cliente cuando se selecciona
    if (clienteSeleccionado) {
      fetchBusquedasCliente()
    } else {
      setBusquedasCliente([])
      setBusquedaSeleccionada('')
    }
  }, [clienteSeleccionado])

  const fetchBusquedasCliente = async () => {
    if (!clienteSeleccionado) return
    try {
      const response = await fetch(`/api/busquedas?clienteId=${clienteSeleccionado}`)
      if (response.ok) {
        const data = await response.json()
        setBusquedasCliente(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error cargando búsquedas:', error)
      setBusquedasCliente([])
    }
  }

  const [filtrosPrellenados, setFiltrosPrellenados] = useState<Partial<FiltrosBusqueda> | undefined>(undefined)

  const seleccionarBusqueda = (busquedaId: string) => {
    setBusquedaSeleccionada(busquedaId)
    const busqueda = busquedasCliente.find(b => b.id === busquedaId)

    if (busqueda) {
      // 1. Extraer mensaje original para el parser de texto (comportamiento anterior)
      if (busqueda.observaciones) {
        const observaciones = busqueda.observaciones
        const mensajeOriginal = observaciones.includes('--- Mensaje original ---')
          ? observaciones.split('--- Mensaje original ---')[1]?.trim() || ''
          : observaciones

        // Si no hay mensaje original explícito, generar uno
        if (!mensajeOriginal || mensajeOriginal === observaciones) {
          let mensajeGenerado = `Busco ${busqueda.tipoPropiedad?.toLowerCase() || 'propiedad'}`
          if (busqueda.presupuestoTexto) mensajeGenerado += ` hasta ${busqueda.presupuestoTexto}`
          if (busqueda.ubicacionPreferida) mensajeGenerado += ` en ${busqueda.ubicacionPreferida}`
          setMensaje(mensajeGenerado)
        } else {
          setMensaje(mensajeOriginal)
        }
      }

      // 2. Prellenar Filtros Avanzados
      // Intentar parsear ubicación: "Barrio, Ciudad, Provincia"
      let barrio = '', ciudad = '', provincia = ''
      if (busqueda.ubicacionPreferida) {
        const partes = busqueda.ubicacionPreferida.split(',').map(s => s.trim())
        // Asumimos formato: Barrio, Ciudad, Provincia (o parcial)
        if (partes.length >= 1) barrio = partes[0]
        if (partes.length >= 2) ciudad = partes[1]
        if (partes.length >= 3) provincia = partes[2]
      }

      setFiltrosPrellenados({
        tipoPropiedad: busqueda.tipoPropiedad || '',
        moneda: busqueda.moneda || 'USD',
        precioHasta: busqueda.presupuestoValor ? busqueda.presupuestoValor.toString() : '',
        dormitoriosMin: busqueda.dormitoriosMin ? busqueda.dormitoriosMin.toString() : '',
        cochera: busqueda.cochera === 'SI',
        barrio,
        ciudad,
        provincia: provincia || 'Santa Fe' // Default
      })

      // Activar modo avanzado para ver los filtros
      setModoAvanzado(true)
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
      console.error('Error cargando clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  const crearCliente = async () => {
    if (!nuevoClienteNombre.trim()) {
      setError('El nombre del cliente es requerido')
      return
    }

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto: nuevoClienteNombre,
          telefono: nuevoClienteTelefono || null,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear cliente')
      }

      const nuevoCliente = await res.json()
      setClientes([...clientes, nuevoCliente])
      setClienteSeleccionado(nuevoCliente.id)
      setCrearNuevoCliente(false)
      setNuevoClienteNombre('')
      setNuevoClienteTelefono('')
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const parsearMensaje = async (guardar: boolean = false) => {
    if (!mensaje.trim()) {
      setError('Pegá un mensaje de WhatsApp para analizar')
      return
    }

    // Validación mejorada para guardar
    if (guardar) {
      if (!clienteSeleccionado && !crearNuevoCliente) {
        setError('Seleccioná un cliente o creá uno nuevo para guardar la búsqueda')
        return
      }
      if (crearNuevoCliente && !nuevoClienteNombre.trim()) {
        setError('Ingresá el nombre del nuevo cliente')
        return
      }
    }

    setLoading(true)
    setError(null)
    setGuardado(null)
    setMatches([])
    setWebMatches([])
    setScrapedItems([])

    try {
      // Determinar el clienteId a usar
      let clienteId = clienteSeleccionado

      // Si está creando un nuevo cliente, primero crearlo
      if (guardar && crearNuevoCliente) {
        try {
          const res = await fetch('/api/clientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombreCompleto: nuevoClienteNombre.trim(),
              telefono: nuevoClienteTelefono.trim() || null
            })
          })

          if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Error al crear el cliente')
          }

          const nuevoCliente = await res.json()
          clienteId = nuevoCliente.id

          // Actualizar la lista de clientes y seleccionar el nuevo
          await fetchClientes()
          setClienteSeleccionado(clienteId)
          setCrearNuevoCliente(false)
          setNuevoClienteNombre('')
          setNuevoClienteTelefono('')
        } catch (err: any) {
          throw new Error(`Error al crear cliente: ${err.message}`)
        }
      }

      const res = await fetch('/api/parsear-busqueda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje,
          guardar,
          clienteId: guardar ? clienteId : null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar')
      }

      setResultado(data.busquedaParseada)
      setMatches(data.matches || [])
      setWebMatches(data.webMatches || [])
      setScrapedItems(data.scrapedItems || [])
      setUsandoIA(data.usandoIA || false)

      if (data.guardado) {
        setGuardado(data.guardado)
        // Recargar búsquedas del cliente
        if (clienteId) {
          fetchBusquedasCliente()
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Estado para vincular a CRM
  const [vinculandoId, setVinculandoId] = useState<string | null>(null)
  const [vinculados, setVinculados] = useState<Set<string>>(new Set())

  const vincularAlCliente = async (item: { url?: string, titulo: string, propiedadId?: string, mensaje?: string }) => {
    if (!clienteSeleccionado) {
      setError('Por favor, selecciona o crea un cliente primero.')
      return
    }

    const uniqueId = item.url || item.propiedadId || 'manual'
    setVinculandoId(uniqueId)
    try {
      const res = await fetch('/api/envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: clienteSeleccionado,
          propiedadId: item.propiedadId,
          urlExterna: item.url,
          tituloExterno: item.titulo,
          mensaje: item.mensaje, // Para guardar el resultado/nota manual
          canal: 'WHATSAPP'
        })
      })

      if (res.ok) {
        setVinculados(prev => new Set(prev).add(uniqueId))
      } else {
        const data = await res.json()
        setError(data.error || 'Error al vincular')
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión')
    } finally {
      setVinculandoId(null)
    }
  }

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 80) return 'text-green-600 bg-green-100'
    if (confianza >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const limpiar = () => {
    setMensaje('')
    setResultado(null)
    setMatches([])
    setWebMatches([])
    setScrapedItems([])
    setGuardado(null)
    setError(null)
    setBusquedaSeleccionada('')
    setUsandoIA(false)
    // No limpiar cliente seleccionado para mantener contexto
    setCrearNuevoCliente(false)
  }

  const compartirSeleccion = () => {
    if (scrapedItems.length === 0) return

    // Generar título de la búsqueda con formato mejorado
    let tituloBusqueda = 'Búsqueda de Propiedades'
    if (resultado) {
      const partes: string[] = []

      // Tipo de propiedad
      if (resultado.tipoPropiedad && resultado.tipoPropiedad !== 'OTRO') {
        const tipoMap: Record<string, string> = {
          'DEPARTAMENTO': 'departamento',
          'CASA': 'casa',
          'TERRENO': 'terreno',
          'PH': 'PH',
          'LOCAL': 'local',
          'OFICINA': 'oficina'
        }
        partes.push(tipoMap[resultado.tipoPropiedad] || resultado.tipoPropiedad.toLowerCase())
      }

      // Zonas
      if (resultado.zonas.length > 0) {
        partes.push(`en ${resultado.zonas.join(', ')}`)
      }

      // Presupuesto
      if (resultado.presupuestoMax) {
        const monedaSimbolo = resultado.moneda === 'USD' ? 'USD' : '$'
        partes.push(`hasta ${monedaSimbolo} ${resultado.presupuestoMax.toLocaleString('es-AR')}`)
      }

      // Dormitorios
      if (resultado.dormitoriosMin) {
        const dormText = resultado.dormitoriosMin === 1 ? 'un dormitorio' : `${resultado.dormitoriosMin} dormitorios`
        partes.push(`con ${dormText}`)
      }

      // Operación (si es alquiler, mencionarlo)
      if (resultado.operacion === 'ALQUILER') {
        partes.unshift('alquiler de')
      }

      if (partes.length > 0) {
        tituloBusqueda = partes.join(' - ')
      }
    }

    // Construir mensaje con formato mejorado
    let texto = `*🔍 Búsqueda: ${tituloBusqueda}*\n\n`
    texto += `*Oportunidades Encontradas en la Web* 🏠\n\n`

    // Filtrar items que parezcan ser elementos de UI antes de mostrar
    const itemsValidos = scrapedItems.filter(item => {
      const tituloLower = item.titulo.toLowerCase().trim()
      const palabrasUI = [
        'buscar solo', 'filtrar', 'moneda:', 'limpiar', 'aplicar',
        'argentina', 'uruguay', 'paraguay', 'brasil', 'emiratos', 'españa',
        'estados unidos', 'seleccionar', 'opciones'
      ]
      return !palabrasUI.some(palabra => tituloLower.includes(palabra)) &&
        tituloLower.length > 10 &&
        !tituloLower.match(/^\([0-9]+\)$/)
    })

    itemsValidos.forEach((item, index) => {
      // Limpiar ubicación (remover información redundante)
      let ubicacionLimpia = item.ubicacion
      // Remover "Argentina" al final si está
      ubicacionLimpia = ubicacionLimpia.replace(/,\s*Argentina\s*$/i, '')
      // Remover duplicados de "Santa Fe"
      ubicacionLimpia = ubicacionLimpia.replace(/Santa Fe[^,]*,\s*Santa Fe/gi, 'Santa Fe')

      texto += `*${item.titulo}*\n`
      texto += `💰 ${item.precio}\n`
      texto += `📍 ${ubicacionLimpia}\n`
      texto += `🔗 ${item.url}\n`

      // Agregar separador entre items (excepto el último)
      if (index < itemsValidos.length - 1) {
        texto += `\n`
      }
    })

    navigator.clipboard.writeText(texto)
    alert('¡Lista copiada al portapapeles! Lista para pegar en WhatsApp.')
  }

  // Manejar búsqueda avanzada
  const handleBusquedaAvanzada = async (filtros: FiltrosBusqueda) => {
    setLoading(true)
    setError(null)
    setMatches([])
    setPropiedadesSeleccionadas(new Set()) // Limpiar selección anterior

    try {
      const res = await fetch('/api/busqueda-avanzada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...filtros,
          guardar: !!clienteSeleccionado, // Guardar si hay cliente
          clienteId: clienteSeleccionado,
          mensajeWhatsApp: mensaje // Opcional: incluir mensaje si existe
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error en la búsqueda')
      }

      setMatches(data.propiedades || [])
      setResultado(null) // Limpiar resultado de parser anterior para no confundir

      if (data.propiedades.length === 0) {
        alert('No se encontraron propiedades con esos filtros.')
      }

      if (data.busqueda) {
        setGuardado({
          clienteId: data.busqueda.clienteId,
          clienteNombre: 'Cliente', // TODO: Mejorar esto trayendo nombre real
          busquedaId: data.busqueda.id
        })
        if (clienteSeleccionado) fetchBusquedasCliente()
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Manejar checkbox de selección
  const toggleSeleccion = (id: string) => {
    const newSet = new Set(propiedadesSeleccionadas)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setPropiedadesSeleccionadas(newSet)
  }

  // Seleccionar/Deseleccionar todo
  const toggleSeleccionTodo = () => {
    if (propiedadesSeleccionadas.size === matches.length && matches.length > 0) {
      setPropiedadesSeleccionadas(new Set())
    } else {
      setPropiedadesSeleccionadas(new Set(matches.map(m => m.id)))
    }
  }

  // Enviar selección por WhatsApp
  const enviarSeleccionWhatsApp = () => {
    if (propiedadesSeleccionadas.size === 0) return

    const seleccionadasDB = matches.filter(m => propiedadesSeleccionadas.has(m.id))
    const seleccionadasWeb = scrapedItems.filter(m => propiedadesSeleccionadas.has(m.url))

    const todasSeleccionadas = [...seleccionadasDB, ...seleccionadasWeb]
    if (todasSeleccionadas.length === 0) return

    const cliente = clientes.find(c => c.id === clienteSeleccionado)

    // Registrar envíos en BD
    seleccionadasDB.forEach(p => {
      vincularAlCliente({
        propiedadId: p.id,
        titulo: p.titulo,
        url: '',
        mensaje: 'Enviado desde Búsqueda Avanzada'
      })
    })

    seleccionadasWeb.forEach(p => {
      vincularAlCliente({
        url: p.url,
        titulo: `${p.sitio}: ${p.titulo}`,
        mensaje: 'Enviado desde Búsqueda Avanzada (Web)'
      })
    })

    // Generar mensaje
    let texto = `*Hola${cliente ? ' ' + cliente.nombreCompleto.split(' ')[0] : ''}! Te paso estas opciones:*\n\n`

    seleccionadasDB.forEach((p) => {
      const precioFmt = `${p.moneda} ${p.precio.toLocaleString()}`
      texto += `🏠 *${p.titulo}*\n`
      texto += `💰 ${precioFmt}\n`
      texto += `📍 ${p.ubicacion}\n`
      if (p.dormitorios) texto += `🛏️ ${p.dormitorios} dorm\n`
      texto += `\n`
    })

    seleccionadasWeb.forEach((p) => {
      texto += `🌐 *${p.titulo}* (${p.sitio})\n`
      texto += `💰 ${p.precio}\n`
      texto += `📍 ${p.ubicacion}\n`
      texto += `🔗 ${p.url}\n\n`
    })

    // Abrir WhatsApp
    const telefono = cliente?.telefono?.replace(/\D/g, '')
    const url = telefono
      ? `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`

    window.open(url, '_blank')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔍 Analizar Búsqueda de Cliente</h1>
        <p className="text-slate-600 mt-1">
          Seleccioná un cliente, pegá el mensaje de WhatsApp y el sistema extraerá los datos automáticamente
        </p>
      </div>

      {/* Selección de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            👤 Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!crearNuevoCliente ? (
            <>
              <div className="flex gap-3">
                <select
                  value={clienteSeleccionado}
                  onChange={(e) => setClienteSeleccionado(e.target.value)}
                  className="flex-1 h-10 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || loadingClientes}
                >
                  <option value="">Seleccionar cliente existente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombreCompleto} {cliente.telefono ? `(${cliente.telefono})` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => setCrearNuevoCliente(true)}
                  variant="outline"
                  disabled={loading || loadingClientes}
                >
                  ➕ Nuevo Cliente
                </Button>
              </div>
              {clienteSeleccionado && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      ✅ Cliente seleccionado: <strong>{clientes.find(c => c.id === clienteSeleccionado)?.nombreCompleto}</strong>
                    </p>
                  </div>

                  {/* Selector de búsquedas existentes */}
                  {busquedasCliente.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-700">
                        🔍 Seleccionar búsqueda existente (opcional):
                      </label>
                      <select
                        value={busquedaSeleccionada}
                        onChange={(e) => {
                          if (e.target.value) {
                            seleccionarBusqueda(e.target.value)
                          } else {
                            setBusquedaSeleccionada('')
                            setMensaje('')
                          }
                        }}
                        className="w-full h-10 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- Seleccionar búsqueda para ver su mensaje --</option>
                        {busquedasCliente.map((busqueda) => {
                          const descripcion = `${busqueda.tipoPropiedad || 'Propiedad'} - ${busqueda.presupuestoTexto || 'Sin presupuesto'}${busqueda.ubicacionPreferida ? ` (${busqueda.ubicacionPreferida})` : ''}`
                          return (
                            <option key={busqueda.id} value={busqueda.id}>
                              {descripcion} - {new Date(busqueda.createdAt).toLocaleDateString('es-AR')}
                            </option>
                          )
                        })}
                      </select>
                      {busquedaSeleccionada && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 El mensaje original se cargó en el campo de abajo. Puedes editarlo y re-analizar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">Crear Nuevo Cliente</h3>
              <Input
                placeholder="Nombre completo del cliente"
                value={nuevoClienteNombre}
                onChange={(e) => setNuevoClienteNombre(e.target.value)}
                className="bg-white"
              />
              <Input
                placeholder="Teléfono (opcional)"
                value={nuevoClienteTelefono}
                onChange={(e) => setNuevoClienteTelefono(e.target.value)}
                className="bg-white"
              />
              <div className="flex gap-2">
                <Button
                  onClick={crearCliente}
                  disabled={!nuevoClienteNombre.trim() || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ✅ Crear Cliente
                </Button>
                <Button
                  onClick={() => {
                    setCrearNuevoCliente(false)
                    setNuevoClienteNombre('')
                    setNuevoClienteTelefono('')
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN DE FILTROS AVANZADOS */}
      {
        modoAvanzado && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <FiltrosAvanzados
              onBuscar={handleBusquedaAvanzada}
              loading={loading}
              valoresIniciales={filtrosPrellenados}
            />
          </div>
        )
      }

      {/* Input de mensaje */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📱 Mensaje de WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={`Pegá aquí el mensaje de WhatsApp...

Ejemplo:
"Hola! Estoy buscando un depto de 2 dormitorios en zona norte, preferentemente Palermo o Belgrano. Mi presupuesto es de hasta 150.000 pesos. Necesito cochera. Gracias! María - 1155443322"`}
            className="w-full h-48 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <div className="flex gap-3">
            <Button
              onClick={() => parsearMensaje(false)}
              disabled={loading || !mensaje.trim()}
              variant="outline"
              className="flex-1"
            >
              {loading ? '⏳ Analizando...' : '🔍 Analizar'}
            </Button>
            <Button
              onClick={() => parsearMensaje(true)}
              disabled={loading || !mensaje.trim() || (!clienteSeleccionado && !crearNuevoCliente)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              title={(!clienteSeleccionado && !crearNuevoCliente) ? 'Seleccioná un cliente primero' : ''}
            >
              {loading ? '⏳ Guardando...' : '💾 Analizar y Guardar'}
            </Button>
            <Button
              onClick={limpiar}
              variant="outline"
              disabled={loading}
            >
              🗑️
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {
        error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">❌ {error}</p>
            </CardContent>
          </Card>
        )
      }


      {/* Resultado guardado */}
      {
        guardado && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="p-4">
              <p className="text-green-700 font-medium">
                ✅ Búsqueda guardada exitosamente
              </p>
              <p className="text-green-600 text-sm mt-1">
                Cliente: <strong>{guardado.clienteNombre}</strong>
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.href = `/gestion?clienteId=${guardado.clienteId}`}
                >
                  👤 Ver Cliente Completo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/busquedas`, '_blank')}
                >
                  🔍 Ver Todas las Búsquedas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/gestion?clienteId=${guardado.clienteId}&tab=sugerencias`, '_blank')}
                >
                  🎯 Ver Propiedades Sugeridas
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Resultado del análisis */}
      {
        resultado && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>📊 Resultado del Análisis</span>
                  {usandoIA ? (
                    <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded-full border border-purple-200">
                      🤖 Procesado con IA
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                      ⚙️ Parser Local
                    </span>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfianzaColor(resultado.confianza)}`}>
                  Confianza: {resultado.confianza}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Cliente</label>
                  <p className="font-medium">
                    {resultado.nombreCliente || '(No detectado)'}
                  </p>
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Teléfono</label>
                  <p className="font-medium">
                    {resultado.telefono || '(No detectado)'}
                  </p>
                </div>

                {/* Tipo */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Tipo de Propiedad</label>
                  <p className="font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded inline-block">
                    {resultado.tipoPropiedad}
                  </p>
                </div>

                {/* Operación */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Operación</label>
                  <p className={`font-medium px-2 py-1 rounded inline-block ${resultado.operacion === 'ALQUILER'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {resultado.operacion}
                  </p>
                </div>

                {/* Presupuesto */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Presupuesto</label>
                  <p className="font-medium">
                    {resultado.presupuestoMax
                      ? `${resultado.moneda} ${resultado.presupuestoMax.toLocaleString()}`
                      : '(No especificado)'}
                    {resultado.presupuestoMin && resultado.presupuestoMin !== resultado.presupuestoMax && (
                      <span className="text-slate-500 text-sm">
                        {' '}(desde {resultado.moneda} {resultado.presupuestoMin.toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>

                {/* Dormitorios */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Dormitorios mín.</label>
                  <p className="font-medium">
                    {resultado.dormitoriosMin ? `${resultado.dormitoriosMin}+` : '(No especificado)'}
                  </p>
                </div>

                {/* Zonas */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Zonas preferidas</label>
                  <div className="flex flex-wrap gap-2">
                    {resultado.zonas.length > 0 ? (
                      resultado.zonas.map((zona, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 rounded text-sm">
                          📍 {zona}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">(No especificadas)</span>
                    )}
                  </div>
                </div>

                {/* Características */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-slate-500 uppercase">Características</label>
                  <div className="flex flex-wrap gap-2">
                    {resultado.cochera && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        🚗 Cochera
                      </span>
                    )}
                    {resultado.caracteristicas.map((car, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 rounded text-sm">
                        ✓ {car}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                {resultado.notas && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-slate-500 uppercase">Notas adicionales</label>
                    <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded">
                      {resultado.notas}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* RESULTADOS DE PROPIEDADES (DB) */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              🏡 Propiedades Encontradas ({matches.length})
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSeleccionTodo}
              >
                {propiedadesSeleccionadas.size === matches.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </Button>
              {propiedadesSeleccionadas.size > 0 && (
                <Button
                  className="bg-green-600 hover:bg-green-700 animate-in zoom-in duration-200"
                  onClick={enviarSeleccionWhatsApp}
                >
                  📲 Enviar Selección ({propiedadesSeleccionadas.size})
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((propiedad) => (
              <Card key={propiedad.id} className={`overflow-hidden transition-all duration-200 ${propiedadesSeleccionadas.has(propiedad.id)
                ? 'ring-2 ring-green-500 bg-green-50/30'
                : 'hover:shadow-md'
                }`}>
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start">
                    <Checkbox
                      checked={propiedadesSeleccionadas.has(propiedad.id)}
                      onCheckedChange={() => toggleSeleccion(propiedad.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-slate-900 leading-tight">
                          {propiedad.titulo}
                        </h3>
                        <span className="font-bold text-green-700 whitespace-nowrap bg-green-100 px-2 py-0.5 rounded text-sm ml-2">
                          {propiedad.moneda} {propiedad.precio.toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-y-1 gap-x-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          📍 {propiedad.ubicacion}
                        </span>
                        {propiedad.dormitorios > 0 && (
                          <span className="flex items-center gap-1">
                            🛏️ {propiedad.dormitorios} dorm
                          </span>
                        )}
                      </div>

                      {propiedad.inmobiliaria && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          🏢 {propiedad.inmobiliaria.nombre}
                          {propiedad.inmobiliaria.whatsapp && (
                            <span className="text-green-600">• WA: {propiedad.inmobiliaria.whatsapp}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resultados WEB (Smart Links Categorizados) */}
      {
        webMatches.length > 0 && (
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌐 Búsqueda Inteligente en la Web
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* 1. Portales Inmobiliarios */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  ⚡ Portales Inmobiliarios
                  <span className="h-px bg-slate-300 flex-1"></span>
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {webMatches.filter((w: any) => w.categoria === 'PORTALES' || !w.categoria).map((web, i) => (
                    <a
                      key={i}
                      href={web.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-all hover:border-indigo-300 group"
                    >
                      <span className="text-2xl">{web.icon}</span>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                          {web.sitio}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {web.titulo}
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-indigo-500">
                        ↗️
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* 2. Inmobiliarias y Redes */}
              {webMatches.some((w: any) => w.categoria === 'INMOBILIARIAS') && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    🏦 Inmobiliarias y Redes
                    <span className="h-px bg-slate-300 flex-1"></span>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {webMatches.filter((w: any) => w.categoria === 'INMOBILIARIAS').map((web, i) => (
                      <a
                        key={i}
                        href={web.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-all hover:border-indigo-300 group"
                      >
                        <span className="text-2xl">{web.icon}</span>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                            {web.sitio}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {web.titulo}
                          </div>
                        </div>
                        <div className="text-slate-400 group-hover:text-indigo-500">
                          ↗️
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Portales Internacionales */}
              {webMatches.some((w: any) => w.categoria === 'INTERNACIONALES') && (
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    🌍 Portales Internacionales
                    <span className="h-px bg-slate-300 flex-1"></span>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {webMatches.filter((w: any) => w.categoria === 'INTERNACIONALES').map((web, i) => (
                      <a
                        key={i}
                        href={web.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-all hover:border-indigo-300 group"
                      >
                        <span className="text-2xl">{web.icon}</span>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                            {web.sitio}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {web.titulo}
                          </div>
                        </div>
                        <div className="text-slate-400 group-hover:text-indigo-500">
                          ↗️
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        )
      }

      {/* Opción de Carga Manual */}
      {
        clienteSeleccionado && (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="pt-6">
              {!mostrandoManual ? (
                <Button
                  variant="ghost"
                  className="w-full border-dashed border-2 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 py-6 h-auto"
                  onClick={() => setMostrandoManual(true)}
                >
                  ➕ ¿Encontraste otra propiedad? Cargala manualmente al historial
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Cargar propiedad manual</h3>
                    <Button variant="ghost" size="sm" onClick={() => setMostrandoManual(false)}>Cancelar</Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Título / Descripción</label>
                      <Input
                        placeholder="Ej: Depto 2 amb en Recoleta"
                        value={formManual.titulo}
                        onChange={e => setFormManual({ ...formManual, titulo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Link / URL (opcional)</label>
                      <Input
                        placeholder="https://..."
                        value={formManual.url}
                        onChange={e => setFormManual({ ...formManual, url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Resultado / Nota (opcional)</label>
                    <Input
                      placeholder="Ej: Interesado, visitado, etc."
                      value={formManual.nota}
                      onChange={e => setFormManual({ ...formManual, nota: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full bg-slate-800 hover:bg-slate-900"
                    disabled={!formManual.titulo || vinculandoId === 'manual'}
                    onClick={async () => {
                      setVinculandoId('manual')
                      await vincularAlCliente({
                        url: formManual.url || undefined,
                        titulo: `MANUAL: ${formManual.titulo}`,
                        mensaje: formManual.nota // Pasamos la nota como mensaje
                      })
                      setFormManual({ titulo: '', url: '', nota: '' })
                      setMostrandoManual(false)
                      setVinculandoId(null)
                    }}
                  >
                    {vinculandoId === 'manual' ? 'Guardando...' : '📥 Guardar en Gestión del Cliente'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* Resultados SCRAPED (Web en vivo) */}
      {
        scrapedItems.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span>🌐 Oportunidades en la Web</span>
                  <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded-full border hidden sm:inline-block">
                    MercadoLibre + ArgenProp + Remax...
                  </span>
                  {propiedadesSeleccionadas.size > 0 && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white ml-2 animate-in zoom-in"
                      onClick={enviarSeleccionWhatsApp}
                    >
                      📲 Enviar ({propiedadesSeleccionadas.size})
                    </Button>
                  )}
                </div>
                <Button onClick={compartirSeleccion} size="sm" variant="outline" className="text-xs">
                  � Copiar Lista Texto
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scrapedItems.map((item, i) => (
                <div key={i} className={`flex gap-4 p-3 bg-white rounded-lg border transition-all ${propiedadesSeleccionadas.has(item.url) ? 'ring-2 ring-green-500 bg-green-50/30' : 'hover:shadow-md'
                  }`}>
                  <div className="flex items-center">
                    <Checkbox
                      checked={propiedadesSeleccionadas.has(item.url)}
                      onCheckedChange={() => toggleSeleccion(item.url)}
                    />
                  </div>
                  {item.img && (
                    <img src={item.img} alt="propiedad" className="w-24 h-24 object-cover rounded hidden sm:block" />
                  )}
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {item.sitio}
                    </div>
                    <h4 className="font-semibold text-slate-800 line-clamp-2 text-sm sm:text-base">{item.titulo}</h4>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-lg font-bold text-slate-900">{item.precio}</span>
                      <span className="text-sm text-slate-500">📍 {item.ubicacion}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end justify-center min-w-[100px]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      🔎 Ver
                    </Button>
                    <Button
                      variant={vinculados.has(item.url) ? "ghost" : "default"}
                      size="sm"
                      className={`w-full text-xs ${vinculados.has(item.url) ? "text-green-600 border-green-200" : "bg-indigo-600 hover:bg-indigo-700"}`}
                      disabled={!clienteSeleccionado || vinculandoId === item.url || vinculados.has(item.url)}
                      onClick={() => vincularAlCliente({ url: item.url, titulo: `${item.sitio}: ${item.titulo}` })}
                    >
                      {vinculados.has(item.url) ? 'Guardado' : '📥 Guardar'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      }

      {/* Ejemplos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Ejemplos de mensajes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'Hola busco depto 2 amb en palermo hasta 120mil. Con cochera si puede ser. Soy Juan 1155443322',
            'Necesito alquilar casa de 3 dormitorios en zona sur, presupuesto 200.000 pesos. María',
            'Busco PH en villa crespo o chacarita, hasta 100k dólares para comprar',
          ].map((ejemplo, i) => (
            <button
              key={i}
              onClick={() => setMensaje(ejemplo)}
              className="block w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm transition-colors"
            >
              &ldquo;{ejemplo}&rdquo;
            </button>
          ))}
        </CardContent>
      </Card>
    </div >
  )
}

export default function ParsearBusquedaPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    }>
      <ParsearBusquedaContent />
    </Suspense>
  )
}
