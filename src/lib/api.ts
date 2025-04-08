import { getToken, API_URL, getCurrentUser } from './auth';
import { Incident, IncidentStatus, IncidentType, IncidentUpdateRequest } from '../types/incidents';
import { CreateUserRequest, CreateUserResponse, User } from '../types/users';

/**
 * Función para realizar peticiones autenticadas
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}, retryCount = 0) {
  // Máximo número de reintentos
  const MAX_RETRIES = 1;
  
  const token = getToken();
  
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // Asegurarse de que el token se envía con el formato correcto
  // Algunos backends esperan solo el token sin 'Bearer'
  headers.set('Authorization', `Bearer ${token}`);
  
  console.log(`Fetching from: ${API_URL}${endpoint}`);
  console.log(`With token: Bearer ${token.substring(0, 15)}...`);
  console.log(`Headers:`, Object.fromEntries(headers.entries()));
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      // Evitar caché a nivel de fetch
      cache: 'no-store',
      next: { revalidate: 0 }, // Para Next.js
      // Evitar problemas con códigos de status incorrectos
      redirect: 'follow',
    });
    
    let responseData;
    try {
      const text = await response.text();
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      console.log(`Raw response (first 100 chars): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      // Intenta analizar como JSON
      try {
        responseData = JSON.parse(text);
      } catch (e: any) {
        console.error('Error parsing JSON:', e);
        console.log('Raw response text:', text);
        responseData = { message: text };
      }
    } catch (e: any) {
      console.error('Error reading response:', e);
      throw new Error(`Error de comunicación con el servidor: ${e.message || 'Error desconocido'}`);
    }
    
    // Manejar diferentes códigos de error
    if (!response.ok) {
      const errorMessage = responseData.message || `Error ${response.status}: ${response.statusText}`;
      console.error('API error:', errorMessage, responseData);
      
      // Si es un error de autenticación, eliminar el token y redirigir al login
      if (response.status === 401 || response.status === 403) {
        console.warn('Token no autorizado, eliminando y redirigiendo al login');
        
        // Eliminar el token para forzar la redirección al login
        localStorage.removeItem('token');
        
        throw new Error('Error de autenticación. Por favor, inicie sesión nuevamente.');
      }
      
      throw new Error(errorMessage);
    }
    
    return responseData;
  } catch (error: any) {
    // Registrar detalles completos del error
    console.error('Error en fetchWithAuth:', error);
    
    // Relanzar el error para que se maneje en el componente
    throw error;
  }
}

/**
 * Obtener el tablero de incidencias con paginación
 */
export async function fetchIncidents(carrierId: number, page: number = 1, pageSize: number = 10) {
  // Asegurarse de que los parámetros de paginación sean números válidos
  const validPage = Math.max(1, page);
  const validPageSize = Math.max(1, pageSize);
  
  // Construir la URL base
  let url = `/incidence/dashboard?page=${validPage}&page_size=${validPageSize}`;
  
  // Añadir el parámetro de mensajería solo si no es 0 (Todas las paqueterías)
  if (carrierId !== 0) {
    url += `&mensajeria=${carrierId}`;
  }
  
  console.log(`Fetching incidents with pagination - URL: ${url}`);
  
  // Usar los nombres de parámetros exactos que espera el backend
  return fetchWithAuth(url);
}

/**
 * Actualizar el estado de una incidencia
 */
export async function updateIncident(updateData: any) {
  return updateIncidentInternal(updateData);
}

/**
 * Actualizar múltiples incidencias a la vez
 */
