'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '../lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [authChecked, setAuthChecked] = useState(true); // Set to true for testing
  const router = useRouter();

  // TESTING MODE: Bypass authentication for development
  const BYPASS_AUTH = true; // Set to true to bypass authentication checks

  // Verificar autenticación en cada renderizado y redirigir si no está autenticado
  useEffect(() => {
    if (BYPASS_AUTH) {
      console.log('DEVELOPMENT MODE: Authentication bypassed for testing');
      setAuthChecked(true);
      return;
    }

    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('Usuario no autenticado, redirigiendo a login');
        router.push('/auth/login');
      } else {
        setAuthChecked(true);
        
        // Verificar el token cada 5 minutos
        const intervalId = setInterval(() => {
          const token = getToken();
          
          if (!token) {
            console.log('Token no encontrado o inválido, redirigiendo a login');
            router.push('/auth/login');
          }
        }, 5 * 60 * 1000); // 5 minutos
        
        return () => clearInterval(intervalId);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Verificar token en cada cambio de ruta o página
  useEffect(() => {
    if (BYPASS_AUTH) return; // Skip for testing

    const handleRouteChange = () => {
      const token = getToken();
      if (!token) {
        console.log('Token no encontrado durante la navegación, redirigiendo a login');
        router.push('/auth/login');
      }
    };

    // Añadir listeners de eventos (para cuando la ventana recupera el foco)
    window.addEventListener('focus', handleRouteChange);
    
    return () => {
      window.removeEventListener('focus', handleRouteChange);
    };
  }, [router]);

  if (!BYPASS_AUTH && (isLoading || !authChecked)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#db3b2a]"></div>
      </div>
    );
  }

  // Always render children in testing mode
  return BYPASS_AUTH ? <>{children}</> : (isAuthenticated ? <>{children}</> : null);
}
