'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildPortalTargets } from '@/lib/manual-links'
import { ManualLinkCard, type ManualLinkItem } from './ManualLinkCard'

type Cliente = {
  id: string
  nombreCompleto: string
}

type Busqueda = {
  id: string
  clienteId: string
  origen: string
  presupuestoTexto?: string | null
  presupuestoValor?: number | null
  moneda?: string | null
  tipoPropiedad?: string | null
  ubicacionPreferida?: string | null
  dormitoriosMin?: number | null
  estado: string
  cliente?: Cliente
}

function formatBudget(busqueda: Busqueda | null) {
  if (!busqueda) return 'Sin presupuesto'
  if (busqueda.presupuestoValor) {
    return `${busqueda.moneda || 'USD'} ${busqueda.presupuestoValor.toLocaleString('es-AR')}`
  }
  return busqueda.presupuestoTexto || 'Sin presupuesto'
}

function sortManualLinks(items: ManualLinkItem[]) {
  const rank: Record<ManualLinkItem['estado'], number> = {
    SELECCIONADO: 0,
    NUEVO: 1,
    DESCARTADO: 2,
    ENVIADO: 3,
  }

  return [...items].sort((a, b) => {
    if (rank[a.estado] !== rank[b.estado]) return rank[a.estado] - rank[b.estado]
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
    return a.portal.localeCompare(b.portal)
  })
}

