'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function DropZone({ onFileSelect, isLoading = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileSelect(file);
      } else {
        alert('Por favor, sube un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 bg-slate-50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      
      <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        {isLoading ? 'Cargando...' : 'Arrastra tu Excel aquí'}
      </h3>
      <p className="text-slate-500 mb-4">
        o haz clic para seleccionar un archivo
      </p>
      
      <Button 
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? 'Procesando...' : 'Seleccionar Archivo'}
      </Button>

      <p className="text-xs text-slate-400 mt-4">
        Soporta: .xlsx, .xls
      </p>
    </div>
  );
}
