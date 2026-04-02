'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AgentRow {
  agente: string
  total: number
  activas: number
  visitas: number
  cerradas: number
  perdidas: number
}

interface PanelStats {
  total: number
  activas: number
  nuevas: number
  visitas: number
  cerradas: number
  perdidas: number
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [agentes, setAgentes] = useState<AgentRow[]>([])
  const [stats, setStats] = useState<PanelStats>({ total: 0, activas: 0, nuevas: 0, visitas: 0, cerradas: 0, perdidas: 0 })

  useEffect(() => {
    checkAdminAndFetch()
    // Refrescar cada 60 segundos
    const interval = setInterval(checkAdminAndFetch, 60000)
    return () => clearInterval(interval)
  }, [])

  const checkAdminAndFetch = async () => {
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) { setLoading(false); return }
      const userData = await userRes.json()
      const rol = userData?.user?.rol
      if (rol !== 'admin' && rol !== 'superadmin') {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      setIsAdmin(true)

      const busquedasRes = await fetch('/api/busquedas')
      if (!busquedasRes.ok) { setLoading(false); return }
      const busquedas = await busquedasRes.json()
      if (!Array.isArray(busquedas)) { setLoading(false); return }

      // Compute stats
      const total = busquedas.length
      const activas = busquedas.filter((b: any) => !['CERRADO', 'PERDIDO'].includes(b.estado)).length
      const nuevas = busquedas.filter((b: any) => b.estado === 'NUEVO').length
      const visitas = busquedas.filter((b: any) => b.estado === 'VISITA').length
      const cerradas = busquedas.filter((b: any) => b.estado === 'CERRADO').length
      const perdidas = busquedas.filter((b: any) => b.estado === 'PERDIDO').length
      setStats({ total, activas, nuevas, visitas, cerradas, perdidas })

      // Compute agent rows
      const agenteMap: Record<string, AgentRow> = {}
      busquedas.forEach((b: any) => {
        const nombre = b.usuario?.nombre || b.cliente?.usuario?.nombre || 'Sin asignar'
        if (!agenteMap[nombre]) {
          agenteMap[nombre] = { agente: nombre, total: 0, activas: 0, visitas: 0, cerradas: 0, perdidas: 0 }
        }
        agenteMap[nombre].total++
        if (!['CERRADO', 'PERDIDO'].includes(b.estado)) agenteMap[nombre].activas++
        if (b.estado === 'VISITA') agenteMap[nombre].visitas++
        if (b.estado === 'CERRADO') agenteMap[nombre].cerradas++
        if (b.estado === 'PERDIDO') agenteMap[nombre].perdidas++
      })
      setAgentes(Object.values(agenteMap).sort((a, b) => b.total - a.total))
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin || loading) return null

  const maxTotal = Math.max(...agentes.map(r => r.total), 1)

  const miniKpis = [
    { label: 'Total', value: stats.total, color: 'text-blue-700', bg: 'bg-blue-100' },
    { label: 'Activas', value: stats.activas, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Nuevas', value: stats.nuevas, color: 'text-violet-700', bg: 'bg-violet-100' },
    { label: 'Visita', value: stats.visitas, color: 'text-amber-700', bg: 'bg-amber-100' },
    { label: 'Cerradas', value: stats.cerradas, color: 'text-sky-700', bg: 'bg-sky-100' },
    { label: 'Perdidas', value: stats.perdidas, color: 'text-red-600', bg: 'bg-red-100' },
  ]

  return (
    <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm mb-6 animate-fade-in-up">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm shadow-sm">📊</span>
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Centro de Control</CardTitle>
              <p className="text-[11px] text-slate-400 mt-0.5">Seguimiento en tiempo real · {agentes.length} agente{agentes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => checkAdminAndFetch()}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Actualizar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title={collapsed ? 'Expandir' : 'Colapsar'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
        {/* Mini KPIs - siempre visibles */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {miniKpis.map(kpi => (
            <span key={kpi.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${kpi.bg} text-xs font-semibold ${kpi.color}`}>
              {kpi.label}: {kpi.value}
            </span>
          ))}
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-2 pb-4 px-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="text-left py-2 pr-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Agente</th>
                  <th className="text-center py-2 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="text-center py-2 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Activas</th>
                  <th className="text-center py-2 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Visita</th>
                  <th className="text-center py-2 px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cerradas</th>
                  <th className="text-left py-2 pl-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider min-w-[100px]">Carga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agentes.map(row => {
                  const pct = Math.round((row.total / maxTotal) * 100)
                  return (
                    <tr key={row.agente} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-[10px] font-bold shadow-sm">
                            {row.agente.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium text-slate-800 text-xs">{row.agente}</span>
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">{row.total}</span>
                      </td>
                      <td className="text-center py-2 px-2">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">{row.activas}</span>
                      </td>
                      <td className="text-center py-2 px-2">
                        <span className={`inline-flex items-center justify-center min-w-[24px] h-6 rounded-full text-[11px] font-bold ${
                          row.visitas > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-300'
                        }`}>{row.visitas}</span>
                      </td>
                      <td className="text-center py-2 px-2">
                        <span className={`inline-flex items-center justify-center min-w-[24px] h-6 rounded-full text-[11px] font-bold ${
                          row.cerradas > 0 ? 'bg-sky-50 text-sky-700' : 'bg-slate-50 text-slate-300'
                        }`}>{row.cerradas}</span>
                      </td>
                      <td className="py-2 pl-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium w-6 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {agentes.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-100">
                    <td className="py-2 pr-3 font-semibold text-slate-600 text-xs">Total</td>
                    <td className="text-center py-2 px-2 font-bold text-slate-800 text-xs">{agentes.reduce((s, r) => s + r.total, 0)}</td>
                    <td className="text-center py-2 px-2 font-bold text-emerald-700 text-xs">{agentes.reduce((s, r) => s + r.activas, 0)}</td>
                    <td className="text-center py-2 px-2 font-bold text-amber-700 text-xs">{agentes.reduce((s, r) => s + r.visitas, 0)}</td>
                    <td className="text-center py-2 px-2 font-bold text-sky-700 text-xs">{agentes.reduce((s, r) => s + r.cerradas, 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
