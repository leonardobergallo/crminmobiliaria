const { PrismaClient } = require('@prisma/client')
const XLSX = require('xlsx')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Generando archivo de exportación de prueba...')
  
  const properties = await prisma.propiedad.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Format matching the one defined in route.ts
  const data = properties.map(prop => ({
      titulo: prop.titulo || '',
      tipo: prop.tipo || '',
      zona: prop.zona || prop.localidad || '',
      descripcion: prop.descripcion || '',
      precio: prop.precio || 0,
      moneda: prop.moneda || 'ARS',
      ambientes: prop.ambientes || 0,
      banos: prop.banos || 0,
      superficie: prop.superficie || 0,
      direccion: prop.direccion || prop.ubicacion || '',
      whatsapp: prop.whatsapp || '',
      
      // Optional columns for template completeness
      foto_principal: '',
      servicio_profesional: '',
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Propiedades')

  const outputPath = path.resolve(__dirname, '../propiedades_export_test.xlsx')
  XLSX.writeFile(workbook, outputPath)

  console.log(`✅ Archivo exportado exitosamente en: ${outputPath}`)
  console.log(`📊 Total propiedades exportadas: ${data.length}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
