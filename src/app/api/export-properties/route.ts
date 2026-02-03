import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    // Optional: Filter by inmobiliaria via query param if needed
    // const { searchParams } = new URL(req.url);
    // const inmobiliariaId = searchParams.get('inmobiliariaId');

    const properties = await prisma.propiedad.findMany({
      orderBy: { createdAt: 'desc' },
      // where: inmobiliariaId ? { inmobiliariaId } : undefined
    });

    // Map properties to the requested Excel format
    const data = properties.map(prop => ({
      titulo: prop.titulo || '',
      tipo: prop.tipo || '',
      zona: prop.zona || prop.localidad || '',
      descripcion: prop.descripcion || '',
      precio: prop.precio || 0,
      moneda: prop.moneda || 'ARS',
      ambientes: prop.ambientes || 0,
      banos: prop.banos || 0,
      superficie: prop.superficie || 0,
      direccion: prop.direccion || prop.ubicacion || '',
      whatsapp: prop.whatsapp || '',
      // Optional/Placeholder columns
      foto_principal: '',
      servicio_profesional: '',
      // Aliases for compatibility/migration if needed (optional)
      // address: prop.direccion,
      // bathrooms: prop.banos,
      // area_m2: prop.superficie
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Propiedades');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=propiedades_export.xlsx',
      },
    });
  } catch (error) {
    console.error('Error exporting properties:', error);
    return NextResponse.json(
      { error: 'Error exporting properties' },
      { status: 500 }
    );
  }
}
