const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  console.log('=== INMOBILIARIAS ===')
  const inmobiliarias = await prisma.inmobiliaria.findMany()
  inmobiliarias.forEach(i => console.log(`  - ${i.nombre} (${i.slug}) ID: ${i.id}`))

  console.log('\n=== USUARIOS POR INMOBILIARIA ===')
  const usuarios = await prisma.usuario.findMany({ include: { inmobiliaria: true } })
  usuarios.forEach(u => console.log(`  - ${u.nombre} (${u.rol}) -> ${u.inmobiliaria?.nombre || 'SIN INMOBILIARIA'}`))

  console.log('\n=== CLIENTES POR INMOBILIARIA ===')
  const clientes = await prisma.cliente.findMany({ include: { inmobiliaria: true, usuario: true } })
  const clientesPorInmob = {}
  clientes.forEach(c => {
    const key = c.inmobiliaria?.nombre || 'SIN INMOBILIARIA'
    if (!clientesPorInmob[key]) clientesPorInmob[key] = []
    clientesPorInmob[key].push(c.nombreCompleto)
  })
  Object.entries(clientesPorInmob).forEach(([inmob, lista]) => {
    console.log(`  ${inmob}:`)
    lista.forEach(n => console.log(`    - ${n}`))
  })

  console.log('\n=== PROPIEDADES POR INMOBILIARIA ===')
  const props = await prisma.propiedad.groupBy({ by: ['inmobiliariaId'], _count: true })
  for (const p of props) {
    const inmob = p.inmobiliariaId ? await prisma.inmobiliaria.findUnique({ where: { id: p.inmobiliariaId } }) : null
    console.log(`  - ${inmob?.nombre || 'SIN INMOBILIARIA'}: ${p._count} propiedades`)
  }

  console.log('\n=== BÚSQUEDAS POR INMOBILIARIA ===')
  const busquedas = await prisma.busqueda.findMany({ 
    include: { 
      cliente: { include: { inmobiliaria: true } }, 
      usuario: true 
    } 
  })
  const porInmob = {}
  busquedas.forEach(b => {
    const key = b.cliente?.inmobiliaria?.nombre || 'SIN INMOBILIARIA'
    if (!porInmob[key]) porInmob[key] = []
    porInmob[key].push({
      cliente: b.cliente?.nombreCompleto,
      tipo: b.tipoPropiedad,
      estado: b.estado,
      agente: b.usuario?.nombre
    })
  })
  Object.entries(porInmob).forEach(([inmob, lista]) => {
    console.log(`  ${inmob}: ${lista.length} búsquedas`)
    lista.slice(0, 5).forEach(b => console.log(`    - ${b.cliente} | ${b.tipo} | ${b.estado} | Agente: ${b.agente}`))
    if (lista.length > 5) console.log(`    ... y ${lista.length - 5} más`)
  })

  await prisma.$disconnect()
}

check().catch(console.error)
