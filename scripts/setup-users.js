// Script para ver y configurar usuarios con email y contraseñas
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Mostrar usuarios actuales
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true, password: true }
  });
  
  console.log('\n=== USUARIOS ACTUALES ===\n');
  
  for (const u of usuarios) {
    console.log(`Nombre: ${u.nombre}`);
    console.log(`Email: ${u.email || '(sin email)'}`);
    console.log(`Rol: ${u.rol}`);
    console.log(`Contraseña: ${u.password ? '(establecida)' : '(sin contraseña)'}`);
    console.log('---');
  }

  // Establecer emails y contraseñas por defecto
  const updates = [
    { nombre: 'Carli Esquivel', email: 'carli@remax.com', password: 'admin123' },
    { nombre: 'Solar inmobiliaria', email: 'solar@remax.com', password: 'agente123' },
  ];

  console.log('\n=== ACTUALIZANDO USUARIOS ===\n');

  for (const update of updates) {
    const hashedPassword = await bcrypt.hash(update.password, 12);
    
    await prisma.usuario.updateMany({
      where: { nombre: update.nombre },
      data: { 
        email: update.email,
        password: hashedPassword 
      }
    });
    
    console.log(`✅ ${update.nombre}`);
    console.log(`   Email: ${update.email}`);
    console.log(`   Contraseña: ${update.password}`);
    console.log('');
  }

  console.log('\n=== CREDENCIALES FINALES ===\n');
  console.log('┌─────────────────────┬────────────────────┬─────────────┬─────────┐');
  console.log('│ Usuario             │ Email              │ Contraseña  │ Rol     │');
  console.log('├─────────────────────┼────────────────────┼─────────────┼─────────┤');
  console.log('│ Carli Esquivel      │ carli@remax.com    │ admin123    │ admin   │');
  console.log('│ Solar inmobiliaria  │ solar@remax.com    │ agente123   │ agente  │');
  console.log('└─────────────────────┴────────────────────┴─────────────┴─────────┘');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
