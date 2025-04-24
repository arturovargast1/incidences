import { useState, useEffect, useCallback } from 'react';
import { getToken, API_URL } from '../lib/auth';

// Interfaces para el formato de respuesta de la API
interface StatusDetail {
  status: string;
  attention_time: number;
  count: number;
}

interface UserStatusDetail {
  attention_time: number;
  count: number;
}

interface UserDetail {
  email: string;
  total_attention_time: number;
  total_count: number;
  details: {
    finalized?: UserStatusDetail;
    in_process?: UserStatusDetail;
  };
}

interface StatusDetails {
  in_process?: StatusDetail;
  finalized?: StatusDetail;
  total_attention_time: number;
  total_count: number;
}

interface KpiApiResponse {
  success: boolean;
  message: string;
  detail: {
    status_details: StatusDetails;
    users_by_email: UserDetail[];
  };
}

// Interfaces para nuestro componente
export interface IncidentTransitionTimes {
  requiresActionToInProcess: number; // Tiempo en horas (corresponde a in_process.attention_time)
  inProcessToFinalized: number; // Tiempo en horas (corresponde a finalized.attention_time)
}

export interface AgentPerformance {
  agentId: string; // Usamos el email como ID
  agentName: string; // Nombre de usuario (usamos email por ahora)
  requiresActionToInProcess: number; // Tiempo en horas 
  inProcessToFinalized: number; // Tiempo en horas
  totalIncidentsHandled: number; // Total de incidencias manejadas
}

export interface KpisData {
  overallTransitionTimes: IncidentTransitionTimes;
  agentPerformance: AgentPerformance[];
}

export function useKpisStats(selectedAgentEmail: string = '') {
  const [kpisData, setKpisData] = useState<KpisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Función para obtener los datos de KPI desde la API
  const fetchKpisStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching KPI stats for agent email: ${selectedAgentEmail}`);
      
      const token = getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      
      // Construir la URL dependiendo si hay un filtro por usuario
      let url = `${API_URL}/incidence/KPI`;
      if (selectedAgentEmail) {
        url += `?user_email=${encodeURIComponent(selectedAgentEmail)}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener datos de KPI: ${response.status} ${response.statusText}`);
      }
      
      const apiData: KpiApiResponse = await response.json();
      
      if (!apiData.success) {
        throw new Error(`Error de API: ${apiData.message}`);
      }
      
      // Transformar los datos de la API al formato de nuestro componente
      const transformedData: KpisData = {
        overallTransitionTimes: {
          requiresActionToInProcess: apiData.detail.status_details.in_process?.attention_time || 0,
          inProcessToFinalized: apiData.detail.status_details.finalized?.attention_time || 0
        },
        agentPerformance: apiData.detail.users_by_email.map(user => ({
          agentId: user.email,
          agentName: user.email, // Usamos el email como nombre por ahora
          requiresActionToInProcess: user.details.in_process?.attention_time || 0,
          inProcessToFinalized: user.details.finalized?.attention_time || 0,
          totalIncidentsHandled: user.total_count
        }))
      };
      
      setKpisData(transformedData);
    } catch (err) {
      console.error('Error fetching KPI stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [selectedAgentEmail]); // Remove refreshTrigger from dependencies as it's not used in the function body

  // Obtener datos cuando cambien las dependencias
  useEffect(() => {
    fetchKpisStats();
  }, [fetchKpisStats]);

  // Filtrar datos basados en el agente seleccionado
  const getFilteredData = useCallback(() => {
    if (!kpisData) return null;
    
    // Si no hay un agente seleccionado o los datos ya vienen filtrados de la API
    // simplemente devolvemos los datos tal cual
    return kpisData;
  }, [kpisData]);

  return {
    kpisData,
    loading,
    error,
    filteredData: getFilteredData(),
    refreshData: () => setRefreshTrigger(prev => prev + 1)
  };
}
