'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BusquedaItem {
  id: string
  origen: string
  estado: string
  createdAt: string
  presupuestoTexto?: string | null
  tipoPropiedad?: string | null
  ubicacionPreferida?: string | null
  cliente?: {
    id: string
    nombreCompleto: string
    usuario?: { id: string; nombre: string } | null
  } | null
  usuario?: { id: string; nombre: string } | null
}

interface CurrentUser {
  id: string
  nombre: string
  rol: string
}

type EstadoClave = 'NUEVO' | 'CALIFICADO' | 'VISITA' | 'RESERVA' | 'CERRADO' | 'PERDIDO'

const ESTADOS: EstadoClave[] = ['NUEVO', 'CALIFICADO', 'VISITA', 'RESERVA', 'CERRADO', 'PERDIDO']

export default function TableroBusquedasAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [busquedas, setBusquedas] = useState<BusquedaItem[]>([])
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTexto, setFiltroTexto] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const me = await fetch('/api/auth/me')
        if (!me.ok) {
          router.replace('/login')
          return
        }
        const meData = await me.json()
        const user = meData.user as CurrentUser
        if (user.rol !== 'admin' && user.rol !== 'superadmin') {
          router.replace('/busquedas')
          return
        }
        setCurrentUser(user)

        const res = await fetch('/api/busquedas')
        if (!res.ok) {
          setBusquedas([])
          return
        }
        const data = await res.json()
        setBusquedas(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  const getAgenteNombre = (b: BusquedaItem) =>
    b.usuario?.nombre || b.cliente?.usuario?.nombre || 'Sin asignar'

  const agentes = useMemo(
    () => Array.from(new Set(busquedas.map(getAgenteNombre))).sort((a, b) => a.localeCompare(b)),
    [busquedas]
  )

  const filtradas = useMemo(() => {
    return busquedas.filter((b) => {
      const agente = getAgenteNombre(b)
      const texto = `${b.cliente?.nombreCompleto || ''} ${b.tipoPropiedad || ''} ${b.ubicacionPreferida || ''}`.toLowerCase()
      if (filtroAgente && agente !== filtroAgente) return false
      if (filtroEstado && b.estado !== filtroEstado) return false
      if (filtroTexto && !texto.includes(filtroTexto.toLowerCase())) return false
      return true
    })
  }, [busquedas, filtroAgente, filtroEstado, filtroTexto])

  const kpis = useMemo(() => {
    const base = {
      total: filtradas.length,
      activas: 0,
      visita: 0,
      cerradas: 0,
      perdidas: 0,
    }
    filtradas.forEach((b) => {
      if (b.estado !== 'CERRADO' && b.estado !== 'PERDIDO') base.activas++
      if (b.estado === 'VISITA') base.visita++
      if (b.estado === 'CERRADO') base.cerradas++
      if (b.estado === 'PERDIDO') base.perdidas++
    })
    return base
  }, [filtradas])

  const tableroAgentes = useMemo(() => {
    const acc: Record<string, { agente: string; total: number; visita: number; cerradas: number; activas: number }> = {}
    filtradas.forEach((b) => {
      const agente = getAgenteNombre(b)
      if (!acc[agente]) {
        acc[agente] = { agente, total: 0, visita: 0, cerradas: 0, activas: 0 }
      }
      acc[agente].total++
      if (b.estado === 'VISITA') acc[agente].visita++
      if (b.estado === 'CERRADO') acc[agente].cerradas++
      if (b.estado !== 'CERRADO' && b.estado !== 'PERDIDO') acc[agente].activas++
    })
    return Object.values(acc).sort((a, b) => b.total - a.total)
  }, [filtradas])

  const timeline = useMemo(
    () => [...filtradas].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 25),
    [filtradas]
  )

  if (loading) return <div className="text-center py-8">Cargando tablero...</div>
  if (!currentUser) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Tablero de Busquedas</h1>
        <Button variant="outline" onClick={() => router.push('/gestion')}>
          Ir a Gestion
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-5"><p className="text-xs text-slate-500">Total</p><p className="text-2xl font-bold">{kpis.total}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-slate-500">Activas</p><p className="text-2xl font-bold">{kpis.activas}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-slate-500">En visita</p><p className="text-2xl font-bold">{kpis.visita}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-slate-500">Cerradas</p><p className="text-2xl font-bold">{kpis.cerradas}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-slate-500">Perdidas</p><p className="text-2xl font-bold">{kpis.perdidas}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Seguimiento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={filtroAgente}
            onChange={(e) => setFiltroAgente(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md bg-white"
          >
            <option value="">Todos los agentes</option>
            {agentes.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md bg-white"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <Input
            placeholder="Buscar cliente / tipo / ubicacion"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance por Agente</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-3">Agente</th>
                <th className="text-left py-2 pr-3">Total</th>
                <th className="text-left py-2 pr-3">Activas</th>
                <th className="text-left py-2 pr-3">Visita</th>
                <th className="text-left py-2 pr-3">Cerradas</th>
              </tr>
            </thead>
            <tbody>
              {tableroAgentes.map((r) => (
                <tr key={r.agente} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{r.agente}</td>
                  <td className="py-2 pr-3">{r.total}</td>
                  <td className="py-2 pr-3">{r.activas}</td>
                  <td className="py-2 pr-3">{r.visita}</td>
                  <td className="py-2 pr-3">{r.cerradas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline de Ultimas Busquedas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {timeline.map((b) => (
            <div key={b.id} className="border border-slate-200 rounded-lg p-3 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{b.cliente?.nombreCompleto || 'Cliente'}</p>
                <span className="text-xs px-2 py-1 rounded bg-slate-100">{b.estado}</span>
              </div>
              <div className="text-sm text-slate-600 mt-1">
                <span className="mr-3">Agente: {getAgenteNombre(b)}</span>
                <span className="mr-3">Tipo: {b.tipoPropiedad || '-'}</span>
                <span>Presupuesto: {b.presupuestoTexto || '-'}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {new Date(b.createdAt).toLocaleString('es-AR')} - {b.ubicacionPreferida || 'Sin ubicacion'}
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/gestion?clienteId=${b.cliente?.id || ''}`)}
                >
                  Abrir gestion
                </Button>
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-sm text-slate-600">No hay busquedas con los filtros actuales.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
