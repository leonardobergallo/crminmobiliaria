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

export default function UltimaWebPage() {
  const router = useRouter()
  const [payload, setPayload] = useState<UltimaWebPayload | null>(null)

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">Última Web</h1>
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
          <CardContent className="py-10 text-center text-slate-600">
            No hay un análisis web guardado todavía.
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
                <div><span className="font-semibold">Búsqueda ID:</span> {payload.busquedaId}</div>
              )}
            </CardContent>
          </Card>

          {Array.isArray(resultado?.scrapedItems) && resultado.scrapedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades en Portales ({resultado.scrapedItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <div className="text-xs font-semibold text-slate-500">{item?.sitio || 'Portal'}</div>
                      <div className="text-sm font-semibold text-slate-900 line-clamp-2">{item?.titulo || '-'}</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">{item?.precio || '-'}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{item?.ubicacion || '-'}</div>
                      {item?.url && (
                        <div className="mt-2">
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                            Ver
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                    <div className="text-2xl">{w?.icon || '🌐'}</div>
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
