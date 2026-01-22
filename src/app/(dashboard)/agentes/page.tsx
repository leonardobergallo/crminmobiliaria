'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Usuario {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  activo: boolean;
  _count: {
    propiedades: number;
    clientes: number;
    operaciones: number;
  };
}

export default function AgentesPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios');
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/usuarios/${editingId}` : '/api/usuarios';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsuarios();
        setFormData({ nombre: '', email: '', telefono: '' });
        setShowForm(false);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email || '',
      telefono: usuario.telefono || '',
    });
    setEditingId(usuario.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro?')) {
      try {
        await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
        await fetchUsuarios();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">👨‍💼 Agentes</h1>
            <p className="text-slate-600 mt-1">Gestiona los agentes inmobiliarios</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ nombre: '', email: '', telefono: '' });
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Nuevo Agente
          </Button>
        </div>

        {/* Formulario */}
        {showForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base">
                {editingId ? 'Editar Agente' : 'Crear Nuevo Agente'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre
                  </label>
                  <Input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Ej: Carli Esquivel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <Input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    placeholder="+54 9 3424 123456"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingId ? 'Guardar Cambios' : 'Crear Agente'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de agentes */}
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : usuarios.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="py-8 text-center text-slate-600">
              No hay agentes registrados. ¡Crea el primero!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {usuarios.map((usuario) => (
              <Card key={usuario.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {usuario.nombre}
                      </h3>
                      {usuario.email && (
                        <p className="text-sm text-slate-600 mt-1">
                          📧 {usuario.email}
                        </p>
                      )}
                      {usuario.telefono && (
                        <p className="text-sm text-slate-600">
                          📞 {usuario.telefono}
                        </p>
                      )}
                      
                      {/* Estadísticas */}
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {usuario._count.propiedades}
                          </p>
                          <p className="text-xs text-slate-600">Propiedades</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {usuario._count.clientes}
                          </p>
                          <p className="text-xs text-slate-600">Clientes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {usuario._count.operaciones}
                          </p>
                          <p className="text-xs text-slate-600">Operaciones</p>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(usuario)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(usuario.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
