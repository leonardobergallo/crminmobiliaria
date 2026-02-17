const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const TARGET_USERS = [
  {
    nombre: 'Administrador Global',
    email: 'admin@inmobiliariaenequipo.com',
    password: 'admin123',
    rol: 'superadmin',
    inmobiliaria: null,
  },
  {
    nombre: 'Carli Esquivel',
    email: 'carli@carliesquivel.com',
    password: 'admin123',
    rol: 'admin',
    inmobiliaria: 'Carli Esquivel Propiedades',
  },
  {
    nombre: 'Agente Carli 1',
    email: 'agente1@carliesquivel.com',
    password: 'admin123',
    rol: 'agente',
    inmobiliaria: 'Carli Esquivel Propiedades',
  },
  {
    nombre: 'Solar Admin',
    email: 'admin@solarinmobiliaria.com',
    password: 'admin123',
    rol: 'admin',
    inmobiliaria: 'Solar Inmobiliaria',
  },
  {
    nombre: 'Agente Solar 1',
    email: 'agente1@solarinmobiliaria.com',
    password: 'admin123',
    rol: 'agente',
    inmobiliaria: 'Solar Inmobiliaria',
  },
]

async function main() {
  const inmobiliarias = await prisma.inmobiliaria.findMany({
    select: { id: true, nombre: true },
  })
  const inmobMap = new Map(inmobiliarias.map((i) => [i.nombre, i.id]))

  const allowedEmails = TARGET_USERS.map((u) => u.email)

  console.log('\n=== Normalizando usuarios demo ===\n')

  for (const user of TARGET_USERS) {
    const inmobiliariaId = user.inmobiliaria ? inmobMap.get(user.inmobiliaria) || null : null
    if (user.inmobiliaria && !inmobiliariaId) {
      throw new Error(`No existe la inmobiliaria "${user.inmobiliaria}"`)
    }

    const hashedPassword = await bcrypt.hash(user.password, 12)

    const existing = await prisma.usuario.findUnique({
      where: { email: user.email },
      select: { id: true },
    })

    if (existing) {
      await prisma.usuario.update({
        where: { id: existing.id },
        data: {
          nombre: user.nombre,
          rol: user.rol,
          password: hashedPassword,
          activo: true,
          inmobiliariaId,
        },
      })
      console.log(`✅ Actualizado: ${user.email}`)
    } else {
      await prisma.usuario.create({
        data: {
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          password: hashedPassword,
          activo: true,
          inmobiliariaId,
        },
      })
      console.log(`✅ Creado: ${user.email}`)
    }
  }

  const desactivados = await prisma.usuario.updateMany({
    where: {
      email: { notIn: allowedEmails },
      rol: { not: 'superadmin' },
    },
    data: { activo: false },
  })

  console.log(`\n🧹 Usuarios desactivados: ${desactivados.count}`)

  const finalUsers = await prisma.usuario.findMany({
    include: { inmobiliaria: { select: { nombre: true } } },
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
  })

  console.log('\n=== Estado final ===\n')
  finalUsers.forEach((u) => {
    console.log(
      `${u.activo ? '🟢' : '⚪'} ${u.nombre} | ${u.email || 'sin email'} | ${u.rol} | ${u.inmobiliaria?.nombre || 'GLOBAL'}`
    )
  })
}

main()
  .catch((error) => {
    console.error('❌ Error:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
