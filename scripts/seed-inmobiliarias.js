// Script para inicializar el sistema con Carli Esquivel y Solar Inmobiliaria
// Ejecutar con: node scripts/seed-inmobiliarias.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const XLSX = require('xlsx')
const path = require('path')

const prisma = new PrismaClient()

// Búsquedas reales de Carli (del WhatsApp)
const busquedasCarli = [
  {
    textoOriginal: "Busq de depaa AMPLIOO y X ASCENSOR de 2 dormii con balcon y con cochh comoda fundamental para ingresar a vivirrrr, NO CONDICIONADO; que sea amplisimo entre 80 m2 o mas, con mb luminosidad y ventilacion dentro de los bvares hasta 120mil dolsss.",
    tipoPropiedad: "DEPARTAMENTO",
    dormitoriosMin: 2,
    superficie: 80,
    cochera: "SI - cómoda, fundamental",
    ubicacionPreferida: "Dentro de bulevares",
    presupuestoValor: 120000,
    moneda: "USD",
    finalidad: "VIVIENDA",
    observaciones: "Amplio, con ascensor, balcón, luminoso, ventilado. NO condicionado. Para entrar a vivir."
  },
  {
    textoOriginal: "Búsqueda de una propiedad para refaccionar xq es para entrar a vivir una flia y tiene que tener potencial para cuatro dormitorios por lo que la superficie del terreno es importante y debe oscilar entre 150 y 250 m2 aproximadamente. Dicha inversión tendría que rondar los usd 150,000. Las zonas que interesan son: preferentemente Candioti desde Avellaneda hasta Belgrano y desde Sargento Cabral hasta Chacabuco y por otro lado Barrio Centro desde 1ro de mayo hasta San Lorenzo y desde Lisandro de la Torre hasta Santiago.",
    tipoPropiedad: "CASA",
    dormitoriosMin: 4,
    superficie: 150,
    cochera: null,
    ubicacionPreferida: "Candioti (Avellaneda-Belgrano, Sargento Cabral-Chacabuco) o Centro (1ro Mayo-San Lorenzo, Lisandro Torre-Santiago)",
    presupuestoValor: 150000,
    moneda: "USD",
    finalidad: "VIVIENDA",
    observaciones: "Para refaccionar. Familia. Potencial 4 dormitorios. Terreno 150-250 m2."
  },
  {
    textoOriginal: "Búsqueda de propiedad muy luminosa y muy ventilada que te den ganas de entrar a vivir, (nada tétrico!) puede ser algo 0 km o sino remodelado a nuevo y con dos habitaciones. Preferentemente una casa al frente con algo de patio y cochhh y sino en su defecto puede ser un PH al frente en planta baja con las mismas caracteristicas. y si o sí es esencial que cuente con cochera amplia de 4,80 de largo como mínimo x 2,80 de ancho como mínimo y si es mas bienvenido sea para que pueda abrir comodamente las puertas y baul y le entre una Nissan kicks comodamemte Dentro de los bulevares, (barrios lindos y tranquilos y seguros) Presupuesto USD 120.000 dolss.",
    tipoPropiedad: "OTRO",
    dormitoriosMin: 2,
    superficie: null,
    cochera: "SI - amplia 4.80x2.80 mínimo (para Nissan Kicks)",
    ubicacionPreferida: "Dentro de bulevares - barrios lindos, tranquilos y seguros",
    presupuestoValor: 120000,
    moneda: "USD",
    finalidad: "VIVIENDA",
    observaciones: "Casa al frente con patio O PH planta baja al frente. Muy luminosa, ventilada. 0km o remodelado. Nada tétrico."
  },
  {
    textoOriginal: "busqueda en el paso hasta 500mil dolss Para un amigowww... Un frennchiss",
    tipoPropiedad: "OTRO",
    dormitoriosMin: null,
    superficie: null,
    cochera: null,
    ubicacionPreferida: "El Paso",
    presupuestoValor: 500000,
    moneda: "USD",
    finalidad: "INVERSION",
    observaciones: "Franquicia. Para un amigo."
  },
  {
    textoOriginal: "Busco preferentemente en zona Recoleta una casa lista para entrar a vivir desarrollada completamente en planta baja y que sea bien luminosa y ventilada; si es nueva mucho mejor para un matrimonio de edad avanzada; o en su defecto un PH al frente en planta baja con las mismas características. Tb puede ser sobre las transversales a no más de 15/20 metros. Hasta USD 250mil dolsss",
    tipoPropiedad: "OTRO",
    dormitoriosMin: null,
    superficie: null,
    cochera: null,
    ubicacionPreferida: "Recoleta - o transversales hasta 15/20 metros",
    presupuestoValor: 250000,
    moneda: "USD",
    finalidad: "VIVIENDA",
    observaciones: "Casa planta baja O PH al frente planta baja. Lista para vivir. Luminosa, ventilada. Nueva mejor. Matrimonio mayor."
  },
  {
    textoOriginal: "Búsqueda de depaaa terminado para inversion, de 1 dormitorio que no oriente nada al oeste, ni balcon ni pieza y si es posible con coch en un buen nivel de piso de alt xq quieren buena vista!, nuevo y a estrenar y de alta Gama que ronde los usd 120,000 dentro de los boulevares pd: NO CAMM ni PILAY",
    tipoPropiedad: "DEPARTAMENTO",
    dormitoriosMin: 1,
    superficie: null,
    cochera: "SI - preferible, piso alto",
    ubicacionPreferida: "Dentro de bulevares",
    presupuestoValor: 120000,
    moneda: "USD",
    finalidad: "INVERSION",
    observaciones: "Terminado, nuevo, alta gama. NO orientación oeste. Piso alto, buena vista. EXCLUIR: CAMM, Pilay."
  },
  {
    textoOriginal: "Busco casa a refaccionar hasta USD 200,000 y si es menos mejor en candioti o en su defecto Barrio 7 jefes, en la costanegra zona lawn tennis en fin que esté cerca de la costanera (avda Almirante Brown)",
    tipoPropiedad: "CASA",
    dormitoriosMin: null,
    superficie: null,
    cochera: null,
    ubicacionPreferida: "Candioti, Barrio 7 Jefes, Costanera (Av. Almirante Brown), zona Lawn Tennis",
    presupuestoValor: 200000,
    moneda: "USD",
    finalidad: "VIVIENDA",
    observaciones: "Para refaccionar. Cerca de la costanera. Si es menos mejor."
  }
]

