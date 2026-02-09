const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== CREANDO USUARIO DEMO MIS FINANZAS ===\n');

  try {
    // 1. Asegurar que existe la "Inmobiliaria" (SaaS Tenant) para MisFinanzas
    let inmobiliaria = await prisma.inmobiliaria.findUnique({
      where: { slug: 'misfinanzas' }
    });

    if (!inmobiliaria) {
      console.log('Creando tenant MisFinanzas...');
      inmobiliaria = await prisma.inmobiliaria.create({
        data: {
          nombre: 'MisFinanzas',
          slug: 'misfinanzas',
          email: 'info@misfinanzas.com',
          colorPrimario: '#2563eb', // Blue 600
        }
      });
    }

    // 2. Crear el usuario demo
    const email = 'demo@misfinanzas.com';
    const password = 'demo_password';
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.usuario.upsert({
      where: { email: email },
      update: {
        password: hashedPassword,
        rol: 'admin',
        inmobiliariaId: inmobiliaria.id,
      },
      create: {
        nombre: 'Usuario Demo',
        email: email,
        password: hashedPassword,
        rol: 'admin',
        inmobiliariaId: inmobiliaria.id,
        telefono: '+54 11 1234-5678',
      }
    });

    console.log(`Usuario creado/actualizado: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Tenant: ${inmobiliaria.nombre}`);

  } catch (error) {
    console.error('Error creando usuario demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
