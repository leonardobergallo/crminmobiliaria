'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  buscadasActivas: number
  buscadasCalificadas: number
  visitas: number
  reservas: number
  cerrados: number
  comisionesTotales: number
  agente: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    buscadasActivas: 0,
    buscadasCalificadas: 0,
    visitas: 0,
    reservas: 0,
    cerrados: 0,
    comisionesTotales: 0,
    agente: 'Sin agente',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Re-fetch cuando cambie el agente seleccionado
    const interval = setInterval(fetchStats, 1000)
    fetchStats()
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      // Obtener el agente seleccionado del localStorage
      const selectedUserId = localStorage.getItem('selectedUserId')
      
      // Obtener datos del agente si existe
      let agenteNombre = 'Sin agente'
      if (selectedUserId) {
        try {
          const userResponse = await fetch(`/api/usuarios/${selectedUserId}`)
          if (userResponse.ok) {
            const user = await userResponse.json()
            agenteNombre = user.nombre
          }
        } catch (e) {
          console.error('Error fetching user:', e)
        }
      }

      // Construir URL con filtro de usuario si existe
      const busquedasUrl = selectedUserId 
        ? `/api/busquedas?usuarioId=${selectedUserId}`
        : '/api/busquedas'
      
      const operacionesUrl = selectedUserId
        ? `/api/operaciones?usuarioId=${selectedUserId}`
        : '/api/operaciones'

      const [busquedas, operaciones] = await Promise.all([
        fetch(busquedasUrl).then((r) => r.json()),
        fetch(operacionesUrl).then((r) => r.json()),
      ])

      const estados = {
        NUEVO: 0,
        CALIFICADO: 0,
        VISITA: 0,
        RESERVA: 0,
        CERRADO: 0,
      }

      busquedas.forEach((b: any) => {
        if (estados[b.estado as keyof typeof estados] !== undefined) {
          estados[b.estado as keyof typeof estados]++
        }
      })

      const comisionesTotal = operaciones.reduce(
        (sum: number, op: any) => sum + (op.comisionTotal || 0),
        0
      )

      setStats({
        buscadasActivas: estados.NUEVO,
        buscadasCalificadas: estados.CALIFICADO,
        visitas: estados.VISITA,
        reservas: estados.RESERVA,
        cerrados: estados.CERRADO,
        comisionesTotales: comisionesTotal,
        agente: agenteNombre,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
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
          <p className="text-sm text-slate-600">Agente:</p>
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
