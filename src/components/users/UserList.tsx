'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/users';
import { fetchUsers, USER_ROLE_NAMES, formatDate, inactivateUser } from '@/lib/api';

interface UserListProps {
  onCreateUser: () => void;
}

export default function UserList({ onCreateUser }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inactivatingUserId, setInactivatingUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load users on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar si hay un token de autenticación
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
          getMockUsers();
          return;
        }
        
        console.log('Token disponible:', token.substring(0, 15) + '...');
        
        try {
          const response = await fetchUsers();
          
          if (response.message) {
            setUsers(response.users || []);
            console.log('Users loaded:', response.users);
          } else {
            setError('Error al cargar usuarios');
            // Fallback to mock data
            getMockUsers();
          }
        } catch (err: any) {
          console.error('Error fetching users:', err);
          
          if (err.message && err.message.includes('token')) {
            setError('Error de autenticación. Por favor, inicie sesión nuevamente.');
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 2000);
          } else if (err.message && err.message.includes('Authorization')) {
            setError('Información de autorización no disponible. Por favor, inicie sesión nuevamente.');
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 2000);
          } else {
            setError('Error al cargar usuarios. Se muestran datos de ejemplo.');
          }
          
          // Fallback to mock data
          getMockUsers();
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Function to load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si hay un token de autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación. Por favor, inicie sesión nuevamente.');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
        getMockUsers();
        return;
      }
      
      console.log('Token disponible:', token.substring(0, 15) + '...');
      
      try {
        const response = await fetchUsers();
        
        if (response.message) {
          setUsers(response.users || []);
          console.log('Users loaded:', response.users);
        } else {
          setError('Error al cargar usuarios');
          // Fallback to mock data
          getMockUsers();
        }
      } catch (err: any) {
        console.error('Error fetching users:', err);
        
        if (err.message && err.message.includes('token')) {
          setError('Error de autenticación. Por favor, inicie sesión nuevamente.');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else if (err.message && err.message.includes('Authorization')) {
          setError('Información de autorización no disponible. Por favor, inicie sesión nuevamente.');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else {
          setError('Error al cargar usuarios. Se muestran datos de ejemplo.');
        }
        
        // Fallback to mock data
        getMockUsers();
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const getMockUsers = () => {
    const mockUsers: User[] = [
      {
        user_id: '1',
        email: 'admin@t1paginas.com',
        first_name: 'Admin',
        last_name: 'T1',
        job_position: 'Administrador',
        company: 'T1 Paginas',
        role: 'admin',
        created_at: new Date().toISOString(),
        active: true
      },
      {
        user_id: '2',
        email: 'operador@dhl.com',
        first_name: 'Juan',
        last_name: 'Pérez',
        job_position: 'Operador',
        company: 'DHL',
        role: 'standard',
        created_at: new Date().toISOString(),
        active: true
      }
    ];
    
    setUsers(mockUsers);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Buscando:', searchTerm);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    toast.style.transition = 'all 0.3s ease-in-out';
    toast.style.opacity = '0';
    toast.textContent = message;
    
    // Añadir al DOM
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  const handleInactivateUser = async (userId: string) => {
    if (!confirm('¿Está seguro que desea inactivar este usuario?')) {
      return;
    }
    
    try {
      setInactivatingUserId(userId);
      setError(null);
      
      const response = await inactivateUser(userId);
      
      if (response.success) {
        // Mostrar toast en lugar de mensaje en la página
        showToast('Usuario inactivado exitosamente', 'success');
        
        // Update the user in the list
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.user_id === userId ? { ...user, active: false } : user
          )
        );
      } else {
        setError(response.message || 'Error al inactivar el usuario');
      }
    } catch (err: any) {
      console.error('Error al inactivar usuario:', err);
      setError(err.message || 'Error al inactivar el usuario');
    } finally {
      setInactivatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--gray-900)] mb-4 md:mb-0">
          Usuarios del sistema
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Buscar usuario..."
              className="filter-control pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--gray-500)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
          <button
            onClick={onCreateUser}
            className="tienvios-button flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="tienvios-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Puesto</th>
              <th>Empresa</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-6 w-6 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">Cargando usuarios...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[var(--gray-500)]">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.user_id} className={!user.active ? "opacity-60" : ""}>
                  <td>{user.email}</td>
                  <td>{`${user.first_name} ${user.last_name}`}</td>
                  <td>{user.job_position}</td>
                  <td>{user.company}</td>
                  <td>
                    <span className={`status-tag ${user.role === 'admin' ? 'status-in-review' : user.role === 'Master' ? 'status-finalized' : 'status-in-process'}`}>
                      {USER_ROLE_NAMES[user.role] || user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-tag ${user.active ? 'status-finalized' : 'status-requires-action'}`}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{user.created_at ? formatDate(user.created_at) : 'N/A'}</td>
                  <td>
                    {user.role !== 'Master' ? (
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        {inactivatingUserId === user.user_id ? (
                          <div className="flex justify-center">
                            <svg className="animate-spin h-5 w-5 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              id={`toggle-${user.user_id}`}
                              className="sr-only"
                              checked={user.active}
                              onChange={() => handleInactivateUser(user.user_id)}
                              disabled={inactivatingUserId !== null}
                            />
                            <label
                              htmlFor={`toggle-${user.user_id}`}
                              className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                                user.active ? 'bg-green-400' : 'bg-red-400'
                              }`}
                            >
                              <span
                                className={`block w-4 h-4 ml-1 mt-1 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                                  user.active ? 'translate-x-4' : ''
                                }`}
                              ></span>
                            </label>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">No editable</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
