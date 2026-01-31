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
  localidad: string
  direccion: string
  precio: string
  moneda: string
  dormitorios: string
  ambientes: string
  banos: string
  superficie: string
  descripcion: string
  whatsapp: string
  urlMls: string
  aptaCredito: boolean
}

interface ErrorValidacion {
  fila: number
  campo: string
  mensaje: string
}

const INITIAL_FORM: PropiedadRapida = {
  titulo: '',
  tipo: 'DEPARTAMENTO',
  ubicacion: '',
  zona: '',
  localidad: '',
  direccion: '',
  precio: '',
  moneda: 'USD',
  dormitorios: '',
  ambientes: '',
  banos: '',
  superficie: '',
  descripcion: '',
  whatsapp: '',
  urlMls: '',
  aptaCredito: false,
}

export default function CargaRapidaPage() {
  const [propiedades, setPropiedades] = useState<PropiedadRapida[]>([INITIAL_FORM])
  const [saving, setSaving] = useState(false)
  const [resultado, setResultado] = useState<{ exito: number; error: number; errores: ErrorValidacion[] } | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [mostrarErrores, setMostrarErrores] = useState(false)

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

  const generarDescripcionAutomatica = (prop: Partial<PropiedadRapida>): string => {
    if (prop.descripcion && prop.descripcion.trim() !== '') {
      return prop.descripcion
    }
    
    const partes: string[] = []
    if (prop.titulo && prop.titulo.trim()) partes.push(prop.titulo)
    if (prop.tipo && prop.tipo.trim()) partes.push(prop.tipo)
    if (prop.zona && prop.zona.trim()) partes.push(`en ${prop.zona}`)
    if (prop.dormitorios && prop.dormitorios.trim()) partes.push(`${prop.dormitorios} dormitorios`)
    if (prop.ambientes && prop.ambientes.trim()) partes.push(`${prop.ambientes} ambientes`)
    if (prop.precio && prop.precio.trim() !== '') {
      try {
        const precioNum = parseInt(prop.precio)
        if (!isNaN(precioNum)) {
          partes.push(`$${precioNum.toLocaleString()} ${prop.moneda || 'USD'}`)
        }
      } catch (e) {
        // Si hay error parseando precio, simplemente no agregarlo
      }
    }
    
    return partes.length > 0 ? partes.join(' - ') : 'Sin descripción'
  }

  const validarPropiedad = (prop: PropiedadRapida, index: number): ErrorValidacion[] => {
    const errores: ErrorValidacion[] = []
    
    if (!prop.ubicacion || prop.ubicacion.trim() === '') {
      errores.push({ fila: index + 1, campo: 'Ubicación', mensaje: 'La ubicación es obligatoria' })
    }
    
    // La descripción se genera automáticamente si está vacía, así que no es error crítico
    // Pero validamos otros campos
    
    if (prop.precio && prop.precio.trim() !== '' && isNaN(parseInt(prop.precio))) {
      errores.push({ fila: index + 1, campo: 'Precio', mensaje: 'El precio debe ser un número válido' })
    }
    
    if (prop.dormitorios && prop.dormitorios.trim() !== '' && isNaN(parseInt(prop.dormitorios))) {
      errores.push({ fila: index + 1, campo: 'Dormitorios', mensaje: 'Debe ser un número válido' })
    }
    
    if (prop.ambientes && prop.ambientes.trim() !== '' && isNaN(parseInt(prop.ambientes))) {
      errores.push({ fila: index + 1, campo: 'Ambientes', mensaje: 'Debe ser un número válido' })
    }
    
    if (prop.urlMls && prop.urlMls.trim() !== '' && !prop.urlMls.startsWith('http')) {
      errores.push({ fila: index + 1, campo: 'URL MLS', mensaje: 'Debe ser una URL válida (comenzar con http)' })
    }
    
    return errores
  }

  const handleGuardarTodas = async () => {
    setSaving(true)
    setResultado(null)
    setMostrarErrores(false)
    
    let exito = 0
    let error = 0
    const erroresValidacion: ErrorValidacion[] = []
    const promesas: Promise<void>[] = []

    // Validar y preparar todas las propiedades
    propiedades.forEach((prop, index) => {
      if (!prop.ubicacion || prop.ubicacion.trim() === '') {
        return // Skip vacías
      }
      
      const errores = validarPropiedad(prop, index)
      if (errores.length > 0) {
        erroresValidacion.push(...errores)
        error++
        return
      }

      // Generar descripción automática si está vacía
      const descripcionFinal = generarDescripcionAutomatica(prop)

      // Crear promesa para guardar propiedad
      const promesa = fetch('/api/propiedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: prop.titulo || null,
          tipo: prop.tipo,
          ubicacion: prop.ubicacion,
          zona: prop.zona || null,
          localidad: prop.localidad || null,
          direccion: prop.direccion || null,
          precio: prop.precio && prop.precio.trim() !== '' ? parseInt(prop.precio) : null,
          moneda: prop.moneda,
          dormitorios: prop.dormitorios && prop.dormitorios.trim() !== '' ? parseInt(prop.dormitorios) : null,
          ambientes: prop.ambientes && prop.ambientes.trim() !== '' ? parseInt(prop.ambientes) : null,
          banos: prop.banos && prop.banos.trim() !== '' ? parseInt(prop.banos) : null,
          superficie: prop.superficie && prop.superficie.trim() !== '' ? parseInt(prop.superficie) : null,
          descripcion: descripcionFinal,
          whatsapp: prop.whatsapp || null,
          urlMls: prop.urlMls || null,
          aptaCredito: prop.aptaCredito,
        }),
      })
        .then(async response => {
          if (response.ok) {
            exito++
          } else {
            error++
            try {
              const data = await response.json()
              erroresValidacion.push({
                fila: index + 1,
                campo: 'General',
                mensaje: data.error || 'Error al guardar'
              })
            } catch {
              erroresValidacion.push({
                fila: index + 1,
                campo: 'General',
                mensaje: `Error ${response.status}: ${response.statusText}`
              })
            }
          }
        })
        .catch((e) => {
          error++
          erroresValidacion.push({
            fila: index + 1,
            campo: 'General',
            mensaje: 'Error de conexión: ' + (e.message || 'Error desconocido')
          })
        })
      
      promesas.push(promesa)
    })

    // Esperar a que todas las promesas se completen
    await Promise.all(promesas)

    setResultado({ exito, error, errores: erroresValidacion })
    if (erroresValidacion.length > 0) {
      setMostrarErrores(true)
    }
    if (exito > 0 && error === 0) {
      setPropiedades([INITIAL_FORM])
    }
    setSaving(false)
  }

  const procesarPaste = () => {
    // Formato esperado: cada línea es una propiedad
    // Columnas separadas por TAB o coma
    const lineas = pasteText.trim().split('\n').filter(l => l.trim())
    const nuevas: PropiedadRapida[] = []

    for (const linea of lineas) {
      // Intentar detectar separador (TAB o coma)
      const separador = linea.includes('\t') ? '\t' : ','
      const cols = linea.split(separador).map(c => c.trim())
      
      if (cols.length >= 2) {
        // Mapear columnas de forma flexible
        nuevas.push({
          titulo: cols[0] || '',
          tipo: detectarTipo(cols[1] || ''),
          ubicacion: cols[2] || cols[1] || '', // Si no hay columna 2, usar la 1
          zona: cols[3] || '',
          localidad: cols[4] || '',
          direccion: cols[5] || '',
          precio: extraerPrecio(cols[6] || cols[3] || ''),
          moneda: detectarMoneda(cols[6] || cols[3] || ''),
          dormitorios: cols[7] || cols[4] || '',
          ambientes: cols[8] || cols[5] || '',
          banos: cols[9] || '',
          superficie: cols[10] || '',
          descripcion: cols[11] || cols[6] || '',
          whatsapp: cols[12] || '',
          urlMls: cols[13] || cols[7] || '',
          aptaCredito: (cols[14]?.toLowerCase().includes('si') || 
                       cols[14]?.toLowerCase().includes('yes') ||
                       cols[8]?.toLowerCase().includes('si') ||
                       cols[8]?.toLowerCase().includes('yes')),
        })
      }
    }

    if (nuevas.length > 0) {
      // Generar descripciones automáticas para las que no tienen
      const nuevasConDescripcion = nuevas.map(prop => ({
        ...prop,
        descripcion: prop.descripcion || generarDescripcionAutomatica(prop)
      }))
      
      setPropiedades(nuevasConDescripcion)
      setPasteMode(false)
      setPasteText('')
      alert(`✅ ${nuevas.length} propiedades cargadas. Revisa y completa los campos obligatorios antes de guardar.`)
    } else {
      alert('⚠️ No se pudieron procesar los datos. Asegúrate de copiar las celdas correctamente desde Excel.')
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
            {saving ? 'Guardando...' : `💾 Guardar ${propiedades.filter(p => p.ubicacion && p.ubicacion.trim()).length} propiedades`}
          </Button>
        </div>
      </div>

      {resultado && (
        <Card className={resultado.error > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}>
          <CardContent className="py-3">
            <div className="flex justify-between items-center">
              <p className="font-medium">
                ✅ {resultado.exito} propiedades guardadas
                {resultado.error > 0 && <span className="text-red-600"> | ❌ {resultado.error} errores</span>}
              </p>
              {resultado.errores && resultado.errores.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarErrores(!mostrarErrores)}
                >
                  {mostrarErrores ? 'Ocultar' : 'Ver'} errores
                </Button>
              )}
            </div>
            {mostrarErrores && resultado.errores && resultado.errores.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-sm text-red-700">Detalles de errores:</h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {resultado.errores.map((err, idx) => (
                    <li key={idx}>
                      Fila {err.fila}: <strong>{err.campo}</strong> - {err.mensaje}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modo Paste */}
      {pasteMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">📋 Pegar desde Excel</CardTitle>
            <p className="text-sm text-slate-600 mb-2">
              Copia las celdas de Excel y pégalas aquí. El sistema detecta automáticamente si están separadas por TAB o coma.
            </p>
            <div className="bg-white p-3 rounded text-xs space-y-1">
              <p className="font-semibold">Formato mínimo (3 columnas):</p>
              <code>Título | Tipo | Ubicación</code>
              <p className="font-semibold mt-2">Formato completo (15 columnas):</p>
              <code>Título | Tipo | Ubicación | Zona | Localidad | Dirección | Precio | Dorms | Ambientes | Baños | Superficie | Descripción | WhatsApp | URL | Apta Crédito</code>
              <p className="text-slate-500 mt-2">💡 Si faltan columnas, el sistema intentará completarlas automáticamente</p>
            </div>
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
                <th className="px-2 py-2 text-left min-w-[60px]">Baños</th>
                <th className="px-2 py-2 text-left min-w-[80px]">Superf.</th>
                <th className="px-2 py-2 text-left min-w-[200px]">Descripción *</th>
                <th className="px-2 py-2 text-left min-w-[120px]">WhatsApp</th>
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
                      type="number"
                      value={prop.banos}
                      onChange={(e) => handleChange(index, 'banos', e.target.value)}
                      placeholder="1"
                      className="h-8 text-sm w-16"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      type="number"
                      value={prop.superficie}
                      onChange={(e) => handleChange(index, 'superficie', e.target.value)}
                      placeholder="65"
                      className="h-8 text-sm w-20"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <textarea
                      value={prop.descripcion}
                      onChange={(e) => handleChange(index, 'descripcion', e.target.value)}
                      onBlur={(e) => {
                        // Si está vacía, generar automáticamente
                        if (!e.target.value.trim()) {
                          const autoDesc = generarDescripcionAutomatica(prop)
                          handleChange(index, 'descripcion', autoDesc)
                        }
                      }}
                      placeholder="Descripción (se genera automáticamente si está vacía)"
                      className="h-10 text-sm w-full px-2 py-1 border rounded resize-none"
                      required
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={prop.whatsapp}
                      onChange={(e) => handleChange(index, 'whatsapp', e.target.value)}
                      placeholder="5491112345678"
                      className="h-8 text-sm"
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
          <h3 className="font-medium mb-2">💡 Tips y Ayuda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Atajos de teclado:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>Tab</strong> para moverte entre campos</li>
                <li>• <strong>Enter</strong> en el último campo agrega una nueva fila</li>
                <li>• <strong>Ctrl+V</strong> pega datos desde Excel</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Campos obligatorios:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>Ubicación</strong> - Dirección o ubicación de la propiedad</li>
                <li>• <strong>Descripción</strong> - Se genera automáticamente si está vacía</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Funcionalidades:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>Pegar desde Excel:</strong> Copia las celdas y pégalas</li>
                <li>• <strong>Duplicar:</strong> Usa 📋 para copiar una fila</li>
                <li>• <strong>Eliminar:</strong> Usa 🗑️ para eliminar una fila</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Validación automática:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Precios y números se validan automáticamente</li>
                <li>• URLs deben comenzar con "http"</li>
                <li>• Errores se muestran antes de guardar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
