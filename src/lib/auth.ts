import { useState, useEffect } from 'react';

// URL del servidor proxy local
export const API_URL = '/api/proxy';

interface AuthResponse {
  message: string;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    // Limpiamos cualquier token anterior para evitar conflictos
    localStorage.removeItem('token');
    
    console.log('Iniciando login con email:', email);
    
    const response = await fetch(`/api/proxy/incidence/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log('Login response status:', response.status);
    console.log('Login response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login error response:', errorText);
      
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || 'Error de autenticación';
      } catch {
        errorMessage = `Error de autenticación: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    console.log('Login success response (primeros 100 caracteres):', 
      responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed login data:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Error al procesar la respuesta del servidor');
    }
    
    if (!data.token) {
      console.error('No token in response:', data);
      throw new Error('No se recibió el token de autenticación');
    }
    
    // Validar el formato del token recibido
    if (!data.token.includes('.')) {
      console.error('Token format invalid (not JWT):', data.token.substring(0, 15) + '...');
      throw new Error('El formato del token recibido no es válido');
    }
    
    // Guardar el token en localStorage
    console.log('Saving token to localStorage:', data.token.substring(0, 15) + '...');
    localStorage.setItem('token', data.token);
    
    // Intentar decodificar el payload para ver cuándo expira
    try {
      const base64Url = data.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      if (payload.exp) {
        const expiryDate = new Date(payload.exp * 1000);
        console.log(`Token expira el: ${expiryDate.toLocaleString()}`);
      }
    } catch (error) {
      console.warn('No se pudo decodificar el payload del token:', error);
    }
    
    return data;
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    throw error;
  }
}

export function logout(): void {
  localStorage.removeItem('token');
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? `${token.substring(0, 15)}...` : 'No token found');
    
    // Si el token existe, verificar si es válido
    if (token) {
      try {
        // Decodificar el token para verificar su validez
        const base64Url = token.split('.')[1];
        if (!base64Url) {
          console.warn('Token malformado');
          localStorage.removeItem('token'); // Eliminar token inválido
          return null;
        }
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        
        // Verificar si el token ha expirado
        if (payload.exp && payload.exp < (Date.now() / 1000)) {
          console.warn('Token expirado, eliminando y redirigiendo');
          localStorage.removeItem('token'); // Eliminar token expirado
          return null;
        }
      } catch (error) {
        console.error('Error al verificar el token:', error);
        localStorage.removeItem('token'); // Eliminar token con error
        return null;
      }
    }
    return token;
  }
  return null;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Comprobar si hay un token almacenado
    const token = getToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  return { isAuthenticated, isLoading };
}
