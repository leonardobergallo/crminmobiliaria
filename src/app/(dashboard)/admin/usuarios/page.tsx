'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Usuario {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  rol: string;
  activo: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  nombre: string;
  rol: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'bg-red-500' },
  { value: 'supervisor', label: 'Supervisor', color: 'bg-yellow-500' },
  { value: 'agente', label: 'Agente', color: 'bg-blue-500' },
];

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'agente',
    password: '',
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return null;
      }
      const data = await res.json();
      setCurrentUser(data.user);
      
      if (data.user.rol !== 'admin') {
        router.push('/dashboard');
        return null;
      }
      return data.user;
    } catch {
      router.push('/login');
      return null;
    }
  }, [router]);

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/usuarios');
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser();
      if (user) {
        await fetchUsuarios();
      }
      setLoading(false);
    };
    init();
  }, [fetchCurrentUser, fetchUsuarios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `/api/auth/usuarios/${editingId}`
        : '/api/auth/usuarios';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ nombre: '', email: '', telefono: '', rol: 'agente', password: '' });
        fetchUsuarios();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingId(usuario.id);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      rol: usuario.rol,
      password: '',
    });
    setShowForm(true);
  };

  const handleToggleActive = async (usuario: Usuario) => {
    try {
      const res = await fetch(`/api/auth/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !usuario.activo }),
      });

      if (res.ok) {
        fetchUsuarios();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    
    try {
      const res = await fetch(`/api/auth/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchUsuarios();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  if (!currentUser || currentUser.rol !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">👥 Gestión de Usuarios</h1>
            <p className="text-slate-400 mt-1">Administra agentes, permisos y contraseñas</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-slate-600 text-slate-300"
            >
              ← Volver
            </Button>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ nombre: '', email: '', telefono: '', rol: 'agente', password: '' });
                setShowForm(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              + Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Formulario */}
        {showForm && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">
                {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Nombre *</label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Teléfono</label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-300 block mb-1">
                    {editingId ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña (opcional, puede definirla el usuario)'}
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div className="md:col-span-2 flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tabla de usuarios */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Usuario</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Teléfono</TableHead>
                  <TableHead className="text-slate-300">Rol</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Último Login</TableHead>
                  <TableHead className="text-slate-300 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-white font-medium">
                      {usuario.nombre}
                      {usuario.id === currentUser.id && (
                        <span className="ml-2 text-xs text-blue-400">(Tú)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {usuario.email || '-'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {usuario.telefono || '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs text-white ${
                          ROLES.find((r) => r.value === usuario.rol)?.color || 'bg-slate-500'
                        }`}
                      >
                        {ROLES.find((r) => r.value === usuario.rol)?.label || usuario.rol}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          usuario.activo
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {usuario.lastLogin
                        ? new Date(usuario.lastLogin).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(usuario)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(usuario)}
                          className={
                            usuario.activo
                              ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-600/20'
                              : 'border-green-600 text-green-400 hover:bg-green-600/20'
                          }
                          disabled={usuario.id === currentUser.id}
                        >
                          {usuario.activo ? '⏸️' : '▶️'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(usuario.id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                          disabled={usuario.id === currentUser.id}
                        >
                          🗑️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Leyenda de roles */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <span className="font-medium text-slate-300">Roles:</span>
          {ROLES.map((r) => (
            <span key={r.value} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${r.color}`}></span>
              <span>{r.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
