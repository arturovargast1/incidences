import { useState, useEffect } from 'react';
import { User } from '../types/users';

// URL del servidor proxy local (for client side) or the actual API URL (for server side)
export const API_URL = '/api/proxy';

// Direct API URL for server side components that may need it
export const DIRECT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apiv2.dev.t1envios.com';

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
    // Perform a complete cleanup to ensure no previous user data causes conflicts
    console.log('Cleaning up previous session data before login...');
    
    // Clear all app tokens and user data
    localStorage.removeItem('token');
    localStorage.removeItem(USER_STORAGE_KEY);
    
    // Clear Keycloak tokens
    localStorage.removeItem('keycloak_token');
    localStorage.removeItem('keycloak_refresh_token');
    localStorage.removeItem('keycloak_token_expires_at');
    
    // Reset global cache
    cachedUser = null;
    
    // Also clear session storage to be thorough
    sessionStorage.clear();
    
    console.log('Iniciando login con email:', email);

    // First, authenticate with Keycloak
    try {
      console.log('Intentando autenticación con Keycloak...');
      console.log('Email:', email);
      
      const keycloakResponse = await import('./keycloak').then(keycloak => 
        keycloak.keycloakLogin(email, password)
      );
      console.log('Autenticación con Keycloak exitosa, token recibido');
    } catch (keycloakError) {
      console.error('Error en la autenticación con Keycloak:', keycloakError);
      throw new Error('Error de autenticación con Keycloak: ' + 
        (keycloakError instanceof Error ? keycloakError.message : String(keycloakError)));
    }
    
    // Then, authenticate with the current system
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
  console.log('Logging out and clearing all user data...');
  
  // Clear all user-related data from localStorage
  if (typeof window !== 'undefined') {
    // Clear main app tokens and user data
    localStorage.removeItem('token');
    localStorage.removeItem(USER_STORAGE_KEY);
    
    // Clear Keycloak tokens
    localStorage.removeItem('keycloak_token');
    localStorage.removeItem('keycloak_refresh_token');
    localStorage.removeItem('keycloak_token_expires_at');
    
    // Clear any other potential cache items
    sessionStorage.clear(); // Clear session storage as well
    
    // Clear memory cache
    cachedUser = null;
    
    // Clear any pending network requests
    // This helps prevent race conditions with in-flight API calls
    if (window.navigator && window.navigator.serviceWorker) {
      window.navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    console.log('All user data cleared, redirecting to login page');
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
      email: payload.sub || payload.email || payload.preferred_username || payload.username || 'usuario@t1envios.com',
      first_name: payload.first_name || payload.firstName || payload.given_name || payload.nombre || '',
      last_name: payload.last_name || payload.lastName || payload.family_name || payload.apellidos || '',
      job_position: payload.job_position || payload.puesto || '',
      company: payload.company || payload.empresa || 'T1',
      role: (payload.role || payload.role_type || 'standard') as any,
      created_at: payload.created_at || '',
      active: true // Asumimos que está activo si el token es válido
    };
    
    // Asegurarse que el email no esté vacío y correctamente formateado desde sub si está disponible
    if (payload.sub && payload.sub.includes('@')) {
      user.email = payload.sub; // Usar el sub como email cuando es una dirección de correo válida
    } else if (!user.email || user.email.trim() === '') {
      user.email = 'usuario@t1envios.com';
    }
    
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
    // First get the current user from the token - this is the authenticated user
    const tokenUser = getCurrentUser();
    console.log('Token user data:', JSON.stringify(tokenUser, null, 2));
    
    if (!tokenUser) {
      console.warn('No valid user found in token');
      return null;
    }
    
    // Extract the JWT token again to get direct access to payload
    const token = getToken();
    if (!token) {
      console.warn('No token available');
      return null;
    }
    
    // Decode the JWT payload directly to access sub
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    console.log('Direct JWT payload for matching:', JSON.stringify(payload, null, 2));
    
    // Get the correct email for matching - prefer sub if it's an email address
    const emailForMatching = (payload.sub && payload.sub.includes('@')) 
      ? payload.sub 
      : tokenUser.email;
    
    console.log('Using email for API matching:', emailForMatching);
    
    // Intentar obtener la lista de usuarios
    const response = await fetchWithAuth('/incidence/users');
    console.log('API users response:', JSON.stringify(response, null, 2));
    
    if (response && response.users && response.users.length > 0) {
      console.log('Available users from API:', response.users.map((u: User) => u.email));
      
      // Buscar el usuario que coincida con el email en el token (si está disponible)
      const matchingUser = response.users.find((user: User) => 
        user.email?.toLowerCase() === emailForMatching.toLowerCase()
      );
      
      if (matchingUser) {
        console.log('Found matching user by email:', matchingUser.email);
        
      // Create a merged user prioritizing token data for critical fields
      const mergedUser = {
        ...matchingUser,
        user_id: tokenUser.user_id,  // Use user_id from token to maintain session consistency
        email: tokenUser.email,      // Ensure we keep the authenticated email
        role: tokenUser.role,        // Keep role from token as it defines permissions
        company: tokenUser.company   // Keep company from token for consistency
      };
      
      console.log('Using merged user data:', JSON.stringify(mergedUser, null, 2));
      return mergedUser;
      }
      
      // If no matching user is found in the API, PREFER the token user
      // This ensures the logged-in user's info is used
      console.log('No matching user found in API. Using token data for:', tokenUser.email);
      return tokenUser;
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
 * Esta función se llama al iniciar la aplicación y después de cambios en la autenticación
 */
export async function loadUserData(forceRefresh = true): Promise<User | null> {
  try {
    // Verificar si el token actual es válido antes de usar datos en caché
    const currentToken = getToken();
    if (!currentToken) {
      console.log('No hay token válido, limpiando datos de usuario');
      cachedUser = null;
      saveUserToStorage(null);
      return null;
    }
    
    // Si tenemos usuario en caché y no estamos forzando actualización, devolverlo
    if (cachedUser && forceRefresh === false) {
      console.log('Usando usuario en caché:', cachedUser.email);
      return cachedUser;
    }
    
    // Si no estamos forzando actualización, intentar obtener el usuario desde localStorage
    // Pero verificamos primero que el email coincida con el del token actual
    if (forceRefresh === false) {
      const storedUser = getUserFromStorage();
      const tokenUser = getCurrentUser();
      
      if (storedUser && tokenUser && 
          storedUser.email === tokenUser.email && 
          storedUser.user_id === tokenUser.user_id) {
        console.log('Usando usuario de localStorage:', storedUser.email);
        cachedUser = storedUser;
        return storedUser;
      } else if (storedUser) {
        console.log('Usuario en localStorage no coincide con token, actualizando...');
      }
    }
    
    console.log('Obteniendo información de usuario fresca desde la API o token...');
    
    // Intentar obtener el usuario desde la API
    let user: User | null = null;
    
    try {
      const apiUser = await fetchUserFromApi();
      if (apiUser) {
        console.log('Usuario obtenido desde API:', apiUser.email);
        user = apiUser;
      }
    } catch (apiError) {
      console.error('Error al obtener usuario desde API, intentando con token JWT:', apiError);
    }
    
    // Si no se puede obtener desde la API, usar los datos del token JWT
    if (!user) {
      const tokenUser = getCurrentUser();
      if (tokenUser) {
        console.log('Usuario obtenido desde token JWT:', tokenUser.email);
        user = tokenUser;
      }
    }
    
    // Actualizar caché y localStorage con el usuario obtenido
    if (user) {
      cachedUser = user;
      saveUserToStorage(user);
    } else {
      console.warn('No se pudo obtener información del usuario');
      cachedUser = null;
      saveUserToStorage(null);
    }
    
    return user;
  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
    return null;
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
    const loadUser = async () => {
      try {
        setLoading(true);
        
        // Force a refresh of user data when needed
        const tokenUser = getCurrentUser();
        
        const shouldForceRefresh = 
          !user || 
          !user.email || 
          user.email === 'usuario@t1envios.com' ||
          (tokenUser && user && user.email !== tokenUser.email) ||
          (tokenUser && user && user.user_id !== tokenUser.user_id);
        
        // Ensure we pass a boolean, not possibly null or undefined
        const userData = await loadUserData(shouldForceRefresh === true);
        
        // Double check that we actually have valid user data
        if (userData) {
          console.log('User data loaded successfully:', userData.email);
          setUser(userData);
        } else {
          console.warn('No user data returned from loadUserData');
          if (user && user.email !== 'usuario@t1envios.com') {
            // Keep existing user if it seems valid
            console.log('Keeping existing user data:', user.email);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Always attempt to load user data when the component mounts
    loadUser();
    
    // Function to handle token and user changes across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token') {
        // If token changed, reload user data
        console.log('Token changed in storage, reloading user data');
        loadUser();
      } else if (event.key === USER_STORAGE_KEY) {
        // If user changed in another tab, update it
        const newUser = getUserFromStorage();
        console.log('User data changed in storage:', newUser?.email || 'No user');
        setUser(newUser);
      }
    };
    
    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Periodically check token validity
    const tokenCheckInterval = setInterval(() => {
      const token = getToken();
      if (!token && user) {
        // If token is gone but we have user data, clear it
        console.log('Token no longer valid, clearing user data');
        setUser(null);
        saveUserToStorage(null);
        cachedUser = null;
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenCheckInterval);
    };
  }, []); // Only run on mount, not when user changes
  
  return { user, loading };
}
