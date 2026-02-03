const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('📊 Verificando asignación de búsquedas...\n')

  const busquedas = await prisma.busqueda.findMany({
    include: {
      cliente: {
        include: {
          usuario: {
            select: { id: true, nombre: true }
          }
        }
      },
      usuario: {
        select: { id: true, nombre: true }
      }
    },
    take: 30
  })

  console.log('ID Búsqueda | Cliente | Agente del Cliente | Creado por')
  console.log('-'.repeat(80))

  busquedas.forEach(b => {
    const cliente = b.cliente?.nombreCompleto || 'Sin cliente'
    const agenteCliente = b.cliente?.usuario?.nombre || 'Sin agente'
    const creadoPor = b.usuario?.nombre || 'Sin usuario'
    console.log(`${b.id.slice(0,8)}... | ${cliente.slice(0,20).padEnd(20)} | ${agenteCliente.padEnd(18)} | ${creadoPor}`)
  })

  console.log('\n📋 Usuarios en el sistema:')
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, rol: true, inmobiliariaId: true }
  })
  usuarios.forEach(u => {
    console.log(`  - ${u.nombre} (${u.rol}) - Inmobiliaria: ${u.inmobiliariaId || 'Sin asignar'}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
