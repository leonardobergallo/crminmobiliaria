const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Datos extraídos de la web de Solar Inmobiliaria
const propiedadesSolar = [
  {
    id: 53,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Maria Selva',
    localidad: 'Santa Fe',
    direccion: 'Llerena 2259 P1 - dpto. 1',
    precio: 55000,
    moneda: 'USD',
    ambientes: 2,
    dormitorios: 1,
    banos: 1,
    superficie: 42,
    superficieCubierta: 40,
    descripcion: 'Muy lindo departamento luminoso, interno en planta alta, 1 dormitorio, cocina-comedor diario con balcón y un baño',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/53_4353_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=53'
  },
  {
    id: 52,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Barranquitas',
    localidad: 'Santa Fe',
    direccion: 'La Paz 4931 PB',
    precio: 70000,
    moneda: 'USD',
    ambientes: 4,
    dormitorios: 2,
    banos: 1,
    superficie: 78,
    superficieCubierta: 75,
    descripcion: 'Amplio departamento en planta baja, que consta de 2 dormitorios, living-comedor-cocina, un baño, lavadero y patio con asador',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/52_4977_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=52'
  },
  {
    id: 51,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Republica del Oeste',
    localidad: 'Santa Fe',
    direccion: 'Catamarca 3528',
    precio: 69000,
    moneda: 'USD',
    ambientes: 5,
    dormitorios: 3,
    banos: 2,
    superficie: 98,
    superficieCubierta: 80,
    descripcion: 'Departamento en primer piso, al frente, por escalera. Muy buena ubicación con bajas expensas. Consta de 3 dormitorios con placares, living comedor cocina y 2 baños. Un patio en seco con lavadero cubierto y amplio balcón al frente. Amplio departamento ideal para vivienda o inversión',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/51_6031_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=51'
  },
  {
    id: 50,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Santa Fe',
    localidad: 'Santa Fe',
    direccion: 'Las Heras 3306',
    precio: 50000,
    moneda: 'USD',
    ambientes: 3,
    dormitorios: 1,
    banos: 1,
    superficie: 45,
    superficieCubierta: 45,
    descripcion: 'Departamento en venta',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/50_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=50'
  },
  {
    id: 49,
    titulo: 'Casa en Venta en Ayacucho 766',
    tipo: 'CASA',
    zona: 'Centro',
    localidad: 'Santa Fe',
    direccion: 'Ayacucho 766',
    precio: 0,
    moneda: 'USD',
    ambientes: 17,
    dormitorios: 4,
    banos: 4,
    superficie: 381,
    superficieCubierta: 307,
    descripcion: 'Casa amplia en ubicación céntrica',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/49_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=49'
  },
  {
    id: 48,
    titulo: 'Casa en Venta en Sauce Viejo',
    tipo: 'CASA',
    zona: 'Sauce Viejo',
    localidad: 'Sauce Viejo',
    direccion: 'Orquídeas 4568',
    precio: 42000,
    moneda: 'USD',
    ambientes: 5,
    dormitorios: 1,
    banos: 2,
    superficie: 85,
    superficieCubierta: 80,
    descripcion: 'Casa en Sauce Viejo',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/48_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=48'
  },
  {
    id: 47,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Centro',
    localidad: 'Santa Fe',
    direccion: 'Hipólito Yrigoyen 3143',
    precio: 75000,
    moneda: 'USD',
    ambientes: 1,
    dormitorios: 1,
    banos: 1,
    superficie: 37,
    superficieCubierta: 35,
    descripcion: 'Departamento en Santa Fe',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/47_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=47'
  },
  {
    id: 46,
    titulo: 'Casa en Venta en Sauce Viejo',
    tipo: 'CASA',
    zona: 'Sauce Viejo',
    localidad: 'Sauce Viejo',
    direccion: 'Curupíes 1040',
    precio: 65000,
    moneda: 'USD',
    ambientes: 3,
    dormitorios: 1,
    banos: 1,
    superficie: 430,
    superficieCubierta: 65,
    descripcion: 'Casa en Sauce Viejo',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/46_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=46'
  },
  {
    id: 45,
    titulo: 'Casa en Venta en Santa Fe',
    tipo: 'CASA',
    zona: 'Santa Fe',
    localidad: 'Santa Fe',
    direccion: 'Mitre 3985',
    precio: 145000,
    moneda: 'USD',
    ambientes: 6,
    dormitorios: 2,
    banos: 3,
    superficie: 155,
    superficieCubierta: 126,
    descripcion: 'Casa en Santa Fe',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/45_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=45'
  },
  {
    id: 44,
    titulo: 'Terreno en Venta en Guadalupe',
    tipo: 'TERRENO',
    zona: 'Guadalupe',
    localidad: 'Guadalupe',
    direccion: 'Azcuénaga y Defensa',
    precio: 100000,
    moneda: 'USD',
    ambientes: null,
    dormitorios: null,
    banos: null,
    superficie: 596,
    superficieCubierta: null,
    descripcion: 'Terreno en Guadalupe',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/44_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=44'
  },
  {
    id: 43,
    titulo: 'Departamento en Venta en Centro',
    tipo: 'DEPARTAMENTO',
    zona: 'Centro',
    localidad: 'Santa Fe',
    direccion: '25 de Mayo 1641',
    precio: 85000,
    moneda: 'USD',
    ambientes: 6,
    dormitorios: 1,
    banos: 3,
    superficie: 93,
    superficieCubierta: 75,
    descripcion: 'Departamento en el centro',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/43_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=43'
  },
  {
    id: 42,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Santa Fe',
    localidad: 'Santa Fe',
    direccion: 'Juan del Campillo 1336 - P10',
    precio: 98500,
    moneda: 'USD',
    ambientes: 5,
    dormitorios: 1,
    banos: 3,
    superficie: 76,
    superficieCubierta: 75,
    descripcion: 'Departamento en Santa Fe',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/42_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=42'
  },
  {
    id: 41,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Centro',
    localidad: 'Santa Fe',
    direccion: 'Urquiza 1933 Piso 7 D',
    precio: 130000,
    moneda: 'USD',
    ambientes: 5,
    dormitorios: 1,
    banos: 2,
    superficie: 74,
    superficieCubierta: 70,
    descripcion: 'Departamento en Santa Fe',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/41_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=41'
  },
  {
    id: 40,
    titulo: 'Departamento en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Centro',
    localidad: 'Santa Fe',
    direccion: 'Urquiza 1757 - Piso 10',
    precio: 115000,
    moneda: 'USD',
    ambientes: 5,
    dormitorios: 1,
    banos: 2,
    superficie: 61,
    superficieCubierta: 61,
    descripcion: 'Departamento en Santa Fe',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/40_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=40'
  },
  {
    id: 39,
    titulo: 'Salón en Venta en Monte Vera',
    tipo: 'LOCAL',
    zona: 'Monte Vera',
    localidad: 'Monte Vera',
    direccion: 'Av. San Martin 6395',
    precio: 175000,
    moneda: 'USD',
    ambientes: 1,
    dormitorios: 2,
    banos: 1,
    superficie: 673,
    superficieCubierta: 398,
    descripcion: 'Salón en Monte Vera',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/39_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=39'
  },
  {
    id: 27,
    titulo: 'Quinta en Venta en Rincón - RESERVADO',
    tipo: 'QUINTA',
    zona: 'Rincón',
    localidad: 'Rincón',
    direccion: 'Calle Pública S-N',
    precio: 180000,
    moneda: 'USD',
    ambientes: 12,
    dormitorios: 2,
    banos: 2,
    superficie: 2682,
    superficieCubierta: 219,
    descripcion: 'Quinta en Rincón - RESERVADO',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/27_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=27'
  },
  {
    id: 26,
    titulo: 'Quinta en Venta en Rincón',
    tipo: 'QUINTA',
    zona: 'Rincón',
    localidad: 'Rincón',
    direccion: 'YBIRA PITA 1622',
    precio: 180000,
    moneda: 'USD',
    ambientes: 9,
    dormitorios: 3,
    banos: 3,
    superficie: 1500,
    superficieCubierta: 230,
    descripcion: 'Quinta en Rincón',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/26_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=26'
  },
  {
    id: 25,
    titulo: 'Departamento interno en Venta en Santa Fe',
    tipo: 'DEPARTAMENTO',
    zona: 'Boulevard',
    localidad: 'Santa Fe',
    direccion: 'Boulevard Galvez 1846',
    precio: 60000,
    moneda: 'USD',
    ambientes: 2,
    dormitorios: 1,
    banos: 1,
    superficie: 35,
    superficieCubierta: 35,
    descripcion: 'Departamento interno en Santa Fe',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/25_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=25'
  },
  {
    id: 24,
    titulo: 'Casa en Venta en Santa Fe - RESERVADO',
    tipo: 'CASA',
    zona: 'Santa Fe',
    localidad: 'Santa Fe',
    direccion: 'Santiago de Chile 3095',
    precio: 80000,
    moneda: 'USD',
    ambientes: 6,
    dormitorios: 1,
    banos: 3,
    superficie: 146,
    superficieCubierta: 94,
    descripcion: 'Casa en Santa Fe - RESERVADO',
    imagenPrincipal: 'https://www.solarinmobiliaria.com.ar/images/menu_vertical/24_grande.jpeg',
    urlMls: 'https://www.solarinmobiliaria.com.ar/propiedades_ver.php?id=24'
  }
]

