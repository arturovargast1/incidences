'use client';

import { useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import AppLayout from '../../components/AppLayout';

export default function TestTokenPage() {
  const [tokenIssueTriggered, setTokenIssueTriggered] = useState(false);

  const triggerTokenIssue = () => {
    if (typeof window !== 'undefined') {
      window.tokenHasIssues = true;
      setTokenIssueTriggered(true);
    }
  };

  const resetTokenIssue = () => {
    if (typeof window !== 'undefined') {
      window.tokenHasIssues = false;
      setTokenIssueTriggered(false);
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <div className="tienvios-card p-6 mb-6">
            <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-4">Prueba de Modal de Token</h1>
            <p className="text-[var(--gray-600)] mb-6">
              Esta página permite probar el modal de alerta de token integrado en el AppLayout.
              Haz clic en el botón para simular un problema con el token de autenticación.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={triggerTokenIssue}
                disabled={tokenIssueTriggered}
                className="tienvios-button flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Simular problema de token
              </button>
              
              <button
                onClick={resetTokenIssue}
                disabled={!tokenIssueTriggered}
                className="tienvios-button-secondary flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restablecer
              </button>
            </div>
          </div>
          
          <div className="tienvios-card p-6">
            <h2 className="text-xl font-bold text-[var(--gray-900)] mb-4">Cómo funciona</h2>
            <p className="text-[var(--gray-600)] mb-4">
              El componente TokenAlert está integrado en el AppLayout y verifica periódicamente 
              si la variable global <code className="bg-[var(--gray-100)] px-1 py-0.5 rounded">window.tokenHasIssues</code> está establecida en <code className="bg-[var(--gray-100)] px-1 py-0.5 rounded">true</code>.
            </p>
            <p className="text-[var(--gray-600)] mb-4">
              Cuando detecta este valor, muestra el modal de alerta de token.
            </p>
            
            <div className="bg-[var(--gray-50)] p-4 rounded-lg border border-[var(--gray-200)] mb-4">
              <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">Implementación</h3>
              <p className="text-[var(--gray-600)] mb-2">
                En una aplicación real, esta variable podría establecerse cuando:
              </p>
              <ul className="list-disc pl-6 text-[var(--gray-600)] space-y-1">
                <li>Una solicitud API devuelve un error de autenticación</li>
                <li>El token ha expirado</li>
                <li>Se detecta un problema de seguridad</li>
              </ul>
            </div>
            
            <div className="bg-[var(--primary-light)] p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">Ventajas del modal</h3>
              <p className="text-[var(--gray-600)] mb-2">
                Usar un modal en lugar de una alerta tradicional proporciona varias ventajas:
              </p>
              <ul className="list-disc pl-6 text-[var(--gray-600)] space-y-1">
                <li>Mejor experiencia de usuario al no interrumpir el flujo de trabajo</li>
                <li>Diseño más atractivo y consistente con la interfaz</li>
                <li>Mayor visibilidad y claridad del mensaje</li>
                <li>Opciones más claras para el usuario (continuar o cerrar sesión)</li>
              </ul>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
