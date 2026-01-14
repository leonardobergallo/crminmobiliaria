import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error fetching usuario' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nombre, email, telefono } = await req.json();

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(email !== undefined && { email: email || null }),
        ...(telefono !== undefined && { telefono: telefono || null }),
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error updating usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error deleting usuario' },
      { status: 500 }
    );
  }
}
