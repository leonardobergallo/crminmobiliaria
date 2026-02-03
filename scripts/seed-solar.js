const { PrismaClient } = require('@prisma/client')
// const OpenAI = require('openai') // Disabled due to quota
const fs = require('fs')
const path = require('path')

// Load env vars manually because we are running with node
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8')
  envConfig.split('\n').forEach(line => {
    const [key, ...value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '')
    }
  })
}

const prisma = new PrismaClient()

// Updated text from user request (Same as before)
const rawText = `
n Venta
FILTROS
Operacion

Venta
Precios
 AR$  U$D Ambas
Desde
Hasta
Tipo de propiedad
Ubicación
Cantidad de ambientes
Dormitorios
Baños
Antigüedad
Características
Departamento en Venta en Santa FeVenta 8
 1
 2
 1
 42m2
 40m2
Departamento en Venta en Santa Fe
Llerena 2259 P1 - dpto. 1

U$D 55.000

Departamento en Venta en santa fe Venta 10
 1
 4
 2
 78m2
 75m2
Departamento en Venta en santa fe
La Paz 4931 PB

U$D 70.000

Departamento en Venta en Santa FeVenta 10
 2
 5
 3
 98m2
 80m2
Departamento en Venta en Santa Fe
Catamarca 3528

U$D 69.000

Departamento en Venta en Santa FeVenta 10
 1
 3
 1
 45m2
 45m2
Departamento en Venta en Santa Fe
Las Heras 3306

U$D 50.000

Casa en Venta en Ayacucho 766Venta 10
 4
 17
 4
 381m2
 307m2
Casa en Venta en Ayacucho 766
U$D 0

Casa en Venta en sauce viejoVenta 10
 1
 5
 2
 85m2
 80m2
Casa en Venta en sauce viejo
Orquídeas 4568

U$D 42.000

Departamento en Venta en Santa fe Venta 8
 1
 37m2
 35m2
Departamento en Venta en Santa fe
Hipólito Yrigoyen 3143

U$D 75.000

Casa en Venta en sauce viejoVenta 10
 1
 3
 1
 430m2
 65m2
Casa en Venta en sauce viejo
Curupíes 1040

U$D 65.000

Casa en Venta en santa fe Venta 10
 2
 6
 3
 155m2
 126m2
Casa en Venta en santa fe
Mitre 3985

U$D 145.000

Terreno en Venta en guadalupeVenta 3
 596m2
Terreno en Venta en guadalupe
Azcuénaga y Defensa

U$D 100.000

Departamento en Venta en centroVenta 10
 1
 6
 3
 93m2
 75m2
Departamento en Venta en centro
25 de mayo 1641

U$D 85.000

Departamento en Venta en Santa fe Venta 10
 1
 5
 3
 76m2
 75m2
Departamento en Venta en Santa fe
Juan del Campillo 1336 - P10

U$D 98.500

Departamento en Venta en Santa FeVenta 10
 1
 5
 2
 74m2
 70m2
Departamento en Venta en Santa Fe
Urquiza 1933 Piso 7 D

U$D 130.000

Departamento en Venta en Santa FeVenta 10
 1
 5
 2
 61m2
 61m2
Departamento en Venta en Santa Fe
Urquiza 1757 - Piso 10

U$D 115.000

Salón en Venta en Monte VeraVenta 10
 2
 1
 673m2
 398m2
Salón en Venta en Monte Vera
Av. San Martin 6395

U$D 175.000

Quinta en Venta en RinconVenta 10
 2
 12
 2
 2682m2
 219m2
Reservado
Quinta en Venta en Rincon
Calle Pública S-N

U$D 180.000

Quinta en Venta en RinconVenta 10
 3
 9
 3
 1500m2
 230m2
Quinta en Venta en Rincon
YBIRA PITA 1622

U$D 180.000

Departamento interno en Venta en Santa FeVenta 8
 1
 2
 1
 35m2
 35m2
Departamento interno en Venta en Santa Fe
Boulevard Galvez 1846

U$D 60.000

Casa en Venta en Santa FeVenta 10
 1
 6
 3
 146m2
 94m2
Reservado
Casa en Venta en Santa Fe
Santiago de Chile 3095

U$D 80.000
`

