'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Propiedad {
  id: string
  titulo?: string | null
  tipo: string
  operacion: string
  precio: number
  moneda: string
  dormitorios?: number | null
  ambientes?: number | null
  banos?: number | null
  superficie?: number | null
  direccion: string
  zona?: string | null
  localidad?: string | null
  descripcion?: string | null
  urlMls?: string | null
  aptaCredito?: boolean
}

interface CompartirModalProps {
  propiedad: Propiedad
  clienteNombre?: string
  clienteTelefono?: string
  onClose: () => void
}

export default function CompartirModal({ 
  propiedad, 
  clienteNombre, 
  clienteTelefono, 
  onClose 
}: CompartirModalProps) {
  const [copiado, setCopiado] = useState(false)
  const [incluirDescripcion, setIncluirDescripcion] = useState(true)
  const [incluirLink, setIncluirLink] = useState(true)

  const formatPrecio = (precio: number, moneda: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'ARS',
      maximumFractionDigits: 0
    }).format(precio)
  }

  const generarMensaje = () => {
    const saludo = clienteNombre 
      ? `¡Hola ${clienteNombre}! 🏠`
      : '¡Hola! 🏠'

    const titulo = propiedad.titulo || `${propiedad.tipo} en ${propiedad.operacion}`
    const ubicacion = [propiedad.direccion, propiedad.zona, propiedad.localidad]
      .filter(Boolean)
      .join(', ')

    let mensaje = `${saludo}

Encontré una propiedad que podría interesarte:

📍 *${titulo}*
${ubicacion}

💰 *${formatPrecio(propiedad.precio, propiedad.moneda)}* (${propiedad.operacion})`

    // Características
    const caracteristicas = []
    if (propiedad.dormitorios) caracteristicas.push(`🛏️ ${propiedad.dormitorios} dormitorios`)
    if (propiedad.ambientes) caracteristicas.push(`🚪 ${propiedad.ambientes} ambientes`)
    if (propiedad.banos) caracteristicas.push(`🚿 ${propiedad.banos} baños`)
    if (propiedad.superficie) caracteristicas.push(`📐 ${propiedad.superficie}m²`)
    if (propiedad.aptaCredito) caracteristicas.push(`✅ Apta crédito`)

    if (caracteristicas.length > 0) {
      mensaje += `\n\n${caracteristicas.join('\n')}`
    }

    // Descripción
    if (incluirDescripcion && propiedad.descripcion) {
      const descripcionCorta = propiedad.descripcion.length > 300 
        ? propiedad.descripcion.substring(0, 300) + '...'
        : propiedad.descripcion
      mensaje += `\n\n📝 *Descripción:*\n${descripcionCorta}`
    }

    // Link
    if (incluirLink && propiedad.urlMls) {
      mensaje += `\n\n🔗 Ver más: ${propiedad.urlMls}`
    }

    mensaje += '\n\n¿Te gustaría coordinar una visita? 📅'

    return mensaje
  }

  const copiarAlPortapapeles = async () => {
    const mensaje = generarMensaje()
    try {
      await navigator.clipboard.writeText(mensaje)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      alert('Error al copiar. Intentá seleccionar y copiar manualmente.')
    }
  }

  const enviarPorWhatsApp = () => {
    const mensaje = generarMensaje()
    const telefono = clienteTelefono?.replace(/\D/g, '') || ''
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    onClose()
  }

  const abrirWhatsAppSinNumero = () => {
    const mensaje = generarMensaje()
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">📤 Compartir Propiedad</CardTitle>
          <button 
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opciones */}
          <div className="flex gap-4 pb-4 border-b">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={incluirDescripcion}
                onChange={(e) => setIncluirDescripcion(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Incluir descripción</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={incluirLink}
                onChange={(e) => setIncluirLink(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Incluir link MLS</span>
            </label>
          </div>

          {/* Vista previa */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs text-slate-500 mb-2 uppercase">Vista previa del mensaje:</p>
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {generarMensaje()}
            </pre>
          </div>

          {/* Instrucciones para foto */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium text-sm mb-2">📸 ¿Querés enviar con foto?</p>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal pl-4">
              <li>Copiá el texto con el botón de abajo</li>
              <li>Abrí WhatsApp y seleccioná el contacto</li>
              <li>Adjuntá la foto de la propiedad</li>
              <li>Pegá el texto como descripción de la foto</li>
              <li>¡Enviá!</li>
            </ol>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              onClick={copiarAlPortapapeles}
              variant="outline"
              className="flex-1"
            >
              {copiado ? '✅ ¡Copiado!' : '📋 Copiar texto'}
            </Button>
            
            {clienteTelefono ? (
              <Button
                onClick={enviarPorWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                📱 Enviar a {clienteNombre || 'cliente'}
              </Button>
            ) : (
              <Button
                onClick={abrirWhatsAppSinNumero}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                📱 Abrir WhatsApp
              </Button>
            )}
          </div>

          {/* Mensaje para admin */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Tip para admins:</strong> Podés copiar este texto y reenviarlo a otros agentes para que lo compartan con sus clientes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
