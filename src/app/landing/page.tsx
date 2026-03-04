'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
  MessageCircle,
  CalendarDays,
  Clock3,
  ArrowRight,
  Play,
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  TrendingUp,
  Building2,
} from 'lucide-react'

const CONTACT_PHONE_DISPLAY = '+54 9 342 508-8906'
const WHATSAPP_URL = 'https://wa.me/5493425088906?text=Hola%2C%20quiero%20info%20del%20CRM%20inmobiliario.'

type DemoCaptureSlide = {
  id: string
  titulo: string
  descripcion: string
  image: string
  alt: string
  badge: string
}

const DEMO_CAPTURE_SLIDES: DemoCaptureSlide[] = [
  {
    id: 'dashboard',
    titulo: 'Dashboard comercial',
    descripcion: 'KPIs en tiempo real, pipeline de ventas y resumen de actividad del equipo.',
    image: '/demo/captura-1-dashboard.png',
    alt: 'Vista dashboard del CRM inmobiliario',
    badge: 'Panel principal',
  },
  {
    id: 'gestion-cliente',
    titulo: 'Gestion de cliente 360',
    descripcion: 'Seguimiento completo: busquedas activas, envios, notas y respuestas en un solo lugar.',
    image: '/demo/captura-2-gestion-cliente.png',
    alt: 'Vista gestion de cliente en CRM inmobiliario',
    badge: 'Cliente',
  },
  {
    id: 'busqueda-inteligente',
    titulo: 'Busqueda inteligente con IA',
    descripcion: 'Analiza texto libre, detecta filtros y sugiere propiedades de multiples portales.',
    image: '/demo/captura-3-busqueda-inteligente.png',
    alt: 'Vista busqueda inteligente y oportunidades en portales',
    badge: 'IA',
  },
  {
    id: 'portales',
    titulo: 'Oportunidades en portales',
    descripcion: 'Comparacion rapida entre fuentes: Zonaprop, Argenprop, Mercado Libre y mas.',
    image: '/demo/captura-4-portales.png',
    alt: 'Vista oportunidades en portales inmobiliarios',
    badge: 'Portales',
  },
  {
    id: 'link-externo',
    titulo: 'Links externos',
    descripcion: 'Agrega propiedades de cualquier sitio web y guardalas en el seguimiento del cliente.',
    image: '/demo/captura-5-link-externo.png',
    alt: 'Vista de carga de link externo manual',
    badge: 'Carga rapida',
  },
]

const STATS = [
  { value: '500+', label: 'Propiedades gestionadas' },
  { value: '120+', label: 'Clientes activos' },
  { value: '40+', label: 'Operaciones cerradas' },
  { value: '6', label: 'Portales conectados' },
]

const FLUJO_PASOS = [
  { nro: '1', titulo: 'Carga de datos', desc: 'Importa propiedades y clientes desde Excel o carga manual rapida.' },
  { nro: '2', titulo: 'Busqueda inteligente', desc: 'Analiza busquedas de clientes y encuentra oportunidades en portales.' },
  { nro: '3', titulo: 'Gestion del cliente', desc: 'Envia opciones, registra respuestas y agenda visitas todo en un flujo.' },
  { nro: '4', titulo: 'Cierre operativo', desc: 'Registra la operacion, calcula comisiones y lleva el seguimiento completo.' },
]

/** Hook: element visible via IntersectionObserver */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, visible }
}

