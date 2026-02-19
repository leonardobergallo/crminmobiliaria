'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import UserSelector from './UserSelector'

interface CurrentUser {
  id: string;
  nombre: string;
  rol: string;
  inmobiliariaId: string | null;
}

interface Inmobiliaria {
  id: string;
  nombre: string;
  colorPrimario: string | null;
}

// SVG Icons Component
const Icons = {
  home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  gestion: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  ),
  clientes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  busquedas: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  parsear: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  ),
  matches: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  propiedades: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  carga: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  agenda: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  comisiones: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  importar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  agentes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  usuarios: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  inmobiliarias: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
      <line x1="9" y1="6" x2="9" y2="6.01"></line>
      <line x1="15" y1="6" x2="15" y2="6.01"></line>
      <line x1="9" y1="10" x2="9" y2="10.01"></line>
      <line x1="15" y1="10" x2="15" y2="10.01"></line>
      <line x1="9" y1="14" x2="9" y2="14.01"></line>
      <line x1="15" y1="14" x2="15" y2="14.01"></line>
      <line x1="9" y1="18" x2="15" y2="18"></line>
    </svg>
  ),
  logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
}

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [inmobiliarias, setInmobiliarias] = useState<Inmobiliaria[]>([])
  const [selectedInmobiliaria, setSelectedInmobiliaria] = useState<string | null>(null)
  const [inmobiliariaNombre, setInmobiliariaNombre] = useState<string>('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setCurrentUser(data.user)
          
          if (data.user.rol === 'superadmin') {
            const inmobRes = await fetch('/api/inmobiliarias')
            if (inmobRes.ok) {
              const inmobData = await inmobRes.json()
              setInmobiliarias(inmobData)
            }
          } else if (data.user.inmobiliariaId) {
            const inmobRes = await fetch(`/api/inmobiliarias/${data.user.inmobiliariaId}`)
            if (inmobRes.ok) {
              const inmobData = await inmobRes.json()
              setInmobiliariaNombre(inmobData.nombre)
            }
          }
        }
      } catch {
        // No autenticado
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('selectedUserId')
      localStorage.removeItem('currentUser')
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Icons.home, description: 'Vista general de métricas y KPIs' },
    { href: '/gestion', label: 'Gestión Cliente', icon: Icons.gestion, description: 'Seguimiento completo del cliente' },
    { href: '/clientes', label: 'Clientes', icon: Icons.clientes, description: 'Base de datos de clientes' },
    { href: '/busquedas', label: 'Búsquedas', icon: Icons.busquedas, description: 'Requerimientos de clientes' },
    { href: '/parsear', label: 'Búsqueda Inteligente', icon: Icons.parsear, description: 'Buscar propiedades con analisis inteligente' },
    { href: '/ultima-web', label: 'Última Búsqueda Web', icon: Icons.matches, description: 'Último análisis web guardado' },
    { href: '/matches', label: 'Matches', icon: Icons.matches, description: 'Propiedades que coinciden' },
    { href: '/propiedades', label: 'Propiedades', icon: Icons.propiedades, description: 'Inventario de propiedades' },
    { href: '/carga-rapida', label: 'Carga Rápida', icon: Icons.carga, description: 'Agregar propiedades rápido' },
    { href: '/tareas', label: 'Agenda / Tareas', icon: Icons.agenda, description: 'Visitas y recordatorios' },
    { href: '/operaciones', label: 'Comisiones', icon: Icons.comisiones, description: 'Seguimiento de ventas' },
    { href: '/importar', label: 'Importar', icon: Icons.importar, description: 'Importar desde Excel' },
    { href: '/agentes', label: 'Agentes', icon: Icons.agentes, description: 'Equipo de trabajo' },
  ]

  const adminLinks = [
    { href: '/admin/tablero-busquedas', label: 'Tablero Búsq.', icon: Icons.busquedas, description: 'Seguimiento de agentes' },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Icons.usuarios, description: 'Gestionar accesos' },
  ]

  const superadminLinks = [
    { href: '/admin/tablero-busquedas', label: 'Tablero Búsq.', icon: Icons.busquedas, description: 'Seguimiento de agentes' },
    { href: '/admin/inmobiliarias', label: 'Inmobiliarias', icon: Icons.inmobiliarias, description: 'Gestionar inmobiliarias' },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Icons.usuarios, description: 'Gestionar accesos' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className=" whitespace-nowrap">
            <h1 className="text-lg font-bold text-slate-800">CRM</h1>
            <p className="text-xs text-slate-500 -mt-0.5">Inmobiliario</p>
          </div>
        </div>
      </div>

      {/* Inmobiliaria Selector (for superadmin) */}
      {currentUser?.rol === 'superadmin' && (
        <div className="px-3 py-2 border-b border-slate-100 ">
          <select
            value={selectedInmobiliaria || ''}
            onChange={(e) => setSelectedInmobiliaria(e.target.value || null)}
            className="w-full bg-slate-50 text-slate-700 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="">🌐 Todas las inmobiliarias</option>
            {inmobiliarias.map((inm) => (
              <option key={inm.id} value={inm.id}>
                {inm.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* User Selector */}
      <div className="px-2 py-2 border-b border-slate-100">
        {currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin' ? (
          <UserSelector />
        ) : (
          <div className="w-full px-3 py-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser?.nombre?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.nombre || 'Usuario'}</p>
              <p className="text-[11px] text-slate-500 capitalize">{currentUser?.rol || 'agente'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          const IconComponent = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.description}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/link relative',
                isActive
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span className={cn(
                "flex-shrink-0 transition-transform duration-200",
                !isActive && "group-hover/link:scale-110"
              )}>
                <IconComponent />
              </span>
              <div className="flex flex-col whitespace-nowrap ">
                <span className="text-sm font-medium">
                  {link.label}
                </span>
                <span className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "text-sky-100" : "text-slate-400"
                )}>
                  {link.description}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Admin Section */}
      {(currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin') && (
        <div className="px-2 py-3 border-t border-slate-100">
          <p className="px-3 text-[10px] text-slate-400 uppercase tracking-wider mb-2 ">
            {currentUser.rol === 'superadmin' ? 'Super Admin' : 'Administración'}
          </p>
          <nav className="space-y-1">
            {(currentUser.rol === 'superadmin' ? superadminLinks : adminLinks).map((link) => {
              const isActive = pathname === link.href
              const IconComponent = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.description}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/link',
                    isActive
                      ? 'bg-violet-500 text-white shadow-lg shadow-violet-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <span className={cn(
                    "flex-shrink-0 transition-transform duration-200",
                    !isActive && "group-hover/link:scale-110"
                  )}>
                    <IconComponent />
                  </span>
                  <div className="flex flex-col whitespace-nowrap ">
                    <span className="text-sm font-medium">
                      {link.label}
                    </span>
                    <span className={cn(
                      "text-[10px] leading-tight",
                      isActive ? "text-violet-100" : "text-slate-400"
                    )}>
                      {link.description}
                    </span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-md">
              {currentUser.nombre.charAt(0).toUpperCase()}
            </div>
            <div className=" min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{currentUser.nombre}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-all duration-200 group/logout"
          >
            <span className="flex-shrink-0 group-hover/logout:scale-110 transition-transform duration-200">
              <Icons.logout />
            </span>
            <span className="text-sm font-medium whitespace-nowrap ">
              Cerrar Sesión
            </span>
          </button>
        </div>
      )}
    </aside>
  )
}

export default Sidebar

