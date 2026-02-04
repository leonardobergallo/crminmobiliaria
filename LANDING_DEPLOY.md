# 🚀 Guía de Despliegue de la Landing Page en Vercel

## 📋 Descripción

Esta landing page promociona el CRM Inmobiliario específicamente para el mercado de Santa Fe, Argentina. Incluye:

- **Descripción completa del CRM**: Qué hace y cómo funciona
- **Características principales**: Gestión de clientes, propiedades, búsquedas, comisiones
- **Estrategias de marketing**: 6 estrategias específicas para promocionar en Santa Fe
- **Diseño responsive**: Optimizado para móviles y desktop
- **Call-to-actions**: Botones para registro y contacto

## 🎯 Estrategias de Marketing Incluidas

La página incluye 6 estrategias específicas para Santa Fe:

1. **Redes Sociales Locales** - Instagram, Facebook con hashtags locales
2. **Networking y Eventos** - Colegio de Corredores, workshops, ferias
3. **Email Marketing** - Newsletters segmentadas para agentes locales
4. **Google Ads Local** - Anuncios geográficos para Santa Fe
5. **Contenido y SEO** - Blog local, colaboraciones con medios
6. **Programas de Referidos** - Incentivos para agentes embajadores

## 📦 Despliegue en Vercel

### Opción 1: Despliegue Automático desde GitHub

1. **Conecta tu repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub
   - Click en "Add New Project"
   - Selecciona el repositorio `leonardobergallo/crminmobiliaria`

2. **Configuración del proyecto:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (raíz del proyecto)
   - Build Command: `npm run build`
   - Output Directory: `.next` (automático para Next.js)
   - Install Command: `npm install`

3. **Variables de entorno:**
   - Agrega `DATABASE_URL` si es necesario
   - Agrega `JWT_SECRET` si es necesario

4. **Deploy:**
   - Click en "Deploy"
   - Vercel construirá y desplegará automáticamente

### Opción 2: Despliegue Manual con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

## 🌐 URLs de la Landing

Una vez desplegado, la landing estará disponible en:

- **Página principal**: `https://tu-dominio.vercel.app/` (redirige a `/landing` si no está autenticado)
- **Landing directa**: `https://tu-dominio.vercel.app/landing`
- **Login**: `https://tu-dominio.vercel.app/login`
- **Dashboard**: `https://tu-dominio.vercel.app/dashboard` (requiere autenticación)

## 🎨 Personalización

### Cambiar colores y branding:

Edita `src/app/landing/page.tsx`:
- Busca las clases de Tailwind con colores (`bg-blue-600`, `text-purple-600`, etc.)
- Reemplaza con tus colores de marca

### Actualizar información de contacto:

1. Busca el formulario de contacto en la sección CTA
2. Modifica el `handleContact` para enviar a tu email o CRM
3. Actualiza los enlaces del footer

### Agregar imágenes:

1. Coloca imágenes en `/public/`
2. Usa `<Image>` de Next.js para optimización
3. Ejemplo: `<Image src="/hero-image.jpg" alt="Hero" />`

## 📱 Optimización SEO

La página incluye:

- ✅ Metadata optimizado en `layout.tsx`
- ✅ Estructura semántica HTML
- ✅ Títulos y descripciones relevantes
- ✅ Contenido localizado para Santa Fe

### Mejoras adicionales recomendadas:

1. **Agregar Open Graph tags** en `layout.tsx`:
```typescript
export const metadata: Metadata = {
  openGraph: {
    title: "CRM Inmobiliario - Santa Fe",
    description: "...",
    images: ["/og-image.jpg"],
  },
}
```

2. **Agregar sitemap.xml** para SEO
3. **Agregar robots.txt** en `/public/robots.txt`
4. **Implementar Google Analytics**

## 🔗 Enlaces Importantes

- **Documentación Vercel**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Tailwind CSS**: https://tailwindcss.com/docs

## 📞 Soporte

Si tienes problemas con el despliegue:

1. Revisa los logs en Vercel Dashboard
2. Verifica que todas las dependencias estén en `package.json`
3. Asegúrate de que `DATABASE_URL` esté configurada correctamente
4. Revisa que el build local funcione: `npm run build`

## ✨ Próximos Pasos

1. ✅ Desplegar en Vercel
2. 🔄 Configurar dominio personalizado (opcional)
3. 📊 Agregar Google Analytics
4. 📧 Configurar formulario de contacto real
5. 🖼️ Agregar imágenes reales del producto
6. 📱 Probar en diferentes dispositivos

---

**¡Listo para desplegar!** 🚀

La landing está optimizada para el mercado de Santa Fe y lista para atraer agentes inmobiliarios locales.
