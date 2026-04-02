# 🚀 Configuración Rápida para Desarrolladores

## Clonar el repositorio

```bash
git clone https://github.com/leonardobergallo/crminmobiliaria.git
cd crminmobiliaria
```

## Setup inicial

```bash
# Instalar dependencias
npm install

# Las migraciones ya están creadas en Prisma
# La BD en PostgreSQL/Neon ya está creada

# Iniciar servidor de desarrollo
npm run dev
```

Abre `http://localhost:3000` en el navegador.

## Variables de entorno

El archivo `.env` contiene la URL de conexión a PostgreSQL. **No commits este archivo a git** (está en `.gitignore`).

```env
DATABASE_URL="postgresql://neondb_owner:npg_6eNTxyDCE0VS@ep-proud-unit-ahalct8y-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## Estructura del proyecto

```
crm-inmobiliario/
├── src/
│   ├── app/api/          # Rutas API CRUD
│   ├── app/dashboard/    # Panel principal
│   ├── app/clientes/     # Clientes
│   ├── app/busquedas/    # Búsquedas
│   ├── app/propiedades/  # Propiedades
│   ├── app/operaciones/  # Comisiones
│   ├── components/       # Componentes React
│   └── lib/              # Utilidades
├── prisma/
│   ├── schema.prisma     # Definición de modelos
│   └── migrations/       # Migraciones de BD
└── package.json
```

## Hacer cambios

```bash
# Crear rama para feature
git checkout -b feature/nombre-feature

# Hacer cambios...

# Commit
git add .
git commit -m "Descripción del cambio"

# Push
git push origin feature/nombre-feature

# Abrir Pull Request en GitHub
```

## Modificar base de datos

Si necesitas cambiar el esquema Prisma:

```bash
# Editar prisma/schema.prisma

# Crear migración
npx prisma migrate dev --name nombre-migracion

# Push a GitHub
git add prisma/migrations/
git commit -m "Migración: descripción"
git push origin main
```

## Build para producción

```bash
npm run build
npm start
```

---

Para más detalles, ver [README.md](./README.md)
