'use client';

import { useState } from 'react';

interface ExportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
}

export default function ExportErrorModal({ isOpen, onClose, errorMessage }: ExportErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--gray-900)]">Error de Exportación</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center text-red-600 mb-4">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium text-red-800">
              Error al exportar a Excel
            </span>
          </div>
          <p className="text-sm text-[var(--gray-600)] mb-2">
            {errorMessage || 'No se pudo completar la exportación a Excel. Por favor, inténtelo de nuevo más tarde.'}
          </p>
          <div className="bg-[var(--gray-50)] p-3 rounded-lg border border-[var(--gray-200)] mt-4">
            <p className="text-xs text-[var(--gray-600)]">
              <span className="font-semibold">Sugerencias:</span>
            </p>
            <ul className="text-xs text-[var(--gray-600)] list-disc pl-4 mt-1 space-y-1">
              <li>Verifique su conexión a internet</li>
              <li>Asegúrese de que tiene permisos para exportar datos</li>
              <li>Intente con un conjunto de datos más pequeño</li>
              <li>Si el problema persiste, contacte al soporte técnico</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="tienvios-button px-4 py-2 rounded-xl flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
