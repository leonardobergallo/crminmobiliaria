const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const usuarios = await prisma.usuario.findMany({
    include: { inmobiliaria: true },
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }]
  })
  
  console.log('=== USUARIOS ACTUALES ===\n')
  console.log('NOMBRE'.padEnd(25) + '| EMAIL'.padEnd(35) + '| ROL'.padEnd(15) + '| INMOBILIARIA'.padEnd(30) + '| PASSWORD')
  console.log('-'.repeat(110))
  usuarios.forEach(u => {
    const nombre = u.nombre.padEnd(24)
    const email = (u.email || 'sin email').padEnd(34)
    const rol = u.rol.padEnd(14)
    const inmob = (u.inmobiliaria?.nombre || 'GLOBAL').padEnd(29)
    const pass = u.password ? 'SI' : 'NO'
    console.log(`${nombre}| ${email}| ${rol}| ${inmob}| ${pass}`)
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)
