'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CompartirModal from '@/components/CompartirModal'

interface Propiedad {
  id: string
  titulo: string
  tipo: string
  operacion: string
  precio: number
  moneda: string
  dormitorios: number | null
  ambientes: number | null
  superficie: number | null
  direccion: string
  zona: string | null
  ciudad: string | null
  descripcion?: string | null
  urlMls?: string | null
  aptaCredito?: boolean
}

interface Match {
  propiedad: Propiedad
  score: number
  nivel: 'ALTA' | 'MEDIA' | 'BAJA'
  detalles: string[]
}

interface Busqueda {
  id: string
  tipoPropiedad: string
  operacion: string
  zonas: string[]
  presupuestoMin: number | null
  presupuestoMax: number | null
  ambientesMin: number | null
  dormitoriosMin: number | null
  caracteristicas: string[]
  notas: string | null
  estado: string
  cliente: {
    id: string
    nombreCompleto: string
    telefono: string | null
    email: string | null
  }
  matches?: Match[]
}

interface CompartirData {
  propiedad: Propiedad
  clienteNombre: string
  clienteTelefono: string | null
}

export default function MatchesPage() {
  const [busquedas, setBusquedas] = useState<Busqueda[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>({})
  const [expandedBusqueda, setExpandedBusqueda] = useState<string | null>(null)
  const [compartirData, setCompartirData] = useState<CompartirData | null>(null)

  useEffect(() => {
    fetchBusquedas()
  }, [])

  const fetchBusquedas = async () => {
    try {
      const res = await fetch('/api/busquedas?estado=activa')
      if (res.ok) {
        const data = await res.json()
        setBusquedas(data)
      }
    } catch (error) {
      console.error('Error cargando búsquedas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async (busquedaId: string) => {
    if (loadingMatches[busquedaId]) return
    
    setLoadingMatches(prev => ({ ...prev, [busquedaId]: true }))
    try {
      const res = await fetch(`/api/sugerencias?busquedaId=${busquedaId}`)
      if (res.ok) {
        const data = await res.json()
        setBusquedas(prev => prev.map(b => 
          b.id === busquedaId ? { ...b, matches: data.matches } : b
        ))
      }
    } catch (error) {
      console.error('Error cargando matches:', error)
    } finally {
      setLoadingMatches(prev => ({ ...prev, [busquedaId]: false }))
    }
  }

  const toggleBusqueda = (busquedaId: string) => {
    if (expandedBusqueda === busquedaId) {
      setExpandedBusqueda(null)
    } else {
      setExpandedBusqueda(busquedaId)
      const busqueda = busquedas.find(b => b.id === busquedaId)
      if (!busqueda?.matches) {
        fetchMatches(busquedaId)
      }
    }
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'ALTA': return 'bg-green-500'
      case 'MEDIA': return 'bg-yellow-500'
      case 'BAJA': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getNivelEmoji = (nivel: string) => {
    switch (nivel) {
      case 'ALTA': return '🟢'
      case 'MEDIA': return '🟡'
      case 'BAJA': return '🔴'
      default: return '⚪'
    }
  }

  const formatPrecio = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'ARS',
      maximumFractionDigits: 0
    }).format(precio)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">✨ Matches de Propiedades</h1>
          <p className="text-slate-600 mt-1">
            Encuentra las mejores propiedades para cada búsqueda activa
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1">🟢 Alta coincidencia</span>
          <span className="flex items-center gap-1">🟡 Media</span>
          <span className="flex items-center gap-1">🔴 Baja</span>
        </div>
      </div>

      {busquedas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-xl text-slate-500">No hay búsquedas activas</p>
            <p className="text-slate-400 mt-2">
              Las búsquedas activas aparecerán aquí con sus propiedades sugeridas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {busquedas.map((busqueda) => (
            <Card key={busqueda.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleBusqueda(busqueda.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">👤</span>
                      {busqueda.cliente.nombreCompleto}
                      {busqueda.matches && (
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          ({busqueda.matches.length} matches)
                        </span>
                      )}
                    </CardTitle>
                    <div className="mt-2 text-sm text-slate-600 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {busqueda.tipoPropiedad}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {busqueda.operacion}
                      </span>
                      {busqueda.zonas.length > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          📍 {busqueda.zonas.join(', ')}
                        </span>
                      )}
                      {(busqueda.presupuestoMin || busqueda.presupuestoMax) && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          💰 {busqueda.presupuestoMin ? `$${busqueda.presupuestoMin.toLocaleString()}` : '?'} - {busqueda.presupuestoMax ? `$${busqueda.presupuestoMax.toLocaleString()}` : '?'}
                        </span>
                      )}
                      {busqueda.dormitoriosMin && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded">
                          🛏️ {busqueda.dormitoriosMin}+ dorm.
                        </span>
                      )}
                    </div>
                    {busqueda.notas && (
                      <p className="mt-2 text-sm text-slate-500 italic">
                        &quot;{busqueda.notas}&quot;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {busqueda.matches && busqueda.matches.length > 0 && (
                      <div className="flex gap-1">
                        {busqueda.matches.filter(m => m.nivel === 'ALTA').length > 0 && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                            {busqueda.matches.filter(m => m.nivel === 'ALTA').length} 🟢
                          </span>
                        )}
                        {busqueda.matches.filter(m => m.nivel === 'MEDIA').length > 0 && (
                          <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                            {busqueda.matches.filter(m => m.nivel === 'MEDIA').length} 🟡
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-2xl transition-transform">
                      {expandedBusqueda === busqueda.id ? '🔽' : '▶️'}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {expandedBusqueda === busqueda.id && (
                <CardContent className="border-t bg-slate-50">
                  {loadingMatches[busqueda.id] ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin text-4xl mb-2">⏳</div>
                      <p className="text-slate-500">Buscando propiedades...</p>
                    </div>
                  ) : !busqueda.matches || busqueda.matches.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-4xl mb-2">😔</p>
                      <p className="text-slate-500">No se encontraron propiedades que coincidan</p>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      {busqueda.matches
                        .sort((a, b) => b.score - a.score)
                        .map((match) => (
                          <div 
                            key={match.propiedad.id}
                            className="bg-white rounded-lg p-4 shadow-sm border flex gap-4"
                          >
                            {/* Score indicator */}
                            <div className="flex flex-col items-center justify-center min-w-[60px]">
                              <span className="text-3xl">{getNivelEmoji(match.nivel)}</span>
                              <span className={`text-white text-xs px-2 py-0.5 rounded-full ${getNivelColor(match.nivel)}`}>
                                {match.score}%
                              </span>
                            </div>

                            {/* Property info */}
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">
                                {match.propiedad.titulo || `${match.propiedad.tipo} en ${match.propiedad.operacion}`}
                              </h4>
                              <p className="text-slate-600 text-sm">
                                📍 {match.propiedad.direccion}
                                {match.propiedad.zona && `, ${match.propiedad.zona}`}
                                {match.propiedad.ciudad && ` - ${match.propiedad.ciudad}`}
                              </p>
                              <div className="flex gap-4 mt-2 text-sm text-slate-600">
                                <span className="font-bold text-green-600">
                                  {formatPrecio(match.propiedad.precio, match.propiedad.moneda)}
                                </span>
                                {match.propiedad.dormitorios && (
                                  <span>🛏️ {match.propiedad.dormitorios}</span>
                                )}
                                {match.propiedad.ambientes && (
                                  <span>🚪 {match.propiedad.ambientes}</span>
                                )}
                                {match.propiedad.superficie && (
                                  <span>📐 {match.propiedad.superficie}m²</span>
                                )}
                              </div>
                              
                              {/* Match details */}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {match.detalles.map((detalle, i) => (
                                  <span 
                                    key={i}
                                    className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                                  >
                                    ✓ {detalle}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 justify-center">
                              <Button
                                size="sm"
                                onClick={() => setCompartirData({
                                  propiedad: match.propiedad,
                                  clienteNombre: busqueda.cliente.nombreCompleto,
                                  clienteTelefono: busqueda.cliente.telefono
                                })}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                📤 Compartir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/propiedades/${match.propiedad.id}`, '_blank')}
                              >
                                👁️ Ver
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal de compartir */}
      {compartirData && (
        <CompartirModal
          propiedad={compartirData.propiedad}
          clienteNombre={compartirData.clienteNombre}
          clienteTelefono={compartirData.clienteTelefono || undefined}
          onClose={() => setCompartirData(null)}
        />
      )}
    </div>
  )
}
