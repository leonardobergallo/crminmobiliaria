'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FiltrosAvanzadosProps {
    onBuscar: (filtros: FiltrosBusqueda) => void
    loading?: boolean
    valoresIniciales?: Partial<FiltrosBusqueda>
}

export interface FiltrosBusqueda {
    provincia: string
    ciudad: string
    barrio: string
    tipoPropiedad: string
    precioDesde: string
    precioHasta: string
    moneda: string
    dormitoriosMin: string
    cochera: boolean
    superficieMin: string
}

const PROVINCIAS = [
    'Santa Fe',
    'Buenos Aires',
    'Córdoba',
    'Mendoza',
]

const CIUDADES_POR_PROVINCIA: Record<string, string[]> = {
    'Santa Fe': ['Santa Fe Capital', 'Rosario', 'Rafaela', 'Venado Tuerto'],
    'Buenos Aires': ['CABA', 'La Plata', 'Mar del Plata'],
}

const BARRIOS_SANTA_FE: string[] = [
    'Candioti',
    'Candioti Sur',
    'Candioti Norte',
    'Centro',
    'Barrio Sur',
    'Barrio Norte',
    'Guadalupe',
    'Guadalupe Este',
    'Guadalupe Oeste',
    '7 Jefes',
    'Bulevar',
    'Constituyentes',
    'Recoleta',
    'Mayoraz',
    'Roma',
    'Las Flores',
    'Fomento 9 de Julio',
    'Barranquitas',
    'Los Hornos',
    'Ciudadela',
    'San Martín',
    'Puerto',
    'Costanera',
    'Villa Setubal',
]

const TIPOS_PROPIEDAD = [
    'CASA',
    'DEPARTAMENTO',
    'TERRENO',
    'PH',
    'LOCAL',
    'OFICINA',
    'COCHERA',
    'OTRO',
]

export default function FiltrosAvanzados({ onBuscar, loading = false, valoresIniciales }: FiltrosAvanzadosProps) {
    const [filtros, setFiltros] = useState<FiltrosBusqueda>({
        provincia: 'Santa Fe',
        ciudad: 'Santa Fe Capital',
        barrio: '',
        tipoPropiedad: '',
        precioDesde: '',
        precioHasta: '',
        moneda: 'USD',
        dormitoriosMin: '',
        cochera: false,
        superficieMin: '',
    })

    // Sincronizar con valores externos si cambian
    useEffect(() => {
        if (valoresIniciales) {
            setFiltros(prev => ({
                ...prev,
                ...valoresIniciales
            }))
        }
    }, [valoresIniciales])

    const [mostrarMasFiltros, setMostrarMasFiltros] = useState(false)

    const ciudades = CIUDADES_POR_PROVINCIA[filtros.provincia] || []
    const barrios = filtros.ciudad === 'Santa Fe Capital' ? BARRIOS_SANTA_FE : []

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validar que tenga al menos barrio o tipo de propiedad
        if (!filtros.barrio && !filtros.tipoPropiedad) {
            alert('Por favor seleccioná al menos un barrio o tipo de propiedad')
            return
        }

        onBuscar(filtros)
    }

    const actualizarFiltro = (campo: keyof FiltrosBusqueda, valor: any) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor,
            // Si cambia provincia, resetear ciudad y barrio
            ...(campo === 'provincia' ? { ciudad: '', barrio: '' } : {}),
            // Si cambia ciudad, resetear barrio
            ...(campo === 'ciudad' ? { barrio: '' } : {}),
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                🎛️ Filtros de Búsqueda
            </h3>

            {/* UBICACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">
                        📍 Provincia
                    </label>
                    <select
                        value={filtros.provincia}
                        onChange={(e) => actualizarFiltro('provincia', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {PROVINCIAS.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">
                        🏙️ Ciudad
                    </label>
                    <select
                        value={filtros.ciudad}
                        onChange={(e) => actualizarFiltro('ciudad', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!ciudades.length}
                    >
                        <option value="">Seleccionar ciudad</option>
                        {ciudades.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">
                        🏘️ Barrio <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={filtros.barrio}
                        onChange={(e) => actualizarFiltro('barrio', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!barrios.length}
                    >
                        <option value="">Seleccionar barrio</option>
                        {barrios.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* CARACTERÍSTICAS BÁSICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">
                        🏠 Tipo de Propiedad
                    </label>
                    <select
                        value={filtros.tipoPropiedad}
                        onChange={(e) => actualizarFiltro('tipoPropiedad', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Cualquier tipo</option>
                        {TIPOS_PROPIEDAD.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700">
                        🛏️ Dormitorios Mínimo
                    </label>
                    <select
                        value={filtros.dormitoriosMin}
                        onChange={(e) => actualizarFiltro('dormitoriosMin', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Cualquier cantidad</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                </div>
            </div>

            {/* PRECIO */}
            <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">
                    💰 Rango de Precio
                </label>
                <div className="flex gap-3 items-center">
                    <div className="flex gap-2 items-center">
                        <input
                            type="radio"
                            id="usd"
                            name="moneda"
                            value="USD"
                            checked={filtros.moneda === 'USD'}
                            onChange={(e) => actualizarFiltro('moneda', e.target.value)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="usd" className="text-sm">USD</label>
                    </div>
                    <div className="flex gap-2 items-center">
                        <input
                            type="radio"
                            id="ars"
                            name="moneda"
                            value="ARS"
                            checked={filtros.moneda === 'ARS'}
                            onChange={(e) => actualizarFiltro('moneda', e.target.value)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="ars" className="text-sm">ARS</label>
                    </div>
                </div>
                <div className="mt-2 flex gap-3 items-center">
                    <Input
                        type="number"
                        placeholder="Desde"
                        value={filtros.precioDesde}
                        onChange={(e) => actualizarFiltro('precioDesde', e.target.value)}
                        className="flex-1"
                    />
                    <span className="text-slate-500">—</span>
                    <Input
                        type="number"
                        placeholder="Hasta"
                        value={filtros.precioHasta}
                        onChange={(e) => actualizarFiltro('precioHasta', e.target.value)}
                        className="flex-1"
                    />
                </div>
            </div>

            {/* FILTROS ADICIONALES (COLAPSABLE) */}
            <div>
                <button
                    type="button"
                    onClick={() => setMostrarMasFiltros(!mostrarMasFiltros)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                    {mostrarMasFiltros ? '▼' : '▶'} Más filtros
                </button>

                {mostrarMasFiltros && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700">
                                📐 Superficie Mínima (m²)
                            </label>
                            <Input
                                type="number"
                                placeholder="Ej: 50"
                                value={filtros.superficieMin}
                                onChange={(e) => actualizarFiltro('superficieMin', e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filtros.cochera}
                                    onChange={(e) => actualizarFiltro('cochera', e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm font-medium text-slate-700">🚗 Con cochera</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTÓN DE BÚSQUEDA */}
            <div className="flex gap-3 pt-2">
                <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium h-11"
                >
                    {loading ? '⏳ Buscando...' : '🔍 Buscar Propiedades'}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFiltros({
                        provincia: 'Santa Fe',
                        ciudad: 'Santa Fe Capital',
                        barrio: '',
                        tipoPropiedad: '',
                        precioDesde: '',
                        precioHasta: '',
                        moneda: 'USD',
                        dormitoriosMin: '',
                        cochera: false,
                        superficieMin: '',
                    })}
                    className="h-11"
                >
                    🗑️ Limpiar
                </Button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
                <span className="text-red-500">*</span> Barrio o tipo de propiedad son obligatorios
            </p>
        </form>
    )
}
