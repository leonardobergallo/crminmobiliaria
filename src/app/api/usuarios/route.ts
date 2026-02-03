import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Filtrar por inmobiliaria según el rol
    const where: any = {};
    
    if (currentUser.rol === 'superadmin') {
      // Superadmin ve todos los usuarios
    } else if (currentUser.inmobiliariaId) {
      // Admin y agentes solo ven usuarios de su inmobiliaria
      where.inmobiliariaId = currentUser.inmobiliariaId;
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      include: {
        _count: {
          select: {
            propiedades: true,
            clientes: true,
            operaciones: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error fetching usuarios' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, telefono } = await req.json();

    if (!nombre) {
      return NextResponse.json(
        { error: 'Nombre es requerido' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email: email || null,
        telefono: telefono || null,
      },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este nombre de usuario ya existe' },
        { status: 400 }
      );
    }
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error creating usuario' },
      { status: 500 }
    );
  }
}