export async function updateMultipleIncidents(updateDataArray: any[]) {
  console.log('Actualizando múltiples incidencias:', updateDataArray);
  
  // Procesar cada elemento del array usando la misma lógica que updateIncidentInternal
  const processedDataArray = updateDataArray.map(updateData => {
    // Copiar los datos para no modificar el objeto original
    const dataToSend: any = { ...updateData };
    
    // Convertir propiedades de camelCase a snake_case para la API
    if (dataToSend.incidentId && !dataToSend.incident_id) {
      dataToSend.incident_id = dataToSend.incidentId;
      delete dataToSend.incidentId;
    }
    
    // Asegurarse de que el formato es correcto para la API
    // Si recibimos status_mensajeria, convertirlo a status (formato que espera la API)
    if (dataToSend.status_mensajeria && !dataToSend.status) {
      dataToSend.status = dataToSend.status_mensajeria;
      delete dataToSend.status_mensajeria; // Eliminar para usar solo status
    }
    
    // Asegurarse de que status sea uno de los valores válidos (no un string con formato)
    if (dataToSend.status && dataToSend.status.includes('=')) {
      const parts = dataToSend.status.split('=');
      if (parts.length === 2) {
        dataToSend.status = parts[1];
      }
    }
    
    // Si hay datos de address_change que vienen como objeto anidado, ajustar el formato
    if (dataToSend.actionType === 'address_change' && !dataToSend.address_change) {
      // Buscar si hay datos de address_change en otro formato
      const addressChangeKey = Object.keys(dataToSend).find(key => key === 'address_change' || dataToSend[key]?.city);
      
      if (addressChangeKey && typeof dataToSend[addressChangeKey] === 'object') {
        dataToSend.address_change = dataToSend[addressChangeKey];
        
        // Si el key no era 'address_change', eliminar la propiedad original
        if (addressChangeKey !== 'address_change') {
          delete dataToSend[addressChangeKey];
        }
      } else {
        // Si no encontramos datos de address_change pero es requerido, agregar datos mínimos
        dataToSend.address_change = {
          city: "Queretaro"
        };
      }
    }
    
    // Asegurarse de que hay notas
    if (!dataToSend.notes) {
      dataToSend.notes = `La mensajeria revisa la incidencia`;
    }
    
    return dataToSend;
  });
  
  console.log('Datos finales enviados a la API:', processedDataArray);
  
  // Usar el proxy API para evitar problemas de CORS
  return fetchWithAuth('/incidence/update-multiple-incidences', {
    method: 'POST',
    body: JSON.stringify(processedDataArray)
  });
}

/**
 * Función interna para actualizar una incidencia (usada por updateIncident)
 */
async function updateIncidentInternal(updateData: any) {
  console.log('Datos de actualización enviados a la API:', updateData);
  
  // Copiar los datos para no modificar el objeto original
  const dataToSend: any = { ...updateData };
  
  // Convertir propiedades de camelCase a snake_case para la API
  if (dataToSend.incidentId && !dataToSend.incident_id) {
    dataToSend.incident_id = dataToSend.incidentId;
    delete dataToSend.incidentId;
  }
  
  // Asegurarse de que el formato es correcto para la API
  // Si recibimos status_mensajeria, convertirlo a status (formato que espera la API)
  if (dataToSend.status_mensajeria && !dataToSend.status) {
    dataToSend.status = dataToSend.status_mensajeria;
    delete dataToSend.status_mensajeria; // Eliminar para usar solo status
  }
  
  // Asegurarse de que status sea uno de los valores válidos (no un string con formato)
  if (dataToSend.status && dataToSend.status.includes('=')) {
    const parts = dataToSend.status.split('=');
    if (parts.length === 2) {
      dataToSend.status = parts[1];
    }
  }
  
  // Si hay datos de address_change que vienen como objeto anidado, ajustar el formato
  if (dataToSend.actionType === 'address_change' && !dataToSend.address_change) {
    // Buscar si hay datos de address_change en otro formato
    const addressChangeKey = Object.keys(dataToSend).find(key => key === 'address_change' || dataToSend[key]?.city);
    
    if (addressChangeKey && typeof dataToSend[addressChangeKey] === 'object') {
      dataToSend.address_change = dataToSend[addressChangeKey];
      
      // Si el key no era 'address_change', eliminar la propiedad original
      if (addressChangeKey !== 'address_change') {
        delete dataToSend[addressChangeKey];
      }
    } else {
      // Si no encontramos datos de address_change pero es requerido, agregar datos mínimos
      dataToSend.address_change = {
        city: "Queretaro"
      };
    }
  }
  
  // Asegurarse de que hay notas
  if (!dataToSend.notes) {
    dataToSend.notes = `La mensajeria revisa la incidencia`;
  }
  
  console.log('Datos finales enviados a la API:', dataToSend);
  
  // Usar el proxy API para evitar problemas de CORS
  return fetchWithAuth('/incidence/update-incidence', {
    method: 'POST',
    body: JSON.stringify(dataToSend)
  });
}

