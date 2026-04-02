const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creando Inmobiliaria Demo y Usuario...');

  // 1. Crear Inmobiliaria
  const inmobiliaria = await prisma.inmobiliaria.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      nombre: 'Inmobiliar en Equipo Demo',
      slug: 'demo',
      email: 'info@inmobiliar.com',
      whatsapp: '+54 11 1234-5678',
      colorPrimario: '#2563eb', // Blue 600
    },
  });

  console.log(`✅ Inmobiliaria: ${inmobiliaria.nombre} [id: ${inmobiliaria.id}]`);

  // 2. Crear Usuario Demo
  const email = 'demo@inmobiliar.com';
  const password = 'demo123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      inmobiliariaId: inmobiliaria.id,
      rol: 'admin',
    },
    create: {
      nombre: 'Usuario Demo',
      email,
      password: hashedPassword,
      rol: 'admin',
      inmobiliariaId: inmobiliaria.id,
    },
  });

  console.log(`✅ Usuario Demo: ${usuario.nombre} (${usuario.email})`);
  console.log(`🔑 Contraseña: ${password}`);

  console.log('\n✨ Proceso completado con éxito');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
