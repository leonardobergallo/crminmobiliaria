import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { prisma } from '@/lib/utils/prisma';

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileData } = await req.json();

    if (!fileData || !fileName) {
      return NextResponse.json(
        { error: 'Archivo no proporcionado' },
        { status: 400 }
      );
    }

    // Decodificar base64 a buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Crear archivo temporal
    const tempPath = join(tmpdir(), `import_${Date.now()}.xlsx`);
    writeFileSync(tempPath, buffer);

    try {
      // Leer workbook
      const workbook = XLSX.readFile(tempPath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      if (data.length === 0) {
        return NextResponse.json(
          { error: 'El archivo está vacío' },
          { status: 400 }
        );
      }

      let count = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          const titulo = (row['titulo'] as string) || '';
          const tipo = (row['tipo'] as string) || 'venta';
          const zona = (row['zona'] as string) || '';
          const descripcion = (row['descripcion'] as string) || '';
          let precio = row['precio'];
          const monedaInput = (row['moneda'] as string) || 'USD';
          const ambientes = parseInt((row['ambientes'] as string) || '0') || 0;
          const banos = parseInt((row['banos'] as string) || '0') || 0;
          const superficie = parseInt((row['superficie'] as string) || '0') || 0;
          const direccion = (row['direccion'] as string) || '';
          const whatsapp = (row['whatsapp'] as string) || '';

          // Convertir precio a número
          let precioNumerico = 0;
          if (typeof precio === 'number') {
            precioNumerico = precio;
          } else if (typeof precio === 'string') {
            const match = precio.match(/[\d.,]+/);
            if (match) {
              let numStr = match[0].replace(/\./g, '').replace(/,/g, '.');
              precioNumerico = parseInt(numStr) || 0;
            }
          }

          // Normalizar tipo
          const tipoNormalizado = normalizarTipoPropiedad(tipo);

          // Crear o actualizar propiedad
          await prisma.propiedad.upsert({
            where: {
              direccion_tipo_usuarioId: {
                direccion: direccion || `${titulo}_${Date.now()}`,
                tipo: tipoNormalizado,
                usuarioId: null,
              },
            },
            create: {
              titulo,
              tipo: tipoNormalizado,
              subtipo: tipo,
              zona,
              descripcion,
              precio: precioNumerico,
              moneda: monedaInput.toUpperCase() === 'USD' ? 'USD' : 'ARS',
              ambientes,
              banos,
              superficie,
              direccion,
              whatsapp,
              urlMls: '',
              aptaCredito: false,
              ubicacion: direccion || zona || '',
            },
            update: {
              titulo,
              descripcion,
              precio: precioNumerico,
              moneda: monedaInput.toUpperCase() === 'USD' ? 'USD' : 'ARS',
              ambientes,
              banos,
              superficie,
              whatsapp,
              zona,
              subtipo: tipo,
            },
          });

          count++;
        } catch (rowError) {
          errors.push(`Fila con error: ${(rowError as Error).message}`);
        }
      }

      return NextResponse.json(
        {
          success: true,
          count,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 200 }
      );
    } finally {
      // Limpiar archivo temporal
      try {
        unlinkSync(tempPath);
      } catch (e) {
        // Ignorar si no se puede eliminar
      }
    }
  } catch (error) {
    console.error('Error en importación:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

function normalizarTipoPropiedad(texto: string): string {
  if (!texto) return 'OTRO';
  const lower = texto.toLowerCase();
  if (lower.includes('departamento') || lower.includes('depar')) return 'DEPARTAMENTO';
  if (lower.includes('casa')) return 'CASA';
  if (lower.includes('terreno')) return 'OTRO';
  if (lower.includes('salón')) return 'OTRO';
  return 'OTRO';
}
