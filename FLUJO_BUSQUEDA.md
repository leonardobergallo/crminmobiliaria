# 🔄 Flujo Completo: De Mensaje de WhatsApp a Envío de Links al Cliente

Este documento explica paso a paso cómo funciona el sistema cuando analizas un mensaje de WhatsApp y cómo puedes enviar los resultados al cliente.

---

## 📱 Paso 1: Seleccionas o Creas un Cliente

**IMPORTANTE**: Ahora el flujo empieza por el cliente para mantener coherencia.

1. Vas a la página **"Analizar Búsqueda"** (`/parsear`)
2. **Seleccionas un cliente existente** del dropdown O
3. **Creas un nuevo cliente** haciendo clic en "➕ Nuevo Cliente"
   - Ingresas nombre (obligatorio) y teléfono (opcional)
   - Haces clic en "✅ Crear Cliente"

---

## 📱 Paso 2: Recibes un Mensaje de WhatsApp

**Ejemplo de mensaje:**
```
"Busco depto hasta USD 170.000 (cash) 💵
2 dorm · 2 baños · cochera · SUM con pileta
Zonas: Micro / Macrocentro / Constituyentes
Si tienen algo, me escriben 👋"
```

---

## 🔍 Paso 3: Analizas el Mensaje en el Sistema

### Opción A: Solo Analizar (sin guardar)
1. Con el cliente ya seleccionado, pegas el mensaje en el campo de texto
2. Haces clic en **"🔍 Analizar"**
3. El sistema:
   - ✅ Extrae automáticamente: tipo de propiedad, presupuesto, zonas, características
   - ✅ Busca propiedades compatibles en tu base de datos
   - ✅ Genera links inteligentes a portales (ZonaProp, ArgenProp, MercadoLibre, etc.)
   - ✅ Scrapea resultados en vivo de MercadoLibre y ArgenProp
   - ❌ **NO guarda** nada en la base de datos

### Opción B: Analizar y Guardar (recomendado)
1. Con el cliente seleccionado, pegas el mensaje
2. Haces clic en **"💾 Analizar y Guardar"**
3. El sistema hace TODO lo anterior **Y ADEMÁS**:
   - ✅ Asocia la búsqueda al cliente seleccionado
   - ✅ Crea una nueva búsqueda en la base de datos
   - ✅ Guarda toda la información extraída
   - ✅ Puedes hacer seguimiento desde la página del cliente

---

## 📊 Paso 4: El Sistema Te Muestra 3 Tipos de Resultados

### 🏡 1. Propiedades Compatibles (de tu Base de Datos)
- Propiedades que ya tienes cargadas que coinciden con los criterios
- Muestra: precio, ubicación, dormitorios, contacto de la inmobiliaria
- Puedes hacer clic en "Ver Ficha" para ver los detalles completos

### 🌐 2. Links Inteligentes a Portales Web
El sistema genera automáticamente links de búsqueda en:
- **Portales**: ZonaProp, **ArgenProp**, MercadoLibre, Buscainmueble
- **Inmobiliarias**: Remax, Century 21
- **Internacionales**: Properstar, FazWaz
- Todos los links ya tienen los filtros aplicados (zona, tipo, precio, etc.)
- **ArgenProp** está incluido con búsquedas filtradas automáticamente

### 🌐 3. Oportunidades en la Web (Scraping en Vivo)
- Resultados reales scrapeados de **MercadoLibre, ArgenProp y Remax**
- Muestra: título, precio, ubicación, imagen, link directo
- Actualizados en tiempo real
- Los tres portales se buscan en paralelo para mayor velocidad

---

## 📲 Paso 5: Compartir con el Cliente

### Opción 1: Copiar Lista de Oportunidades Web
1. En la sección **"🌐 Oportunidades en la Web"**
2. Haz clic en el botón **"📲 Copiar para Compartir"**
3. El sistema genera un texto formateado con todas las propiedades encontradas
4. Se copia automáticamente al portapapeles
5. Pegas directamente en WhatsApp al cliente

