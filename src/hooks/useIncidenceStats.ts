import { useState, useEffect, useCallback } from 'react';
import { fetchIncidenceStats, IncidenceStatsResponse, CourierStats } from '../lib/api';

// Interface for our internal representation of the stats
interface ProcessedStats {
  totalGuides: number;
  overallPercentage: number;
  totalIncidents: number;
  couriers: CourierData[];
}

// Interface for courier data in our internal format
export interface CourierData {
  messaging_name: string;
  total_records: number;
  total_incidents: number;
  percentaje: number;
}

export function useIncidenceStats(selectedCarrierId: number = 0) {
  const [apiResponse, setApiResponse] = useState<IncidenceStatsResponse | null>(null);
  const [processedStats, setProcessedStats] = useState<ProcessedStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Function to fetch incidence stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching incidence stats for carrier ID: ${selectedCarrierId}`);
      
      const response = await fetchIncidenceStats(selectedCarrierId);
      console.log('Incidence stats response:', JSON.stringify(response, null, 2));
      
      // Check if the response has the expected structure
      if (response && response.detail) {
        setApiResponse(response);
        
        // Process the API response into our internal format
        const totalIncidents = response.detail.couriers.reduce(
          (sum: number, courier: CourierStats) => sum + courier.total_de_incidencias, 
          0
        );
        
        const mappedCouriers = response.detail.couriers.map((courier: CourierStats) => ({
          messaging_name: courier.nombre_mensajeria,
          total_records: courier.total_de_registros,
          total_incidents: courier.total_de_incidencias,
          percentaje: courier.percentaje
        }));
        
        setProcessedStats({
          totalGuides: response.detail.total_of_guides,
          overallPercentage: response.detail.overall_percentaje,
          totalIncidents: totalIncidents,
          couriers: mappedCouriers
        });
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err) {
      console.error('Error fetching incidence stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [refreshTrigger, selectedCarrierId]);

  // Fetch stats when dependencies change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Get filtered data based on selected carrier
  const getFilteredData = useCallback(() => {
    if (!processedStats) return null;
    
    // If no specific carrier is selected (all carriers)
    if (selectedCarrierId === 0) {
      return {
        totalGuides: processedStats.totalGuides,
        overallPercentage: processedStats.overallPercentage,
        totalIncidents: processedStats.totalIncidents,
        couriers: processedStats.couriers,
        isFiltered: false
      };
    }
    
    // Find the selected courier
    const selectedCourier = processedStats.couriers.find(
      courier => courier.messaging_name === getCarrierNameById(selectedCarrierId)
    );
    
    if (!selectedCourier) {
      console.warn(`Courier with ID ${selectedCarrierId} not found`);
      return {
        totalGuides: processedStats.totalGuides,
        overallPercentage: processedStats.overallPercentage,
        totalIncidents: processedStats.totalIncidents,
        couriers: processedStats.couriers,
        isFiltered: false
      };
    }
    
    // Return data for the selected courier
    return {
      totalGuides: selectedCourier.total_records,
      overallPercentage: selectedCourier.percentaje,
      totalIncidents: selectedCourier.total_incidents,
      couriers: [selectedCourier],
      isFiltered: true,
      selectedCourier
    };
  }, [processedStats, selectedCarrierId]);

  // Helper function to get carrier name by ID
  const getCarrierNameById = (id: number): string => {
    const CARRIER_NAMES: Record<number, string> = {
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
    
    return CARRIER_NAMES[id] || `Unknown (${id})`;
  };

  return {
    apiResponse,
    processedStats,
    loading,
    error,
    filteredData: getFilteredData(),
    refreshData: () => setRefreshTrigger(prev => prev + 1)
  };
}
