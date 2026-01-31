export interface BusquedaWithRelations {
  id: string
  createdBy?: string | null
  cliente?: {
    usuarioId?: string | null
  } | null
}

export interface PropiedadWithRelations {
  id: string
  usuarioId?: string | null
  estado?: string
}

/**
 * Verifica si un usuario puede ver una búsqueda
 */
export function canViewBusqueda(
  user: { id: string; rol: string } | null,
  busqueda: BusquedaWithRelations
): boolean {
  if (!user) return false
  
  // Admin puede ver todas
  if (user.rol === 'admin') return true
  
  // Agente solo puede ver las que creó o de sus clientes
  if (user.rol === 'agente') {
    return (
      busqueda.createdBy === user.id ||
      busqueda.cliente?.usuarioId === user.id
    )
  }
  
  return false
}

/**
 * Verifica si un usuario puede editar una búsqueda
 */
export function canEditBusqueda(
  user: { id: string; rol: string } | null,
  busqueda: BusquedaWithRelations
): boolean {
  if (!user) return false
  
  // Admin puede editar todas
  if (user.rol === 'admin') return true
  
  // Agente solo puede editar las que creó o de sus clientes
  if (user.rol === 'agente') {
    return (
      busqueda.createdBy === user.id ||
      busqueda.cliente?.usuarioId === user.id
    )
  }
  
  return false
}

/**
 * Verifica si un usuario puede cambiar el estado de una búsqueda
 */
export function canChangeBusquedaEstado(
  user: { id: string; rol: string } | null
): boolean {
  if (!user) return false
  
  // Solo admin puede cambiar estados avanzados
  return user.rol === 'admin'
}

/**
 * Verifica si un usuario puede ver una propiedad
 */
export function canViewPropiedad(
  user: { id: string; rol: string } | null,
  propiedad: PropiedadWithRelations
): boolean {
  if (!user) return false
  
  // Admin puede ver todas
  if (user.rol === 'admin') return true
  
  // Agente solo puede ver las suyas
  if (user.rol === 'agente') {
    return propiedad.usuarioId === user.id
  }
  
  return false
}

/**
 * Verifica si un usuario puede editar una propiedad
 */
export function canEditPropiedad(
  user: { id: string; rol: string } | null,
  propiedad: PropiedadWithRelations
): boolean {
  if (!user) return false
  
  // Admin puede editar todas
  if (user.rol === 'admin') return true
  
  // Agente solo puede editar sus propias propiedades
  if (user.rol === 'agente') {
    if (propiedad.usuarioId !== user.id) return false
    
    // Agente solo puede editar propiedades en estado BORRADOR
    return propiedad.estado === 'BORRADOR' || !propiedad.estado
  }
  
  return false
}

/**
 * Verifica si un usuario puede cambiar el estado de una propiedad
 */
export function canChangePropiedadEstado(
  user: { id: string; rol: string } | null
): boolean {
  if (!user) return false
  
  // Solo admin puede cambiar estados
  return user.rol === 'admin'
}
