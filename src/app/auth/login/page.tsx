'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../../lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      // Display the specific error message from the authentication system
      const errorMessage = err?.message || 'Credenciales inválidas. Por favor, intenta de nuevo.';
      // Simplify Keycloak error messages for better user experience
      if (errorMessage.includes('Error de autenticación con Keycloak:')) {
        if (errorMessage.includes('invalid_grant') || errorMessage.includes('Invalid user credentials')) {
          setError('Credenciales inválidas en Keycloak. Por favor, verifica tu email y contraseña.');
        } else {
          setError('Error de autenticación en Keycloak. Por favor, intenta nuevamente.');
        }
      } else {
        setError(errorMessage);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border border-gray-200 animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/t1envios_logo_.webp" 
              alt="T1 Envíos Logo" 
              className="h-12 transform hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Incidencias T1 Envíos</h1>
          <p className="mt-2 text-gray-600">
            Plataforma de gestión de incidencias para equipos de operación
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-start animate-fade-in">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] text-gray-900 font-medium transition-all duration-200"
                  placeholder="nombre@empresa.com"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                  Contraseña
                </label>
                <a href="#" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-lg border border-gray-300 px-3 py-3 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] text-gray-900 font-medium transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="tienvios-button tienvios-button-lg w-full flex items-center justify-center py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p className="flex items-center justify-center">
            © 2025 Incidencias T1 Envíos. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
