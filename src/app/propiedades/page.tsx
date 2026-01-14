'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Propiedad {
  id: string
  tipo: string
  ubicacion: string
  localidad: string
  precio: string
  dormitorios: number
  link: string
  aptaCredito: boolean
  createdAt: string
}

export default function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [filtro, setFiltro] = useState('')
  const [soloAptaCredito, setSoloAptaCredito] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPropiedades()
  }, [soloAptaCredito])

  const fetchPropiedades = async () => {
    try {
      const url = soloAptaCredito
        ? '/api/propiedades?aptaCredito=true'
        : '/api/propiedades'
      const response = await fetch(url)
      const data = await response.json()
      setPropiedades(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtrados = propiedades.filter((p) =>
    p.ubicacion.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Propiedades</h1>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Buscar por ubicación..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={soloAptaCredito}
            onChange={(e) => setSoloAptaCredito(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700">Solo Apta a Crédito</span>
        </label>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ubicación</TableHead>
                <TableHead>Localidad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Dorms</TableHead>
                <TableHead className="text-center">Apta Crédito</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No hay propiedades
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((propiedad) => (
                  <TableRow key={propiedad.id}>
                    <TableCell className="font-medium">
                      {propiedad.ubicacion}
                    </TableCell>
                    <TableCell>{propiedad.localidad || '-'}</TableCell>
                    <TableCell>{propiedad.tipo}</TableCell>
                    <TableCell>{propiedad.precio || '-'}</TableCell>
                    <TableCell>{propiedad.dormitorios || '-'}</TableCell>
                    <TableCell className="text-center">
                      {propiedad.aptaCredito ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {propiedad.link && (
                        <a
                          href={propiedad.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver MLS
                        </a>
                      )}
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
