import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/auth/me - Obtener usuario actual
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
