import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
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
