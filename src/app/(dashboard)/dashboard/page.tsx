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

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="text-right">
          <p className="text-sm text-slate-600">
            {stats.isAdmin ? 'Administrador' : 'Agente'}:
          </p>
          <p className="text-lg font-semibold text-blue-600">{stats.agente}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Búsquedas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.buscadasActivas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Calificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.buscadasCalificadas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              En Visita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats.visitas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.reservas}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Cerrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600">
              {stats.cerrados}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Comisiones (ARS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              ${stats.comisionesTotales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>NUEVO</span>
                <span className="font-semibold">{stats.buscadasActivas}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.buscadasActivas /
                        (stats.buscadasActivas +
                          stats.buscadasCalificadas +
                          stats.visitas +
                          stats.reservas +
                          stats.cerrados || 1)) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span>CALIFICADO</span>
                <span className="font-semibold">
                  {stats.buscadasCalificadas}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.buscadasCalificadas /
                        (stats.buscadasActivas +
                          stats.buscadasCalificadas +
                          stats.visitas +
                          stats.reservas +
                          stats.cerrados || 1)) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span>VISITA</span>
                <span className="font-semibold">{stats.visitas}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.visitas /
                        (stats.buscadasActivas +
                          stats.buscadasCalificadas +
                          stats.visitas +
                          stats.reservas +
                          stats.cerrados || 1)) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span>RESERVA</span>
                <span className="font-semibold">{stats.reservas}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.reservas /
                        (stats.buscadasActivas +
                          stats.buscadasCalificadas +
                          stats.visitas +
                          stats.reservas +
                          stats.cerrados || 1)) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span>CERRADO</span>
                <span className="font-semibold">{stats.cerrados}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-slate-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (stats.cerrados /
                        (stats.buscadasActivas +
                          stats.buscadasCalificadas +
                          stats.visitas +
                          stats.reservas +
                          stats.cerrados || 1)) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
