'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type UltimaWebPayload = {
  savedAt: string
  source: 'busquedas' | 'parsear'
  busquedaId?: string
  clienteId?: string
  clienteLabel?: string
  data: any
}

const STORAGE_KEY = 'ultimaWebResult'
const BUSQUEDA_DRAFT_KEY = 'busquedaDraftFromUltimaWeb'

export default function UltimaWebPage() {
  const router = useRouter()
  const [payload, setPayload] = useState<UltimaWebPayload | null>(null)
  const [scrapedPage, setScrapedPage] = useState(1)
  const SCRAPED_PAGE_SIZE = 10

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setPayload(null)
        return
      }
      setPayload(JSON.parse(raw))
    } catch {
      setPayload(null)
    }
  }, [])

  const resultado = payload?.data
  const busquedaParseada = resultado?.busquedaParseada
  const scrapedItems = Array.isArray(resultado?.scrapedItems) ? resultado.scrapedItems : []
  const scrapedTotalPages = Math.max(1, Math.ceil(scrapedItems.length / SCRAPED_PAGE_SIZE))
  const scrapedItemsPaginados = scrapedItems.slice(
    (scrapedPage - 1) * SCRAPED_PAGE_SIZE,
    scrapedPage * SCRAPED_PAGE_SIZE
  )

  const handleNuevaBusquedaPreCargada = () => {
    if (!busquedaParseada) {
      router.push('/busquedas')
      return
    }

    const tipo = ['DEPARTAMENTO', 'CASA', 'OTRO'].includes(busquedaParseada.tipoPropiedad)
      ? busquedaParseada.tipoPropiedad
      : 'OTRO'

    const draft = {
      clienteId: payload?.clienteId || '',
      origen: 'PERSONALIZADA',
      moneda: busquedaParseada.moneda || 'USD',
      presupuestoDesde: busquedaParseada.presupuestoMin ? String(busquedaParseada.presupuestoMin) : '',
      presupuestoHasta: busquedaParseada.presupuestoMax ? String(busquedaParseada.presupuestoMax) : '',
      tipoPropiedad: tipo,
      provincia: 'Santa Fe',
      ciudad: 'Santa Fe Capital',
      barrio: '',
      dormitoriosMin: busquedaParseada.dormitoriosMin ? String(busquedaParseada.dormitoriosMin) : '',
      observaciones: busquedaParseada.notas || '',
    }

    localStorage.setItem(BUSQUEDA_DRAFT_KEY, JSON.stringify(draft))
    router.push('/busquedas')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">Ultima Web</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/busquedas')}>Volver</Button>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              setPayload(null)
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {!payload ? (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-slate-600">No hay un analisis web guardado todavia.</div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button onClick={() => router.push('/parsear')} className="bg-sky-600 hover:bg-sky-700">
                Buscar con IA
              </Button>
              <Button variant="outline" onClick={() => router.push('/busquedas')}>
                Ir a Busquedas
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-1">
              <div><span className="font-semibold">Fecha:</span> {new Date(payload.savedAt).toLocaleString()}</div>
              <div><span className="font-semibold">Origen:</span> {payload.source}</div>
              {payload.clienteLabel && (
                <div><span className="font-semibold">Cliente:</span> {payload.clienteLabel}</div>
              )}
              {payload.busquedaId && (
                <div><span className="font-semibold">Busqueda ID:</span> {payload.busquedaId}</div>
              )}
              {busquedaParseada && (
                <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                  <div><span className="font-semibold">Tipo:</span> {busquedaParseada.tipoPropiedad || '-'}</div>
                  <div><span className="font-semibold">Operacion:</span> {busquedaParseada.operacion || '-'}</div>
                  <div><span className="font-semibold">Presupuesto:</span> {busquedaParseada.moneda || 'USD'} {busquedaParseada.presupuestoMax ? Number(busquedaParseada.presupuestoMax).toLocaleString() : '-'}</div>
                </div>
              )}
              <div className="flex gap-2 flex-wrap pt-3">
                {payload.clienteId && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/gestion?clienteId=${payload.clienteId}`)}
                    className="border-sky-200 text-sky-700 hover:bg-sky-50"
                  >
                    Ver cliente
                  </Button>
                )}
                <Button onClick={handleNuevaBusquedaPreCargada} className="bg-emerald-600 hover:bg-emerald-700">
                  Nueva busqueda (pre-cargada)
                </Button>
                <Button variant="outline" onClick={() => router.push(`/parsear${payload.clienteId ? `?clienteId=${payload.clienteId}` : ''}`)}>
                  Nueva busqueda con IA
                </Button>
              </div>
            </CardContent>
          </Card>

          {Array.isArray(resultado?.scrapedItems) && resultado.scrapedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades en Portales ({resultado.scrapedItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Mostrando {(scrapedPage - 1) * SCRAPED_PAGE_SIZE + 1}-
                    {Math.min(scrapedPage * SCRAPED_PAGE_SIZE, scrapedItems.length)} de {scrapedItems.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setScrapedPage((p) => Math.max(1, p - 1))}
                      disabled={scrapedPage <= 1}
                    >
                      Anterior
                    </Button>
                    <span>Pagina {scrapedPage} de {scrapedTotalPages}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setScrapedPage((p) => Math.min(scrapedTotalPages, p + 1))}
                      disabled={scrapedPage >= scrapedTotalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scrapedItemsPaginados.map((item: any, idx: number) => (
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
                      <div className="text-xs font-semibold text-slate-500">{item?.sitio || 'Portal'}</div>
                      <div className="text-sm font-semibold text-slate-900 line-clamp-2">{item?.titulo || '-'}</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">{item?.precio || '-'}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{item?.ubicacion || '-'}</div>
                      {item?.url && (
                        <div className="mt-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-sky-200 text-xs font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-300"
                          >
                            Ver publicacion
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
          )}

          {Array.isArray(resultado?.webMatches) && resultado.webMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Links sugeridos ({resultado.webMatches.length})</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {resultado.webMatches.map((w: any, idx: number) => (
                  <a
                    key={`${w?.url || idx}`}
                    href={w?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm"
                  >
                    <div className="text-2xl">{w?.icon || 'WEB'}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{w?.sitio || 'Link'}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{w?.titulo || w?.url}</div>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {Array.isArray(resultado?.matches) && resultado.matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Propiedades del CRM ({resultado.matches.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resultado.matches.map((m: any, idx: number) => (
                  <div key={`${m?.id || idx}`} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
