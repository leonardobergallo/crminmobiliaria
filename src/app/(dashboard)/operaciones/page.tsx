'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Operacion {
  id: string
  nro: number
  descripcion: string
  precioReal: number
  comisionTotal: number
  cliente: { nombreCompleto: string } | null
  createdAt: string
}

export default function OperacionesPage() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOperaciones()
  }, [])

  const fetchOperaciones = async () => {
    try {
      const response = await fetch('/api/operaciones')
      const data = await response.json()
      setOperaciones(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const comisionesPorMes: Record<string, number> = {}
  operaciones.forEach((op) => {
    const mes = new Date(op.createdAt).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    })
    comisionesPorMes[mes] = (comisionesPorMes[mes] || 0) + (op.comisionTotal || 0)
  })

  const comisionesTotal = operaciones.reduce(
    (sum, op) => sum + (op.comisionTotal || 0),
    0
  )

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Comisiones y Operaciones</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Operaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {operaciones.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Comisiones Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${comisionesTotal.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Promedio por Operación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${Math.round(comisionesTotal / (operaciones.length || 1)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comisiones por mes */}
      {Object.keys(comisionesPorMes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comisiones por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(comisionesPorMes).map(([mes, monto]) => (
                <div key={mes}>
                  <div className="flex justify-between mb-2">
                    <span>{mes}</span>
                    <span className="font-semibold">${monto.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((monto / comisionesTotal) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de operaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Operaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Precio Real</TableHead>
                <TableHead className="text-right">Comisión Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No hay operaciones
                  </TableCell>
                </TableRow>
              ) : (
                operaciones.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-semibold">{op.nro || '-'}</TableCell>
                    <TableCell>{op.descripcion}</TableCell>
                    <TableCell>{op.cliente?.nombreCompleto || '-'}</TableCell>
                    <TableCell className="text-right">
                      ${op.precioReal?.toLocaleString() || '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ${op.comisionTotal?.toLocaleString() || '0'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
