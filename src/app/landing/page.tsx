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
  MessageSquare,
  CalendarDays,
  Clock3,
} from 'lucide-react'

export default function LandingPage() {
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fechaDemo: '',
    horaDemo: '',
    mensaje: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSending(true)
      const response = await fetch('/api/landing-consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        alert(errorData?.error || 'No se pudo enviar la consulta.')
        return
      }

      alert('Consulta enviada. Ya llego al inbox del superusuario.')
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        fechaDemo: '',
        horaDemo: '',
        mensaje: '',
      })
    } catch (error) {
      console.error('Error enviando consulta:', error)
      alert('Error de conexion al enviar la consulta.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
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

            <Link href="/login">
              <Button variant="outline" className="hidden sm:flex">Acceder</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase mb-4">
              Sistema Profesional Inmobiliario
            </h2>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Gestion profesional de
              <br />
              <span className="text-blue-600">propiedades, clientes y busquedas</span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-slate-600 mb-10">
              Demo comercial actualizada con importacion Excel, analisis de portales, gestion de cliente y tablero admin por agente.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#demo">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-lg">
                  Ver demo en vivo
                </Button>
              </a>
              <a href="#contacto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-12 text-lg">
                  Solicitar reunion
                </Button>
              </a>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-8 text-slate-500">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                <span className="font-medium">Multi inmobiliaria aislada</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Admin y agentes por equipo</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Flujo rapido para operar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
              Funcionalidades completas
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Todo lo necesario para vender, seguir y cerrar operaciones en un solo CRM
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Importacion inteligente</h3>
              <p className="text-slate-600 mb-6">
                Carga masiva por Excel para propiedades y para clientes con consultas.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  Formatos flexibles de columnas
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  Validacion y resumen de errores
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Busqueda de portales</h3>
              <p className="text-slate-600 mb-6">
                Analisis guiado de oportunidades con foco en Santa Fe y filtros comerciales.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Filtros por precio, dorm y zona
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Checklist para enviar a gestion
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gestion del cliente</h3>
              <p className="text-slate-600 mb-6">
                Seguimiento de busquedas, envios y comunicaciones en un flujo unico.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Historial completo por cliente
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Links externos y links seleccionados
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <LayoutList className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Agenda de visitas</h3>
              <p className="text-slate-600 mb-6">
                Tareas por prioridad con estados, recordatorios y seguimiento semanal.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  Citas, visitas y llamadas
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-orange-500" />
                  Carga rapida desde texto
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Tablero de administracion</h3>
              <p className="text-slate-600 mb-6">
                Vista consolidada de busquedas y actividad por agente para control comercial.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  KPIs por inmobiliaria
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Seguimiento operativo de agentes
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow border-none">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Asistente de flujo</h3>
              <p className="text-slate-600 mb-6">
                El sistema guia al usuario para completar cada paso sin perder informacion.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                  Mensajes de ayuda en pantalla
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                  Menos pasos manuales repetitivos
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section id="demo" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-3xl p-8 md:p-16 text-white text-center">
            <h2 className="text-3xl font-extrabold sm:text-4xl mb-6">
              Proba el sistema ahora
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Usuario demo listo para mostrar el circuito completo comercial
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-lg mx-auto border border-white/20 mb-10">
              <h3 className="text-2xl font-bold mb-6">Acceso demo</h3>
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Usuario:</p>
                  <p className="text-lg font-mono">demo@inmobiliar.com</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Contrasena:</p>
                  <p className="text-lg font-mono">demo123</p>
                </div>
              </div>
              <Link href="/login">
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-6 text-lg">
                  Acceder al sistema demo
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Importar excel</div>
              <div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Analizar busquedas</div>
              <div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Gestion de cliente</div>
              <div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Agenda de tareas</div>
              <div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Tablero admin</div>
              <div className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Usuarios por rol</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Agenda sugerida para la cita</h3>
            <p className="text-slate-600 mb-6">Demo de 30 minutos para mostrar el sistema de punta a punta.</p>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">Bloque 1</p>
                <p className="text-slate-600">Importadores y carga inicial</p>
                <p className="text-slate-500 mt-1">10 min</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">Bloque 2</p>
                <p className="text-slate-600">Busqueda y oportunidades</p>
                <p className="text-slate-500 mt-1">10 min</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">Bloque 3</p>
                <p className="text-slate-600">Tablero admin y seguimiento</p>
                <p className="text-slate-500 mt-1">10 min</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="precios" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
              Planes accesibles
            </h2>
            <p className="text-xl text-slate-600">
              Inversion unica y mantenimiento mensual
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-none bg-white shadow-md">
              <h3 className="text-xl font-bold mb-2">Implementacion inicial</h3>
              <p className="text-slate-500 text-sm mb-3">Pago unico por setup completo</p>
              <div className="text-4xl font-extrabold text-slate-900">$299.999</div>
              <p className="text-sm font-semibold text-emerald-700 mt-2 mb-8">
                o $360.000 en 3 cuotas de $120.000
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Configuracion completa del CRM',
                  'Migracion de datos desde planillas',
                  'Capacitacion para todo el equipo',
                  'Personalizacion de marca',
                  'Carga inicial de propiedades',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#contacto" className="block">
                <Button className="w-full h-12 text-lg" variant="outline">Elegir plan</Button>
              </a>
            </Card>

            <Card className="p-8 border-2 border-blue-600 bg-white relative shadow-xl">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Mantenimiento mensual</h3>
              <p className="text-slate-500 text-sm mb-6">Soporte y mejoras continuas</p>
              <div className="text-4xl font-extrabold text-slate-900 mb-8">
                $59.000 <span className="text-xl font-normal text-slate-400">/mes</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Soporte tecnico prioritario',
                  'Actualizaciones del sistema',
                  'Hosting en la nube',
                  'Backups diarios',
                  'Certificado SSL',
                  'Nuevas funciones mensuales',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#contacto" className="block">
                <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">Contratar ahora</Button>
              </a>
            </Card>
          </div>
        </div>
      </section>

      <section id="contacto" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Solicita una demostracion</h2>
              <p className="text-slate-600">Elegi fecha y hora tentativa para coordinar la cita comercial</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" /> Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" /> Telefono
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="+54 11 1234-5678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" /> Fecha demo
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    value={formData.fechaDemo}
                    onChange={(e) => setFormData({ ...formData, fechaDemo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-blue-600" /> Hora demo
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    value={formData.horaDemo}
                    onChange={(e) => setFormData({ ...formData, horaDemo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Mensaje *
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Contanos que queres ver en la demo..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={sending} className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 font-bold">
                {sending ? 'Enviando...' : 'Enviar solicitud'}
              </Button>
            </form>
          </div>
        </div>
      </section>

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
                CRM inmobiliario para equipos comerciales que quieren velocidad, orden y seguimiento real.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 italic">Enlaces rapidos</h4>
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
            &copy; 2026 Inmobiliar en Equipo. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
