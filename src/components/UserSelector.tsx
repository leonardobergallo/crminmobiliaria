'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Usuario {
  id: string;
  nombre: string;
}

export default function UserSelector() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUsuarios();
    // Cargar usuario seleccionado del localStorage
    const saved = localStorage.getItem('selectedUserId');
    if (saved) {
      setSelectedId(saved);
    }
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios');
      const data = await response.json();
      setUsuarios(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
        localStorage.setItem('selectedUserId', data[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    localStorage.setItem('selectedUserId', id);
    setIsOpen(false);
  };

  const currentUser = usuarios.find(u => u.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 mb-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors text-left flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          {currentUser?.nombre || 'Selecciona agente'}
        </span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-lg z-50 border border-slate-700">
          {usuarios.length === 0 ? (
            <div className="p-3 text-slate-400 text-sm text-center">
              No hay agentes
            </div>
          ) : (
            usuarios.map(usuario => (
              <button
                key={usuario.id}
                onClick={() => handleSelect(usuario.id)}
                className={`w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0 ${
                  selectedId === usuario.id ? 'bg-blue-600 text-white font-semibold' : 'text-slate-300'
                }`}
              >
                {selectedId === usuario.id ? '✓ ' : ''}{usuario.nombre}
              </button>
            ))
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              router.push('/agentes');
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-slate-400 text-sm border-t border-slate-700"
          >
            ⚙️ Gestionar agentes...
          </button>
        </div>
      )}
    </div>
  );
}
