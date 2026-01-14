# CRM Inmobiliario - Sistema de Gestión para Agentes REMAX

Sistema web completo para gestionar clientes, búsquedas inmobiliarias, propiedades, tareas y comisiones.

## 🚀 Características

- **Dashboard**: KPIs, pipeline por estado, comisiones estimadas
- **Gestión de Clientes**: Crear, editar, listar clientes con búsquedas asociadas
- **Búsquedas/Leads**: Registrar búsquedas de compradores, filtrar por estado/presupuesto/tipo
- **Propiedades**: Inventario de inmuebles, filtros por zona y apta crédito
- **Operaciones/Comisiones**: Seguimiento de ventas y cálculo de comisiones
- **Importación desde Excel**: Importar datos desde archivos Excel existentes
- **API REST**: Endpoints CRUD completos para todas las entidades

## 📋 Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Excel**: XLSX, ExcelJS

## 📦 Instalación

### Requisitos
- Node.js 18+ 
- npm o yarn
- Acceso a base de datos PostgreSQL

### Setup

1. **Clonar/Descargar el proyecto**
```bash
cd crm-inmobiliario
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
El archivo `.env` ya contiene la cadena de conexión PostgreSQL.

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📥 Importación desde Excel

### Proceso Manual (API)

Realiza un POST a `/api/import` con el siguiente body:

```json
{
  "fileType": "all",
  "buscadasCalificadas": "C:\\Users\\leona\\Desktop\\Busquedas Calificadas (1).xlsx",
  "aptaCredito": "C:\\Users\\leona\\Desktop\\APTA CREDITO.xls.xlsx",
  "comisiones": "C:\\Users\\leona\\Desktop\\COMISIONES REMAx (1).xlsx"
}
```

## 🏗️ Estructura de Carpetas

```
src/app/
├── api/                     # API Routes CRUD
├── dashboard/               # Panel principal
├── clientes/                # Gestión de clientes
├── busquedas/               # Gestión de búsquedas
├── propiedades/             # Listado de propiedades
└── operaciones/             # Comisiones y ventas
```

## 🗄️ Modelo de Datos Principal

- **Cliente**: Personas que buscan propiedades
- **Búsqueda**: Leads o requerimientos de compradores
- **Propiedad**: Inventario inmobiliario
- **Operacion**: Ventas realizadas y comisiones
- **Tarea**: Recordatorios y seguimiento

## 🚀 Inicio Rápido

```bash
# Instalar
npm install

# Ejecutar desarrollo
npm run dev

# Ver en navegador
http://localhost:3000
```

## 📊 Endpoints Principales

- `GET/POST /api/clientes` - Gestión de clientes
- `GET/POST /api/busquedas` - Gestión de búsquedas
- `GET/POST /api/propiedades` - Gestión de propiedades
- `GET/POST /api/operaciones` - Gestión de comisiones
- `POST /api/import` - Importar desde Excel

---

**Última actualización**: Enero 2026


This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
