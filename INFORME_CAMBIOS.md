# Informe de Cambios — CRM Inmobiliario

**Fecha:** 4 de marzo de 2026  
**Commit:** `c1ee464` — branch `main` → `origin/main`  
**Archivos afectados:** 17 (6 nuevos + 11 modificados)  
**Balance:** +2 289 líneas / −866 líneas

---

## 1. Protección de Usuarios Demo

Se implementó un sistema completo para que los usuarios demo (`demo@inmobiliar.com`, `demo@misfinanzas.com`) puedan recorrer el sistema sin realizar acciones destructivas.

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/middleware.ts` | **Nuevo** | Edge middleware que intercepta POST/PATCH/DELETE/PUT en `/api/*` y devuelve 403 con `{isDemo: true}` si el usuario es demo. Decodifica JWT sin Prisma. Whitelist: login, logout, landing-consultas, parsear-busqueda, busqueda-avanzada, export-properties. |
| `src/lib/auth.ts` | Modificado | Agregadas funciones `isDemoUser()` y `demoGuard()` para protección server-side en route handlers. |
| `src/lib/useDemoUser.ts` | **Nuevo** | Hook client-side que detecta si el usuario actual es demo. |
| `src/app/(dashboard)/operaciones/page.tsx` | Modificado | Toast flotante al intentar crear/eliminar operaciones en modo demo. Detecta `err.isDemo` de la API. |

---

## 2. Banner de Bienvenida Demo

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/DemoBanner.tsx` | **Nuevo** | Componente de tour con 6 pasos: Búsquedas, IA Parsear, Gestión, Propiedades, Comisiones, Sugerencias IA. Descartable con ✕, barra de tips, fondo dot-pattern, animaciones. |
| `src/app/(dashboard)/dashboard/page.tsx` | Modificado | Importa DemoBanner, detecta `isDemo` por email, renderiza el banner condicionalmente. |

---

## 3. Panel de Admin — Control de Comisiones

Nuevo módulo completo para que el administrador configure porcentajes de comisión y vea un resumen ejecutivo de operaciones.

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/(dashboard)/admin/comisiones/page.tsx` | **Nuevo** (~520 líneas) | **Secciones:** (1) Config de comisiones con campos editables + preview en vivo, (2) 6 KPIs (operaciones, cobradas, pendientes, total, agente, inmobiliaria), (3) Cards cobrado vs pendiente con gradientes, (4) Tabla de rendimiento por agente con totales, (5) Historial de operaciones filtrable (agente/estado/texto). |
| `src/app/api/inmobiliarias/[id]/route.ts` | Modificado | PUT ahora acepta y guarda `comisionVenta` y `comisionAgente`. |
| `src/components/Sidebar.tsx` | Modificado | Link "Comisiones" agregado a menú de admin y superadmin. |

---

## 4. UX de Operaciones

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/(dashboard)/operaciones/page.tsx` | Modificado | KPIs refactorizados con map + hover shadows. Card especial Carli con gradiente. Tabla con hover en filas, fechas formateadas (es-AR dd/MMM/yy), botones de acción compactos, demo toast. |
| `src/app/api/operaciones/route.ts` | Modificado | POST con retry loop (MAX_RETRIES=5) para error P2002 de unique constraint en campo `nro`. |

---

## 5. Landing / Demo Page

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/landing/page.tsx` | Modificado (~680 líneas) | Rediseño completo: Hero con gradientes y blobs animados, IntersectionObserver para animaciones al scroll, carrusel con fade + flechas + thumbnails, sección "Cómo Funciona" (4 pasos), contadores animados, card demo glassmorphism, formulario de contacto con estado de éxito. |

---

## 6. Mejoras UX Generales

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/app/globals.css` | Modificado | Animaciones: `fade-in-up`, `stagger-*`, `card-interactive`. Utilidades CSS custom. |
| `src/app/(dashboard)/busquedas/page.tsx` | Modificado | Mejoras de UX + búsqueda de inmobiliarias en Google/Mercado Único. |
| `src/app/(dashboard)/parsear/page.tsx` | Modificado | Botón inteligente de inmobiliaria (detecta contexto). |
| `src/app/(dashboard)/gestion/page.tsx` | Modificado | Estados de carga y vacío mejorados. |
| `src/app/(dashboard)/dashboard/page.tsx` | Modificado | Greeting, 6 KPI cards clickeables, pipeline bars, 4 botones de acción rápida. |

---

## 7. Componentes UI Nuevos

| Archivo | Tipo |
|---------|------|
| `src/components/ui/confirm-dialog.tsx` | **Nuevo** |
| `src/components/ui/dropdown-menu.tsx` | **Nuevo** |

---

## Estado Final

- ✅ TypeScript compila limpio (`npx tsc --noEmit` → Exit Code 0)
- ✅ Commit `c1ee464` pusheado a `origin/main`
- ✅ 17 archivos: 6 nuevos + 11 modificados
- ✅ Working tree limpio (sin cambios pendientes)
