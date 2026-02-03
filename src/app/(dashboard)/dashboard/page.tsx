'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  buscadasActivas: number
  buscadasCalificadas: number
  visitas: number
  reservas: number
  cerrados: number
  comisionesTotales: number
  agente: string
  isAdmin: boolean
}

interface CurrentUser {
  id: string
  nombre: string
  rol: string
}

// Icons
const Icons = {
  search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  star: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  bookmark: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  dollar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
  ),
  bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    buscadasActivas: 0,
    buscadasCalificadas: 0,
    visitas: 0,
    reservas: 0,
    cerrados: 0,
    comisionesTotales: 0,
    agente: 'Cargando...',
    isAdmin: false,
  })
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchStats()
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.user)
      } else {
        // Si no está autenticado, redirigir al login
        if (res.status === 401) {
          router.push('/login')
        } else {
          console.error('Error obteniendo usuario actual:', res.status)
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error)
      // En caso de error de red, también redirigir al login
      router.push('/login')
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error al obtener estadísticas:', response.status, errorData)
        // Si es error 401, redirigir al login
        if (response.status === 401) {
          router.push('/login')
          return
        }
        // Para otros errores, mostrar valores por defecto
        setStats({
          buscadasActivas: 0,
          buscadasCalificadas: 0,
          visitas: 0,
          reservas: 0,
          cerrados: 0,
          comisionesTotales: 0,
          agente: currentUser.nombre,
          isAdmin: currentUser.rol === 'admin',
        })
        setLoading(false)
        return
      }

      const data = await response.json()

      // Validar que la respuesta tenga la estructura esperada
      if (!data.busquedas || !data.comisiones) {
        console.error('Respuesta inválida del servidor:', data)
        setStats({
          buscadasActivas: 0,
          buscadasCalificadas: 0,
          visitas: 0,
          reservas: 0,
          cerrados: 0,
          comisionesTotales: 0,
          agente: currentUser.nombre,
          isAdmin: currentUser.rol === 'admin',
        })
        setLoading(false)
        return
      }

      setStats({
        buscadasActivas: data.busquedas?.porEstado?.NUEVO || 0,
        buscadasCalificadas: data.busquedas?.porEstado?.CALIFICADO || 0,
        visitas: data.busquedas?.porEstado?.VISITA || 0,
        reservas: data.busquedas?.porEstado?.RESERVA || 0,
        cerrados: data.busquedas?.porEstado?.CERRADO || 0,
        comisionesTotales: data.comisiones?.total || 0,
        agente: data.agente?.nombre || currentUser.nombre,
        isAdmin: currentUser.rol === 'admin',
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // En caso de error, mostrar valores por defecto
      setStats({
        buscadasActivas: 0,
        buscadasCalificadas: 0,
        visitas: 0,
        reservas: 0,
        cerrados: 0,
        comisionesTotales: 0,
        agente: currentUser.nombre,
        isAdmin: currentUser.rol === 'admin',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-500">
        <svg className="animate-spin h-6 w-6 text-sky-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-lg font-medium">Cargando dashboard...</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Vista general de tu actividad</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
            <Icons.bell />
          </button>
          <button className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
            <Icons.refresh />
          </button>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {stats.agente.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{stats.agente}</p>
              <p className="text-xs text-slate-500">{stats.isAdmin ? 'Administrador' : 'Agente'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Búsquedas Activas</p>
                <p className="text-3xl font-bold text-sky-600">{stats.buscadasActivas}</p>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl text-sky-500">
                <Icons.search />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Calificadas</p>
                <p className="text-3xl font-bold text-violet-600">{stats.buscadasCalificadas}</p>
              </div>
              <div className="p-3 bg-violet-50 rounded-xl text-violet-500">
                <Icons.star />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">En Visita</p>
                <p className="text-3xl font-bold text-amber-600">{stats.visitas}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                <Icons.calendar />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Reservas</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.reservas}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
                <Icons.bookmark />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Cerrados</p>
                <p className="text-3xl font-bold text-slate-700">{stats.cerrados}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
                <Icons.check />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Comisiones (ARS)</p>
                <p className="text-2xl font-bold text-green-600">${stats.comisionesTotales.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-500">
                <Icons.dollar />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800">Pipeline por Estado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: 'NUEVO', value: stats.buscadasActivas, color: 'bg-sky-500', bgLight: 'bg-sky-100' },
            { label: 'CALIFICADO', value: stats.buscadasCalificadas, color: 'bg-violet-500', bgLight: 'bg-violet-100' },
            { label: 'VISITA', value: stats.visitas, color: 'bg-amber-500', bgLight: 'bg-amber-100' },
            { label: 'RESERVA', value: stats.reservas, color: 'bg-emerald-500', bgLight: 'bg-emerald-100' },
            { label: 'CERRADO', value: stats.cerrados, color: 'bg-slate-500', bgLight: 'bg-slate-100' },
          ].map((item) => {
            const total = stats.buscadasActivas + stats.buscadasCalificadas + stats.visitas + stats.reservas + stats.cerrados || 1
            const percentage = Math.min((item.value / total) * 100, 100)
            return (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className="text-sm font-bold text-slate-800">{item.value}</span>
                </div>
                <div className={`w-full ${item.bgLight} rounded-full h-2.5`}>
                  <div
                    className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
