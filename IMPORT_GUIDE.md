# 📥 Guía de Importación de Archivos Excel

Este documento explica cómo importar los archivos Excel existentes al CRM.

## 🔧 Requisitos

- Servidor de desarrollo ejecutándose: `npm run dev`
- Acceso a los archivos Excel (ubicación del usuario)
- Una herramienta para hacer requests HTTP (curl, Postman, etc.)

## 📂 Archivos a Importar

### 1. **Búsquedas Calificadas (1).xlsx**
- **Sheets**: "Efectivo", "Creditos"
- **Contenido**: Búsquedas con presupuesto, tipo de propiedad, dormitorios, etc.
- **Destino BD**: Tabla `Busqueda` con origen = CALIFICADA_EFECTIVO o CALIFICADA_CREDITO

### 2. **Busquedas Activas.xlsx**
- **Sheets**: Nombres de clientes ("CRISTIAN", "RINCARDO Y ANA", etc.)
- **Contenido**: Búsquedas en formato clave/valor
- **Destino BD**: Tabla `Busqueda` con origen = ACTIVA

### 3. **BUSQUEDAS PERSONALIZADAS.xlsx**
- **Sheets**: Nombres de búsquedas
- **Contenido**: Búsquedas personalizadas formato clave/valor
- **Destino BD**: Tabla `Busqueda` con origen = PERSONALIZADA

### 4. **APTA CREDITO.xls.xlsx**
- **Sheets**: "CASA APTA CREDITO", "DEPARTAMENTOS APTOS A CREDITOS", etc.
- **Contenido**: Propiedades con ubicación, precio, dormitorios, links
- **Destino BD**: Tabla `Propiedad` con aptaCredito = true

### 5. **COMISIONES REMAx (1).xlsx**
- **Sheets**: "ULTIMAS OEPERACIONES", "RESERVAS - DOCUMENTOS", etc.
- **Contenido**: Operaciones (ventas) y comisiones
- **Destino BD**: Tabla `Operacion`

## 🚀 Pasos para Importar

### Opción 1: Importar Todos los Archivos (Recomendado)

Realiza una solicitud POST a `/api/import`:

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "all",
    "buscadasCalificadas": "C:\\ruta\\a\\Busquedas Calificadas (1).xlsx",
    "aptaCredito": "C:\\ruta\\a\\APTA CREDITO.xls.xlsx",
    "comisiones": "C:\\ruta\\a\\COMISIONES REMAx (1).xlsx"
  }'
```

**Respuesta esperada**:
```json
{
  "message": "Importación completada. 3 archivo(s) procesado(s).",
  "imported": 3
}
```

### Opción 2: Importar un Archivo Individual

#### Búsquedas Calificadas
```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "busquedas-calificadas",
    "filePath": "C:\\Users\\leona\\Desktop\\Busquedas Calificadas (1).xlsx"
  }'
```

#### Propiedades APTA CREDITO
```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "apta-credito",
    "filePath": "C:\\Users\\leona\\Desktop\\APTA CREDITO.xls.xlsx"
  }'
```

#### Comisiones
```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "comisiones",
    "filePath": "C:\\Users\\leona\\Desktop\\COMISIONES REMAx (1).xlsx"
  }'
```

### Opción 3: Usar Postman

1. **Nueva solicitud** → POST
2. **URL**: `http://localhost:3000/api/import`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body** (raw JSON):
```json
{
  "fileType": "all",
  "buscadasCalificadas": "C:\\ruta\\completa\\Busquedas Calificadas (1).xlsx",
  "aptaCredito": "C:\\ruta\\completa\\APTA CREDITO.xls.xlsx",
  "comisiones": "C:\\ruta\\completa\\COMISIONES REMAx (1).xlsx"
}
```
5. Click **Send**

## 📝 Ubicación de Archivos

**Actualiza estas rutas según tu sistema**:

```
Windows:
C:\Users\leona\Desktop\Gestion de agente\archivos-excel\Busquedas Calificadas (1).xlsx

Linux/Mac:
/home/usuario/documentos/Busquedas Calificadas (1).xlsx
```

## ✅ Verificar Importación

Después de importar, verifica que los datos están en la BD:

1. **Abre el navegador** y ve a `http://localhost:3000`
2. Navega a cada sección:
   - **Clientes**: Debe mostrar clientes importados
   - **Búsquedas**: Debe mostrar búsquedas por cliente
   - **Propiedades**: Debe mostrar propiedades con apta crédito
   - **Comisiones**: Debe mostrar operaciones

## 🔄 Normalización de Datos

Los importadores normalizan los datos automáticamente:

### Presupuesto/Monto
- Detecta moneda: si contiene "USD" o "DOLARES" → USD, sino ARS
- Extrae valor numérico cuando es posible
- Guarda el texto original para auditoría

### Tipo de Propiedad
- "departamento", "depar" → DEPARTAMENTO
- "casa" → CASA
- Otro → OTRO

### Precio
- Reemplaza puntos de mil y comas decimales
- Convierte a número para búsquedas

## ⚠️ Notas Importantes

1. **Las importaciones son idempotentes**: Si ejecutas el import dos veces, no duplicará registros
2. **Validación**: Si un campo requerido falta, se salta esa fila
3. **Logs**: Observa la consola del servidor para ver mensajes de progreso
4. **Backups**: Antes de importar masivamente, haz backup de la BD

## 🔗 Configuración de Rutas Automáticas

Puedes configurar variables de entorno en `.env` para rutas fijas:

```env
EXCEL_BUSQUEDAS_CALIFICADAS=C:\Users\leona\Desktop\Busquedas Calificadas (1).xlsx
EXCEL_APTA_CREDITO=C:\Users\leona\Desktop\APTA CREDITO.xls.xlsx
EXCEL_COMISIONES=C:\Users\leona\Desktop\COMISIONES REMAx (1).xlsx
```

Luego, la API puede cargar automáticamente desde estas rutas.

---

**¿Necesitas ayuda?** Revisa los logs de la consola del servidor para mensajes de error detallados.
