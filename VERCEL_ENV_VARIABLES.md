# Variables de Entorno para Vercel

Este documento lista todas las variables de entorno necesarias para configurar el proyecto en Vercel.

## Variables Requeridas (Obligatorias)

### 1. `DATABASE_URL`
**Descripción**: URL de conexión a la base de datos PostgreSQL (Neon)

**Ejemplo**:
```
DATABASE_URL=postgresql://neondb_owner:npg_6eNTxyDCE0VS@ep-proud-unit-ahalct8y-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Nota**: Reemplaza con tu propia URL de conexión de Neon o PostgreSQL.

---

### 2. `JWT_SECRET`
**Descripción**: Clave secreta para firmar y verificar tokens JWT de autenticación

**Ejemplo**:
```
JWT_SECRET=crm-inmobiliario-remax-secret-key-2026-secure
```

**Recomendación**: Usa una cadena larga y aleatoria en producción. Puedes generar una con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. `NODE_ENV`
**Descripción**: Entorno de ejecución

**Valores**: `development` | `production`

**Nota**: Vercel configura automáticamente esta variable como `production` en el deploy. No necesitas configurarla manualmente.

---

## Variables de IA (No utilizadas actualmente)

⚠️ **Nota**: Estas variables están documentadas pero **NO se utilizan** en el código actual. El sistema usa un parser local basado en regex. Si en el futuro quieres reactivar la funcionalidad de IA, estas son las variables necesarias:

### `AI_PROVIDER`
**Descripción**: Proveedor de IA a utilizar

**Valor**: `openai`

---

## Variables de Scraping (CRITICAS en Produccion)

### `SCRAPER_PROXY_URL`
**Descripción**: URL de un servicio de proxy para scraping (ScraperAPI, ScrapingBee, etc). **Obligatoria en Vercel** porque los portales bloquean las IPs de datacenter. En localhost funciona sin proxy (tu IP residencial), pero en produccion siempre sera bloqueado sin proxy.

**Ejemplo**:
```
SCRAPER_PROXY_URL=https://api.scraperapi.com?api_key=TU_API_KEY&render=false&country_code=ar
```

**Nota**: El sistema añade automaticamente `url=URL_DESTINO`, `country_code=ar` y `render=false` si no los incluis. Si ScraperAPI devuelve 401, verifica que la API key sea valida y este configurada en Vercel (Settings > Environment Variables). Hace falta un nuevo deploy despues de agregar la variable.

**Verificar en produccion**: Entra a `https://tu-dominio.vercel.app/api/scraper-status` (logueado) para ver si el proxy esta configurado correctamente.

---

### `OPENAI_API_KEY`
**Descripción**: API Key de OpenAI para servicios de IA

**Ejemplo**:
```
OPENAI_API_KEY=sk-proj-tu-api-key-aqui
```

**Nota**: ⚠️ **NO se usa actualmente** - El código no incluye funcionalidad de IA.

---

### `AI_MODEL`
**Descripción**: Modelo de IA a utilizar

**Valor**: `gpt-3.5-turbo` (o `gpt-4o-mini`)

**Ejemplo**:
```
AI_MODEL=gpt-3.5-turbo
```

---

### `AI_TEMPERATURE`
**Descripción**: Temperatura para las respuestas de IA (0.0 a 1.0)

**Valor**: `0.7` (recomendado)

**Ejemplo**:
```
AI_TEMPERATURE=0.7
```

---

## Variables Opcionales para Desarrollo Local (No necesarias en Vercel)

Estas variables son solo para desarrollo local y no deben configurarse en Vercel:

- `EXCEL_BUSQUEDAS_CALIFICADAS` - Ruta local a archivo Excel
- `EXCEL_APTA_CREDITO` - Ruta local a archivo Excel
- `EXCEL_COMISIONES` - Ruta local a archivo Excel

---

## Cómo Configurar en Vercel

### Opción 1: Desde el Dashboard de Vercel

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Agrega cada variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Tu URL de conexión
   - **Environment**: Selecciona `Production`, `Preview`, y/o `Development` según corresponda
4. Repite para `JWT_SECRET`
5. Haz clic en **Save**

### Opción 2: Desde la CLI de Vercel

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Configurar variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

---

## Verificación

Después de configurar las variables, puedes verificar que están correctamente configuradas:

1. En el dashboard de Vercel, ve a **Settings** → **Environment Variables**
2. Verifica que todas las variables requeridas estén presentes
3. Realiza un nuevo deploy para que los cambios surtan efecto

---

## Importante

- ⚠️ **Nunca** commits el archivo `.env` o `.env.local` al repositorio
- ✅ Las variables de entorno en Vercel están encriptadas y son seguras
- 🔄 Después de agregar/modificar variables, necesitas hacer un nuevo deploy
- 🔐 Usa valores diferentes para `JWT_SECRET` en producción vs desarrollo

---

## Resumen Rápido

**Variables necesarias para producción:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=tu-clave-secreta-segura
```

**Nota**: El sistema usa un parser local basado en regex para analizar mensajes de WhatsApp. No requiere servicios externos de IA.

---

## Variables de IA (Referencia - No utilizadas)

Si en el futuro quieres reactivar funcionalidad de IA, estas son las variables que necesitarías:

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
AI_MODEL=gpt-3.5-turbo
AI_TEMPERATURE=0.7
```

⚠️ **Importante**: Actualmente estas variables NO se utilizan en el código. El sistema funciona completamente sin ellas usando un parser local.
