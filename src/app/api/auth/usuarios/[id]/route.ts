import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// PUT /api/auth/usuarios/[id] - Actualizar usuario (admin o el propio usuario)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admin puede editar otros usuarios, o el propio usuario puede editarse
    const isOwnProfile = currentUser.id === id;
    const isAdmin = currentUser.rol === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, email, telefono, rol, password, activo } = body;

    // Solo admin puede cambiar rol y estado activo
    const updateData: Record<string, unknown> = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email || null;
    if (telefono !== undefined) updateData.telefono = telefono || null;

    // Solo admin puede cambiar estos campos
    if (isAdmin) {
      if (rol !== undefined) updateData.rol = rol;
      if (activo !== undefined) updateData.activo = activo;
    }

    // Cambiar contraseña
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/auth/usuarios/[id] - Eliminar usuario (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // No permitir eliminar el propio usuario
    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      );
    }

    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
