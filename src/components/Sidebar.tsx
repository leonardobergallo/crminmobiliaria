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
}

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    // Cargar usuario actual
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setCurrentUser(data.user)
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
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/gestion', label: 'Gestión Cliente', icon: '📱' },
    { href: '/clientes', label: 'Clientes', icon: '👥' },
    { href: '/busquedas', label: 'Búsquedas', icon: '🔍' },
    { href: '/propiedades', label: 'Propiedades', icon: '🏠' },
    { href: '/carga-rapida', label: 'Carga Rápida', icon: '⚡' },
    { href: '/tareas', label: 'Tareas', icon: '📋' },
    { href: '/operaciones', label: 'Comisiones', icon: '💰' },
    { href: '/importar', label: 'Importar', icon: '📥' },
    { href: '/agentes', label: 'Agentes', icon: '👨‍💼' },
  ]

  // Links de administración (solo para admin)
  const adminLinks = [
    { href: '/admin/usuarios', label: 'Usuarios', icon: '🔐' },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">CRM Inmobiliario</h1>
        <p className="text-sm text-slate-400 mt-1">REMAX</p>
      </div>

      {/* Selector de Usuario */}
      <UserSelector />

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors',
              pathname === link.href
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            )}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Admin Section */}
      {currentUser?.rol === 'admin' && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="px-4 text-xs text-slate-500 uppercase tracking-wider mb-2">
            Administración
          </p>
          <nav className="space-y-2">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors',
                  pathname === link.href
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* User Info & Logout */}
      {currentUser && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="px-4 py-2 text-sm">
            <p className="text-white font-medium">{currentUser.nombre}</p>
            <p className="text-slate-400 text-xs capitalize">{currentUser.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center space-x-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
