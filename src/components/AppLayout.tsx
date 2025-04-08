'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, useCurrentUser, loadUserData } from '../lib/auth';

interface AppLayoutProps {
  children: React.ReactNode;
  notificationCount?: number;
}

export default function AppLayout({ children, notificationCount = 0 }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  
  // Obtener las iniciales del usuario
  const getUserInitials = () => {
    if (!user) return 'U';
    
    // Manejar caso donde first_name o last_name pueden ser undefined o null
    const firstInitial = user.first_name && typeof user.first_name === 'string' 
      ? user.first_name.charAt(0).toUpperCase() 
      : '';
      
    const lastInitial = user.last_name && typeof user.last_name === 'string' 
      ? user.last_name.charAt(0).toUpperCase() 
      : '';
    
    // Si no hay iniciales de nombre, usar la primera letra del email
    if (firstInitial || lastInitial) {
      return firstInitial + lastInitial;
    } else if (user.email && typeof user.email === 'string') {
      return user.email.charAt(0).toUpperCase();
    } else {
      return 'U'; // Fallback si no hay datos
    }
  };

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    // Cargar los datos del usuario una sola vez al iniciar la aplicación
    loadUserData().catch(error => {
      console.error('Error al cargar datos del usuario:', error);
    });
  }, []);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
  };

  // Determinar el título de la página actual
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/incidents') return 'Gestión de incidencias';
    if (pathname.startsWith('/incidents/')) return 'Detalle de incidencia';
    if (pathname === '/users') return 'Gestión de usuarios';
    return 'Incidencias T1 Envíos';
  };

  return (
    <div className="flex h-screen bg-[var(--gray-100)] overflow-hidden">
      {/* Overlay para móvil cuando el sidebar está abierto */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 backdrop-blur-sm transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-[var(--gray-200)] transition-all duration-300 ease-in-out ${
          isMobile ? 'fixed z-30 h-full shadow-lg' : ''
        } ${isMobile && !sidebarOpen ? '-translate-x-full' : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--gray-200)]">
            <div className="flex items-center flex-grow">
              <div className={`${sidebarOpen ? "w-32 h-10" : "w-10 h-10"} flex items-center justify-center`}>
                <img 
                  src={sidebarOpen ? "/t1envios_logo_.webp" : "/t1envios-isotipo.png"} 
                  alt="T1 Envíos Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <button 
              className="text-[var(--gray-500)] hover:text-[var(--primary)] transition-colors duration-200 p-1.5 rounded-lg hover:bg-[var(--gray-100)]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {sidebarOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
          
          {/* Menú principal */}
          <div className="flex-1 overflow-y-auto py-6">
            <div className="px-4 mb-6">
              {sidebarOpen && (
                <h3 className="px-3 text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-3">
                  Principal
                </h3>
              )}
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard"
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      pathname === '/dashboard' 
                        ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                        : 'text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${pathname === '/dashboard' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--gray-100)] text-[var(--gray-600)]'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    {sidebarOpen && <span className="ml-3 font-medium">Inicio</span>}
                    {pathname === '/dashboard' && (
                      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)] rounded-r-md"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/incidents"
                    className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      pathname === '/incidents' || pathname.startsWith('/incidents/') 
                        ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                        : 'text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${pathname === '/incidents' || pathname.startsWith('/incidents/') ? 'bg-[var(--primary)] text-white' : 'bg-[var(--gray-100)] text-[var(--gray-600)]'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    {sidebarOpen && (
                      <div className="ml-3 flex-1 flex items-center justify-between">
                        <span className="font-medium">Incidencias</span>
                        {notificationCount > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold leading-none text-white bg-[var(--primary)] rounded-full">
                            {notificationCount}
                          </span>
                        )}
                      </div>
                    )}
                    {!sidebarOpen && notificationCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-[var(--primary)] rounded-full transform translate-x-1/2 -translate-y-1/2">
                        {notificationCount}
                      </span>
                    )}
                    {(pathname === '/incidents' || pathname.startsWith('/incidents/')) && (
                      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)] rounded-r-md"></span>
                    )}
                  </Link>
                </li>
                {/* Reportes module hidden temporarily */}
              </ul>
            </div>
            
            {sidebarOpen && (
              <div className="px-4 mb-6">
                <h3 className="px-3 text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-3">
                  Administración
                </h3>
                <ul className="space-y-2">
                  {/* Configuración module hidden temporarily */}
                  <li>
                    <Link
                      href="/users"
                      className={`flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        pathname === '/users' 
                          ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                          : 'text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${pathname === '/users' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--gray-100)] text-[var(--gray-600)]'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="ml-3 font-medium">Usuarios</span>
                      {pathname === '/users' && (
                        <span className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)] rounded-r-md"></span>
                      )}
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Footer del sidebar */}
          <div className="p-4 border-t border-[var(--gray-200)]">
            {sidebarOpen && (
              <div className="mb-4 px-4 py-4 bg-[var(--primary-light)] rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white font-medium shadow-sm">
                      {loading ? '...' : getUserInitials()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-[var(--gray-900)]">
                      {loading ? 'Cargando...' : user ? 
                        (user.first_name || user.last_name) ? 
                          `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
                          user.email || 'Usuario' 
                        : 'Usuario'}
                    </p>
                    <p className="text-xs text-[var(--gray-600)]">
                      {loading ? '' : user?.email || 'Sin correo'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 rounded-lg text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-all duration-200"
            >
              <div className="p-1.5 rounded-lg bg-[var(--gray-100)] text-[var(--gray-600)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              {sidebarOpen && <span className="ml-3 font-medium">Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[var(--gray-200)] z-10 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              {isMobile && (
                <button 
                  className="mr-4 text-[var(--gray-500)] hover:text-[var(--primary)] transition-colors duration-200 p-1.5 rounded-lg hover:bg-[var(--gray-100)]"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </button>
              )}
              
              <div className="breadcrumbs hidden md:flex items-center">
                <div className="breadcrumbs-item">
                  <Link href="/dashboard" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">Incidencias T1 Envíos</Link>
                </div>
                <div className="breadcrumbs-item">
                  {getPageTitle()}
                </div>
              </div>
              
              <h1 className="text-xl font-bold text-[var(--gray-900)] tracking-tight md:hidden flex items-center">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Botón de ayuda 
              <button className="tienvios-button-outline tienvios-button-sm hidden md:flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ayuda</span>
              </button>*/}
              
              {/* Notificaciones - Hidden temporarily */}
              
              {/* Perfil de usuario - Hidden temporarily */}
            </div>
          </div>
        </header>
        
        {/* Área de contenido principal */}
        <main className="flex-1 overflow-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
