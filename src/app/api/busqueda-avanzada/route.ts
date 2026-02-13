import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser()

        if (!currentUser) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const {
            provincia,
            ciudad,
            barrio,
            tipoPropiedad,
            precioDesde,
            precioHasta,
            moneda,
            dormitoriosMin,
            cochera,
            superficieMin,
            // Opcionales para guardar
            guardar,
            clienteId,
            mensajeWhatsApp
        } = body

        // Construir filtros
        const where: any = {
            estado: { in: ['APROBADA', 'BORRADOR', 'EN_ANALISIS'] }
            // Nota: No filtramos por inmobiliariaId para permitir búsqueda global como en el parser original
            // Si se requiere restringir, descomentar:
            // inmobiliariaId: currentUser.inmobiliariaId
        }

        const condicionesAND: any[] = []

        // 1. Ubicación (Barrio es prioritario)
        if (barrio) {
            condicionesAND.push({
                OR: [
                    { zona: { contains: barrio, mode: 'insensitive' } },
                    { ubicacion: { contains: barrio, mode: 'insensitive' } },
                    { localidad: { contains: barrio, mode: 'insensitive' } },
                    { direccion: { contains: barrio, mode: 'insensitive' } }
                ]
            })
        } else if (ciudad) {
            condicionesAND.push({
                OR: [
                    { localidad: { contains: ciudad, mode: 'insensitive' } },
                    { ubicacion: { contains: ciudad, mode: 'insensitive' } }
                ]
            })
        }

        // 2. Tipo de Propiedad
        if (tipoPropiedad && tipoPropiedad !== 'OTRO') {
            condicionesAND.push({
                tipo: { equals: tipoPropiedad, mode: 'insensitive' }
            })
        }

        // 3. Rango de Precio
        if (precioDesde || precioHasta) {
            const precioFilter: any = {}
            if (precioDesde) precioFilter.gte = parseFloat(precioDesde)
            if (precioHasta) precioFilter.lte = parseFloat(precioHasta)

            condicionesAND.push({
                precio: precioFilter,
                moneda: moneda || 'USD'
            })
        }

        // 4. Dormitorios
        if (dormitoriosMin) {
            const dorms = parseInt(dormitoriosMin)
            condicionesAND.push({
                OR: [
                    { dormitorios: { gte: dorms } },
                    // Permitir si ambientes es suficiente (aprox dorms + 1)
                    { ambientes: { gte: dorms + 1 } }
                ]
            })
        }

        // 5. Cochera
        if (cochera) {
            condicionesAND.push({
                OR: [
                    { cochera: true },
                    { descripcion: { contains: 'cochera', mode: 'insensitive' } },
                    { descripcion: { contains: 'garage', mode: 'insensitive' } },
                    { titulo: { contains: 'cochera', mode: 'insensitive' } }
                ]
            })
        }

        // 6. Superficie
        if (superficieMin) {
            condicionesAND.push({
                superficie: { gte: parseFloat(superficieMin) }
            })
        }

        if (condicionesAND.length > 0) {
            where.AND = condicionesAND
        }

        // Ejecutar búsqueda
        const propiedades = await prisma.propiedad.findMany({
            where,
            orderBy: { precio: 'asc' },
            take: 50,
            include: {
                inmobiliaria: {
                    select: {
                        nombre: true,
                        email: true,
                        whatsapp: true
                    }
                }
            }
        })

        // Guardar búsqueda si se solicitó
        let busquedaGuardada = null
        if (guardar && clienteId) {
            // Construir texto de presupuesto
            let presupuestoTexto = ''
            if (precioDesde && precioHasta) presupuestoTexto = `${moneda} ${precioDesde} - ${precioHasta}`
            else if (precioHasta) presupuestoTexto = `Hasta ${moneda} ${precioHasta}`
            else if (precioDesde) presupuestoTexto = `Desde ${moneda} ${precioDesde}`

            // Construir ubicación
            const ubicacionTexto = [barrio, ciudad, provincia].filter(Boolean).join(', ')

            // Construir observaciones
            let observaciones = `Búsqueda Avanzada\n`
            if (cochera) observaciones += `- Con cochera\n`
            if (superficieMin) observaciones += `- Superficie min: ${superficieMin} m2\n`
            if (mensajeWhatsApp) observaciones += `\n--- Mensaje original ---\n${mensajeWhatsApp}`

            busquedaGuardada = await prisma.busqueda.create({
                data: {
                    clienteId,
                    origen: 'PERSONALIZADA', // Usamos este origen para distinguir
                    tipoPropiedad: tipoPropiedad || 'OTRO',
                    presupuestoTexto: presupuestoTexto || null,
                    presupuestoValor: precioHasta ? parseFloat(precioHasta) : null,
                    moneda: moneda || 'USD',
                    ubicacionPreferida: ubicacionTexto,
                    dormitoriosMin: dormitoriosMin ? parseInt(dormitoriosMin) : null,
                    cochera: cochera ? 'SI' : 'NO',
                    observaciones,
                    estado: 'ACTIVA',
                    createdBy: currentUser.id
                }
            })
        }

        return NextResponse.json({
            success: true,
            propiedades,
            total: propiedades.length,
            busqueda: busquedaGuardada
        })

    } catch (error: any) {
        console.error('Error en búsqueda avanzada:', error)
        return NextResponse.json(
            { error: error.message || 'Error al procesar la búsqueda' },
            { status: 500 }
        )
    }
}
