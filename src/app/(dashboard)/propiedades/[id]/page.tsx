'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CompartirModal from '@/components/CompartirModal'

interface Propiedad {
  id: string
  titulo?: string | null
  tipo: string
  subtipo?: string | null
  ubicacion: string
  zona?: string | null
  localidad?: string | null
  direccion?: string | null
  precio?: number | null
  moneda: string
  descripcion?: string | null
  dormitorios?: number | null
  ambientes?: number | null
  banos?: number | null
  superficie?: number | null
  superficieCubierta?: number | null
  cochera: boolean
  patio: boolean
  pileta: boolean
  whatsapp?: string | null
  urlMls?: string | null
  imagenPrincipal?: string | null
  imagenes: string[]
  aptaCredito: boolean
  estado: string
  usuario?: { id: string; nombre: string } | null
  inmobiliaria?: { 
    id: string
    nombre: string
    email?: string | null
    whatsapp?: string | null
    slug?: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export default function PropiedadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mostrarCompartir, setMostrarCompartir] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPropiedad(params.id as string)
    }
  }, [params.id])

  const fetchPropiedad = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/propiedades/${id}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Propiedad no encontrada')
        } else if (res.status === 403) {
          setError('No tienes permiso para ver esta propiedad')
        } else {
          setError('Error al cargar la propiedad')
        }
        return
      }

      const data = await res.json()
      setPropiedad(data)
    } catch (err) {
      setError('Error al cargar la propiedad')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando...</div>
        </div>
      </div>
    )
  }

  if (error || !propiedad) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Propiedad no encontrada'}</p>
              <Button onClick={() => router.push('/propiedades')}>
                ← Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="outline" onClick={() => router.push('/propiedades')}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{propiedad.titulo || `${propiedad.tipo} en ${propiedad.ubicacion}`}</h1>
            <p className="text-slate-600 mt-1">
              {propiedad.direccion || propiedad.zona || propiedad.ubicacion}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setMostrarCompartir(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          📤 Compartir
        </Button>
      </div>

      {/* Imagen Principal */}
      {propiedad.imagenPrincipal && (
        <Card>
          <CardContent className="p-0">
            <img 
              src={propiedad.imagenPrincipal} 
              alt={propiedad.titulo || 'Propiedad'}
              className="w-full h-96 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Galería de Imágenes */}
      {propiedad.imagenes && propiedad.imagenes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Galería</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {propiedad.imagenes.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Precio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Precio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {propiedad.precio 
                  ? `${propiedad.moneda} ${propiedad.precio.toLocaleString()}`
                  : 'Consultar precio'
                }
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏠 Características
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {propiedad.dormitorios !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛏️ {propiedad.dormitorios} dorm.</span>
                  </div>
                )}
                {propiedad.banos !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🚿 {propiedad.banos} baños</span>
                  </div>
                )}
                {propiedad.ambientes !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏡 {propiedad.ambientes} amb.</span>
                  </div>
                )}
                {propiedad.superficie !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📐 {propiedad.superficie} m²</span>
                  </div>
                )}
                {propiedad.cochera && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🚗 Cochera</span>
                  </div>
                )}
                {propiedad.patio && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏡 Patio</span>
                  </div>
                )}
                {propiedad.pileta && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏊 Pileta</span>
                  </div>
                )}
                {propiedad.aptaCredito && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">✓ Apta crédito</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Descripción */}
          {propiedad.descripcion && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{propiedad.descripcion}</p>
              </CardContent>
            </Card>
          )}

          {/* Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📍 Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {propiedad.direccion && (
                <p><strong>Dirección:</strong> {propiedad.direccion}</p>
              )}
              {propiedad.zona && (
                <p><strong>Zona:</strong> {propiedad.zona}</p>
              )}
              {propiedad.localidad && (
                <p><strong>Localidad:</strong> {propiedad.localidad}</p>
              )}
              <p><strong>Ubicación:</strong> {propiedad.ubicacion}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {propiedad.inmobiliaria && (
                <div>
                  <p className="font-semibold text-sm text-slate-600">Inmobiliaria</p>
                  <p className="font-medium">{propiedad.inmobiliaria.nombre}</p>
                </div>
              )}
              
              {propiedad.whatsapp && (
                <a
                  href={`https://wa.me/${propiedad.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline"
                >
                  📱 WhatsApp
                </a>
              )}

              {propiedad.inmobiliaria?.whatsapp && (
                <a
                  href={`https://wa.me/${propiedad.inmobiliaria.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline"
                >
                  📱 WhatsApp Inmobiliaria
                </a>
              )}

              {propiedad.inmobiliaria?.email && (
                <a
                  href={`mailto:${propiedad.inmobiliaria.email}`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                >
                  ✉️ Email
                </a>
              )}

              {propiedad.urlMls && (
                <a
                  href={propiedad.urlMls}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                >
                  🔗 Ver en MLS
                </a>
              )}
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-slate-600">Tipo:</span>{' '}
                <span className="font-medium">{propiedad.tipo}</span>
              </div>
              {propiedad.subtipo && (
                <div>
                  <span className="text-slate-600">Subtipo:</span>{' '}
                  <span className="font-medium">{propiedad.subtipo}</span>
                </div>
              )}
              <div>
                <span className="text-slate-600">Estado:</span>{' '}
                <span className={`font-medium px-2 py-1 rounded text-xs ${
                  propiedad.estado === 'APROBADA' ? 'bg-green-100 text-green-700' :
                  propiedad.estado === 'BORRADOR' ? 'bg-yellow-100 text-yellow-700' :
                  propiedad.estado === 'DESCARTADA' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {propiedad.estado}
                </span>
              </div>
              {propiedad.usuario && (
                <div>
                  <span className="text-slate-600">Agente:</span>{' '}
                  <span className="font-medium">{propiedad.usuario.nombre}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Compartir */}
      {mostrarCompartir && propiedad && (
        <CompartirModal
          propiedad={{
            id: propiedad.id,
            titulo: propiedad.titulo || `${propiedad.tipo} en ${propiedad.ubicacion}`,
            tipo: propiedad.tipo,
            operacion: propiedad.subtipo?.toLowerCase().includes('venta') ? 'venta' : 
                      propiedad.subtipo?.toLowerCase().includes('alquiler') ? 'alquiler' : 'venta',
            precio: propiedad.precio || 0,
            moneda: propiedad.moneda,
            dormitorios: propiedad.dormitorios,
            ambientes: propiedad.ambientes,
            banos: propiedad.banos,
            superficie: propiedad.superficie,
            direccion: propiedad.direccion || propiedad.ubicacion,
            zona: propiedad.zona,
            localidad: propiedad.localidad,
            descripcion: propiedad.descripcion,
            urlMls: propiedad.urlMls,
            aptaCredito: propiedad.aptaCredito,
            urlPropiedad: typeof window !== 'undefined' 
              ? `${window.location.origin}/propiedades/${propiedad.id}`
              : null
          }}
          onClose={() => setMostrarCompartir(false)}
        />
      )}
    </div>
  )
}
