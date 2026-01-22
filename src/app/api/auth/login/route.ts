import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST /api/auth/login - Iniciar sesión
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Email no encontrado' },
        { status: 401 }
      );
    }

    if (!usuario.activo) {
      return NextResponse.json(
        { error: 'Usuario desactivado. Contacte al administrador.' },
        { status: 401 }
      );
    }

    // Si el usuario no tiene contraseña, es la primera vez - establecer contraseña
    if (!usuario.password) {
      const hashedPassword = await hashPassword(password);
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { 
          password: hashedPassword,
          lastLogin: new Date()
        },
      });
    } else {
      // Verificar contraseña
      const isValid = await verifyPassword(password, usuario.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Contraseña incorrecta' },
          { status: 401 }
        );
      }
      
      // Actualizar último login
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { lastLogin: new Date() },
      });
    }

    // Generar token
    const token = generateToken({
      userId: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email || '',
      rol: usuario.rol,
    });

    // Guardar en cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
