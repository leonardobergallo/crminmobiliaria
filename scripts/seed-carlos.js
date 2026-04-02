const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Cargando datos de ejemplo para Carlos Esquivel...\n')

    // Crear o encontrar el usuario
    let carlosEsquivel = await prisma.usuario.findUnique({
      where: { nombre: 'Carli Esquivel' },
    })

    if (!carlosEsquivel) {
      carlosEsquivel = await prisma.usuario.create({
        data: {
          nombre: 'Carli Esquivel',
          email: 'carli.esquivel@ejemplo.com',
          telefono: '+34 666 777 888',
          activo: true,
        },
      })
      console.log('✅ Usuario creado: Carli Esquivel')
    } else {
      console.log('✅ Usuario encontrado: Carli Esquivel')
    }

    // Crear clientes
    let cliente1 = await prisma.cliente.findFirst({
      where: { 
        nombreCompleto: 'María García López',
        usuario: { id: carlosEsquivel.id }
      },
    })

    if (!cliente1) {
      cliente1 = await prisma.cliente.create({
        data: {
          nombreCompleto: 'María García López',
          email: 'maria.garcia@email.com',
          telefono: '+34 612 345 678',
          usuario: {
            connect: { id: carlosEsquivel.id }
          },
          notas: 'Cliente potencial para departamento de 2 dormitorios',
        },
      })
      console.log('✅ Cliente creado: María García López')
    } else {
      console.log('✅ Cliente encontrado: María García López')
    }

    let cliente2 = await prisma.cliente.findFirst({
      where: { 
        nombreCompleto: 'Juan Rodríguez Martínez',
        usuario: { id: carlosEsquivel.id }
      },
    })

    if (!cliente2) {
      cliente2 = await prisma.cliente.create({
        data: {
          nombreCompleto: 'Juan Rodríguez Martínez',
          email: 'juan.rodriguez@email.com',
          telefono: '+34 623 456 789',
          usuario: {
            connect: { id: carlosEsquivel.id }
          },
          notas: 'Interesado en casa con patio',
        },
      })
      console.log('✅ Cliente creado: Juan Rodríguez Martínez')
    } else {
      console.log('✅ Cliente encontrado: Juan Rodríguez Martínez')
    }

    let cliente3 = await prisma.cliente.findFirst({
      where: { 
        nombreCompleto: 'Ana Fernández Silva',
        usuario: { id: carlosEsquivel.id }
      },
    })

    if (!cliente3) {
      cliente3 = await prisma.cliente.create({
        data: {
          nombreCompleto: 'Ana Fernández Silva',
          email: 'ana.fernandez@email.com',
          telefono: '+34 634 567 890',
          usuario: {
            connect: { id: carlosEsquivel.id }
          },
          notas: 'Busca propiedad a crédito, presupuesto 200K',
        },
      })
      console.log('✅ Cliente creado: Ana Fernández Silva')
    } else {
      console.log('✅ Cliente encontrado: Ana Fernández Silva')
    }
    console.log('✅ Cliente creado: Ana Fernández Silva\n')

    // Crear búsquedas
    const busqueda1 = await prisma.busqueda.create({
      data: {
        clienteId: cliente1.id,
        origen: 'Web',
        presupuestoTexto: '150.000 - 200.000',
        presupuestoValor: 175000,
        moneda: 'USD',
        tipoPropiedad: 'Departamento',
        ubicacionPreferida: 'Zona Centro',
        dormitoriosMin: 2,
        cochera: 'SI',
        finalidad: 'Vivienda',
        estado: 'Activa',
        observaciones: 'Preferencia por edificio moderno',
      },
    })
    console.log('✅ Búsqueda creada: Departamento 2 dorms')

    const busqueda2 = await prisma.busqueda.create({
      data: {
        clienteId: cliente2.id,
        origen: 'Referencia',
        presupuestoTexto: '250.000 - 350.000',
        presupuestoValor: 300000,
        moneda: 'USD',
        tipoPropiedad: 'Casa',
        ubicacionPreferida: 'Zona Norte Residencial',
        dormitoriosMin: 3,
        cochera: 'SI',
        finalidad: 'Vivienda',
        estado: 'Activa',
        observaciones: 'Necesita patio para mascotas',
      },
    })
    console.log('✅ Búsqueda creada: Casa con patio')

    const busqueda3 = await prisma.busqueda.create({
      data: {
        clienteId: cliente3.id,
        origen: 'Publicidad',
        presupuestoTexto: 'A Crédito',
        presupuestoValor: 200000,
        moneda: 'ARS',
        tipoPropiedad: 'Departamento',
        ubicacionPreferida: 'Zona Sur',
        dormitoriosMin: 2,
        cochera: 'NO',
        finalidad: 'Vivienda',
        estado: 'Calificada',
        observaciones: 'Apto para financiación bancaria',
      },
    })
    console.log('✅ Búsqueda creada: Depto a crédito\n')

    // Crear propiedades
    let propiedad1 = await prisma.propiedad.findFirst({
      where: {
        direccion: 'Calle Principal 123, Apartamento 4B',
        usuario: { id: carlosEsquivel.id }
      },
    })

    if (!propiedad1) {
      propiedad1 = await prisma.propiedad.create({
        data: {
          ubicacion: 'Centro, Capital',
          zona: 'Centro',
          localidad: 'Centro',
          direccion: 'Calle Principal 123, Apartamento 4B',
          tipo: 'Departamento',
          precio: 180000,
          moneda: 'USD',
          dormitorios: 2,
          banos: 1,
          ambientes: 3,
          superficie: 75,
          usuario: {
            connect: { id: carlosEsquivel.id }
          },
          aptaCredito: true,
          descripcion: 'Recientemente refaccionado, excelente ubicación',
          fuente: 'APTA_CREDITO',
        },
      })
      console.log('✅ Propiedad creada: Depto Centro 75m²')
    } else {
      console.log('✅ Propiedad encontrada: Depto Centro 75m²')
    }

    let propiedad2 = await prisma.propiedad.findFirst({
      where: {
        direccion: 'Avenida del Parque 456',
        usuario: { id: carlosEsquivel.id }
      },
    })

    if (!propiedad2) {
      propiedad2 = await prisma.propiedad.create({
        data: {
          ubicacion: 'Zona Residencial, Capital',
          zona: 'Zona Residencial',
          localidad: 'Zona Residencial',
          direccion: 'Avenida del Parque 456',
          tipo: 'Casa',
          precio: 320000,
          moneda: 'USD',
          dormitorios: 3,
          banos: 2,
          ambientes: 5,
          superficie: 150,
          usuario: {
            connect: { id: carlosEsquivel.id }
          },
          aptaCredito: false,
          descripcion: 'Casa con patio amplio, piscina pequeña',
          fuente: 'OTRA',
        },
      })
      console.log('✅ Propiedad creada: Casa Residencial 150m²')
    } else {
      console.log('✅ Propiedad encontrada: Casa Residencial 150m²')
    }

    // Crear operación
    let operacion = await prisma.operacion.findUnique({
      where: { nro: 1 },
    })

    if (!operacion) {
      operacion = await prisma.operacion.create({
        data: {
          nro: 1,
          cliente: {
            connect: { id: cliente1.id }
          },
          usuario: {
            connect: { id: carlosEsquivel.id }
          },
          descripcion: 'Venta de departamento en Centro',
          precioReal: 180000,
          comisionTotal: 10800,
          totalComisionEquipo: 4860,
          comisionEquipoUnaPunta: 2430,
          comisionLeoDosPuntas: 2160,
          comisionLeoUnaPunta: 2160,
          fechaPagoAprox: new Date('2026-02-14'),
          observaciones: 'Operación cerrada, documentación en trámite',
        },
      })
      console.log('✅ Operación creada: OP-001\n')
    } else {
      console.log('✅ Operación encontrada: OP-001\n')
    }
    console.log('✅ Operación creada: OP-001-2026\n')

    console.log('✨ ¡Datos cargados exitosamente para Carli Esquivel!\n')
    console.log('Resumen:')
    console.log(`  • Usuario: ${carlosEsquivel.nombre}`)
    console.log(`  • Clientes: 3`)
    console.log(`  • Búsquedas activas: 3`)
    console.log(`  • Propiedades: 2`)
    console.log(`  • Operaciones: 1`)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