/**
 * Obtener los detalles de una incidencia específica
 */
export async function fetchIncidentDetails(incidentId: string) {
  // Añadimos un timestamp para evitar caché
  const timestamp = new Date().getTime();
  
  // Usar el parámetro incident_id en lugar de incidentId para la API
  return fetchWithAuth(`/incidence/detail?incident_id=${incidentId}&_t=${timestamp}`);
}

/**
 * Obtener estadísticas de incidencias para el dashboard
 */
export async function fetchIncidenceStats(carrierId?: number) {
  let url = '/incidence/cardsadmin';
  
  // Añadir el parámetro de mensajería solo si se proporciona y no es 0 (Todas las paqueterías)
  if (carrierId && carrierId !== 0) {
    url += `?mensajeria=${carrierId}`;
  }
  
  return fetchWithAuth(url);
}

/**
 * Interfaz para la respuesta de estadísticas de incidencias
 */
export interface IncidenceStatsResponse {
  success: boolean;
  message: string;
  detail: {
    total_of_guides: number;
    overall_percentaje: number;
    couriers: CourierStats[];
  };
}

/**
 * Interfaz para las estadísticas de cada paquetería
 */
export interface CourierStats {
  nombre_mensajeria: string;
  total_de_registros: number;
  total_de_incidencias: number;
  percentaje: number;
}

/**
 * Mapea los ID de paqueterías a sus nombres
 */
export const CARRIER_NAMES: Record<number, string> = {
  1: 'DHL',
  2: 'FEDEX',
  3: 'ESTAFETA',
  12: '99MIN',
  19: 'AMPM',
  20: 'UPS',
  22: 'EXPRESS',
  24: 'JTEXPRESS',
  2599: 'T1ENVIOS'
};

/**
 * Mapea los tipos de incidencia a nombres legibles
 */
export const INCIDENT_TYPE_NAMES: Record<IncidentType, string> = {
  'address_change': 'Cambio de dirección',
  'recipient_not_found': 'Destinatario no encontrado',
  'restricted_access': 'Acceso restringido',
  'package_without_movement': 'Paquete sin movimiento',
  'package_rejected': 'Paquete rechazado',
  'failed_pickups': 'Recolección fallida',
  'delivery_delay': 'Retraso en entrega',
  'package_pending_pickup': 'Paquete pendiente de recolección',
  'package_damaged': 'Paquete dañado',
  'package_lost': 'Paquete perdido',
  'package_opened_or_tampered': 'Paquete abierto o manipulado',
  'theft': 'Robo',
  'theft_with_violence': 'Robo con violencia',
  'return_to_origin': 'Retorno al origen',
  'compensation_payment': 'Pago de compensación',
  'package_not_received': 'Paquete no recibido'
};

/**
 * Mapea los estados de incidencia a nombres legibles
 */
export const INCIDENT_STATUS_NAMES: Record<IncidentStatus, string> = {
  'requires_action': 'Requiere acción',
  'in_review': 'En revisión',
  'in_process': 'En proceso',
  'approved': 'Aprobado',
  'finalized': 'Finalizado',
  'pending': 'Pendiente'
};

