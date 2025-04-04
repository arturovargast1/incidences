'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TokenAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Comprobamos si la variable global indica un problema con el token
    const checkTokenStatus = () => {
      if (typeof window !== 'undefined' && window.tokenHasIssues === true) {
        setShowAlert(true);
      } else {
        setShowAlert(false);
      }
    };

    // Comprobar al montar el componente
    checkTokenStatus();

    // Comprobar periódicamente
    const interval = setInterval(checkTokenStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      router.push('/auth/login');
    }
  };

  const handleDismiss = () => {
    setShowAlert(false);
  };

  if (!showAlert) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">
            Token no autorizado. Pero se seguirá usando para evitar pérdida de datos.
          </span>
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleLogout}
            className="mr-2 px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700"
          >
            Cerrar sesión
          </button>
          <button 
            onClick={handleDismiss}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}