async function main() {
  console.log('☀️ Actualizando propiedades de SOLAR Inmobiliaria...\n')

  // 1. Encontrar la inmobiliaria Solar
  const solar = await prisma.inmobiliaria.findUnique({
    where: { slug: 'solar' }
  })

  if (!solar) {
    console.error('❌ No se encontró la inmobiliaria Solar')
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
    console.error('❌ No se encontró agente para Solar')
    return
  }
  console.log(`✅ Agente: ${agenteSolar.nombre}`)

  // 3. Borrar propiedades existentes de Solar (para reimportar con datos completos)
  const deleted = await prisma.propiedad.deleteMany({
    where: { inmobiliariaId: solar.id }
  })
  console.log(`🗑️  Eliminadas ${deleted.count} propiedades anteriores`)

  // 4. Insertar propiedades nuevas con fotos
  let creadas = 0
  for (const prop of propiedadesSolar) {
    try {
      await prisma.propiedad.create({
        data: {
          titulo: prop.titulo,
          tipo: prop.tipo,
          zona: prop.zona,
          localidad: prop.localidad,
          direccion: prop.direccion,
          ubicacion: prop.direccion || prop.zona || 'Santa Fe',
          precio: prop.precio,
          moneda: prop.moneda,
          ambientes: prop.ambientes,
          dormitorios: prop.dormitorios,
          banos: prop.banos,
          superficie: prop.superficie,
          superficieCubierta: prop.superficieCubierta,
          descripcion: prop.descripcion,
          imagenPrincipal: prop.imagenPrincipal,
          urlMls: prop.urlMls,
          estado: 'APROBADA',
          aptaCredito: false,
          inmobiliariaId: solar.id,
          usuarioId: agenteSolar.id
        }
      })
      creadas++
      console.log(`  ✅ ${prop.titulo} - ${prop.direccion}`)
    } catch (error) {
      console.error(`  ❌ Error: ${prop.titulo}:`, error.message)
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   - Propiedades importadas: ${creadas}`)
  
  // Mostrar total
  const totalSolar = await prisma.propiedad.count({
    where: { inmobiliariaId: solar.id }
  })
  console.log(`   - Total propiedades Solar: ${totalSolar}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