/**
 * Convierte una fecha ISO a formato legible y la ajusta a UTC-6 (Hora del Centro de México)
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  
  try {
    // Crear objeto de fecha a partir de la cadena ISO
    const date = new Date(isoDate);
    
    // Ajustar a UTC-6 (agregando -6 horas al UTC)
    // Primero obtenemos el tiempo en UTC y luego restamos 6 horas (en milisegundos)
    const utcMinus6Date = new Date(date.getTime() - (6 * 60 * 60 * 1000));
    
    // Formatear la fecha ajustada
    return utcMinus6Date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error, isoDate);
    return isoDate; // Devolver la fecha original si hay error
  }
}

/**
 * Calcula el tiempo restante hasta el deadline en horas
 * Valor negativo indica que ya ha vencido
 * Ajusta la fecha a UTC-6 (Hora del Centro de México)
 */
export function calculateRemainingTime(deadline: string): number {
  if (!deadline) return 0;
  
  try {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    // Ajustar deadline a UTC-6
    const deadlineUTCMinus6 = new Date(deadlineDate.getTime() - (6 * 60 * 60 * 1000));
    
    const diffMs = deadlineUTCMinus6.getTime() - now.getTime();
    // Devuelve valor negativo si ya venció el plazo
    return Math.round(diffMs / (1000 * 60 * 60));
  } catch (error) {
    console.error('Error al calcular tiempo restante:', error, deadline);
    return 0; // Devolver 0 si hay un error
  }
}

/**
 * Calcula el tiempo restante hasta el deadline en días, siempre redondeando hacia arriba
 * Valor negativo indica que ya ha vencido
 * Para valores positivos, cualquier fracción de día se redondea hacia arriba (ej: 0.1 días = 1 día)
 */
export function calculateRemainingDays(deadline: string): number {
  const hours = calculateRemainingTime(deadline);
  
  if (hours <= 0) {
    // Para SLA vencido, convertir a días negativos
    return Math.floor(hours / 24);
  } else {
    // Para horas positivas, siempre redondear hacia arriba al siguiente día
    // Si las horas no son un múltiplo perfecto de 24, agregar 1 día
    return hours % 24 === 0 ? hours / 24 : Math.floor(hours / 24) + 1;
  }
}

/**
 * Crear un nuevo usuario
 */
export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  console.log('Datos de usuario enviados a la API:', userData);
  
  // Usar el endpoint correcto que funciona en Postman
  return fetchWithAuth('/incidence/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

/**
 * Obtener lista de usuarios
 */
export async function fetchUsers(): Promise<{
  message: string;
  users: User[];
}> {
  console.log('Fetching users list');
  
  return fetchWithAuth('/incidence/users');
}

/**
 * Inactivar un usuario
 */
export async function inactivateUser(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  console.log(`Inactivating user with ID: ${userId}`);
  
  return fetchWithAuth('/incidence/users', {
    method: 'PUT',
    body: JSON.stringify({
      user_id: userId
    })
  });
}

/**
 * Mapea los tipos de rol a nombres legibles
 */
export const USER_ROLE_NAMES: Record<string, string> = {
  'admin': 'Administrador',
  'standard': 'Estándar',
  'Master': 'Master'
};

/**
 * Obtener la URL para descargar incidencias en Excel
 */
export async function downloadIncidentsExcel(carrierId: number = 1, page: number = 1, pageSize: number = 20) {
  console.log(`Requesting Excel download for carrier: ${carrierId}, page: ${page}, pageSize: ${pageSize}`);
  
  // Construir la URL base
  let url = `/incidence/download?page=${page}&page_size=${pageSize}`;
  
  // Añadir el parámetro de mensajería solo si no es 0 (Todas las paqueterías)
  if (carrierId !== 0) {
    url += `&mensajeria=${carrierId}`;
  }
  
  return fetchWithAuth(url);
}
