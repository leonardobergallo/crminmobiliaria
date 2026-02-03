const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('⚙️ Configurando comisiones por inmobiliaria...\n')

  // Solar: agente recibe 50% de la comisión
  await prisma.inmobiliaria.update({
    where: { slug: 'solar' },
    data: { 
      comisionVenta: 3,    // 3% por punta (se duplica si son 2 puntas)
      comisionAgente: 50   // agente recibe 50% de la comisión
    }
  })
  console.log('✅ Solar Inmobiliaria:')
  console.log('   - 1 punta: 3% → Agente recibe 50% = 1.5%')
  console.log('   - 2 puntas: 6% → Agente recibe 50% = 3%')

  // Carli (RE/MAX): agente recibe 20% de la comisión
  await prisma.inmobiliaria.update({
    where: { slug: 'carli-esquivel' },
    data: { 
      comisionVenta: 3,    // 3% por punta
      comisionAgente: 20   // agente recibe 20% de la comisión
    }
  })
  console.log('\n✅ RE/MAX (Carli Esquivel):')
  console.log('   - 1 punta: 3% → Agente recibe 20% = 0.6%')
  console.log('   - 2 puntas: 6% → Agente recibe 20% = 1.2%')

  console.log('\n📊 Ejemplo con venta de $100.000 USD:')
  console.log('\n   SOLAR (2 puntas):')
  console.log('   - Comisión total: $6.000')
  console.log('   - Agente (50%): $3.000')
  console.log('   - Inmobiliaria: $3.000')
  
  console.log('\n   RE/MAX (2 puntas):')
  console.log('   - Comisión total: $6.000')
  console.log('   - Agente (20%): $1.200')
  console.log('   - RE/MAX: $4.800')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
