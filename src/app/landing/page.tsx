'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  FileText, 
  PieChart, 
  Target, 
  LayoutList, 
  BarChart3, 
  Lightbulb,
  CheckCircle2,
  Lock,
  Users,
  Zap,
  Mail,
  Phone,
  User,
  MessageSquare
} from 'lucide-react'

export default function LandingPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Solicitud enviada con éxito. Nos contactaremos a la brevedad.')
    setFormData({ nombre: '', email: '', telefono: '', mensaje: '' })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">IE</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">Inmobiliar en Equipo</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#funcionalidades" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Funcionalidades</a>
              <a href="#demo" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Demo</a>
              <a href="#precios" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Precios</a>
              <a href="#contacto" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Contacto</a>
            </nav>

            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="outline" className="hidden sm:flex">Acceder</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase mb-4">
              Sistema Profesional Inmobiliario
            </h2>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Gestión Profesional de <br />
              <span className="text-blue-600">Propiedades y Clientes</span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-slate-600 mb-10">
              Sistema completo de administración con importación automática, búsqueda inteligente, gestión de clientes y seguimiento de operaciones. Template listo para tu inmobiliaria.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#demo">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-lg">
                  Ver Demo en Vivo
                </Button>
              </a>
              <a href="#contacto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 text-lg">
                  Solicitar Información
                </Button>
              </a>
            </div>
            
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-slate-500">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                <span className="font-medium">Seguro y en la nube</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Multi-usuario</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Rápido y moderno</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Todo lo que necesitas para administrar tu inmobiliaria de forma profesional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Importación */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Importación de Propiedades</h3>
              <p className="text-slate-600 mb-6">
                Carga masiva de propiedades desde Excel o portales inmobiliarios. Procesamiento automático de datos.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  Soporte Excel y portales
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  Carga rápida e individual
                </li>
              </ul>
            </Card>

            {/* Búsqueda */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Búsqueda Inteligente</h3>
              <p className="text-slate-600 mb-6">
                Filtros avanzados por zona, precio, ambientes y características. Motor de búsqueda optimizado.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Filtros interactivos
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Exportación de fichas PDF
                </li>
              </ul>
            </Card>

            {/* Matches */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Matches con Clientes</h3>
              <p className="text-slate-600 mb-6">
                Conecta automáticamente pedidos de clientes con propiedades disponibles en tu cartera.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Alertas de coincidencia
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Seguimiento de pedidos
                </li>
              </ul>
            </Card>

            {/* Operaciones */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <LayoutList className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gestión de Operaciones</h3>
              <p className="text-slate-600 mb-6">
                Historial completo de visitas, reservas y cierres. Control total del pipeline de ventas.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  Agenda integrada
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  Estado de trámites
                </li>
              </ul>
            </Card>

            {/* Dashboard */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dashboard Real Estate</h3>
              <p className="text-slate-600 mb-6">
                Métricas clave del negocio: captaciones, ventas, rendimiento de agentes y objetivos.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Estadísticas en tiempo real
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Reportes de gestión
                </li>
              </ul>
            </Card>

            {/* IA */}
            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Asistente IA</h3>
              <p className="text-slate-600 mb-6">
                Recomendaciones personalizadas basadas en el comportamiento del mercado y tus clientes.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                  Valuaciones sugeridas
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                  Optimización de cartera
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-3xl p-8 md:p-16 text-white text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl mb-6">
              Prueba el Sistema Ahora
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Explora todas las funcionalidades con nuestro usuario demo
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-lg mx-auto border border-white/20 mb-10">
              <h3 className="text-2xl font-bold mb-6">Acceso Demo</h3>
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Usuario:</p>
                  <p className="text-lg font-mono">demo@inmobiliar.com</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Contraseña:</p>
                  <p className="text-lg font-mono">demo123</p>
                </div>
              </div>
              <Link href="/login">
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-6 text-lg">
                  Acceder al Sistema Demo
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Ver dashboard
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Cargar propiedades
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Gestionar clientes
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Ver matches
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Agenda de visitas
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Importar Excel
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planes/Precios */}
      <section id="precios" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
              Planes Accesibles
            </h2>
            <p className="text-xl text-slate-600">
              Inversión única y mantenimiento mensual transparente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-none bg-white shadow-md">
              <h3 className="text-xl font-bold mb-2">Implementación Inicial</h3>
              <p className="text-slate-500 text-sm mb-6">Pago único por setup completo</p>
              <div className="text-4xl font-extrabold text-slate-900 mb-8">$299.000</div>
              <ul className="space-y-4 mb-8">
                {[
                  'Instalación y configuración completa',
                  'Migración de datos desde Excel/Portales',
                  'Capacitación para todo el equipo',
                  'Personalización de marca y colores',
                  'Carga inicial de propiedades'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#contacto" className="block">
                <Button className="w-full h-12 text-lg" variant="outline">Elegir Plan</Button>
              </a>
            </Card>

            <Card className="p-8 border-2 border-blue-600 bg-white relative shadow-xl">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Mantenimiento Mensual</h3>
              <p className="text-slate-500 text-sm mb-6">Soporte continuo y actualizaciones</p>
              <div className="text-4xl font-extrabold text-slate-900 mb-8">
                $59.000 <span className="text-xl font-normal text-slate-400">/mes</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Soporte técnico prioritario 24/7',
                  'Actualizaciones permanentes del sistema',
                  'Hosting en la nube de alta velocidad',
                  'Backups diarios automáticos',
                  'Certificado de seguridad SSL',
                  'Nuevas funcionalidades cada mes'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#contacto" className="block">
                <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">Contratar Ahora</Button>
              </a>
            </Card>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section id="contacto" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Solicita una Demostración</h2>
              <p className="text-slate-600">Nuestro equipo se pondrá en contacto contigo a la brevedad</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" /> Nombre Completo *
                  </label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Tu nombre aquí"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" /> Email *
                  </label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="email@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" /> Teléfono
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="+54 11 1234-5678"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Mensaje *
                </label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Cuéntanos sobre tus necesidades..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                ></textarea>
              </div>
              <Button type="submit" className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 font-bold">
                Enviar Solicitud
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-16 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="font-bold">IE</span>
                </div>
                <span className="text-xl font-bold">Inmobiliar en Equipo</span>
              </div>
              <p className="text-sm">
                Sistema profesional de gestión inmobiliaria y de clientes desarrollado con tecnología de última generación.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 italic">Enlaces Rápidos</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#funcionalidades" className="hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                <li><a href="#demo" className="hover:text-blue-400 transition-colors">Demo</a></li>
                <li><a href="#precios" className="hover:text-blue-400 transition-colors">Precios</a></li>
                <li><a href="#contacto" className="hover:text-blue-400 transition-colors">Contacto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 italic">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" /> info@inmobiliar.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" /> +54 11 1234-5678
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-800 text-center text-xs">
            © 2026 Inmobiliar en Equipo. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
