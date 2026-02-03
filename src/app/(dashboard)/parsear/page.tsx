'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

export default function ParsearBusquedaPage() {
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<BusquedaParseada | null>(null)
  const [matches, setMatches] = useState<PropiedadMatch[]>([])
  const [webMatches, setWebMatches] = useState<WebMatch[]>([])
  const [scrapedItems, setScrapedItems] = useState<ScrapedItem[]>([])
  const [guardado, setGuardado] = useState<ResultadoGuardado | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parsearMensaje = async (guardar: boolean = false) => {
    if (!mensaje.trim()) {
      setError('Pegá un mensaje de WhatsApp para analizar')
      return
    }

    setLoading(true)
    setError(null)
    setGuardado(null)
    setMatches([])
    setWebMatches([])
    setScrapedItems([])

    try {
      const res = await fetch('/api/parsear-busqueda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, guardar })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar')
      }

      setResultado(data.busquedaParseada)
      setMatches(data.matches || [])
      setWebMatches(data.webMatches || [])
      setScrapedItems(data.scrapedItems || [])
      
      if (data.guardado) {
        setGuardado(data.guardado)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
  }

  const compartirSeleccion = () => {
     if (scrapedItems.length === 0) return
     
     let texto = `*Oportunidades Encontradas en la Web* 🏠\n\n`
     scrapedItems.forEach(item => {
        texto += `*${item.titulo}*\n`
        texto += `💰 ${item.precio}\n`
        texto += `📍 ${item.ubicacion}\n`
        texto += `🔗 ${item.url}\n\n`
     })
     
     navigator.clipboard.writeText(texto)
     alert('¡Lista copiada al portapapeles! Lista para pegar en WhatsApp.')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🤖 Parsear Búsqueda con IA</h1>
        <p className="text-slate-600 mt-1">
          Pegá un mensaje de WhatsApp y la IA extraerá los datos de la búsqueda automáticamente
        </p>
      </div>

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
              disabled={loading || !mensaje.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
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
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Resultado guardado */}
      {guardado && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-700 font-medium">
              ✅ Búsqueda guardada exitosamente
            </p>
            <p className="text-green-600 text-sm mt-1">
              Cliente: <strong>{guardado.clienteNombre}</strong>
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(`/busquedas`, '_blank')}
              >
                Ver búsquedas
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(`/matches`, '_blank')}
              >
                Ver matches
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado del análisis */}
      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>📊 Resultado del Análisis</span>
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
                <p className={`font-medium px-2 py-1 rounded inline-block ${
                  resultado.operacion === 'ALQUILER' 
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
      )}

      {/* Matches Encontrados */}
      {matches.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏡 Propiedades Compatibles ({matches.length})
              <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded-full border">
                Detectadas automáticamente en la base
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches.map((prop) => (
              <div 
                key={prop.id} 
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between gap-4"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{prop.titulo}</h4>
                  <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                    <span className="font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      {prop.moneda} {prop.precio.toLocaleString()}
                    </span>
                    <span>📍 {prop.ubicacion}</span>
                    <span>🛏️ {prop.dormitorios} dorm.</span>
                  </div>

                  {prop.inmobiliaria && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 pt-3 border-t">
                      <span className="font-medium flex items-center gap-1">
                        🏢 {prop.inmobiliaria.nombre}
                      </span>
                      {prop.inmobiliaria.whatsapp && (
                        <a 
                          href={`https://wa.me/${prop.inmobiliaria.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
                        >
                          📱 WhatsApp
                        </a>
                      )}
                      {prop.inmobiliaria.email && (
                        <span>✉️ {prop.inmobiliaria.email}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/propiedades/${prop.id}`, '_blank')}
                  >
                    Ver Ficha
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resultados WEB (Smart Links Categorizados) */}
      {webMatches.length > 0 && (
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
                {webMatches.filter((w:any) => w.categoria === 'PORTALES' || !w.categoria).map((web, i) => (
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
            {webMatches.some((w:any) => w.categoria === 'INMOBILIARIAS') && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  🏦 Inmobiliarias y Redes
                  <span className="h-px bg-slate-300 flex-1"></span>
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {webMatches.filter((w:any) => w.categoria === 'INMOBILIARIAS').map((web, i) => (
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
            {webMatches.some((w:any) => w.categoria === 'INTERNACIONALES') && (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  🌍 Portales Internacionales
                  <span className="h-px bg-slate-300 flex-1"></span>
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {webMatches.filter((w:any) => w.categoria === 'INTERNACIONALES').map((web, i) => (
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
      )}

      {/* Resultados SCRAPED (Web en vivo) */}
      {scrapedItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span>🌐 Oportunidades en la Web</span>
                 <span className="text-xs font-normal text-slate-500 bg-white px-2 py-1 rounded-full border">
                   MercadoLibre + ArgenProp
                 </span>
              </div>
              <Button onClick={compartirSeleccion} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                📲 Copiar para Compartir
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             {scrapedItems.map((item, i) => (
               <div key={i} className="flex gap-4 p-3 bg-white rounded-lg border hover:shadow-md transition-all">
                  {item.img && (
                    <img src={item.img} alt="propiedad" className="w-24 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                     <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        {item.sitio}
                     </div>
                     <h4 className="font-semibold text-slate-800 line-clamp-2">{item.titulo}</h4>
                     <div className="flex flex-col gap-1 mt-1">
                        <span className="text-lg font-bold text-slate-900">{item.precio}</span>
                        <span className="text-sm text-slate-500">📍 {item.ubicacion}</span>
                     </div>
                  </div>
                  <div className="flex items-end">
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(item.url, '_blank')}
                     >
                       Ver ficha
                     </Button>
                  </div>
               </div>
             ))}
          </CardContent>
        </Card>
      )}

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
    </div>
  )
}
