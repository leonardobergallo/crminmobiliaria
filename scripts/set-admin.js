// Script para establecer a Carli Esquivel como admin
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Establecer Carli Esquivel como admin
  const carli = await prisma.usuario.updateMany({
    where: { nombre: 'Carli Esquivel' },
    data: { rol: 'admin' }
  });
  
  console.log('Carli Esquivel actualizado como admin:', carli);
  
  // Mostrar todos los usuarios
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, rol: true, activo: true }
  });
  
  console.log('\nUsuarios actuales:');
  usuarios.forEach(u => {
    console.log(`- ${u.nombre}: ${u.rol} (${u.activo ? 'activo' : 'inactivo'})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
