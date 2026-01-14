'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import UserSelector from './UserSelector'

const Sidebar = () => {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/clientes', label: 'Clientes', icon: '👥' },
    { href: '/busquedas', label: 'Búsquedas', icon: '🔍' },
    { href: '/propiedades', label: 'Propiedades', icon: '🏠' },
    { href: '/operaciones', label: 'Comisiones', icon: '💰' },
    { href: '/importar', label: 'Importar', icon: '📥' },
    { href: '/agentes', label: 'Agentes', icon: '👨‍💼' },
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
    </aside>
  )
}

export default Sidebar
