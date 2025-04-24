'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getToken } from '../lib/auth';
import { getKeycloakToken } from '../lib/keycloak';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [authChecked, setAuthChecked] = useState(true); // Set to true for testing
  const router = useRouter();

  // TESTING MODE: Bypass authentication for development
  const BYPASS_AUTH = true; // Set to true to bypass authentication checks

  // Verificar ambos tokens (sistema actual y Keycloak)
  function isUserAuthenticated(): boolean {
    // En modo de desarrollo, siempre devolver true
    if (BYPASS_AUTH) return true;
    
    // Verificar si hay algún token válido (sistema actual o Keycloak)
    const currentToken = getToken();
    const keycloakToken = getKeycloakToken();
    
    console.log('Auth check - Current system token:', currentToken ? 'Present' : 'Missing');
    console.log('Auth check - Keycloak token:', keycloakToken ? 'Present' : 'Missing');
    
    // Durante la fase de transición, consideramos autenticado si tiene al menos uno de los tokens
    return !!currentToken || !!keycloakToken;
  }

  // Verificar autenticación en cada renderizado y redirigir si no está autenticado
  useEffect(() => {
    if (BYPASS_AUTH) {
      console.log('DEVELOPMENT MODE: Authentication bypassed for testing');
      setAuthChecked(true);
      return;
    }

    if (!isLoading) {
      if (!isUserAuthenticated()) {
        console.log('Usuario no autenticado, redirigiendo a login');
        router.push('/auth/login');
      } else {
        setAuthChecked(true);
        
        // Verificar los tokens cada 5 minutos
        const intervalId = setInterval(() => {
          if (!isUserAuthenticated()) {
            console.log('Tokens no encontrados o inválidos, redirigiendo a login');
            router.push('/auth/login');
          }
        }, 5 * 60 * 1000); // 5 minutos
        
        return () => clearInterval(intervalId);
      }
    }
  }, [isAuthenticated, isLoading, router, BYPASS_AUTH, isUserAuthenticated]);

  // Verificar token en cada cambio de ruta o página
  useEffect(() => {
    if (BYPASS_AUTH) return; // Skip for testing

    const handleRouteChange = () => {
      if (!isUserAuthenticated()) {
        console.log('Tokens no encontrados durante la navegación, redirigiendo a login');
        router.push('/auth/login');
      }
    };

    // Añadir listeners de eventos (para cuando la ventana recupera el foco)
    window.addEventListener('focus', handleRouteChange);
    
    return () => {
      window.removeEventListener('focus', handleRouteChange);
    };
  }, [router, BYPASS_AUTH, isUserAuthenticated]);

  if (!BYPASS_AUTH && (isLoading || !authChecked)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#db3b2a]"></div>
      </div>
    );
  }

  // Always render children in testing mode
  return BYPASS_AUTH ? <>{children}</> : (isUserAuthenticated() ? <>{children}</> : null);
}
