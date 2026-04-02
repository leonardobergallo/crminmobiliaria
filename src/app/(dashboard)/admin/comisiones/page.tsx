'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Operacion {
  id: string
  nro: number | null
  descripcion: string
  direccion: string | null
  precioVenta: number | null
  tipoPunta: 'UNA' | 'DOS'
  porcentajeComision: number | null
  comisionBruta: number | null
  porcentajeAgente: number | null
  comisionAgente: number | null
  estado: 'PENDIENTE' | 'COBRADA' | 'CANCELADA'
  fechaOperacion: string
  fechaCobro: string | null
  observaciones: string | null
  cliente: { nombreCompleto: string } | null
  usuario: { nombre: string } | null
}

interface Inmobiliaria {
  id: string
  nombre: string
  comisionVenta: number
  comisionAgente: number
}

interface CurrentUser {
  id: string
  nombre: string
  rol: string
  inmobiliariaId: string | null
}

const estadoBadge: Record<string, string> = {
  COBRADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
  PENDIENTE: 'bg-amber-100 text-amber-700',
}

export default function AdminComisionesPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [inmobiliaria, setInmobiliaria] = useState<Inmobiliaria | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // Editable commission config
  const [comisionVentaEdit, setComisionVentaEdit] = useState('')
  const [comisionAgenteEdit, setComisionAgenteEdit] = useState('')

  // Filters
  const [filtroAgente, setFiltroAgente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTexto, setFiltroTexto] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) { router.replace('/login'); return }
        const meData = await meRes.json()
        const user = meData.user as CurrentUser
      if (user.rol !== 'admin' && user.rol !== 'superadmin') {
        router.replace('/dashboard')
        return
      }
      setCurrentUser(user)

      // Fetch operaciones + inmobiliaria config in parallel
      const [opsRes, inmoRes] = await Promise.all([
        fetch('/api/operaciones'),
        user.inmobiliariaId ? fetch(`/api/inmobiliarias/${user.inmobiliariaId}`) : null,
      ])

      if (opsRes.ok) {
        const data = await opsRes.json()
        setOperaciones(Array.isArray(data) ? data : [])
      }

      if (inmoRes?.ok) {
        const data = await inmoRes.json()
        setInmobiliaria(data)
        setComisionVentaEdit(String(data.comisionVenta ?? 3))
        setComisionAgenteEdit(String(data.comisionAgente ?? 50))
      }
    } finally {
      setLoading(false)
    }
  }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save commission config
  const handleSaveConfig = async () => {
    if (!inmobiliaria) return
    setSavingConfig(true)
    setConfigSaved(false)
    try {
      const res = await fetch(`/api/inmobiliarias/${inmobiliaria.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comisionVenta: parseFloat(comisionVentaEdit) || 3,
          comisionAgente: parseFloat(comisionAgenteEdit) || 50,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setInmobiliaria(data)
        setConfigSaved(true)
        setTimeout(() => setConfigSaved(false), 3000)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err?.error || 'Error al guardar configuración')
      }
    } finally {
      setSavingConfig(false)
    }
  }

  // Derived data
  const agentes = useMemo(() => {
    const set = new Set(operaciones.map((op) => op.usuario?.nombre || 'Sin asignar'))
    return Array.from(set).sort()
  }, [operaciones])

  const filtradas = useMemo(() => {
    return operaciones.filter((op) => {
      const agente = op.usuario?.nombre || 'Sin asignar'
      if (filtroAgente && agente !== filtroAgente) return false
      if (filtroEstado && op.estado !== filtroEstado) return false
      if (filtroTexto) {
        const txt = `${op.descripcion} ${op.cliente?.nombreCompleto || ''} ${op.direccion || ''}`.toLowerCase()
        if (!txt.includes(filtroTexto.toLowerCase())) return false
      }
      return true
    })
  }, [operaciones, filtroAgente, filtroEstado, filtroTexto])

  // KPIs
  const kpis = useMemo(() => {
    const totalBruta = filtradas.reduce((s, o) => s + (o.comisionBruta || 0), 0)
    const totalAgente = filtradas.reduce((s, o) => s + (o.comisionAgente || 0), 0)
    const totalInmobiliaria = totalBruta - totalAgente
    const cobradas = filtradas.filter((o) => o.estado === 'COBRADA')
    const pendientes = filtradas.filter((o) => o.estado === 'PENDIENTE')
    const cobradasBruta = cobradas.reduce((s, o) => s + (o.comisionBruta || 0), 0)
    const pendientesBruta = pendientes.reduce((s, o) => s + (o.comisionBruta || 0), 0)
    return {
      total: filtradas.length,
      cobradas: cobradas.length,
      pendientes: pendientes.length,
      canceladas: filtradas.filter((o) => o.estado === 'CANCELADA').length,
      totalBruta,
      totalAgente,
      totalInmobiliaria,
      cobradasBruta,
      pendientesBruta,
    }
  }, [filtradas])

  // Agent performance
  const agentPerf = useMemo(() => {
    const acc: Record<string, { agente: string; ops: number; bruta: number; agentePart: number; inmoPart: number; cobradas: number; pendientes: number }> = {}
    filtradas.forEach((op) => {
      const agente = op.usuario?.nombre || 'Sin asignar'
      if (!acc[agente]) acc[agente] = { agente, ops: 0, bruta: 0, agentePart: 0, inmoPart: 0, cobradas: 0, pendientes: 0 }
      acc[agente].ops++
      acc[agente].bruta += op.comisionBruta || 0
      acc[agente].agentePart += op.comisionAgente || 0
      acc[agente].inmoPart += (op.comisionBruta || 0) - (op.comisionAgente || 0)
      if (op.estado === 'COBRADA') acc[agente].cobradas++
      if (op.estado === 'PENDIENTE') acc[agente].pendientes++
    })
    return Object.values(acc).sort((a, b) => b.bruta - a.bruta)
  }, [filtradas])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Control de Comisiones</h1>
          <p className="text-slate-500 mt-1">Panel administrativo de operaciones y porcentajes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/tablero-busquedas')}>
            Tablero Búsquedas
          </Button>
          <Button variant="outline" onClick={() => router.push('/operaciones')}>
            Mis Operaciones
          </Button>
        </div>
      </div>

      {/* Commission Config Card */}
      {inmobiliaria && (
        <Card className="border-violet-200 bg-gradient-to-r from-violet-50 via-white to-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Configuración de Comisiones</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{inmobiliaria.nombre}</p>
                </div>
              </div>
              {configSaved && (
                <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium animate-fade-in-up">
                  ✓ Guardado
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  % Comisión sobre Venta
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={comisionVentaEdit}
                    onChange={(e) => setComisionVentaEdit(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">1 Punta = {comisionVentaEdit}% · 2 Puntas = {(parseFloat(comisionVentaEdit) * 2 || 0).toFixed(1)}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  % que recibe el Agente
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={comisionAgenteEdit}
                    onChange={(e) => setComisionAgenteEdit(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Inmobiliaria retiene: {(100 - (parseFloat(comisionAgenteEdit) || 0)).toFixed(0)}%</p>
              </div>
              <Button onClick={handleSaveConfig} disabled={savingConfig} className="bg-violet-600 hover:bg-violet-700">
                {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>

            {/* Visual preview */}
            <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-2">Vista previa: Venta de $100.000 USD (1 Punta)</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-slate-400">Comisión</div>
                  <div className="text-lg font-bold text-blue-600">${((parseFloat(comisionVentaEdit) || 0) / 100 * 100000).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Agente ({comisionAgenteEdit}%)</div>
                  <div className="text-lg font-bold text-green-600">${((parseFloat(comisionVentaEdit) || 0) / 100 * 100000 * (parseFloat(comisionAgenteEdit) || 0) / 100).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Inmobiliaria ({(100 - (parseFloat(comisionAgenteEdit) || 0)).toFixed(0)}%)</div>
                  <div className="text-lg font-bold text-slate-600">${((parseFloat(comisionVentaEdit) || 0) / 100 * 100000 * (100 - (parseFloat(comisionAgenteEdit) || 0)) / 100).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Operaciones', value: kpis.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Cobradas', value: kpis.cobradas, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pendientes', value: kpis.pendientes, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Comisión Total', value: `$${kpis.totalBruta.toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Agentes', value: `$${kpis.totalAgente.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inmobiliaria', value: `$${kpis.totalInmobiliaria.toLocaleString()}`, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-sm">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color} mt-0.5`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cobrado vs Pendiente visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700/70 font-medium">Comisiones Cobradas</p>
                <p className="text-3xl font-bold text-green-600 mt-1">${kpis.cobradasBruta.toLocaleString()}</p>
                <p className="text-xs text-green-500 mt-1">{kpis.cobradas} operaciones cobradas</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700/70 font-medium">Comisiones Pendientes</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">${kpis.pendientesBruta.toLocaleString()}</p>
                <p className="text-xs text-amber-500 mt-1">{kpis.pendientes} operaciones pendientes</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Rendimiento por Agente</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2.5 pr-3 font-semibold text-slate-600">Agente</th>
                <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Ops</th>
                <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Cobradas</th>
                <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Pendientes</th>
                <th className="text-right py-2.5 px-2 font-semibold text-slate-600">Comisión Bruta</th>
                <th className="text-right py-2.5 px-2 font-semibold text-slate-600">Parte Agente</th>
                <th className="text-right py-2.5 pl-2 font-semibold text-slate-600">Parte Inmo</th>
              </tr>
            </thead>
            <tbody>
              {agentPerf.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Sin operaciones registradas</td></tr>
              ) : (
                agentPerf.map((r, i) => (
                  <tr key={r.agente} className={`border-b border-slate-100 ${i === 0 ? 'bg-violet-50/30' : ''}`}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {r.agente.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{r.agente}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-medium">{r.ops}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{r.cobradas}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{r.pendientes}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-blue-600">${r.bruta.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-green-600">${r.agentePart.toLocaleString()}</td>
                    <td className="py-2.5 pl-2 text-right font-semibold text-violet-600">${r.inmoPart.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            {agentPerf.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-bold">
                  <td className="py-3 pr-3 text-slate-800">TOTAL</td>
                  <td className="py-3 px-2 text-center">{kpis.total}</td>
                  <td className="py-3 px-2 text-center text-green-700">{kpis.cobradas}</td>
                  <td className="py-3 px-2 text-center text-amber-700">{kpis.pendientes}</td>
                  <td className="py-3 px-2 text-right text-blue-600">${kpis.totalBruta.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-green-600">${kpis.totalAgente.toLocaleString()}</td>
                  <td className="py-3 pl-2 text-right text-violet-600">${kpis.totalInmobiliaria.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>

      {/* Filters + Operaciones Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-lg">Historial de Operaciones</CardTitle>
            <div className="flex flex-wrap gap-2">
              <select
                value={filtroAgente}
                onChange={(e) => setFiltroAgente(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm"
              >
                <option value="">Todos los agentes</option>
                {agentes.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="COBRADA">Cobrada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
              <Input
                placeholder="Buscar..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-40 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left py-2.5 pl-4 pr-2 font-semibold text-slate-600">#</th>
                <th className="text-left py-2.5 px-2 font-semibold text-slate-600">Agente</th>
                <th className="text-left py-2.5 px-2 font-semibold text-slate-600">Descripción</th>
                <th className="text-left py-2.5 px-2 font-semibold text-slate-600">Cliente</th>
                <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Puntas</th>
                <th className="text-right py-2.5 px-2 font-semibold text-slate-600">Precio</th>
                <th className="text-right py-2.5 px-2 font-semibold text-slate-600">Comisión</th>
                <th className="text-right py-2.5 px-2 font-semibold text-slate-600">Agente</th>
                <th className="text-right py-2.5 px-2 font-semibold text-slate-600">Inmo</th>
                <th className="text-center py-2.5 px-2 font-semibold text-slate-600">Estado</th>
                <th className="text-left py-2.5 pl-2 pr-4 font-semibold text-slate-600">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-slate-400">Sin operaciones</td></tr>
              ) : (
                filtradas.map((op) => {
                  const inmo = (op.comisionBruta || 0) - (op.comisionAgente || 0)
                  return (
                    <tr key={op.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 pl-4 pr-2 font-mono text-slate-500">{op.nro || '-'}</td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {(op.usuario?.nombre || '?').charAt(0)}
                          </span>
                          <span className="text-slate-700 truncate max-w-[100px]">{op.usuario?.nombre || '-'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-2 max-w-[160px]">
                        <div className="font-medium text-slate-800 truncate">{op.descripcion}</div>
                        {op.direccion && <div className="text-xs text-slate-400 truncate">{op.direccion}</div>}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 truncate max-w-[120px]">{op.cliente?.nombreCompleto || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${op.tipoPunta === 'DOS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {op.tipoPunta === 'DOS' ? '2P' : '1P'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">${op.precioVenta?.toLocaleString() || '-'}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-blue-600">${op.comisionBruta?.toLocaleString() || '0'}</td>
                      <td className="py-2.5 px-2 text-right text-green-600">${op.comisionAgente?.toLocaleString() || '0'}</td>
                      <td className="py-2.5 px-2 text-right text-violet-600">${inmo.toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[op.estado] || 'bg-slate-100 text-slate-600'}`}>
                          {op.estado}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-xs text-slate-500">
                        {new Date(op.fechaOperacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
