import { useState, useEffect } from 'react';
import { User } from '../types/users';

// URL del servidor proxy local
export const API_URL = '/api/proxy';

// Interfaz para el payload del JWT
interface JwtPayload {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  job_position?: string;
  company?: string;
  role: string;
  exp: number;
  iat: number;
}

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
    
    // Limpiar datos de usuario anteriores
    localStorage.removeItem(USER_STORAGE_KEY);
    cachedUser = null;
    
    // Cargar los datos del nuevo usuario (esto se hará automáticamente en useCurrentUser)
    
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
  // Limpiar token y datos de usuario
  localStorage.removeItem('token');
  localStorage.removeItem(USER_STORAGE_KEY);
  cachedUser = null; // Limpiar la caché en memoria
  
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

/**
 * Obtiene la información del usuario actual desde el token JWT
 * @returns Objeto con la información del usuario o null si no hay token o es inválido
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = getToken();
  if (!token) {
    return null;
  }
  
  try {
    // Decodificar el payload del token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    // Depuración detallada para ver la estructura del payload
    console.log('JWT payload:', JSON.stringify(payload, null, 2));
    console.log('JWT payload keys:', Object.keys(payload));
    
    // Convertir el payload a un objeto User, manejando posibles diferencias en la estructura
    const user: User = {
      user_id: payload.user_id || payload.id || payload.sub || '',
      email: payload.email || '',
      first_name: payload.first_name || payload.firstName || payload.nombre || '',
      last_name: payload.last_name || payload.lastName || payload.apellidos || '',
      job_position: payload.job_position || payload.puesto || '',
      company: payload.company || payload.empresa || '',
      role: (payload.role || payload.role_type || 'standard') as any,
      created_at: payload.created_at || '',
      active: true // Asumimos que está activo si el token es válido
    };
    
    return user;
  } catch (error) {
    console.error('Error al obtener información del usuario desde el token:', error);
    console.error('Token:', token ? token.substring(0, 20) + '...' : 'null');
    return null;
  }
}

/**
 * Función interna para realizar peticiones autenticadas
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      data = { message: text };
    }
    
    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error en fetchWithAuth:', error);
    throw error;
  }
}

/**
 * Obtener información del usuario actual desde la API
 */
async function fetchUserFromApi(): Promise<User | null> {
  try {
    // Intentar obtener la lista de usuarios
    const response = await fetchWithAuth('/incidence/users');
    
    if (response && response.users && response.users.length > 0) {
      // Buscar el usuario que coincida con el email en el token (si está disponible)
      const tokenUser = getCurrentUser();
      
      if (tokenUser && tokenUser.email) {
        const matchingUser = response.users.find((user: User) => user.email === tokenUser.email);
        if (matchingUser) {
          console.log('Found matching user by email:', matchingUser.email);
          return matchingUser;
        }
      }
      
      // Si no encontramos un usuario que coincida, devolver el primer usuario
      console.log('Using first user from list:', response.users[0].email);
      return response.users[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener usuario desde API:', error);
    return null;
  }
}

// Clave para almacenar el usuario en localStorage
const USER_STORAGE_KEY = 'current_user';

/**
 * Guarda la información del usuario en localStorage
 */
function saveUserToStorage(user: User | null): void {
  if (typeof window === 'undefined') return;
  
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Obtiene la información del usuario desde localStorage
 */
function getUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;
    
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Error al obtener usuario desde localStorage:', error);
    return null;
  }
}

// Variable global para almacenar el usuario en memoria
let cachedUser: User | null = null;

/**
 * Carga la información del usuario desde la API y la almacena en caché
 * Esta función se llama una sola vez al iniciar la aplicación
 */
export async function loadUserData(): Promise<User | null> {
  try {
    // Si ya tenemos el usuario en caché, devolverlo
    if (cachedUser) return cachedUser;
    
    // Intentar obtener el usuario desde localStorage
    const storedUser = getUserFromStorage();
    if (storedUser) {
      cachedUser = storedUser;
      return storedUser;
    }
    
    // Intentar obtener el usuario desde la API
    const apiUser = await fetchUserFromApi();
    
    if (apiUser) {
      // Guardar en caché y localStorage
      cachedUser = apiUser;
      saveUserToStorage(apiUser);
      return apiUser;
    }
    
    // Si no se puede obtener desde la API, usar el token
    const tokenUser = getCurrentUser();
    if (tokenUser) {
      cachedUser = tokenUser;
      saveUserToStorage(tokenUser);
    }
    
    return tokenUser;
  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
    
    // Si falla todo, intentar usar la información del token
    const tokenUser = getCurrentUser();
    if (tokenUser) {
      cachedUser = tokenUser;
      saveUserToStorage(tokenUser);
    }
    
    return tokenUser;
  }
}

/**
 * Hook para obtener y actualizar la información del usuario actual
 * @returns Objeto con la información del usuario y estado de carga
 */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(cachedUser || getUserFromStorage());
  const [loading, setLoading] = useState<boolean>(!user);
  
  useEffect(() => {
    // Si ya tenemos el usuario, no necesitamos cargarlo
    if (user) return;
    
    const loadUser = async () => {
      try {
        const userData = await loadUserData();
        setUser(userData);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
    
    // Función para actualizar el usuario cuando cambie el token
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token') {
        // Si el token cambió, recargar el usuario
        loadUser();
      } else if (event.key === USER_STORAGE_KEY) {
        // Si el usuario cambió en otro tab, actualizarlo
        const newUser = getUserFromStorage();
        setUser(newUser);
      }
    };
    
    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);
  
  return { user, loading };
}
