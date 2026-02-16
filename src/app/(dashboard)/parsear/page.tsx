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

const BUSQUEDA_DRAFT_KEY = 'busquedaDraftFromUltimaWeb'

function toTimestamp(value?: string | null) {
  if (!value) return 0
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? 0 : t
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
  const [busquedaFiltro, setBusquedaFiltro] = useState('')
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

  const busquedasOrdenadas = useMemo(() => {
    return [...busquedas].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
  }, [busquedas])

  useEffect(() => {
    if (!busquedasOrdenadas.length) {
      setBusquedaId('')
      return
    }
    if (!busquedaId || !busquedasOrdenadas.some((b) => b.id === busquedaId)) {
      setBusquedaId(busquedasOrdenadas[0].id)
    }
  }, [busquedasOrdenadas, busquedaId])

  const busquedasFiltradas = useMemo(() => {
    const query = busquedaFiltro.trim().toLowerCase()
    if (!query) return busquedasOrdenadas

    return busquedasOrdenadas.filter((b) => {
      const text = [
        b.tipoPropiedad,
        b.ubicacionPreferida,
        b.presupuestoTexto,
        b.estado,
        b.origen,
      ].join(' ').toLowerCase()
      return text.includes(query)
    })
  }, [busquedasOrdenadas, busquedaFiltro])

  const clienteLabel = useMemo(() => {
    const c = clientes.find((x) => x.id === clienteId)
    return c?.nombreCompleto || c?.nombre || ''
  }, [clientes, clienteId])

  const busquedaSeleccionada = useMemo(() => {
    return busquedasOrdenadas.find((b) => b.id === busquedaId) || null
  }, [busquedasOrdenadas, busquedaId])

  const buildBusquedaLabel = (b: Busqueda) => {
    const parts = [b.tipoPropiedad || 'Propiedad']
    if (b.ubicacionPreferida) parts.push(b.ubicacionPreferida)
    if (b.presupuestoTexto) parts.push(b.presupuestoTexto)
    return parts.join(' - ')
  }

  const buildMensajeFromBusqueda = (b: Busqueda) => {
    const partes: string[] = []
    partes.push('Hola, estoy buscando una propiedad')
    if (b.tipoPropiedad) partes.push(`tipo ${b.tipoPropiedad}`)
    if (b.ubicacionPreferida) partes.push(`en ${b.ubicacionPreferida}`)

    const moneda = b.moneda || 'USD'
    const desdeMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/desde\s+(\d+)/i) : null
    const rangoMatch = typeof b.presupuestoTexto === 'string' ? b.presupuestoTexto.match(/(\d+)\s*[-–]\s*(\d+)/) : null

    if (rangoMatch) {
      const d = parseInt(rangoMatch[1], 10)
      const h = parseInt(rangoMatch[2], 10)
      if (!isNaN(d) && !isNaN(h)) partes.push(`presupuesto entre ${moneda} ${d} y ${h}`)
    } else if (desdeMatch) {
      const d = parseInt(desdeMatch[1], 10)
      if (!isNaN(d)) partes.push(`presupuesto desde ${moneda} ${d}`)
    } else if (typeof b.presupuestoValor === 'number') {
      partes.push(`presupuesto hasta ${moneda} ${b.presupuestoValor}`)
    } else if (b.presupuestoTexto) {
      partes.push(`presupuesto hasta ${b.presupuestoTexto}`)
    }

    if (typeof b.dormitoriosMin === 'number' && b.dormitoriosMin > 0) {
      partes.push(`${b.dormitoriosMin} dormitorios minimo`)
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

  const guardarBusqueda = () => {
    if (!clienteId) return
    const items = Array.from(seleccionadas).map((k) => {
      const [tipo, idx] = k.split(':')
      const i = parseInt(idx, 10)
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

  const irNuevaBusqueda = () => {
    const draft = {
      clienteId: clienteId || '',
      origen: 'PERSONALIZADA',
      moneda: 'USD',
      presupuestoDesde: '',
      presupuestoHasta: '',
      tipoPropiedad: '',
      provincia: 'Santa Fe',
      ciudad: 'Santa Fe Capital',
      barrio: '',
      dormitoriosMin: '',
      observaciones: '',
    }
    localStorage.setItem(BUSQUEDA_DRAFT_KEY, JSON.stringify(draft))
    router.push('/busquedas')
  }

  const analizar = async () => {
    if (!clienteId) {
      setError('Selecciona un cliente')
      return
    }

    if (!busquedaSeleccionada) {
      setError('Selecciona una busqueda')
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

      setResultado(data)
    } catch (e: any) {
      setError(e?.message || 'Error de conexion')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buscar con IA</h1>
          <p className="text-sm text-slate-600 mt-1">Selecciona una busqueda y analiza portales + CRM en un click.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/busquedas')}>Volver</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cliente y busquedas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</div>
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
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtrar busquedas</div>
              <Input
                value={busquedaFiltro}
                onChange={(e) => setBusquedaFiltro(e.target.value)}
                placeholder="Tipo, ubicacion, presupuesto, estado..."
                disabled={!clienteId}
              />
              <div className="text-xs text-slate-500">
                {clienteId ? `${busquedasFiltradas.length} busquedas encontradas` : 'Primero selecciona un cliente'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Busqueda activa</div>
            <select
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              disabled={!clienteId || !busquedasFiltradas.length}
            >
              <option value="">Seleccionar busqueda...</option>
              {busquedasFiltradas.map((b) => (
                <option key={b.id} value={b.id}>
                  {buildBusquedaLabel(b)}
                </option>
              ))}
            </select>
          </div>

          {!!busquedasFiltradas.length && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ultimas busquedas</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {busquedasFiltradas.slice(0, 6).map((b) => {
                  const isActive = b.id === busquedaId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBusquedaId(b.id)}
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        isActive
                          ? 'border-sky-300 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{b.tipoPropiedad || 'Propiedad'}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{b.ubicacionPreferida || 'Sin ubicacion'}</div>
                      <div className="text-xs text-slate-500 mt-1">{b.presupuestoTexto || 'Sin presupuesto'}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {busquedaSeleccionada && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input readOnly value={`Tipo: ${busquedaSeleccionada.tipoPropiedad || '-'}`} />
              <Input readOnly value={`Ubicacion: ${busquedaSeleccionada.ubicacionPreferida || '-'}`} />
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
              disabled={submitting}
              onClick={analizar}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {submitting ? 'Analizando...' : 'Analizar propiedades'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={irNuevaBusqueda}
            >
              Nueva busqueda
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setResultado(null)
                setError(null)
                setSeleccionadas(new Set())
              }}
            >
              Limpiar resultado
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
            placeholder="Titulo del link..."
            value={linkExternoTitulo}
            onChange={(e) => setLinkExternoTitulo(e.target.value)}
          />
          <Input
            placeholder="Pega un link externo..."
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
              Link seleccionado: {linkExternoTitulo || 'Sin titulo'} - {linkSeleccionado}
            </div>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">Portales</div>
                <div className="text-lg font-semibold text-slate-900">{Array.isArray(resultado?.scrapedItems) ? resultado.scrapedItems.length : 0}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">Links</div>
                <div className="text-lg font-semibold text-slate-900">{Array.isArray(resultado?.webMatches) ? resultado.webMatches.length : 0}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">CRM</div>
                <div className="text-lg font-semibold text-slate-900">{Array.isArray(resultado?.matches) ? resultado.matches.length : 0}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs text-slate-500">Seleccionadas</div>
                <div className="text-lg font-semibold text-slate-900">{seleccionadas.size + (linkSeleccionado ? 1 : 0)}</div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              Analisis completado.
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
                Ir a Gestion del Cliente
              </Button>
              {(linkSeleccionado || seleccionadas.size > 0) && (
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={guardarBusqueda}
                >
                  Guardar seleccion y pasar a Gestion
                </Button>
              )}
            </div>

            {Array.isArray(resultado?.scrapedItems) && resultado.scrapedItems.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-800">
                  Oportunidades en Portales ({resultado.scrapedItems.length}) - solo vista
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resultado.scrapedItems.map((item: any, idx: number) => (
                    <div key={`${item?.url || idx}`} className="flex gap-3 p-3 bg-white border rounded-lg">
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
                        {item?.url && (
                          <div className="mt-2">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-sky-200 text-xs font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                            >
                              Ver portal
                            </a>
                          </div>
                        )}
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
                      <div className="text-2xl">{w?.icon || 'WEB'}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">
                          {w?.sitio || 'Link'}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1">
                          {w?.titulo || w?.url}
                        </div>
                      </div>
                      {w?.url && (
                        <a
                          href={w.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-sky-200 text-xs font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                        >
                          Ver
                        </a>
                      )}
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
