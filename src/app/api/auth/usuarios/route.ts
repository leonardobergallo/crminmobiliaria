import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// GET /api/auth/usuarios - Listar usuarios (solo admin)
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        avatar: true,
        rol: true,
        activo: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/auth/usuarios - Crear usuario (solo admin)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nombre, email, telefono, rol, password } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Verificar si existe
    const existe = await prisma.usuario.findUnique({
      where: { nombre },
    });

    if (existe) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese nombre' },
        { status: 400 }
      );
    }

    // Hash de contraseña si se proporcionó
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email: email || null,
        telefono: telefono || null,
        rol: rol || 'agente',
        password: hashedPassword,
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true,
      },
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
