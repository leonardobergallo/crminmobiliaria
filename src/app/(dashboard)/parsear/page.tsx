'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Cliente = {
  id: string
  nombreCompleto?: string | null
  nombre?: string | null
}

type Busqueda = {
  id: string
  tipoPropiedad?: string | null
  presupuestoTexto?: string | null
  presupuestoValor?: number | null
  moneda?: string | null
  dormitoriosMin?: number | null
  ubicacionPreferida?: string | null
  observaciones?: string | null
  origen?: string | null
  estado?: string | null
  createdAt?: string | null
}

function ParsearBusquedaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdFromUrl = searchParams.get('clienteId')

  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<any>(null)
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [busquedaId, setBusquedaId] = useState('')
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [linkExterno, setLinkExterno] = useState('')
  const [linkExternoTitulo, setLinkExternoTitulo] = useState('')
  const [linkSeleccionado, setLinkSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const me = await fetch('/api/auth/me')
        if (!me.ok) {
          router.push('/login')
          return
        }

        const resClientes = await fetch('/api/clientes')
        if (!resClientes.ok) {
          setClientes([])
          setLoading(false)
          return
        }
        const data = await resClientes.json()
        setClientes(Array.isArray(data) ? data : [])
      } catch {
        setClientes([])
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  useEffect(() => {
    if (clienteIdFromUrl) setClienteId(clienteIdFromUrl)
  }, [clienteIdFromUrl])

  useEffect(() => {
    const fetchBusquedasCliente = async () => {
      if (!clienteId) {
        setBusquedas([])
        setBusquedaId('')
        return
      }

      try {
        const res = await fetch(`/api/busquedas?clienteId=${encodeURIComponent(clienteId)}`)
        if (!res.ok) {
          setBusquedas([])
          return
        }
        const data = await res.json()
        setBusquedas(Array.isArray(data) ? data : [])
      } catch {
        setBusquedas([])
      }
    }

    fetchBusquedasCliente()
  }, [clienteId])

  const clienteLabel = useMemo(() => {
    const c = clientes.find(x => x.id === clienteId)
    return c?.nombreCompleto || c?.nombre || ''
  }, [clientes, clienteId])

  const busquedaSeleccionada = useMemo(() => {
    return busquedas.find(b => b.id === busquedaId) || null
  }, [busquedas, busquedaId])

  const buildMensajeFromBusqueda = (b: Busqueda) => {
    const partes: string[] = []
    partes.push('Hola, estoy buscando una propiedad')
    if (b.tipoPropiedad) partes.push(`tipo ${b.tipoPropiedad}`)
    if (b.ubicacionPreferida) partes.push(`en ${b.ubicacionPreferida}`)

    const moneda = b.moneda || 'USD'
    const desdeMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/desde\s+(\d+)/i) : null
    const rangoMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/(\d+)\s*[-–]\s*(\d+)/) : null

    if (rangoMatch) {
      const d = parseInt(rangoMatch[1])
      const h = parseInt(rangoMatch[2])
      if (!isNaN(d) && !isNaN(h)) partes.push(`presupuesto entre ${moneda} ${d} y ${h}`)
    } else if (desdeMatch) {
      const d = parseInt(desdeMatch[1])
      if (!isNaN(d)) partes.push(`presupuesto desde ${moneda} ${d}`)
    } else if (typeof b.presupuestoValor === 'number') {
      partes.push(`presupuesto hasta ${moneda} ${b.presupuestoValor}`)
    } else if (b.presupuestoTexto) {
      partes.push(`presupuesto hasta ${b.presupuestoTexto}`)
    }

    if (typeof b.dormitoriosMin === 'number' && b.dormitoriosMin > 0) {
      partes.push(`${b.dormitoriosMin} dormitorios mínimo`)
    }
    partes.push('Por favor enviame opciones')
    return partes.join(', ') + '.'
  }

  const toggleSeleccion = (key: string) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const verSeleccionadas = () => {
    if (!clienteId) return
    const items = Array.from(seleccionadas).map((k) => {
      const [tipo, idx] = k.split(':')
      const i = parseInt(idx, 10)
      if (tipo === 'scraped' && resultado?.scrapedItems?.[i]) return { tipo: 'scraped', item: { ...resultado.scrapedItems[i], url: resultado.scrapedItems[i]?.url || '' } }
      if (tipo === 'web' && resultado?.webMatches?.[i]) return { tipo: 'web', item: resultado.webMatches[i] }
      if (tipo === 'match' && resultado?.matches?.[i]) return { tipo: 'match', item: resultado.matches[i] }
      return null
    }).filter(Boolean)
    if (linkSeleccionado) {
      items.push({ tipo: 'externo', item: { url: linkSeleccionado, titulo: linkExternoTitulo || 'Link externo' } })
    }
    const params = new URLSearchParams()
    params.set('clienteId', clienteId)
    params.set('propSeleccionadas', JSON.stringify(items))
    window.location.href = `/gestion?${params.toString()}`
  }

  const guardarBusqueda = () => {
    if (!clienteId) return
    const items = Array.from(seleccionadas).map((k) => {
      const [tipo, idx] = k.split(':')
      const i = parseInt(idx, 10)
      if (tipo === 'scraped' && resultado?.scrapedItems?.[i]) return { tipo: 'scraped', item: { ...resultado.scrapedItems[i], url: resultado.scrapedItems[i]?.url || '' } }
      if (tipo === 'web' && resultado?.webMatches?.[i]) return { tipo: 'web', item: resultado.webMatches[i] }
      if (tipo === 'match' && resultado?.matches?.[i]) return { tipo: 'match', item: resultado.matches[i] }
      return null
    }).filter(Boolean)
    if (linkSeleccionado) {
      items.push({ tipo: 'externo', item: { url: linkSeleccionado, titulo: linkExternoTitulo || 'Link externo' } })
    }
    const params = new URLSearchParams()
    params.set('clienteId', clienteId)
    params.set('propSeleccionadas', JSON.stringify(items))
    window.location.href = `/gestion?${params.toString()}`
  }

  const analizar = async () => {
    if (!clienteId) {
      setError('Seleccioná un cliente')
      return
    }

    if (!busquedaSeleccionada) {
      setError('Seleccioná una búsqueda')
      return
    }

    setSubmitting(true)
    setError(null)
    setResultado(null)
    setSeleccionadas(new Set())
    try {
      const mensaje = buildMensajeFromBusqueda(busquedaSeleccionada)
      const res = await fetch('/api/parsear-busqueda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, guardar: false, clienteId: null }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Error al analizar')
        return
      }

      try {
        // No guardamos en localStorage para evitar duplicidad con Buscar con IA
      } catch {
        // ignore
      }

      setResultado(data)
    } catch (e: any) {
      setError(e?.message || 'Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">Buscar con IA</h1>
        <Button variant="outline" onClick={() => router.push('/busquedas')}>Volver</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombreCompleto || c.nombre || c.id}
              </option>
            ))}
          </select>
          {clienteId && (
            <div className="text-sm text-slate-600">Seleccionado: {clienteLabel}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={busquedaId}
            onChange={(e) => setBusquedaId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
            disabled={!clienteId}
          >
            <option value="">Seleccionar búsqueda...</option>
            {busquedas.map((b) => (
              <option key={b.id} value={b.id}>
                {(b.tipoPropiedad || 'Propiedad')}
                {b.ubicacionPreferida ? ` - ${b.ubicacionPreferida}` : ''}
                {b.presupuestoTexto ? ` - ${b.presupuestoTexto}` : ''}
              </option>
            ))}
          </select>

          {busquedaSeleccionada && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input readOnly value={`Tipo: ${busquedaSeleccionada.tipoPropiedad || '-'}`} />
              <Input readOnly value={`Ubicación: ${busquedaSeleccionada.ubicacionPreferida || '-'}`} />
              <Input readOnly value={`Presupuesto: ${busquedaSeleccionada.presupuestoTexto || '-'}`} />
              <Input readOnly value={`Dormitorios min: ${busquedaSeleccionada.dormitoriosMin ?? '-'}`} />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={analizar}
            >
              {submitting ? 'Analizando...' : 'Analizar (buscar propiedades)'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setBusquedaId('')
                setResultado(null)
                setError(null)
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link externo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Título del link..."
            value={linkExternoTitulo}
            onChange={(e) => setLinkExternoTitulo(e.target.value)}
          />
          <Input
            placeholder="Pegá un link de afuera..."
            value={linkExterno}
            onChange={(e) => setLinkExterno(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!linkExterno.trim()}
            onClick={() => setLinkSeleccionado(linkExterno.trim())}
          >
            Seleccionar link
          </Button>
          {linkSeleccionado && (
            <div className="text-sm text-green-700">
              ✅ Link seleccionado: {linkExternoTitulo || 'Sin título'} - {linkSeleccionado}
            </div>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input readOnly value={resultado?.guardado?.busquedaId ? `Guardado: ${resultado.guardado.busquedaId}` : 'No guardado'} />

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              Análisis completado.
              {clienteLabel ? (
                <span className="ml-1">Cliente: <span className="font-semibold">{clienteLabel}</span>.</span>
              ) : null}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                disabled={!clienteId}
                onClick={() => {
                  if (!clienteId) return
                  window.location.href = `/gestion?clienteId=${clienteId}`
                }}
              >
                Ir a Gestión del Cliente
              </Button>
              {(linkSeleccionado || seleccionadas.size > 0) && (
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={guardarBusqueda}
                >
                  Guardar búsqueda y pasar a Gestión del Cliente
                </Button>
              )}
            </div>

            {Array.isArray(resultado?.scrapedItems) && resultado.scrapedItems.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-800">
                  Oportunidades en Portales ({resultado.scrapedItems.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resultado.scrapedItems.map((item: any, idx: number) => (
                    <div key={`${item?.url || idx}`} className="flex gap-3 p-3 bg-white border rounded-lg">
                      <input
                        type="checkbox"
                        checked={seleccionadas.has(`scraped:${idx}`)}
                        onChange={() => toggleSeleccion(`scraped:${idx}`)}
                        className="mt-1"
                      />
                      {item?.img ? (
                        <img
                          src={item.img}
                          alt={item?.titulo || 'propiedad'}
                          className="w-20 h-20 object-cover rounded"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded bg-slate-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-500">
                          {item?.sitio || 'Portal'}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 line-clamp-2">
                          {item?.titulo || '-'}
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-1">
                          {item?.precio || '-'}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1">
                          {item?.ubicacion || '-'}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {item?.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Ver
                            </a>
                          )}
                          <div className="text-xs text-slate-500">
                            📍 {item?.url || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(resultado?.webMatches) && resultado.webMatches.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-800">
                  Links sugeridos ({resultado.webMatches.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {resultado.webMatches.map((w: any, idx: number) => (
                    <div key={`${w?.url || idx}`} className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm">
                      <input
                        type="checkbox"
                        checked={seleccionadas.has(`web:${idx}`)}
                        onChange={() => toggleSeleccion(`web:${idx}`)}
                        className="mt-1"
                      />
                      <div className="text-2xl">{w?.icon || '🌐'}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {w?.sitio || 'Link'}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1">
                          {w?.titulo || w?.url}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {w?.url && (
                          <a
                            href={w.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Ver
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(resultado?.matches) && resultado.matches.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-800">
                  Propiedades del CRM ({resultado.matches.length})
                </div>
                <div className="space-y-2">
                  {resultado.matches.map((m: any, idx: number) => (
                    <div key={`${m?.id || idx}`} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <input
                          type="checkbox"
                          checked={seleccionadas.has(`match:${idx}`)}
                          onChange={() => toggleSeleccion(`match:${idx}`)}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {m?.titulo || m?.propiedad?.titulo || 'Propiedad'}
                          </div>
                          <div className="text-xs text-slate-600 line-clamp-1">
                            {m?.ubicacion || m?.propiedad?.ubicacion || '-'}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                          {m?.precio ? `${m?.moneda || ''} ${m?.precio}` : (m?.propiedad?.precio ? `${m?.propiedad?.moneda || ''} ${m?.propiedad?.precio}` : '-')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ParsearBusquedaPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <ParsearBusquedaContent />
    </Suspense>
  )
}
