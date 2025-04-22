'use client';

import { useState } from 'react';
import { CreateUserRequest, UserRole } from '@/types/users';
import { createUser } from '@/lib/api';

interface CreateUserFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateUserForm({ onCancel, onSuccess }: CreateUserFormProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    user: '',
    password: '',
    nombre: '',
    apellidos: '',
    puesto: '',
    empresa: 'DHL', // Valor predeterminado
    role_type: 'standard' // Valor predeterminado
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.user || !formData.password || !formData.nombre || !formData.apellidos || !formData.puesto) {
      setError('Por favor, complete todos los campos obligatorios');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.user)) {
      setError('Por favor, ingrese un correo electrónico válido');
      return;
    }

    // Validar longitud de contraseña
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    // Validar que se proporcione admin_key si el rol es admin
    if (formData.role_type === 'admin' && !formData.admin_key) {
      setError('Para crear un usuario administrador, debe proporcionar la clave de administrador');
      return;
    }

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
        return;
      }
      
      console.log('Enviando datos de usuario:', formData);
      console.log('Token disponible:', token.substring(0, 15) + '...');
      
      try {
        // Usar la API real para crear el usuario
        const response = await createUser(formData);
        
        if (response.success) {
          // Mostrar toast de éxito
          showToast('Usuario creado exitosamente', 'success');
          
          // Regresar inmediatamente a la lista de usuarios
          onSuccess();
        } else {
          setError(response.message || 'Error al crear el usuario');
        }
      } catch (apiErr: any) {
        console.error('Error en la llamada a la API:', apiErr);
        
        // Mostrar un mensaje de error más amigable
        if (apiErr.message && apiErr.message.includes('token')) {
          setError('Error de autenticación. Por favor, inicie sesión nuevamente.');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else if (apiErr.message && apiErr.message.includes('Authorization')) {
          setError('Información de autorización no disponible. Por favor, inicie sesión nuevamente.');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else {
          setError(apiErr.message || 'Error al crear el usuario');
        }
      }
    } catch (err: any) {
      console.error('Error general al crear usuario:', err);
      setError(err.message || 'Error inesperado al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const empresas = [
    { id: 'DHL', name: 'DHL' },
    { id: 'FEDEX', name: 'FedEx' },
    { id: 'ESTAFETA', name: 'Estafeta' },
    { id: '99MIN', name: '99 Minutos' },
    { id: 'AMPM', name: 'AMPM' },
    { id: 'UPS', name: 'UPS' },
    { id: 'EXPRESS', name: 'Express' },
    { id: 'JTEXPRESS', name: 'JT Express' },
    { id: 'T1ENVIOS', name: 'T1 Envíos' }
  ];

  const roles: { id: UserRole; name: string }[] = [
    { id: 'admin', name: 'Administrador' },
    { id: 'standard', name: 'Estándar' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--gray-900)]">
          Crear nuevo usuario
        </h2>
        <button
          onClick={onCancel}
          className="text-[var(--gray-500)] hover:text-[var(--gray-700)]"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              id="user"
              name="user"
              value={formData.user}
              onChange={handleChange}
              className="filter-control"
              placeholder="ejemplo@empresa.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="filter-control"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </div>
          
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="filter-control"
              placeholder="Nombre"
              required
            />
          </div>
          
          <div>
            <label htmlFor="apellidos" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Apellidos *
            </label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              className="filter-control"
              placeholder="Apellidos"
              required
            />
          </div>
          
          <div>
            <label htmlFor="puesto" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Puesto *
            </label>
            <input
              type="text"
              id="puesto"
              name="puesto"
              value={formData.puesto}
              onChange={handleChange}
              className="filter-control"
              placeholder="Ej: Operador, Supervisor, Gerente"
              required
            />
          </div>
          
          <div>
            <label htmlFor="empresa" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Empresa *
            </label>
            <select
              id="empresa"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className="filter-control"
              required
            >
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="role_type" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Tipo de rol *
            </label>
            <select
              id="role_type"
              name="role_type"
              value={formData.role_type}
              onChange={handleChange}
              className="filter-control"
              required
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          
          {formData.role_type === 'admin' && (
            <div>
              <label htmlFor="admin_key" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
                Clave de administrador *
              </label>
              <input
                type="password"
                id="admin_key"
                name="admin_key"
                value={formData.admin_key || ''}
                onChange={handleChange}
                className="filter-control"
                placeholder="Clave de administrador"
                required
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="tienvios-button tienvios-button-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="tienvios-button"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </div>
            ) : 'Crear usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}
