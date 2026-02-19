'use client'

import { useState } from 'react'
import DropZone from '@/components/DropZone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ImportResult {
  success: boolean
  message: string
  mode?: 'preview' | 'import'
  count?: number
  error?: string
  details?: Record<string, unknown>
}

export default function ImportarPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileDataBase64, setFileDataBase64] = useState('')
  const [importType, setImportType] = useState<'propiedades' | 'clientes_busquedas'>('propiedades')

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const chunkSize = 0x8000

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }

    return btoa(binary)
  }

  const endpoint = importType === 'propiedades'
    ? '/api/import-properties'
    : '/api/import-clientes-busquedas'

  const runImport = async (params: { fileName: string; fileData: string; preview: boolean }) => {
    const targetUserId =
      typeof window !== 'undefined' ? localStorage.getItem('selectedUserId') : null

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: params.fileName,
        fileData: params.fileData,
        preview: params.preview,
        targetUserId,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setResult({
        success: false,
        message: params.preview ? 'Error en vista previa' : 'Error al importar',
        error: data.error,
      })
      return
    }

    if (params.preview) {
      setResult({
        success: true,
        mode: 'preview',
        message: 'Vista previa lista. Revisa el resumen y confirma para importar.',
        details: data,
      })
      return
    }

    if (importType === 'propiedades') {
      setResult({
        success: true,
        mode: 'import',
        message: `${data.count ?? 0} propiedades procesadas correctamente`,
        count: data.count,
        details: data,
      })
    } else {
      setResult({
        success: true,
        mode: 'import',
        message: `Importacion completada: ${data.busquedasCreadas ?? 0} consultas creadas`,
        details: data,
      })
    }
  }

  const handleFileSelect = async (file: File) => {
    setFileName(file.name)
    setIsLoading(true)
    setResult(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = arrayBufferToBase64(arrayBuffer)
      setFileDataBase64(base64)
      await runImport({ fileName: file.name, fileData: base64, preview: true })
    } catch (error) {
      setResult({
        success: false,
        message: 'Error al procesar el archivo',
        error: String(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!fileName || !fileDataBase64) return
    setIsLoading(true)
    try {
      await runImport({ fileName, fileData: fileDataBase64, preview: false })
    } finally {
      setIsLoading(false)
    }
  }

  const resultErrors = Array.isArray(result?.details?.errors)
    ? (result?.details?.errors as string[])
    : []
  const accionesPreview = Array.isArray(result?.details?.acciones)
    ? (result?.details?.acciones as Array<{ fila: number; accion: string; detalle: string; entidad?: string }>)
    : []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Importar desde Excel</h1>
          <p className="text-slate-600">
            Carga masiva de datos para acelerar el alta de registros.
          </p>
        </div>
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-4">
            <div className="text-sm text-slate-700">
              Paso a paso: `1)` elegi tipo de importacion, `2)` revisa formato esperado, `3)` subi archivo, `4)` revisa vista previa, `5)` confirma importacion.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de importacion</CardTitle>
            <CardDescription>
              Define que modulo se actualiza: propiedades del stock o clientes con sus consultas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={importType === 'propiedades' ? 'default' : 'outline'}
              onClick={() => {
                setImportType('propiedades')
                setResult(null)
                setFileName('')
                setFileDataBase64('')
              }}
            >
              Propiedades
            </Button>
            <Button
              type="button"
              variant={importType === 'clientes_busquedas' ? 'default' : 'outline'}
              onClick={() => {
                setImportType('clientes_busquedas')
                setResult(null)
                setFileName('')
                setFileDataBase64('')
              }}
            >
              Clientes + Consultas
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Formato esperado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-700">
              {importType === 'propiedades' ? (
                <>
                  <p className="font-medium">Columnas recomendadas para propiedades:</p>
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded border border-blue-200">
                    <div>- titulo</div>
                    <div>- tipo</div>
                    <div>- zona</div>
                    <div>- descripcion</div>
                    <div>- precio</div>
                    <div>- moneda</div>
                    <div>- ambientes</div>
                    <div>- banos</div>
                    <div>- superficie</div>
                    <div>- direccion</div>
                    <div>- whatsapp</div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium">Columnas recomendadas para clientes y consultas:</p>
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded border border-blue-200">
                    <div>- cliente o nombre</div>
                    <div>- telefono</div>
                    <div>- email</div>
                    <div>- notasCliente</div>
                    <div>- origen</div>
                    <div>- presupuesto</div>
                    <div>- moneda</div>
                    <div>- tipoPropiedad</div>
                    <div>- ubicacion</div>
                    <div>- dormitoriosMin</div>
                    <div>- estado</div>
                    <div>- observaciones</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selecciona tu archivo</CardTitle>
            <CardDescription>
              Arrastra y suelta tu archivo Excel aqui. Se procesa solo la primera hoja del archivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropZone onFileSelect={handleFileSelect} isLoading={isLoading} />
          </CardContent>
        </Card>

        {fileName && (
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
              <p className="text-sm">
                <span className="font-medium">Archivo seleccionado:</span>{' '}
                <span className="text-blue-600">{fileName}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card
            className={`border-2 ${
              result.success
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-lg font-semibold text-slate-900">
                  {result.message}
                </p>

                {typeof result.count === 'number' && (
                  <div className="bg-white rounded p-3 border-2 border-green-200">
                    <p className="text-center text-2xl font-bold text-green-600">
                      {result.count}
                    </p>
                    <p className="text-center text-sm text-slate-600">
                      propiedades cargadas
                    </p>
                  </div>
                )}

                {result.details && importType === 'propiedades' && result.success && (
                  <div className="grid grid-cols-2 gap-2 text-sm bg-white rounded p-3 border border-green-200">
                    <div>Filas: {String(result.details.totalFilas ?? '-')}</div>
                    <div>Creadas: {String(result.details.creadas ?? 0)}</div>
                    <div>Actualizadas: {String(result.details.actualizadas ?? 0)}</div>
                    <div>Omitidas: {String(result.details.omitidas ?? 0)}</div>
                  </div>
                )}

                {result.details && importType === 'clientes_busquedas' && result.success && (
                  <div className="grid grid-cols-2 gap-2 text-sm bg-white rounded p-3 border border-green-200">
                    <div>Filas: {String(result.details.totalFilas ?? '-')}</div>
                    <div>Clientes nuevos: {String(result.details.clientesCreados ?? 0)}</div>
                    <div>Clientes actualizados: {String(result.details.clientesActualizados ?? 0)}</div>
                    <div>Consultas cargadas: {String(result.details.busquedasCreadas ?? 0)}</div>
                    <div>Consultas actualizadas: {String(result.details.busquedasActualizadas ?? 0)}</div>
                    <div>Consultas duplicadas: {String(result.details.busquedasDuplicadas ?? 0)}</div>
                    <div>Filas omitidas: {String(result.details.filasOmitidas ?? 0)}</div>
                  </div>
                )}

                {result.mode === 'preview' && accionesPreview.length > 0 && (
                  <div className="bg-white rounded p-3 border border-slate-200">
                    <p className="text-sm font-medium mb-2">Vista previa (primeras acciones)</p>
                    <ul className="text-xs text-slate-700 space-y-1 max-h-48 overflow-y-auto">
                      {accionesPreview.map((item, idx) => (
                        <li key={`${item.fila}-${idx}`}>
                          {`Fila ${item.fila} · ${item.entidad ? `${item.entidad} · ` : ''}${item.accion} · ${item.detalle}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {resultErrors.length > 0 && (
                  <div className="bg-white rounded p-3 border-2 border-amber-200">
                    <p className="text-sm font-medium mb-2">Errores de filas</p>
                    <ul className="text-xs text-amber-800 space-y-1 max-h-40 overflow-y-auto">
                      {resultErrors.slice(0, 10).map((error, idx) => (
                        <li key={`${error}-${idx}`}>- {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.error && (
                  <div className="bg-white rounded p-3 border-2 border-red-200">
                    <p className="text-sm text-red-700 font-mono">{result.error}</p>
                  </div>
                )}

                {result.mode === 'preview' && result.success ? (
                  <Button
                    onClick={handleConfirmImport}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Importando...' : 'Confirmar importacion'}
                  </Button>
                ) : null}

                <Button
                  onClick={() => {
                    setResult(null)
                    setFileName('')
                    setFileDataBase64('')
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Importar otro archivo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">Consejos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {importType === 'propiedades' ? (
              <>
                <p>- Verifica que las columnas principales esten presentes.</p>
                <p>- La moneda puede ser ARS o USD.</p>
                <p>- Los numeros se normalizan automaticamente.</p>
                <p>- No duplica propiedades si ya existen.</p>
              </>
            ) : (
              <>
                <p>- Cada fila debe tener al menos el nombre del cliente.</p>
                <p>- El sistema crea o actualiza cliente y luego carga su consulta.</p>
                <p>- Si detecta una consulta igual para el mismo cliente, la marca como duplicada.</p>
                <p>- Revisa el bloque de errores para corregir filas puntuales y volver a subir.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
