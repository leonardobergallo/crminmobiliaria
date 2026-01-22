import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/auth/logout - Cerrar sesión
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