**Ejemplo del texto generado:**
```
*Oportunidades Encontradas en la Web* 🏠

*Departamento 2 dormitorios - Microcentro*
💰 USD 165.000
📍 Microcentro, Santa Fe
🔗 https://www.mercadolibre.com.ar/...

*Casa 3 dormitorios - Constituyentes*
💰 USD 180.000
📍 Constituyentes, Santa Fe
🔗 https://www.argenprop.com/...
```

### Opción 2: Enviar Links de Portales
1. En la sección **"🌐 Búsqueda Inteligente en la Web"**
2. Haz clic en cualquier link (se abre en nueva pestaña)
3. Copias la URL del portal con los filtros aplicados
4. La envías al cliente por WhatsApp

**Ejemplo:**
```
"Te paso el link de ZonaProp con las búsquedas filtradas:
https://www.zonaprop.com.ar/departamentos-venta-ciudad-de-santa-fe-sf-2-habitaciones.html"
```

### Opción 3: Enviar Propiedades de tu Base de Datos
1. En la sección **"🏡 Propiedades Compatibles"**
2. Haz clic en **"Ver Ficha"** de la propiedad que te interese
3. Copias el link de la ficha o los datos de contacto
4. Los envías al cliente

---

## 💾 Paso 6: Seguimiento (si guardaste la búsqueda)

Si usaste **"Analizar y Guardar"**, ahora puedes:

1. **Ver el Cliente Creado:**
   - Ve a **"Clientes"** (`/clientes`)
   - Encontrarás el cliente con su nombre y teléfono (si se detectó)

2. **Ver la Búsqueda Guardada:**
   - Ve a **"Búsquedas"** (`/busquedas`)
   - Verás la búsqueda con todos los criterios extraídos
   - Estado: "ACTIVA"

3. **Gestionar el Cliente:**
   - Haz clic en el cliente
   - Puedes agregar más búsquedas, tareas, notas, etc.

---

## 🎯 Resumen del Flujo Completo

```
1. Seleccionar/Crear Cliente
    ↓
2. Pegar Mensaje WhatsApp
    ↓
3. Analizar (con o sin guardar)
    ↓
Sistema Extrae: Tipo, Precio, Zonas, Características
    ↓
Sistema Busca: 
  • Propiedades en tu BD
  • Genera links a portales (ZonaProp, ArgenProp, MercadoLibre, Remax, etc.)
  • Scrapea web en vivo (MercadoLibre + ArgenProp + Remax)
    ↓
4. Ves Resultados:
  • Propiedades compatibles
  • Links inteligentes (incluye ArgenProp)
  • Oportunidades web scrapeadas (ML + ArgenProp + Remax)
    ↓
5. Compartes con Cliente:
  • Copias lista formateada
  • O envías links de portales (incluye ArgenProp)
  • O compartes propiedades de tu BD
    ↓
6. (Si guardaste) Seguimiento:
  • Búsqueda asociada al cliente
  • Puedes ver desde página del cliente
  • Puedes agregar más búsquedas al mismo cliente
```

---

## 💡 Tips y Mejores Prácticas

### ✅ Recomendado:
- **Siempre selecciona o crea el cliente primero** - Mantiene coherencia en el sistema
- Usa **"Analizar y Guardar"** para tener registro de todas las búsquedas asociadas al cliente
- Revisa los resultados scrapeados antes de enviar (pueden haber propiedades fuera de zona)
- Combina propiedades de tu BD + links de portales (ZonaProp, ArgenProp, MercadoLibre, Remax) para dar más opciones
- Usa el botón "Copiar para Compartir" para enviar rápido al cliente
- **ArgenProp y Remax** están incluidos tanto en links inteligentes como en scraping en vivo
- El scraping busca en **MercadoLibre, ArgenProp y Remax** simultáneamente para darte más resultados

### ⚠️ Importante:
- El scraping web puede tardar unos segundos
- Los resultados scrapeados son en tiempo real (pueden cambiar)
- Siempre verifica que las propiedades sean relevantes antes de enviar
- Los links de portales tienen filtros aplicados automáticamente

---

## 🔗 Navegación Rápida

- **Parsear Mensaje**: `/parsear`
- **Ver Búsquedas**: `/busquedas`
- **Ver Clientes**: `/clientes`
- **Ver Propiedades**: `/propiedades`

---

¿Tienes dudas sobre algún paso específico? Revisa el código o pregunta por ayuda adicional.
