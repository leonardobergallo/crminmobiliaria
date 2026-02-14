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

    return null

}
