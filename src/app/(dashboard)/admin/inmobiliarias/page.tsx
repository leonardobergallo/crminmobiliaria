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

interface Inmobiliaria {
  id: string;
  nombre: string;
  slug: string;
  email: string | null;
  whatsapp: string | null;
  direccion: string | null;
  colorPrimario: string | null;
  activa: boolean;
  createdAt: string;
  _count: {
    usuarios: number;
    clientes: number;
    propiedades: number;
    operaciones: number;
  };
}

interface CurrentUser {
  id: string;
  nombre: string;
  rol: string;
  inmobiliariaId: string | null;
}

export default function AdminInmobiliariasPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [inmobiliarias, setInmobiliarias] = useState<Inmobiliaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    email: '',
    whatsapp: '',
    direccion: '',
    colorPrimario: '#3B82F6',
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
      
      // Solo superadmin puede acceder
      if (data.user.rol !== 'superadmin') {
        router.push('/dashboard');
        return null;
      }
      return data.user;
    } catch {
      router.push('/login');
      return null;
    }
  }, [router]);

  const fetchInmobiliarias = useCallback(async () => {
    try {
      const res = await fetch('/api/inmobiliarias');
      if (res.ok) {
        const data = await res.json();
        setInmobiliarias(data);
      }
    } catch (error) {
      console.error('Error cargando inmobiliarias:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser();
      if (user) {
        await fetchInmobiliarias();
      }
      setLoading(false);
    };
    init();
  }, [fetchCurrentUser, fetchInmobiliarias]);

  const generateSlug = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.value;
    setFormData({
      ...formData,
      nombre,
      slug: editingId ? formData.slug : generateSlug(nombre),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre || !formData.slug) {
      setError('Nombre y slug son requeridos');
      return;
    }

    try {
      const url = editingId 
        ? `/api/inmobiliarias/${editingId}` 
        : '/api/inmobiliarias';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar');
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        nombre: '',
        slug: '',
        email: '',
        whatsapp: '',
        direccion: '',
        colorPrimario: '#3B82F6',
      });
      fetchInmobiliarias();
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    }
  };

  const handleEdit = (inmobiliaria: Inmobiliaria) => {
    setFormData({
      nombre: inmobiliaria.nombre,
      slug: inmobiliaria.slug,
      email: inmobiliaria.email || '',
      whatsapp: inmobiliaria.whatsapp || '',
      direccion: inmobiliaria.direccion || '',
      colorPrimario: inmobiliaria.colorPrimario || '#3B82F6',
    });
    setEditingId(inmobiliaria.id);
    setShowForm(true);
  };

  const handleToggleActiva = async (inmobiliaria: Inmobiliaria) => {
    try {
      const res = await fetch(`/api/inmobiliarias/${inmobiliaria.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !inmobiliaria.activa }),
      });

      if (res.ok) {
        fetchInmobiliarias();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.rol !== 'superadmin') {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Inmobiliarias</h1>
          <p className="text-gray-500">Administra las inmobiliarias del sistema</p>
        </div>
        <Button onClick={() => {
          setFormData({
            nombre: '',
            slug: '',
            email: '',
            whatsapp: '',
            direccion: '',
            colorPrimario: '#3B82F6',
          });
          setEditingId(null);
          setShowForm(true);
        }}>
          + Nueva Inmobiliaria
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Inmobiliaria' : 'Nueva Inmobiliaria'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre *
                  </label>
                  <Input
                    value={formData.nombre}
                    onChange={handleNombreChange}
                    placeholder="Ej: Mi Inmobiliaria"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Slug (URL) *
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="mi-inmobiliaria"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se usa para URLs y referencias únicas
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@inmobiliaria.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    WhatsApp
                  </label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+54 9 342 000-0000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dirección
                  </label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Av. Principal 123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Color de marca
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.colorPrimario}
                      onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.colorPrimario}
                      onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {editingId ? 'Guardar Cambios' : 'Crear Inmobiliaria'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setError('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabla de inmobiliarias */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Usuarios</TableHead>
                <TableHead className="text-center">Clientes</TableHead>
                <TableHead className="text-center">Propiedades</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inmobiliarias.map((inmobiliaria) => (
                <TableRow key={inmobiliaria.id}>
                  <TableCell>
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: inmobiliaria.colorPrimario || '#3B82F6' }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {inmobiliaria.nombre}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {inmobiliaria.slug}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {inmobiliaria._count.usuarios}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      {inmobiliaria._count.clientes}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                      {inmobiliaria._count.propiedades}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inmobiliaria.activa
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inmobiliaria.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(inmobiliaria)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={inmobiliaria.activa ? 'destructive' : 'default'}
                        onClick={() => handleToggleActiva(inmobiliaria)}
                      >
                        {inmobiliaria.activa ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {inmobiliarias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No hay inmobiliarias registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
