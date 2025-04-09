'use client';

import { useState } from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  errorMessage: string;
  suggestions?: string[];
}

export default function ErrorModal({ 
  isOpen, 
  onClose, 
  title = 'Error', 
  errorMessage,
  suggestions = []
}: ErrorModalProps) {
  if (!isOpen) return null;

  // Si no se proporcionan sugerencias, usar sugerencias predeterminadas
  const defaultSuggestions = [
    'Verifique su conexión a internet',
    'Intente recargar la página',
    'Si el problema persiste, contacte al soporte técnico'
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--gray-900)]">{title}</h3>
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
              {errorMessage || 'Ha ocurrido un error. Por favor, inténtelo de nuevo más tarde.'}
            </span>
          </div>
          
          {displaySuggestions.length > 0 && (
            <div className="bg-[var(--gray-50)] p-3 rounded-lg border border-[var(--gray-200)] mt-4">
              <p className="text-xs text-[var(--gray-600)]">
                <span className="font-semibold">Sugerencias:</span>
              </p>
              <ul className="text-xs text-[var(--gray-600)] list-disc pl-4 mt-1 space-y-1">
                {displaySuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
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
