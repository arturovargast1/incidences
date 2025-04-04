'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../lib/auth';

interface AppLayoutProps {
  children: React.ReactNode;
  notificationCount?: number;
}

export default function AppLayout({ children, notificationCount = 0 }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

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
    return 'Tienvíos';
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
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              {sidebarOpen && (
                <span className="ml-3 text-[var(--gray-900)] font-semibold text-lg">Tienvíos</span>
              )}
            </div>
            <button 
              className="text-[var(--gray-500)] hover:text-[var(--primary)] transition-colors duration-200 p-1 rounded-md hover:bg-[var(--gray-100)]"
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
                <h3 className="px-3 text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-2">
                  Principal
                </h3>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/dashboard"
                    className={`flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 ${
                      pathname === '/dashboard' 
                        ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                        : 'text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {sidebarOpen && <span className="ml-3 font-medium">Inicio</span>}
                    {pathname === '/dashboard' && (
                      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)] rounded-r-md"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/incidents"
                    className={`flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 ${
                      pathname === '/incidents' || pathname.startsWith('/incidents/') 
                        ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                        : 'text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {sidebarOpen && (
                      <div className="ml-3 flex-1 flex items-center justify-between">
                        <span className="font-medium">Incidencias</span>
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[var(--primary)] rounded-full">
                          {notificationCount}
                        </span>
                      </div>
                    )}
                    {!sidebarOpen && notificationCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[var(--primary)] rounded-full transform translate-x-1/2 -translate-y-1/2">
                        {notificationCount}
                      </span>
                    )}
                    {(pathname === '/incidents' || pathname.startsWith('/incidents/')) && (
                      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)] rounded-r-md"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="flex items-center w-full px-3 py-3 rounded-lg text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {sidebarOpen && <span className="ml-3 font-medium">Reportes</span>}
                  </Link>
                </li>
              </ul>
            </div>
            
            {sidebarOpen && (
              <div className="px-4 mb-6">
                <h3 className="px-3 text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wider mb-2">
                  Administración
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="#"
                      className="flex items-center w-full px-3 py-3 rounded-lg text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="ml-3 font-medium">Configuración</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/users"
                      className={`flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 ${
                        pathname === '/users' 
                          ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                          : 'text-[var(--gray-700)] hover:bg-[var(--gray-100)]'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
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
              <div className="mb-4 px-3 py-3 bg-[var(--gray-50)] rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white font-medium shadow-sm">
                      AE
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-[var(--gray-900)]">Admin Ejemplo</p>
                    <p className="text-xs text-[var(--gray-500)]">admin@tienvios.com</p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-3 rounded-lg text-[var(--gray-700)] hover:bg-[var(--gray-100)] transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
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
                  className="mr-4 text-[var(--gray-500)] hover:text-[var(--primary)] transition-colors duration-200"
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
              
              <div className="breadcrumbs hidden md:flex">
                <div className="breadcrumbs-item">
                  <Link href="/dashboard">Tienvíos</Link>
                </div>
                <div className="breadcrumbs-item">
                  {getPageTitle()}
                </div>
              </div>
              
              <h1 className="text-xl font-bold text-[var(--gray-900)] md:hidden">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notificaciones */}
              <button className="relative p-1 text-[var(--gray-500)] hover:text-[var(--primary)] transition-colors duration-200 rounded-full hover:bg-[var(--gray-100)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[var(--primary)] rounded-full transform translate-x-1/2 -translate-y-1/2">
                  {notificationCount}
                </span>
              </button>
              
              {/* Perfil de usuario */}
              <div className="relative">
                <button className="flex items-center focus:outline-none">
                  <div className="relative">
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white"></span>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white font-medium shadow-sm">
                      AE
                    </div>
                  </div>
                </button>
              </div>
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
