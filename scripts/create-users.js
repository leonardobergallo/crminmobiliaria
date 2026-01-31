// Script para crear usuarios de ejemplo con credenciales
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== CREANDO USUARIOS ===\n');

  const usuarios = [
    {
      nombre: 'Admin',
      email: 'admin@inmobiliaria.com',
      password: 'admin123',
      rol: 'admin',
      telefono: '+54 11 1234-5678',
    },
    {
      nombre: 'Agente 1',
      email: 'agente1@inmobiliaria.com',
      password: 'agente123',
      rol: 'agente',
      telefono: '+54 11 2345-6789',
    },
    {
      nombre: 'Agente 2',
      email: 'agente2@inmobiliaria.com',
      password: 'agente123',
      rol: 'agente',
      telefono: '+54 11 3456-7890',
    },
  ];

  const creados = [];

  for (const usuario of usuarios) {
    try {
      // Verificar si ya existe
      const existe = await prisma.usuario.findUnique({
        where: { nombre: usuario.nombre },
      });

      if (existe) {
        // Actualizar si existe
        const hashedPassword = await bcrypt.hash(usuario.password, 12);
        await prisma.usuario.update({
          where: { nombre: usuario.nombre },
          data: {
            email: usuario.email,
            password: hashedPassword,
            rol: usuario.rol,
            telefono: usuario.telefono,
            activo: true,
          },
        });
        console.log(`✅ Actualizado: ${usuario.nombre}`);
        creados.push({ ...usuario, accion: 'actualizado' });
      } else {
        // Crear nuevo
        const hashedPassword = await bcrypt.hash(usuario.password, 12);
        await prisma.usuario.create({
          data: {
            nombre: usuario.nombre,
            email: usuario.email,
            password: hashedPassword,
            rol: usuario.rol,
            telefono: usuario.telefono,
            activo: true,
          },
        });
        console.log(`✅ Creado: ${usuario.nombre}`);
        creados.push({ ...usuario, accion: 'creado' });
      }
    } catch (error) {
      console.error(`❌ Error con ${usuario.nombre}:`, error.message);
    }
  }

  console.log('\n=== CREDENCIALES PARA INGRESAR ===\n');
  console.log('┌─────────────────────┬──────────────────────────────┬─────────────┬─────────┐');
  console.log('│ Usuario             │ Email                         │ Contraseña  │ Rol     │');
  console.log('├─────────────────────┼──────────────────────────────┼─────────────┼─────────┤');
  
  creados.forEach(u => {
    const nombre = u.nombre.padEnd(20);
    const email = u.email.padEnd(28);
    const password = u.password.padEnd(12);
    const rol = u.rol.padEnd(8);
    console.log(`│ ${nombre} │ ${email} │ ${password} │ ${rol} │`);
  });
  
  console.log('└─────────────────────┴──────────────────────────────┴─────────────┴─────────┘');
  
  console.log('\n📝 NOTAS:');
  console.log('   • Usa el email y contraseña para iniciar sesión');
  console.log('   • El usuario Admin puede ver y gestionar todo');
  console.log('   • Los Agentes solo ven sus propias búsquedas y propiedades');
  console.log('   • Puedes cambiar las contraseñas desde la página de administración\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
