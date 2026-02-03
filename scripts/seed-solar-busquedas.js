const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('☀️ Creando clientes y búsquedas para SOLAR Inmobiliaria...\n')

  // 1. Encontrar la inmobiliaria Solar
  const solar = await prisma.inmobiliaria.findUnique({
    where: { slug: 'solar' }
  })

  if (!solar) {
    console.error('❌ No se encontró la inmobiliaria Solar. Ejecutá primero seed-solar.js')
    return
  }
  console.log(`✅ Inmobiliaria: ${solar.nombre}`)

  // 2. Encontrar un agente de Solar
  let agenteSolar = await prisma.usuario.findFirst({
    where: { 
      inmobiliariaId: solar.id,
      rol: { in: ['agente', 'admin'] }
    }
  })

  if (!agenteSolar) {
    // Crear agente si no existe
    agenteSolar = await prisma.usuario.create({
      data: {
        nombre: 'Agente Solar 1',
        email: 'agente@solar.com.ar',
        rol: 'agente',
        activo: true,
        inmobiliariaId: solar.id
      }
    })
    console.log('✅ Agente creado: Agente Solar 1')
  } else {
    console.log(`✅ Agente encontrado: ${agenteSolar.nombre}`)
  }

  // 3. Crear clientes para Solar
  const clientesData = [
    {
      nombreCompleto: 'Roberto Martínez',
      email: 'roberto.martinez@email.com',
      telefono: '+54 342 456 7890',
      notas: 'Busca departamento céntrico para inversión'
    },
    {
      nombreCompleto: 'Laura Giménez',
      email: 'laura.gimenez@email.com',
      telefono: '+54 342 567 8901',
      notas: 'Familia joven, busca casa con patio'
    },
    {
      nombreCompleto: 'Miguel Fernández',
      email: 'miguel.fernandez@email.com',
      telefono: '+54 342 678 9012',
      notas: 'Inversor, interesado en locales comerciales'
    },
    {
      nombreCompleto: 'Carolina Pérez',
      email: 'carolina.perez@email.com',
      telefono: '+54 342 789 0123',
      notas: 'Primera vivienda, puede acceder a crédito'
    },
    {
      nombreCompleto: 'Diego Sánchez',
      email: 'diego.sanchez@email.com',
      telefono: '+54 342 890 1234',
      notas: 'Busca quinta para fines de semana'
    }
  ]

  const clientes = []
  for (const clienteData of clientesData) {
    let cliente = await prisma.cliente.findFirst({
      where: {
        nombreCompleto: clienteData.nombreCompleto,
        inmobiliariaId: solar.id
      }
    })

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          ...clienteData,
          inmobiliariaId: solar.id,
          usuarioId: agenteSolar.id
        }
      })
      console.log(`  ✅ Cliente creado: ${cliente.nombreCompleto}`)
    } else {
      console.log(`  → Cliente existente: ${cliente.nombreCompleto}`)
    }
    clientes.push(cliente)
  }

  // 4. Crear búsquedas para cada cliente
  const busquedasData = [
    {
      clienteIndex: 0, // Roberto Martínez
      origen: 'ACTIVA',
      presupuestoTexto: '80.000 USD',
      presupuestoValor: 80000,
      moneda: 'USD',
      tipoPropiedad: 'DEPARTAMENTO',
      ubicacionPreferida: 'Centro, Santa Fe',
      dormitoriosMin: 1,
      finalidad: 'INVERSION',
      estado: 'CALIFICADO',
      observaciones: 'Prefiere edificios nuevos con amenities'
    },
    {
      clienteIndex: 0, // Roberto Martínez - segunda búsqueda
      origen: 'ACTIVA',
      presupuestoTexto: '120.000 USD',
      presupuestoValor: 120000,
      moneda: 'USD',
      tipoPropiedad: 'DEPARTAMENTO',
      ubicacionPreferida: 'Recoleta, Santa Fe',
      dormitoriosMin: 2,
      finalidad: 'INVERSION',
      estado: 'NUEVO',
      observaciones: 'Alternativa para alquiler temporario'
    },
    {
      clienteIndex: 1, // Laura Giménez
      origen: 'CALIFICADA_CREDITO',
      presupuestoTexto: '150.000 USD',
      presupuestoValor: 150000,
      moneda: 'USD',
      tipoPropiedad: 'CASA',
      ubicacionPreferida: 'Sauce Viejo, Santo Tomé',
      dormitoriosMin: 3,
      cochera: 'SI',
      finalidad: 'VIVIENDA',
      estado: 'VISITA',
      observaciones: 'Necesita patio grande para los chicos'
    },
    {
      clienteIndex: 2, // Miguel Fernández
      origen: 'ACTIVA',
      presupuestoTexto: '200.000 USD',
      presupuestoValor: 200000,
      moneda: 'USD',
      tipoPropiedad: 'LOCAL',
      ubicacionPreferida: 'Centro, Peatonal',
      dormitoriosMin: null,
      finalidad: 'INVERSION',
      estado: 'CALIFICADO',
      observaciones: 'Busca local con buena ubicación comercial'
    },
    {
      clienteIndex: 3, // Carolina Pérez
      origen: 'CALIFICADA_CREDITO',
      presupuestoTexto: '70.000 USD',
      presupuestoValor: 70000,
      moneda: 'USD',
      tipoPropiedad: 'DEPARTAMENTO',
      ubicacionPreferida: 'Santa Fe capital',
      dormitoriosMin: 2,
      finalidad: 'VIVIENDA',
      estado: 'NUEVO',
      observaciones: 'Primera vivienda, tiene pre-aprobado crédito hipotecario'
    },
    {
      clienteIndex: 3, // Carolina Pérez - alternativa
      origen: 'CALIFICADA_CREDITO',
      presupuestoTexto: '90.000 USD',
      presupuestoValor: 90000,
      moneda: 'USD',
      tipoPropiedad: 'CASA',
      ubicacionPreferida: 'Rincón, Arroyo Leyes',
      dormitoriosMin: 2,
      finalidad: 'VIVIENDA',
      estado: 'NUEVO',
      observaciones: 'Alternativa a las afueras'
    },
    {
      clienteIndex: 4, // Diego Sánchez
      origen: 'CALIFICADA_EFECTIVO',
      presupuestoTexto: '180.000 USD',
      presupuestoValor: 180000,
      moneda: 'USD',
      tipoPropiedad: 'QUINTA',
      ubicacionPreferida: 'Rincón, Monte Vera',
      dormitoriosMin: 2,
      cochera: 'SI',
      finalidad: 'INVERSION',
      estado: 'RESERVA',
      observaciones: 'Paga contado, busca con pileta'
    }
  ]

  let busquedasCreadas = 0
  for (const busqueda of busquedasData) {
    const cliente = clientes[busqueda.clienteIndex]
    
    // Verificar si ya existe una búsqueda similar
    const existe = await prisma.busqueda.findFirst({
      where: {
        clienteId: cliente.id,
        tipoPropiedad: busqueda.tipoPropiedad,
        ubicacionPreferida: busqueda.ubicacionPreferida
      }
    })

    if (!existe) {
      await prisma.busqueda.create({
        data: {
          clienteId: cliente.id,
          origen: busqueda.origen,
          presupuestoTexto: busqueda.presupuestoTexto,
          presupuestoValor: busqueda.presupuestoValor,
          moneda: busqueda.moneda,
          tipoPropiedad: busqueda.tipoPropiedad,
          ubicacionPreferida: busqueda.ubicacionPreferida,
          dormitoriosMin: busqueda.dormitoriosMin,
          cochera: busqueda.cochera || null,
          finalidad: busqueda.finalidad,
          estado: busqueda.estado,
          observaciones: busqueda.observaciones,
          createdBy: agenteSolar.id
        }
      })
      busquedasCreadas++
    }
  }

  console.log(`\n✅ Se crearon ${busquedasCreadas} búsquedas para Solar`)

  // Resumen final
  const totalBusquedas = await prisma.busqueda.count({
    where: {
      cliente: { inmobiliariaId: solar.id }
    }
  })

  const totalClientes = await prisma.cliente.count({
    where: { inmobiliariaId: solar.id }
  })

  console.log(`\n📊 Resumen Solar:`)
  console.log(`   - Clientes: ${totalClientes}`)
  console.log(`   - Búsquedas: ${totalBusquedas}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
