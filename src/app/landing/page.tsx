'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const [email, setEmail] = useState('')

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí puedes agregar lógica para enviar el email o redirigir
    window.location.href = `/login`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🏠</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">CRM Inmobiliario</span>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700">Comenzar Gratis</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Gestiona tu Inmobiliaria en
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Santa Fe</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            La plataforma CRM diseñada especialmente para agentes inmobiliarios de Santa Fe. 
            Organiza clientes, propiedades, búsquedas y comisiones en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Probar Gratis
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
            Todo lo que necesitas para gestionar tu inmobiliaria
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Gestión de Clientes</h3>
              <p className="text-slate-600">
                Organiza todos tus clientes, sus búsquedas activas y el historial de comunicaciones. 
                Nunca pierdas el contacto con un cliente potencial.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🏘️</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Inventario de Propiedades</h3>
              <p className="text-slate-600">
                Carga y gestiona tu inventario completo. Filtra por zona, precio, tipo de propiedad 
                y encuentra la propiedad perfecta para cada cliente.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Búsquedas Activas</h3>
              <p className="text-slate-600">
                Seguimiento completo del pipeline de ventas. Desde búsqueda nueva hasta cierre, 
                mantén el control de cada oportunidad.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Control de Comisiones</h3>
              <p className="text-slate-600">
                Calcula y gestiona comisiones automáticamente. Lleva un registro preciso de 
                todas tus operaciones cerradas y comisiones pendientes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Dashboard Intuitivo</h3>
              <p className="text-slate-600">
                Visualiza tus métricas clave en tiempo real. Búsquedas activas, propiedades 
                disponibles, comisiones y mucho más en un solo vistazo.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Carga Rápida</h3>
              <p className="text-slate-600">
                Importa múltiples propiedades desde Excel en segundos. Ahorra tiempo con nuestra 
                herramienta de carga masiva optimizada para inmobiliarias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
            ¿Por qué elegir nuestro CRM en Santa Fe?
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Diseñado para el mercado local</h3>
                    <p className="text-slate-600">
                      Conoce las necesidades específicas del mercado inmobiliario de Santa Fe y Argentina.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Multi-agente y escalable</h3>
                    <p className="text-slate-600">
                      Gestiona múltiples agentes, cada uno con su propio inventario y clientes, 
                      perfecto para inmobiliarias en crecimiento.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Seguro y confiable</h3>
                    <p className="text-slate-600">
                      Tus datos están protegidos con encriptación y respaldos automáticos. 
                      Cumplimos con los estándares de seguridad más altos.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">Soporte en español</h3>
                    <p className="text-slate-600">
                      Atención personalizada en español, con horarios adaptados a Argentina. 
                      Estamos aquí para ayudarte.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Estadísticas que hablan</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-slate-600">Tiempo ahorrado</span>
                  <span className="text-2xl font-bold text-blue-600">+40%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-slate-600">Clientes gestionados</span>
                  <span className="text-2xl font-bold text-purple-600">+200%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-slate-600">Cierres incrementados</span>
                  <span className="text-2xl font-bold text-green-600">+35%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Satisfacción</span>
                  <span className="text-2xl font-bold text-yellow-600">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Suggestions for Santa Fe */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
            Estrategias de Marketing para Santa Fe
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Te sugerimos estas estrategias para promocionar el CRM en el mercado inmobiliario de Santa Fe
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Strategy 1 */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>📱</span> Redes Sociales Locales
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Crea contenido en Instagram y Facebook mostrando casos de éxito</li>
                <li>• Publica tips para agentes inmobiliarios de Santa Fe</li>
                <li>• Usa hashtags como #InmobiliariaSantaFe #PropiedadesSantaFe</li>
                <li>• Colabora con influencers locales del sector inmobiliario</li>
              </ul>
            </div>

            {/* Strategy 2 */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>🤝</span> Networking y Eventos
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Participa en eventos del Colegio de Corredores Inmobiliarios de Santa Fe</li>
                <li>• Organiza workshops gratuitos sobre gestión inmobiliaria</li>
                <li>• Ofrece demos en vivo en ferias inmobiliarias locales</li>
                <li>• Crea alianzas con inmobiliarias establecidas</li>
              </ul>
            </div>

            {/* Strategy 3 */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>📧</span> Email Marketing
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Construye una base de datos de agentes inmobiliarios de Santa Fe</li>
                <li>• Envía newsletters con tips y actualizaciones del CRM</li>
                <li>• Ofrece períodos de prueba gratuitos por email</li>
                <li>• Segmenta por tipo de inmobiliaria (residencial, comercial, etc.)</li>
              </ul>
            </div>

            {/* Strategy 4 */}
            <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>🎯</span> Google Ads Local
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Usa palabras clave: "CRM inmobiliario Santa Fe", "software inmobiliario"</li>
                <li>• Configura anuncios geográficos para Santa Fe y alrededores</li>
                <li>• Crea landing pages específicas para diferentes zonas (Centro, Sur, etc.)</li>
                <li>• Usa remarketing para visitantes que no se registraron</li>
              </ul>
            </div>

            {/* Strategy 5 */}
            <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>📰</span> Contenido y SEO
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Crea un blog con artículos sobre el mercado inmobiliario de Santa Fe</li>
                <li>• Optimiza para búsquedas locales: "mejor CRM inmobiliario Santa Fe"</li>
                <li>• Publica guías gratuitas descargables (PDFs)</li>
                <li>• Colabora con medios locales como El Litoral o La Capital</li>
              </ul>
            </div>

            {/* Strategy 6 */}
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span>💼</span> Programas de Referidos
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li>• Ofrece descuentos a agentes que traigan referidos</li>
                <li>• Crea un programa de embajadores para inmobiliarias líderes</li>
                <li>• Premia a los primeros usuarios con planes especiales</li>
                <li>• Genera testimonios y casos de éxito locales</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu inmobiliaria?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a los agentes inmobiliarios de Santa Fe que ya están usando nuestro CRM
          </p>
          <form onSubmit={handleContact} className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg text-slate-900"
              required
            />
            <Link href="/login">
              <Button type="submit" size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                Comenzar
              </Button>
            </Link>
          </form>
          <p className="text-blue-100 text-sm mt-4">
            Prueba gratuita • Sin tarjeta de crédito • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏠</span>
                </div>
                <span className="text-white font-bold">CRM Inmobiliario</span>
              </div>
              <p className="text-sm">
                La plataforma CRM líder para agentes inmobiliarios en Santa Fe, Argentina.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Características</a></li>
                <li><a href="#" className="hover:text-white">Precios</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white">Contacto</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Términos</a></li>
                <li><a href="#" className="hover:text-white">Privacidad</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 CRM Inmobiliario. Todos los derechos reservados.</p>
            <p className="mt-2">Santa Fe, Argentina 🇦🇷</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