async function main() {
  console.log('🚀 Iniciando carga de datos...\n')

  // 1. Limpiar datos existentes
  console.log('🗑️  Limpiando datos existentes...')
  await prisma.matchBusquedaPropiedad.deleteMany()
  await prisma.envioPropiedad.deleteMany()
  await prisma.comunicacion.deleteMany()
  await prisma.tarea.deleteMany()
  await prisma.busqueda.deleteMany()
  await prisma.operacion.deleteMany()
  await prisma.propiedad.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.session.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.inmobiliaria.deleteMany()
  console.log('✅ Datos limpiados\n')

  // 2. Crear inmobiliarias
  console.log('🏢 Creando inmobiliarias...')
  
  const inmobiliariaCarli = await prisma.inmobiliaria.create({
    data: {
      nombre: 'Carli Esquivel Propiedades',
      slug: 'carli-esquivel',
      whatsapp: '+5493424000000',
      email: 'carli@carliesquivel.com',
      colorPrimario: '#E91E63',
    }
  })
  console.log(`  ✅ ${inmobiliariaCarli.nombre} (${inmobiliariaCarli.id})`)

  const inmobiliariaSolar = await prisma.inmobiliaria.create({
    data: {
      nombre: 'Solar Inmobiliaria',
      slug: 'solar',
      whatsapp: '+5493425000000',
      email: 'info@solarinmobiliaria.com',
      colorPrimario: '#FF9800',
    }
  })
  console.log(`  ✅ ${inmobiliariaSolar.nombre} (${inmobiliariaSolar.id})`)
  console.log('')

  // 3. Crear usuarios
  console.log('👤 Creando usuarios...')
  
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  // Superadmin global
  const superadmin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador Global',
      email: 'admin@inmobiliariaenequipo.com',
      password: passwordHash,
      rol: 'superadmin',
      inmobiliariaId: null, // Sin inmobiliaria, ve todas
    }
  })
  console.log(`  ✅ Superadmin: ${superadmin.email}`)

  // Admin Carli
  const carli = await prisma.usuario.create({
    data: {
      nombre: 'Carli Esquivel',
      email: 'carli@carliesquivel.com',
      password: passwordHash,
      rol: 'admin',
      inmobiliariaId: inmobiliariaCarli.id,
    }
  })
  console.log(`  ✅ Admin Carli: ${carli.email}`)

  // Admin Solar
  const solar = await prisma.usuario.create({
    data: {
      nombre: 'Solar Admin',
      email: 'admin@solarinmobiliaria.com',
      password: passwordHash,
      rol: 'admin',
      inmobiliariaId: inmobiliariaSolar.id,
    }
  })
  console.log(`  ✅ Admin Solar: ${solar.email}`)

  // Agente de Carli
  const agenteCarli = await prisma.usuario.create({
    data: {
      nombre: 'Agente Carli 1',
      email: 'agente1@carliesquivel.com',
      password: passwordHash,
      rol: 'agente',
      inmobiliariaId: inmobiliariaCarli.id,
    }
  })
  console.log(`  ✅ Agente Carli: ${agenteCarli.email}`)

  // Agente de Solar
  const agenteSolar = await prisma.usuario.create({
    data: {
      nombre: 'Agente Solar 1',
      email: 'agente1@solarinmobiliaria.com',
      password: passwordHash,
      rol: 'agente',
      inmobiliariaId: inmobiliariaSolar.id,
    }
  })
  console.log(`  ✅ Agente Solar: ${agenteSolar.email}`)
  console.log('')

  // 4. Crear clientes y búsquedas de Carli
  console.log('📋 Creando búsquedas de Carli...')
  
  for (let i = 0; i < busquedasCarli.length; i++) {
    const busqueda = busquedasCarli[i]
    
    // Crear cliente para cada búsqueda
    const cliente = await prisma.cliente.create({
      data: {
        nombreCompleto: `Cliente Búsqueda ${i + 1}`,
        telefono: `+549342400000${i}`,
        notas: busqueda.textoOriginal.substring(0, 100) + '...',
        usuarioId: carli.id,
        inmobiliariaId: inmobiliariaCarli.id,
      }
    })

    // Crear búsqueda
    await prisma.busqueda.create({
      data: {
        clienteId: cliente.id,
        origen: 'ACTIVA',
        tipoPropiedad: busqueda.tipoPropiedad,
        ubicacionPreferida: busqueda.ubicacionPreferida,
        dormitoriosMin: busqueda.dormitoriosMin,
        cochera: busqueda.cochera,
        presupuestoValor: busqueda.presupuestoValor,
        presupuestoTexto: `USD ${busqueda.presupuestoValor?.toLocaleString()}`,
        moneda: busqueda.moneda,
        finalidad: busqueda.finalidad,
        observaciones: busqueda.observaciones,
        planillaRef: busqueda.textoOriginal,
        createdBy: carli.id,
        estado: 'NUEVO',
      }
    })

    console.log(`  ✅ Búsqueda ${i + 1}: ${busqueda.tipoPropiedad} - USD ${busqueda.presupuestoValor?.toLocaleString()}`)
  }
  console.log('')

  // 5. Importar propiedades del Excel
  console.log('🏠 Importando propiedades del Excel...')
  
  const excelPath = path.join(__dirname, '..', 'Documentacion', 'importacion_propiedades_corregida.xlsx')
  
  try {
    const workbook = XLSX.readFile(excelPath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    let countCarli = 0
    let countSolar = 0
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const titulo = row['titulo'] || row['TITULO'] || ''
      const tipo = row['tipo'] || row['TIPO'] || 'venta'
      const zona = row['zona'] || row['ZONA'] || ''
      const descripcion = row['descripcion'] || row['DESCRIPCION'] || ''
      let precio = row['precio'] || row['PRECIO'] || 0
      const monedaInput = row['moneda'] || row['MONEDA'] || 'USD'
      const ambientes = parseInt(row['ambientes'] || row['AMBIENTES'] || '0') || 0
      const banos = parseInt(row['banos'] || row['BANOS'] || '0') || 0
      const superficie = parseInt(row['superficie'] || row['SUPERFICIE'] || '0') || 0
      const direccion = row['direccion'] || row['DIRECCION'] || `Propiedad-${i + 1}` // Generar dirección única
      const whatsapp = row['whatsapp'] || row['WHATSAPP'] || ''
      const dormitorios = parseInt(row['dormitorios'] || row['DORMITORIOS'] || '0') || 0

      // Convertir precio a número
      let precioNumerico = 0
      if (typeof precio === 'number') {
        precioNumerico = precio
      } else if (typeof precio === 'string') {
        precioNumerico = parseInt(precio.replace(/\D/g, '')) || 0
      }

      // Determinar tipo
      let tipoNormalizado = 'OTRO'
      const tipoLower = (tipo + ' ' + titulo + ' ' + descripcion).toLowerCase()
      if (tipoLower.includes('departamento') || tipoLower.includes('depto') || tipoLower.includes('dpto')) {
        tipoNormalizado = 'DEPARTAMENTO'
      } else if (tipoLower.includes('casa')) {
        tipoNormalizado = 'CASA'
      }

      // Alternar entre Carli y Solar
      const esCarli = countCarli <= countSolar
      const inmobiliariaId = esCarli ? inmobiliariaCarli.id : inmobiliariaSolar.id
      const usuarioId = esCarli ? carli.id : solar.id

      try {
        await prisma.propiedad.create({
          data: {
            titulo: titulo || `Propiedad en ${zona || 'Santa Fe'}`,
            tipo: tipoNormalizado,
            subtipo: tipo,
            ubicacion: zona || direccion || 'Santa Fe',
            zona: zona || null,
            direccion: direccion, // Ahora siempre tiene valor único
            precio: precioNumerico,
            moneda: monedaInput.toUpperCase() === 'USD' ? 'USD' : 'ARS',
            descripcion,
            dormitorios: dormitorios || null,
            ambientes,
            banos,
            superficie,
            whatsapp,
            inmobiliariaId,
            usuarioId,
            estado: 'APROBADA',
          }
        })

        if (esCarli) {
          countCarli++
        } else {
          countSolar++
        }
      } catch (err) {
        console.log(`  ⚠️  Error en fila ${i + 1}: ${err.message}`)
      }
    }

    console.log(`  ✅ ${countCarli} propiedades asignadas a Carli Esquivel`)
    console.log(`  ✅ ${countSolar} propiedades asignadas a Solar`)
  } catch (error) {
    console.log(`  ⚠️  No se pudo leer el Excel: ${error.message}`)
    console.log('  📝 Creando propiedades de ejemplo...')
    
    // Crear algunas propiedades de ejemplo si no hay Excel
    const propiedadesEjemplo = [
      { titulo: 'Depto 2 amb luminoso', tipo: 'DEPARTAMENTO', zona: 'Centro', precio: 95000, dormitorios: 1 },
      { titulo: 'Casa 3 dorm con cochera', tipo: 'CASA', zona: 'Candioti', precio: 130000, dormitorios: 3 },
      { titulo: 'PH al frente planta baja', tipo: 'OTRO', zona: 'Recoleta', precio: 115000, dormitorios: 2 },
      { titulo: 'Depto 3 amb a estrenar', tipo: 'DEPARTAMENTO', zona: 'Centro', precio: 140000, dormitorios: 2 },
      { titulo: 'Casa para refaccionar', tipo: 'CASA', zona: 'Candioti', precio: 85000, dormitorios: 2 },
    ]

    for (let i = 0; i < propiedadesEjemplo.length; i++) {
      const p = propiedadesEjemplo[i]
      const esCarli = i % 2 === 0
      
      await prisma.propiedad.create({
        data: {
          titulo: p.titulo,
          tipo: p.tipo,
          ubicacion: p.zona,
          zona: p.zona,
          precio: p.precio,
          moneda: 'USD',
          dormitorios: p.dormitorios,
          inmobiliariaId: esCarli ? inmobiliariaCarli.id : inmobiliariaSolar.id,
          usuarioId: esCarli ? carli.id : solar.id,
          estado: 'APROBADA',
        }
      })
    }
    console.log(`  ✅ ${propiedadesEjemplo.length} propiedades de ejemplo creadas`)
  }

  console.log('')
  console.log('=' .repeat(50))
  console.log('✅ CARGA COMPLETADA')
  console.log('=' .repeat(50))
  console.log('')
  console.log('📌 CREDENCIALES (password: admin123 para todos):')
  console.log('')
  console.log('   🔑 SUPERADMIN (ve todas las inmobiliarias):')
  console.log('      Email: admin@inmobiliariaenequipo.com')
  console.log('')
  console.log('   🏢 CARLI ESQUIVEL PROPIEDADES:')
  console.log('      Admin: carli@carliesquivel.com')
  console.log('      Agente: agente1@carliesquivel.com')
  console.log('')
  console.log('   🏢 SOLAR INMOBILIARIA:')
  console.log('      Admin: admin@solarinmobiliaria.com')
  console.log('      Agente: agente1@solarinmobiliaria.com')
  console.log('')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
