'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TOUR_STEPS = [
  {
    icon: '🔍',
    title: 'Explorá Búsquedas',
    desc: 'Mirá cómo se gestionan clientes compradores y su pipeline.',
    href: '/busquedas',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: '🤖',
    title: 'IA para Parsear',
    desc: 'Pegá un texto de WhatsApp y la IA extrae los datos automáticamente.',
    href: '/parsear',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: '👤',
    title: 'Gestión de Clientes',
    desc: 'Seguimiento completo: envíos, comunicaciones y tareas.',
    href: '/gestion',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: '🏠',
    title: 'Propiedades',
    desc: 'Inventario de propiedades con filtros y match automático.',
    href: '/propiedades',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: '💰',
    title: 'Comisiones',
    desc: 'Sistema de puntas argentino con cálculo automático.',
    href: '/operaciones',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: '📊',
    title: 'Sugerencias IA',
    desc: 'Match inteligente entre búsquedas y propiedades.',
    href: '/matches',
    color: 'from-rose-500 to-pink-600',
  },
]

export default function DemoBanner() {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-lg animate-fade-in-up">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="demo-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#demo-pattern)" />
        </svg>
      </div>

      <div className="relative p-5 sm:p-6">
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 flex items-center justify-center transition-colors text-sm"
          title="Cerrar"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-lg">
            🚀
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">¡Bienvenido a la Demo!</h3>
            <p className="text-sm text-slate-500">
              Explorá todas las funciones del CRM. Los datos son de ejemplo y las acciones de escritura están
              deshabilitadas.
            </p>
          </div>
        </div>

        {/* Tour steps grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
          {TOUR_STEPS.map((step, i) => (
            <button
              key={step.href}
              onClick={() => router.push(step.href)}
              className="group flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border border-slate-200/70 bg-white/80 hover:bg-white hover:shadow-md hover:border-slate-300 transition-all"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{step.icon}</span>
              <span className="text-xs font-semibold text-slate-700 leading-tight">{step.title}</span>
              <span className="text-[10px] text-slate-400 leading-tight hidden sm:block">{step.desc}</span>
            </button>
          ))}
        </div>

        {/* Tip */}
        <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-100/50 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Tip:</strong> Podés navegar libremente. Si intentás crear o eliminar algo, verás un mensaje indicando
            que es cuenta demo.
          </span>
        </div>
      </div>
    </div>
  )
}