export default function LandingPage() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [demoSlideIndex, setDemoSlideIndex] = useState(0)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fechaDemo: '',
    horaDemo: '',
    mensaje: '',
  })

  // auto-advance carousel
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)
  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setDemoSlideIndex((p) => (p + 1) % DEMO_CAPTURE_SLIDES.length), 4500)
  }, [])
  useEffect(() => { resetAutoplay(); return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [resetAutoplay])

  const goSlide = (idx: number) => { setDemoSlideIndex(idx); resetAutoplay() }
  const prevSlide = () => goSlide((demoSlideIndex - 1 + DEMO_CAPTURE_SLIDES.length) % DEMO_CAPTURE_SLIDES.length)
  const nextSlide = () => goSlide((demoSlideIndex + 1) % DEMO_CAPTURE_SLIDES.length)

  // section animations
  const hero = useInView(0.1)
  const features = useInView()
  const flujo = useInView()
  const demo = useInView()
  const precios = useInView()

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

      setSent(true)
      setFormData({ nombre: '', email: '', telefono: '', fechaDemo: '', horaDemo: '', mensaje: '' })
    } catch (error) {
      console.error('Error enviando consulta:', error)
      alert('Error de conexion al enviar la consulta.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      {/* ─── HEADER ─── */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
                <span className="text-white font-bold text-lg">IE</span>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Inmobiliar en Equipo</span>
            </div>

            <nav className="hidden md:flex items-center gap-7">
              {[
                ['#funcionalidades', 'Funcionalidades'],
                ['#flujo', 'Como funciona'],
                ['#demo', 'Demo'],
                ['#precios', 'Precios'],
                ['#contacto', 'Contacto'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors">{label}</a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <Link href="/login">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">Acceder</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section ref={hero.ref} className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-slate-50 pt-16 pb-24 sm:pt-24 sm:pb-32">
        {/* background blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative transition-all duration-700 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/70 backdrop-blur px-4 py-1.5 text-sm font-semibold text-blue-700 mb-6">
              <Zap className="w-4 h-4" /> CRM Inmobiliario Profesional
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.08]">
              Gestiona tu inmobiliaria
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">con velocidad y orden</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
              Importacion masiva, busqueda inteligente en portales, gestion de clientes y cierre operativo en un solo sistema para todo tu equipo.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#demo">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 h-13 text-base shadow-lg shadow-blue-600/25 gap-2">
                  <Play className="w-4 h-4" /> Ver demo en vivo
                </Button>
              </a>
              <a href="#contacto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-13 text-base gap-2">
                  Solicitar reunion <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>

          {/* trust row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{s.value}</div>
                <div className="text-xs md:text-sm text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-5 text-slate-600">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm border border-slate-200/60">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Multi inmobiliaria</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm border border-slate-200/60">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Datos aislados por empresa</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-4 py-2 shadow-sm border border-slate-200/60">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">Mejoras continuas</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FUNCIONALIDADES ─── */}
      <section id="funcionalidades" ref={features.ref} className="py-24 bg-white">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${features.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-600 mb-4">
              <Building2 className="w-4 h-4" /> Todo en un solo sistema
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
              Funcionalidades completas
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Todo lo que tu equipo necesita para captar, gestionar y cerrar operaciones inmobiliarias
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, color: 'blue', title: 'Importacion inteligente', desc: 'Carga masiva desde Excel: propiedades, clientes y busquedas con validacion automatica.', items: ['Mapeo flexible de columnas', 'Resumen de errores en tiempo real'] },
              { icon: PieChart, color: 'purple', title: 'Busqueda en portales', desc: 'Analisis guiado de oportunidades en Zonaprop, Argenprop, MercadoLibre y mas.', items: ['Filtros por precio, zona y tipo', 'Links directos a publicaciones'] },
              { icon: Target, color: 'green', title: 'Gestion del cliente', desc: 'Seguimiento 360: busquedas, envios, notas y comunicaciones en un flujo unificado.', items: ['Historial completo por cliente', 'Envio de opciones con un click'] },
              { icon: LayoutList, color: 'orange', title: 'Agenda y tareas', desc: 'Visitas, llamadas y recordatorios por prioridad con seguimiento semanal.', items: ['Carga rapida desde texto', 'Estados y vencimientos'] },
              { icon: BarChart3, color: 'indigo', title: 'Tablero admin', desc: 'Dashboard consolidado con KPIs por inmobiliaria y seguimiento por agente.', items: ['Metricas en tiempo real', 'Control operativo del equipo'] },
              { icon: Lightbulb, color: 'amber', title: 'Asistente de flujo', desc: 'El sistema guia cada paso con sugerencias contextuales y menos clicks repetitivos.', items: ['Guias en pantalla', 'Acciones rapidas inteligentes'] },
            ].map((feat) => {
              const Icon = feat.icon
              const colorMap: Record<string, { bg: string, text: string, check: string }> = {
                blue: { bg: 'bg-blue-50', text: 'text-blue-600', check: 'text-blue-500' },
                purple: { bg: 'bg-purple-50', text: 'text-purple-600', check: 'text-purple-500' },
                green: { bg: 'bg-emerald-50', text: 'text-emerald-600', check: 'text-emerald-500' },
                orange: { bg: 'bg-orange-50', text: 'text-orange-600', check: 'text-orange-500' },
                indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', check: 'text-indigo-500' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-600', check: 'text-amber-500' },
              }
              const c = colorMap[feat.color] || colorMap.blue
              return (
                <Card key={feat.title} className="group p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/60 bg-white">
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-slate-600 text-sm mb-5 leading-relaxed">{feat.desc}</p>
                  <ul className="space-y-2">
                    {feat.items.map((it) => (
                      <li key={it} className="flex items-center gap-2 text-sm text-slate-500">
                        <CheckCircle2 className={`w-4 h-4 ${c.check} shrink-0`} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section id="flujo" ref={flujo.ref} className="py-24 bg-slate-50">
        <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${flujo.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">Como funciona</h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">4 pasos para llevar cada oportunidad desde la captacion hasta el cierre</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLUJO_PASOS.map((p, idx) => (
              <div key={p.nro} className="relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow" style={{ animationDelay: `${idx * 120}ms` }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-blue-600/20">
                  {p.nro}
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">{p.titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                {idx < FLUJO_PASOS.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMO CAROUSEL ─── */}
      <section id="demo" ref={demo.ref} className="py-24 bg-white">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${demo.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">Recorre el sistema</h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">Capturas reales del CRM funcionando en produccion</p>
          </div>

          {/* carousel */}
          <div className="mb-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-900/10">
            <div className="relative aspect-[16/9] bg-slate-950">
              {DEMO_CAPTURE_SLIDES.map((slide, idx) => (
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.alt}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${idx === demoSlideIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />
              ))}
              {/* overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8 text-white">
                <span className="inline-block rounded-full bg-white/20 backdrop-blur px-3 py-0.5 text-xs font-semibold uppercase tracking-wider mb-2">
                  {DEMO_CAPTURE_SLIDES[demoSlideIndex].badge}
                </span>
                <h3 className="text-xl md:text-2xl font-bold">{DEMO_CAPTURE_SLIDES[demoSlideIndex].titulo}</h3>
                <p className="text-sm text-white/80 mt-1 max-w-lg">{DEMO_CAPTURE_SLIDES[demoSlideIndex].descripcion}</p>
              </div>
              {/* arrows */}
              <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition" aria-label="Anterior">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition" aria-label="Siguiente">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {/* thumbnails */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 overflow-x-auto">
              {DEMO_CAPTURE_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => goSlide(idx)}
                  className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    idx === demoSlideIndex
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {slide.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* access card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 md:p-16 text-white text-center shadow-xl">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-indigo-400/10 translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl font-extrabold sm:text-4xl mb-4">
                Proba el sistema ahora
              </h2>
              <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
                Accede con el usuario demo y recorre todo el flujo comercial en menos de 5 minutos
              </p>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto border border-white/20 mb-10">
                <h3 className="text-xl font-bold mb-5">Acceso demo</h3>
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                    <span className="text-blue-200 text-sm">Usuario</span>
                    <span className="font-mono font-semibold">demo@inmobiliar.com</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                    <span className="text-blue-200 text-sm">Contrasena</span>
                    <span className="font-mono font-semibold">demo123</span>
                  </div>
                </div>
                <Link href="/login">
                  <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold py-5 text-base shadow-lg gap-2">
                    <Play className="w-4 h-4" /> Acceder al sistema
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm max-w-lg mx-auto">
                {['Importar Excel', 'Busqueda IA', 'Gestion 360', 'Agenda tareas', 'Tablero admin', 'Multi usuario'].map((f) => (
                  <div key={f} className="flex items-center justify-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AGENDA SUGERIDA ─── */}
      <section className="py-14 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/60">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Agenda sugerida para la cita</h3>
                <p className="text-slate-500 text-sm mt-0.5">Demo de 30 minutos de punta a punta</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              {[
                { bloque: '1', titulo: 'Carga inicial', desc: 'Importadores y propiedades', min: '10 min', color: 'border-blue-200 bg-blue-50/50' },
                { bloque: '2', titulo: 'Busqueda y gestion', desc: 'Portales, cliente 360', min: '10 min', color: 'border-purple-200 bg-purple-50/50' },
                { bloque: '3', titulo: 'Admin y cierre', desc: 'Tablero y operaciones', min: '10 min', color: 'border-emerald-200 bg-emerald-50/50' },
              ].map((b) => (
                <div key={b.bloque} className={`rounded-xl border p-4 ${b.color}`}>
                  <p className="font-semibold text-slate-800">Bloque {b.bloque} — {b.titulo}</p>
                  <p className="text-slate-600 mt-0.5">{b.desc}</p>
                  <p className="text-slate-400 mt-1.5 text-xs font-medium">{b.min}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRECIOS ─── */}
      <section id="precios" ref={precios.ref} className="py-24 bg-white">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${precios.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
              Planes accesibles
            </h2>
            <p className="text-lg text-slate-600">
              Inversion unica + mantenimiento mensual — sin sorpresas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border border-slate-200/60 bg-white shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-2">Implementacion inicial</h3>
              <p className="text-slate-500 text-sm mb-4">Pago unico por setup completo</p>
              <div className="text-4xl font-extrabold text-slate-900">$299.999</div>
              <p className="text-sm font-semibold text-emerald-600 mt-2 mb-8">
                o 3 cuotas de $120.000
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Configuracion completa del CRM',
                  'Migracion de datos existentes',
                  'Capacitacion para el equipo',
                  'Personalizacion de marca',
                  'Carga inicial de propiedades',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#contacto" className="block">
                <Button className="w-full h-12 text-base" variant="outline">Elegir plan</Button>
              </a>
            </Card>

            <Card className="relative p-8 border-2 border-blue-600 bg-white shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-xs font-bold px-5 py-1.5 rounded-bl-xl flex items-center gap-1.5">
                <Star className="w-3 h-3" /> POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Mantenimiento mensual</h3>
              <p className="text-slate-500 text-sm mb-6">Soporte, hosting y mejoras continuas</p>
              <div className="text-4xl font-extrabold text-slate-900 mb-8">
                $59.000 <span className="text-xl font-normal text-slate-400">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Soporte tecnico prioritario',
                  'Actualizaciones del sistema',
                  'Hosting en la nube',
                  'Backups diarios automaticos',
                  'Certificado SSL incluido',
                  'Nuevas funciones cada mes',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <a href="#contacto" className="block">
                <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20">Contratar ahora</Button>
              </a>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── CONTACTO ─── */}
      <section id="contacto" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/60">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Solicita una demostracion</h2>
              <p className="text-slate-600">Elegi fecha y hora tentativa y te contactamos para coordinar</p>
            </div>

            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Consulta enviada</h3>
                <p className="text-slate-600 mb-6">Ya llego al inbox. Te vamos a contactar a la brevedad.</p>
                <Button onClick={() => setSent(false)} variant="outline">Enviar otra consulta</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-blue-600" /> Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      placeholder="Tu nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-blue-600" /> Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      placeholder="email@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-blue-600" /> Telefono
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      placeholder={CONTACT_PHONE_DISPLAY}
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <CalendarDays className="w-4 h-4 text-blue-600" /> Fecha demo
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      value={formData.fechaDemo}
                      onChange={(e) => setFormData({ ...formData, fechaDemo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                      <Clock3 className="w-4 h-4 text-blue-600" /> Hora demo
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      value={formData.horaDemo}
                      onChange={(e) => setFormData({ ...formData, horaDemo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                    <MessageSquare className="w-4 h-4 text-blue-600" /> Mensaje *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Contanos que te interesa ver en la demo..."
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  />
                </div>

                <Button type="submit" disabled={sending} className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20">
                  {sending ? 'Enviando...' : 'Enviar solicitud de demo'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-900 py-16 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm">IE</span>
                </div>
                <span className="text-lg font-bold">Inmobiliar en Equipo</span>
              </div>
              <p className="text-sm leading-relaxed">
                CRM inmobiliario para equipos comerciales que buscan velocidad, organizacion y seguimiento real.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-5">Enlaces</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#funcionalidades" className="hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                <li><a href="#flujo" className="hover:text-blue-400 transition-colors">Como funciona</a></li>
                <li><a href="#demo" className="hover:text-blue-400 transition-colors">Demo</a></li>
                <li><a href="#precios" className="hover:text-blue-400 transition-colors">Precios</a></li>
                <li><a href="#contacto" className="hover:text-blue-400 transition-colors">Contacto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-5">Contacto</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" /> info@inmobiliar.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" /> {CONTACT_PHONE_DISPLAY}
                </li>
                <li>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Escribinos por WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; 2026 Inmobiliar en Equipo. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* ─── WHATSAPP FAB ─── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition hover:scale-110 hover:bg-emerald-600 active:scale-95"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  )
}
