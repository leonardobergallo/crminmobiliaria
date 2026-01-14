'use client';

import { useState } from 'react';
import DropZone from '@/components/DropZone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ImportResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

export default function ImportarPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    setIsLoading(true);
    setResult(null);

    try {
      // Leer archivo y convertir a array buffer
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Enviar al servidor
      const response = await fetch('/api/import-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `✅ ${data.count} propiedades importadas correctamente`,
          count: data.count,
        });
      } else {
        setResult({
          success: false,
          message: '❌ Error al importar',
          error: data.error,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: '❌ Error al procesar el archivo',
        error: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">📥 Importar Propiedades</h1>
          <p className="text-slate-600">
            Carga un archivo Excel con tus propiedades en venta
          </p>
        </div>

        {/* Formato Esperado */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">📋 Formato Esperado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-700">
              <p className="font-medium">Columnas necesarias en tu Excel:</p>
              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded border border-blue-200">
                <div>• titulo</div>
                <div>• tipo</div>
                <div>• zona</div>
                <div>• descripcion</div>
                <div>• precio</div>
                <div>• moneda</div>
                <div>• ambientes</div>
                <div>• banos</div>
                <div>• superficie</div>
                <div>• direccion</div>
                <div>• whatsapp</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DropZone */}
        <Card>
          <CardHeader>
            <CardTitle>Selecciona tu archivo</CardTitle>
            <CardDescription>
              Arrastra y suelta tu archivo Excel aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropZone onFileSelect={handleFileSelect} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Nombre del archivo */}
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

        {/* Resultado */}
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
                {result.count && (
                  <div className="bg-white rounded p-3 border-2 border-green-200">
                    <p className="text-center text-2xl font-bold text-green-600">
                      {result.count}
                    </p>
                    <p className="text-center text-sm text-slate-600">
                      propiedades cargadas
                    </p>
                  </div>
                )}
                {result.error && (
                  <div className="bg-white rounded p-3 border-2 border-red-200">
                    <p className="text-sm text-red-700 font-mono">{result.error}</p>
                  </div>
                )}
                <Button
                  onClick={() => {
                    setResult(null);
                    setFileName('');
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

        {/* Instrucciones */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">💡 Consejos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>✓ Verifica que todas las columnas estén presentes</p>
            <p>✓ La moneda puede ser: ARS, USD, DOLARES</p>
            <p>✓ Los números se normalizan automáticamente</p>
            <p>✓ No duplica propiedades si ya existen</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
