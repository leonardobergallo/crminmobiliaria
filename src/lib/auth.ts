import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'crm-inmobiliario-secret-key-2024';

export interface TokenPayload {
  userId: string;
  nombre: string;
  email: string;
  rol: string;
}

// Hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verificar contraseña
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generar token JWT
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verificar token JWT
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Obtener usuario actual desde cookies
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const user = await prisma.usuario.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      avatar: true,
      rol: true,
      activo: true,
    }
  });
  
  if (!user || !user.activo) return null;
  
  return user;
}

// Verificar si es admin
export function isAdmin(user: { rol: string } | null): boolean {
  return user?.rol === 'admin';
}

// Verificar si tiene permiso
export function hasPermission(user: { rol: string } | null, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.rol);
}