export function ManualFlowWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const busquedaIdFromUrl = searchParams.get('busquedaId') || ''
  const clienteIdFromUrl = searchParams.get('clienteId') || ''

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteId, setClienteId] = useState(clienteIdFromUrl)
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [busquedaId, setBusquedaId] = useState(busquedaIdFromUrl)
  const [manualLinks, setManualLinks] = useState<ManualLinkItem[]>([])
  const [prepared, setPrepared] = useState(Boolean(busquedaIdFromUrl))
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingUrl, setSavingUrl] = useState(false)
  const [persistingId, setPersistingId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedBusqueda = useMemo(
    () => busquedas.find((item) => item.id === busquedaId) || null,
    [busquedaId, busquedas]
  )

  const portalTargets = useMemo(() => {
    if (!selectedBusqueda) return []
    return buildPortalTargets({
      id: selectedBusqueda.id,
      clienteId: selectedBusqueda.clienteId,
      tipoPropiedad: selectedBusqueda.tipoPropiedad,
      ubicacionPreferida: selectedBusqueda.ubicacionPreferida,
      presupuestoTexto: selectedBusqueda.presupuestoTexto,
      presupuestoValor: selectedBusqueda.presupuestoValor,
      moneda: selectedBusqueda.moneda,
      dormitoriosMin: selectedBusqueda.dormitoriosMin,
    })
  }, [selectedBusqueda])

  const selectedCount = manualLinks.filter((item) => item.estado === 'SELECCIONADO').length

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const response = await fetch('/api/clientes')
        if (response.ok) {
          const data = await response.json()
          setClientes(Array.isArray(data) ? data : [])
        }
      } catch (loadError) {
        console.error('Error al cargar clientes:', loadError)
      } finally {
        setLoading(false)
      }
    }

    loadInitial()
  }, [])

  useEffect(() => {
    const loadBusquedas = async () => {
      if (!clienteId) {
        setBusquedas([])
        setBusquedaId('')
        setManualLinks([])
        return
      }

      try {
        const response = await fetch(`/api/busquedas?clienteId=${clienteId}`)
        const data = response.ok ? await response.json() : []
        const nextBusquedas = Array.isArray(data) ? data : []
        setBusquedas(nextBusquedas)

        if (!nextBusquedas.some((item) => item.id === busquedaId)) {
          if (busquedaIdFromUrl && nextBusquedas.some((item) => item.id === busquedaIdFromUrl)) {
            setBusquedaId(busquedaIdFromUrl)
          } else {
            setBusquedaId(nextBusquedas[0]?.id || '')
          }
        }
      } catch (loadError) {
        console.error('Error al cargar búsquedas:', loadError)
        setBusquedas([])
      }
    }

    loadBusquedas()
  }, [busquedaIdFromUrl, clienteId])

  useEffect(() => {
    const loadLinks = async () => {
      if (!busquedaId) {
        setManualLinks([])
        return
      }

      try {
        const response = await fetch(`/api/manual-links?busquedaId=${busquedaId}`)
        const data = response.ok ? await response.json() : []
        setManualLinks(sortManualLinks(Array.isArray(data) ? data : []))
      } catch (loadError) {
        console.error('Error al cargar manual links:', loadError)
        setManualLinks([])
      }
    }

    loadLinks()
  }, [busquedaId])

  useEffect(() => {
    if (!selectedBusqueda) return
    const params = new URLSearchParams()
    params.set('clienteId', selectedBusqueda.clienteId)
    params.set('busquedaId', selectedBusqueda.id)
    window.history.replaceState({}, '', `/flujo-manual?${params.toString()}`)
  }, [selectedBusqueda])

  const refreshLinks = async () => {
    if (!busquedaId) return
    const response = await fetch(`/api/manual-links?busquedaId=${busquedaId}`)
    const data = response.ok ? await response.json() : []
    setManualLinks(sortManualLinks(Array.isArray(data) ? data : []))
  }

  const handlePrepare = () => {
    if (!selectedBusqueda) {
      setError('Seleccioná una búsqueda activa antes de preparar el flujo.')
      return
    }
    setPrepared(true)
    setError(null)
  }

  const handleCreateFromUrl = async () => {
    if (!busquedaId || !urlInput.trim()) return
    await createManualLink(urlInput.trim())
  }

  const createManualLink = async (nextUrl: string) => {
    if (!busquedaId || !nextUrl.trim()) return
    setSavingUrl(true)
    setError(null)

    try {
      const response = await fetch('/api/manual-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busquedaId,
          url: nextUrl.trim(),
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'No se pudo analizar el link.')
        return
      }

      setUrlInput('')
      await refreshLinks()
    } catch (saveError) {
      console.error('Error al guardar link manual:', saveError)
      setError('No se pudo guardar el link manual.')
    } finally {
      setSavingUrl(false)
    }
  }

  const updateItemState = async (itemId: string, estado: ManualLinkItem['estado']) => {
    setPersistingId(itemId)
    try {
      const response = await fetch(`/api/manual-links/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setError(payload?.error || 'No se pudo actualizar la card.')
        return
      }

      await refreshLinks()
    } catch (updateError) {
      console.error('Error al actualizar manual link:', updateError)
      setError('No se pudo actualizar la card.')
    } finally {
      setPersistingId(null)
    }
  }

  const deleteItem = async (itemId: string) => {
    setPersistingId(itemId)
    try {
      const response = await fetch(`/api/manual-links/${itemId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setError(payload?.error || 'No se pudo eliminar la card.')
        return
      }
      await refreshLinks()
    } catch (deleteError) {
      console.error('Error al eliminar manual link:', deleteError)
      setError('No se pudo eliminar la card.')
    } finally {
      setPersistingId(null)
    }
  }

  const openAllPortals = () => {
    portalTargets.forEach((portal) => {
      window.open(portal.url, '_blank', 'noopener,noreferrer')
    })
  }

  const openSelectedLinks = () => {
    manualLinks
      .filter((item) => item.estado === 'SELECCIONADO')
      .forEach((item) => {
        window.open(item.url, '_blank', 'noopener,noreferrer')
      })
  }

  const handleSendToGestion = async () => {
    if (!busquedaId) return

    setSending(true)
    setError(null)
    try {
      const response = await fetch('/api/manual-links/guardar-seleccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busquedaId }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setError(payload?.error || 'No se pudo guardar la selección.')
        return
      }

      router.push(`/gestion?clienteId=${payload.clienteId}&tab=envios`)
    } catch (sendError) {
      console.error('Error al enviar a gestión:', sendError)
      setError('No se pudo guardar la selección y pasar a gestión.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f4f7fb_52%,#eef3f8_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Flujo Manual de Links Inteligente
          </span>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Links manuales, análisis local y pase a Gestión</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Este módulo trabaja solo con análisis de string sobre la URL. No hace scraping, no consulta APIs externas y no cruza datos con la base interna de propiedades.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push('/busquedas')}>
                Volver a búsquedas
              </Button>
              <Button onClick={handlePrepare}>Preparar flujo manual</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <Card className="border-slate-200/90 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">1. Búsqueda activa</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cliente</label>
                <select
                  value={clienteId}
                  onChange={(event) => {
                    setClienteId(event.target.value)
                    setPrepared(false)
                    setError(null)
                  }}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                  disabled={loading}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Búsqueda</label>
                <select
                  value={busquedaId}
                  onChange={(event) => {
                    setBusquedaId(event.target.value)
                    setPrepared(false)
                    setError(null)
                  }}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                  disabled={!clienteId}
                >
                  <option value="">Seleccionar búsqueda...</option>
                  {busquedas.map((busqueda) => (
                    <option key={busqueda.id} value={busqueda.id}>
                      {busqueda.tipoPropiedad || 'Propiedad'} | {busqueda.ubicacionPreferida || 'Sin zona'} | {busqueda.estado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(241,245,249,0.98))] p-5">
                {selectedBusqueda ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedBusqueda.tipoPropiedad || 'Tipo no definido'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedBusqueda.ubicacionPreferida || 'Zona no definida'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatBudget(selectedBusqueda)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {selectedBusqueda.dormitoriosMin ? `${selectedBusqueda.dormitoriosMin}+ dorm` : 'Dormitorios abiertos'}
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Cliente</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">
                          {clientes.find((item) => item.id === selectedBusqueda.clienteId)?.nombreCompleto || 'Sin cliente'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Estado</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{selectedBusqueda.estado}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Origen</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{selectedBusqueda.origen}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Cards</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{manualLinks.length} registradas</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Seleccioná un cliente y una búsqueda para activar el flujo manual.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/90 bg-slate-950 text-white shadow-xl shadow-slate-900/10">
            <CardHeader>
              <CardTitle className="text-xl text-white">2. Portales manuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-300">
                Abrí portales en pestañas nuevas y trabajá manualmente. El CRM solo procesa la URL que pegues después.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {portalTargets.map((portal) => (
                  <Button
                    key={portal.key}
                    type="button"
                    variant="outline"
                    className="justify-between border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
                    onClick={() => window.open(portal.url, '_blank', 'noopener,noreferrer')}
                    disabled={!prepared}
                  >
                    {portal.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-white text-slate-900 hover:bg-slate-100"
                onClick={openAllPortals}
                disabled={!prepared || portalTargets.length === 0}
              >
                Abrir todos
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/90 bg-white/95">
          <CardHeader>
            <CardTitle className="text-xl">3. Pegá la URL y generá la card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <Input
                placeholder="Pegá acá la URL de ZonaProp, ArgenProp, MercadoLibre o Remax"
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData('text')
                  if (pasted) {
                    event.preventDefault()
                    setUrlInput(pasted)
                    void createManualLink(pasted)
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleCreateFromUrl()
                  }
                }}
                disabled={!prepared || !busquedaId || savingUrl}
              />
              <Button type="button" onClick={handleCreateFromUrl} disabled={!prepared || !urlInput.trim() || savingUrl}>
                {savingUrl ? 'Analizando...' : 'Crear card'}
              </Button>
              <Button type="button" variant="outline" onClick={openSelectedLinks} disabled={selectedCount === 0}>
                Abrir links seleccionados
              </Button>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Cards totales</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{manualLinks.length}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Seleccionadas</div>
                <div className="mt-2 text-2xl font-semibold text-emerald-800">{selectedCount}</div>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Ya enviadas antes</div>
                <div className="mt-2 text-2xl font-semibold text-violet-800">
                  {manualLinks.filter((item) => item.fueEnviadoAntes).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">4. Cards inteligentes</h2>
              <p className="mt-1 text-sm text-slate-600">Ordenadas por prioridad operativa: seleccionadas, nuevas, descartadas y enviadas.</p>
            </div>
            <Button onClick={handleSendToGestion} disabled={selectedCount === 0 || sending}>
              {sending ? 'Guardando selección...' : 'Guardar selección y pasar a Gestión'}
            </Button>
          </div>

          {manualLinks.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white/70">
              <CardContent className="py-12 text-center text-sm text-slate-500">
                Todavía no hay cards. Prepará el flujo, abrí los portales y pegá la primera URL manual.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortManualLinks(manualLinks).map((item) => (
                <ManualLinkCard
                  key={item.id}
                  item={item}
                  busy={persistingId === item.id}
                  onSelect={() => updateItemState(item.id, 'SELECCIONADO')}
                  onDiscard={() => updateItemState(item.id, 'DESCARTADO')}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
