'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PropiedadRapida {
  titulo: string
  tipo: string
  ubicacion: string
  zona: string
  precio: string
  moneda: string
  dormitorios: string
  ambientes: string
  urlMls: string
  aptaCredito: boolean
}

const INITIAL_FORM: PropiedadRapida = {
  titulo: '',
  tipo: 'DEPARTAMENTO',
  ubicacion: '',
  zona: '',
  precio: '',
  moneda: 'USD',
  dormitorios: '',
  ambientes: '',
  urlMls: '',
  aptaCredito: false,
}

export default function CargaRapidaPage() {
  const [propiedades, setPropiedades] = useState<PropiedadRapida[]>([INITIAL_FORM])
  const [saving, setSaving] = useState(false)
  const [resultado, setResultado] = useState<{ exito: number; error: number } | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const handleChange = (index: number, field: keyof PropiedadRapida, value: string | boolean) => {
    const nuevas = [...propiedades]
    nuevas[index] = { ...nuevas[index], [field]: value }
    setPropiedades(nuevas)
  }

  const agregarFila = () => {
    setPropiedades([...propiedades, { ...INITIAL_FORM }])
  }

  const eliminarFila = (index: number) => {
    if (propiedades.length > 1) {
      setPropiedades(propiedades.filter((_, i) => i !== index))
    }
  }

  const duplicarFila = (index: number) => {
    const nuevas = [...propiedades]
    nuevas.splice(index + 1, 0, { ...propiedades[index] })
    setPropiedades(nuevas)
  }

  const handleGuardarTodas = async () => {
    setSaving(true)
    setResultado(null)
    let exito = 0
    let error = 0

    for (const prop of propiedades) {
      if (!prop.ubicacion) continue // Skip vacías

      try {
        const response = await fetch('/api/propiedades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titulo: prop.titulo || null,
            tipo: prop.tipo,
            ubicacion: prop.ubicacion,
            zona: prop.zona || null,
            precio: prop.precio ? parseInt(prop.precio) : null,
            moneda: prop.moneda,
            dormitorios: prop.dormitorios ? parseInt(prop.dormitorios) : null,
            ambientes: prop.ambientes ? parseInt(prop.ambientes) : null,
            urlMls: prop.urlMls || null,
            aptaCredito: prop.aptaCredito,
          }),
        })

        if (response.ok) {
          exito++
        } else {
          error++
        }
      } catch (e) {
        error++
      }
    }

    setResultado({ exito, error })
    if (exito > 0) {
      setPropiedades([INITIAL_FORM])
    }
    setSaving(false)
  }

  const procesarPaste = () => {
    // Formato esperado: cada línea es una propiedad
    // Columnas separadas por TAB: titulo, tipo, ubicacion, zona, precio, dorms, url
    const lineas = pasteText.trim().split('\n')
    const nuevas: PropiedadRapida[] = []

    for (const linea of lineas) {
      const cols = linea.split('\t')
      if (cols.length >= 3) {
        nuevas.push({
          titulo: cols[0]?.trim() || '',
          tipo: detectarTipo(cols[1]?.trim() || ''),
          ubicacion: cols[2]?.trim() || '',
          zona: cols[3]?.trim() || '',
          precio: extraerPrecio(cols[4]?.trim() || ''),
          moneda: detectarMoneda(cols[4]?.trim() || ''),
          dormitorios: cols[5]?.trim() || '',
          ambientes: cols[6]?.trim() || '',
          urlMls: cols[7]?.trim() || '',
          aptaCredito: (cols[8]?.toLowerCase().includes('si') || cols[8]?.toLowerCase().includes('yes')),
        })
      }
    }

    if (nuevas.length > 0) {
      setPropiedades(nuevas)
      setPasteMode(false)
      setPasteText('')
    }
  }

  const detectarTipo = (texto: string): string => {
    const lower = texto.toLowerCase()
    if (lower.includes('depto') || lower.includes('departamento')) return 'DEPARTAMENTO'
    if (lower.includes('casa')) return 'CASA'
    if (lower.includes('ph')) return 'PH'
    if (lower.includes('local')) return 'LOCAL'
    if (lower.includes('terreno')) return 'TERRENO'
    if (lower.includes('oficina')) return 'OFICINA'
    return 'OTRO'
  }

  const extraerPrecio = (texto: string): string => {
    const match = texto.match(/[\d.,]+/)
    if (match) {
      return match[0].replace(/[.,]/g, '')
    }
    return ''
  }

  const detectarMoneda = (texto: string): string => {
    const lower = texto.toLowerCase()
    if (lower.includes('usd') || lower.includes('dolar') || lower.includes('u$s')) return 'USD'
    return 'ARS'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚡ Carga Rápida</h1>
          <p className="text-slate-600">Agrega múltiples propiedades de forma rápida</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPasteMode(!pasteMode)}
          >
            📋 Pegar desde Excel
          </Button>
          <Button onClick={agregarFila} variant="outline">
            + Agregar Fila
          </Button>
          <Button 
            onClick={handleGuardarTodas} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? 'Guardando...' : `💾 Guardar ${propiedades.filter(p => p.ubicacion).length} propiedades`}
          </Button>
        </div>
      </div>

      {resultado && (
        <Card className={resultado.error > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}>
          <CardContent className="py-3">
            <p className="font-medium">
              ✅ {resultado.exito} propiedades guardadas
              {resultado.error > 0 && <span className="text-red-600"> | ❌ {resultado.error} errores</span>}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modo Paste */}
      {pasteMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">📋 Pegar desde Excel</CardTitle>
            <p className="text-sm text-slate-600">
              Copia las celdas de Excel y pégalas aquí. Formato esperado (separado por TAB):<br/>
              <code className="bg-white px-1 rounded">Titulo | Tipo | Ubicación | Zona | Precio | Dorms | Ambientes | URL | Apta Crédito</code>
            </p>
          </CardHeader>
          <CardContent>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Pega aquí los datos copiados de Excel..."
              className="w-full h-32 p-3 border rounded-md font-mono text-sm"
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={procesarPaste} className="bg-blue-600">
                Procesar
              </Button>
              <Button variant="outline" onClick={() => { setPasteMode(false); setPasteText('') }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de carga rápida */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left min-w-[150px]">Título</th>
                <th className="px-2 py-2 text-left min-w-[100px]">Tipo</th>
                <th className="px-2 py-2 text-left min-w-[180px]">Ubicación *</th>
                <th className="px-2 py-2 text-left min-w-[120px]">Zona</th>
                <th className="px-2 py-2 text-left min-w-[100px]">Precio</th>
                <th className="px-2 py-2 text-left min-w-[60px]">Mon</th>
                <th className="px-2 py-2 text-left min-w-[60px]">Dorm</th>
                <th className="px-2 py-2 text-left min-w-[60px]">Amb</th>
                <th className="px-2 py-2 text-left min-w-[200px]">URL MLS</th>
                <th className="px-2 py-2 text-center">Créd</th>
                <th className="px-2 py-2 text-center">Acc</th>
              </tr>
            </thead>
            <tbody>
              {propiedades.map((prop, index) => (
                <tr key={index} className="border-b hover:bg-slate-50">
                  <td className="px-2 py-1 text-slate-500">{index + 1}</td>
                  <td className="px-1 py-1">
                    <Input
                      value={prop.titulo}
                      onChange={(e) => handleChange(index, 'titulo', e.target.value)}
                      placeholder="Título"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <select
                      value={prop.tipo}
                      onChange={(e) => handleChange(index, 'tipo', e.target.value)}
                      className="w-full h-8 px-2 border rounded text-sm"
                    >
                      <option value="DEPARTAMENTO">Depto</option>
                      <option value="CASA">Casa</option>
                      <option value="PH">PH</option>
                      <option value="LOCAL">Local</option>
                      <option value="OFICINA">Oficina</option>
                      <option value="TERRENO">Terreno</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={prop.ubicacion}
                      onChange={(e) => handleChange(index, 'ubicacion', e.target.value)}
                      placeholder="Dirección o ubicación"
                      className="h-8 text-sm"
                      required
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={prop.zona}
                      onChange={(e) => handleChange(index, 'zona', e.target.value)}
                      placeholder="Barrio"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      type="number"
                      value={prop.precio}
                      onChange={(e) => handleChange(index, 'precio', e.target.value)}
                      placeholder="150000"
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <select
                      value={prop.moneda}
                      onChange={(e) => handleChange(index, 'moneda', e.target.value)}
                      className="w-full h-8 px-1 border rounded text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                    </select>
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      type="number"
                      value={prop.dormitorios}
                      onChange={(e) => handleChange(index, 'dormitorios', e.target.value)}
                      placeholder="2"
                      className="h-8 text-sm w-16"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      type="number"
                      value={prop.ambientes}
                      onChange={(e) => handleChange(index, 'ambientes', e.target.value)}
                      placeholder="3"
                      className="h-8 text-sm w-16"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={prop.urlMls}
                      onChange={(e) => handleChange(index, 'urlMls', e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={prop.aptaCredito}
                      onChange={(e) => handleChange(index, 'aptaCredito', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <div className="flex gap-1">
                      <button
                        onClick={() => duplicarFila(index)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Duplicar"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => eliminarFila(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                        disabled={propiedades.length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-slate-50">
        <CardContent className="py-4">
          <h3 className="font-medium mb-2">💡 Tips</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• <strong>Tab</strong> para moverte entre campos</li>
            <li>• <strong>Pegar desde Excel:</strong> Copia las celdas y usa el botón "Pegar desde Excel"</li>
            <li>• <strong>Duplicar:</strong> Usa 📋 para copiar una fila y modificar solo lo necesario</li>
            <li>• Solo se guardan las filas que tienen <strong>Ubicación</strong></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
