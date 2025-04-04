'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        redirect('/dashboard');
      } else {
        redirect('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Mostrar un estado de carga mientras se verifica la autenticación
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
    </div>
  );
}
