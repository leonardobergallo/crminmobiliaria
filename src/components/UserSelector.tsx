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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeUsers = async () => {
      // Cargar usuarios (la validación del localStorage se hace dentro de fetchUsuarios)
      await fetchUsuarios();
      setIsLoading(false);
    };

    initializeUsers();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setUsuarios(data);
        
        // Verificar si el usuario guardado existe en la lista actual
        const saved = localStorage.getItem('selectedUserId');
        const savedUserExists = saved && data.some((u: Usuario) => u.id === saved);
        
        if (savedUserExists) {
          setSelectedId(saved);
        } else if (data.length > 0) {
          // Si no existe o no hay guardado, seleccionar el primero
          const firstId = data[0].id;
          setSelectedId(firstId);
          localStorage.setItem('selectedUserId', firstId);
        } else {
          // No hay usuarios disponibles
          localStorage.removeItem('selectedUserId');
          setSelectedId('');
        }
      } else {
        console.error('Expected array but got:', typeof data);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      setUsuarios([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    localStorage.setItem('selectedUserId', id);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full px-3 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-200 rounded-full"></div>
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity">Cargando...</span>
        </div>
      </div>
    );
  }

  const currentUser = usuarios.find(u => u.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-all text-left flex items-center gap-3 border border-slate-200"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {currentUser?.nombre?.charAt(0).toUpperCase() || '?'}
        </div>
        <span className="text-sm truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-1">
          {currentUser?.nombre || 'Sin agente'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-shrink-0"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl z-50 border border-slate-200 overflow-hidden">
          {usuarios.length === 0 ? (
            <div className="p-3 text-slate-400 text-sm text-center">
              No hay agentes
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {usuarios.map(usuario => (
                <button
                  key={usuario.id}
                  onClick={() => handleSelect(usuario.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-sky-50 transition-colors flex items-center gap-3 ${
                    selectedId === usuario.id ? 'bg-sky-50 text-sky-700' : 'text-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedId === usuario.id ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm truncate">{usuario.nombre}</span>
                  {selectedId === usuario.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-sky-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              router.push('/agentes');
            }}
            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors text-slate-500 text-sm border-t border-slate-100 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Gestionar agentes
          </button>
        </div>
      )}
    </div>
  );
}
