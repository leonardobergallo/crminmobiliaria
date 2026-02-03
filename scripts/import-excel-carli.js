const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('📥 Importando propiedades del Excel para Carli Esquivel...\n')

  // 1. Encontrar la inmobiliaria Carli Esquivel
  const carli = await prisma.inmobiliaria.findUnique({
    where: { slug: 'carli-esquivel' }
  })

  if (!carli) {
    console.error('❌ No se encontró la inmobiliaria Carli Esquivel')
    return
  }
  console.log(`✅ Inmobiliaria: ${carli.nombre}`)

  // 2. Encontrar un agente de Carli
  let agenteCarli = await prisma.usuario.findFirst({
    where: { 
      inmobiliariaId: carli.id,
      rol: { in: ['agente', 'admin'] }
    }
  })

  if (!agenteCarli) {
    console.error('❌ No se encontró agente para Carli Esquivel')
    return
  }
  console.log(`✅ Agente: ${agenteCarli.nombre}`)

  // 3. Leer el Excel
  const excelPath = path.join(__dirname, '../Documentacion/importacion_propiedades_corregida.xlsx')
  const workbook = XLSX.readFile(excelPath)
  const sheetName = workbook.SheetNames[0]
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

  console.log(`\n📋 Encontradas ${data.length} propiedades en el Excel\n`)

  // 4. Determinar tipo de propiedad basado en título
  function determinarTipo(titulo) {
    const t = titulo.toLowerCase()
    if (t.includes('departamento') || t.includes('depto')) return 'DEPARTAMENTO'
    if (t.includes('casa')) return 'CASA'
    if (t.includes('ph') || t.includes('dúplex') || t.includes('duplex')) return 'PH'
    if (t.includes('lote') || t.includes('terreno')) return 'TERRENO'
    if (t.includes('cochera')) return 'COCHERA'
    if (t.includes('local')) return 'LOCAL'
    if (t.includes('oficina')) return 'OFICINA'
    return 'OTRO'
  }

  // 5. Insertar propiedades
  let creadas = 0
  let existentes = 0

  for (const row of data) {
    const titulo = row.titulo || 'Sin título'
    
    // Verificar si ya existe
    const existe = await prisma.propiedad.findFirst({
      where: {
        titulo: titulo,
        inmobiliariaId: carli.id
      }
    })

    if (existe) {
      existentes++
      continue
    }

    try {
      await prisma.propiedad.create({
        data: {
          titulo: titulo,
          tipo: determinarTipo(titulo),
          zona: row.zona || null,
          localidad: row.zona || 'Santa Fe',
          direccion: row.direccion || null,
          ubicacion: row.direccion || row.zona || 'Santa Fe',
          descripcion: row.descripcion || null,
          precio: row.precio || 0,
          moneda: row.moneda || 'USD',
          ambientes: row.ambientes || null,
          dormitorios: row.ambientes ? Math.max(1, row.ambientes - 1) : null,
          banos: row.banos || null,
          superficie: row.superficie || null,
          estado: 'APROBADA',
          aptaCredito: false,
          inmobiliariaId: carli.id,
          usuarioId: agenteCarli.id
        }
      })
      creadas++
      console.log(`  ✅ ${titulo}`)
    } catch (error) {
      console.error(`  ❌ Error al crear "${titulo}":`, error.message)
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   - Propiedades creadas: ${creadas}`)
  console.log(`   - Ya existentes: ${existentes}`)

  // Mostrar total actual
  const totalCarli = await prisma.propiedad.count({
    where: { inmobiliariaId: carli.id }
  })
  console.log(`   - Total propiedades Carli: ${totalCarli}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