function parseProperties(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const properties = []
  
  const typeKeywords = ['Casa', 'Departamento', 'Terreno', 'Quinta', 'Salón', 'Local', 'Oficina']

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('U$D') || line.startsWith('AR$')) {
       // Found a price termination
       const currency = line.startsWith('U$D') ? 'USD' : 'ars'
       const priceStr = line.replace('U$D', '').replace('AR$', '').replace(/\./g, '').trim()
       const price = parseFloat(priceStr) || 0
       
       let address = lines[i-1]
       let title = lines[i-2]

       // Basic correction logic
       if (!address || !title) continue;

       // Check if Address looks like "Reservado"
       if (address.toLowerCase() === 'reservado') {
         address = lines[i-2]
         title = lines[i-3]
       }

       // Heuristic: If Title is a number (surface), shift up
       if (title && (title.endsWith('m2') || /^\d+$/.test(title))) {
         // Shift logic
         // Case: "Casa en Venta en Ayacucho 766" followed by "U$D 0" 
         // Previous line (i-1) is the Title/Address combo
         title = lines[i-1]
         address = title // Default address to title
         
         // Try to extract address from title
         // "Casa en Venta en Ayacucho 766" -> "Ayacucho 766"
         // "Terreno en Venta en guadalupe" -> "guadalupe" (Neighborhood)
         // But wait, look at "Terreno en Venta en guadalupe" followed by "Azcuénaga y Defensa"
         // ... 596m2
         // Terreno en Venta en guadalupe
         // Azcuénaga y Defensa
         // U$D 100.000
         // Here: Address=Azcuénaga..., Title=Terreno...
         // So standard i-1, i-2 works.
       } else {
           // Standard case
       }

       // Refine Address/Title for "Casa en Venta en Ayacucho 766"
       // i-1: Casa en Venta en Ayacucho 766
       // i-2: 307m2
       // Here title ends with m2 -> Shift triggered?
       // i-2 "307m2" ends with m2.
       // So title becomes lines[i-1] ("Casa en...")
       // Address becomes lines[i-1] ("Casa en...")
       
       // Try to extract real address from "Casa en Venta en Ayacucho 766"
       const typeMatch = typeKeywords.find(t => title.startsWith(t))
       const type = typeMatch || 'Otro'
       
       // Surface extraction
       // Scan backward from title index to find "m2"
       let surface = 0
       let bedrooms = 0
       let bathrooms = 0
       
       // Look at lines before the title
       // usually: 
       // N
       // M
       // K
       // Xm2
       // Ym2
       
       // We can scan lines[i-3], i-4, i-5, i-6
       const lookback = [lines[i-3], lines[i-4], lines[i-5], lines[i-6], lines[i-7]].filter(x => x);
       
       for (const stat of lookback) {
           if (stat.endsWith('m2')) {
               const val = parseFloat(stat.replace('m2', ''))
               if (val > surface) surface = val // Take max usually total surface?
           } else if (/^\d+$/.test(stat)) {
               const val = parseInt(stat)
               if (val > 0 && val < 10) {
                   // Ambiguous. Let's guess:
                   // If we verify against "ambientes", "dormitorios", "banos".
                   // Without labels, hard. defaulting to assumptions.
                   // Assuming largest small number is Ambientes?
               }
           }
       }
       
       // Estimate city/localidad
       let city = 'Santa Fe'
       if (title.toLowerCase().includes('sauce viejo')) city = 'Sauce Viejo'
       if (title.toLowerCase().includes('rincon')) city = 'San José del Rincón'
       if (title.toLowerCase().includes('monte vera')) city = 'Monte Vera'
       if (title.toLowerCase().includes('guadalupe')) city = 'Santa Fe' // Neighborhood
       
       properties.push({
         title,
         address,
         city,
         price,
         currency,
         type,
         total_surface: surface,
         // Default others
         bedrooms: 0,
         bathrooms: 0
       })
    }
  }
  return properties
}

async function main() {
  try {
    console.log('☀️ Iniciando importación para SOLAR Inmobiliaria (Manual Parse)...')

    // 1. Find or Create Inmobiliaria
    let solar = await prisma.inmobiliaria.findUnique({
      where: { slug: 'solar' }
    })

    if (!solar) {
      console.log('Creating Solar Inmobiliaria...')
      solar = await prisma.inmobiliaria.create({
        data: {
          nombre: 'Solar Inmobiliaria',
          slug: 'solar',
          activa: true,
          email: 'contacto@solar.com.ar', 
        }
      })
    }
    console.log(`✅ Inmobiliaria: ${solar.nombre} (${solar.id})`)

    // 2. Parse Properties Manually
    const properties = parseProperties(rawText)
    console.log(`📋 Detectadas ${properties.length} propiedades.`)

    // 3. Insert Properties
    let count = 0
    for (const prop of properties) {
      // Check duplicate by address
      const existing = await prisma.propiedad.findFirst({
        where: {
          direccion: prop.address,
          inmobiliariaId: solar.id
        }
      })

      if (!existing && prop.address) {
        await prisma.propiedad.create({
          data: {
            titulo: prop.title,
            direccion: prop.address,
            localidad: prop.city,
            zona: prop.city, // Default
            ubicacion: `${prop.address}, ${prop.city}`,
            precio: prop.price,
            moneda: prop.currency,
            tipo: prop.type,
            dormitorios: prop.bedrooms,
            banos: prop.bathrooms,
            ambientes: prop.bedrooms + 1,
            superficie: prop.total_surface,
            descripcion: `${prop.title} en ${prop.city}. Superficie aprox ${prop.total_surface}m2.`,
            inmobiliariaId: solar.id,
            estado: 'APROBADA',
            aptaCredito: false
          }
        })
        process.stdout.write('.')
        count++
      } else {
         // console.log(`Skipping existing: ${prop.address}`)
      }
    }
    console.log(`\n✅ Se importaron ${count} nuevas propiedades a Solar.`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
