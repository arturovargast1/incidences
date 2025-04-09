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
      
      let response;
      try {
        response = await fetchIncidenceStats(selectedCarrierId);
        console.log('Incidence stats response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Error fetching from API:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
        setLoading(false);
        return; // Exit early instead of using mock data
      }
      
      // Check if the response has the expected structure
      if (response && response.detail) {
        setApiResponse(response);
        
        // Process the API response into our internal format
        const totalIncidents = response.detail.total_incidents || 
          response.detail.couriers.reduce(
            (sum: number, courier: any) => sum + (courier.total_incidents || courier.total_de_incidencias || 0), 
            0
          );
        
        // Log the raw courier data to understand its structure
        console.log('Raw courier data:', JSON.stringify(response.detail.couriers, null, 2));
        
        const mappedCouriers = response.detail.couriers.map((courier: any) => {
          // Check if the courier data is already in the expected format
          if (courier.messaging_name !== undefined && 
              courier.total_records !== undefined && 
              courier.total_incidents !== undefined) {
            // Data is already in the expected format
            console.log('Courier data already in expected format:', courier);
            return {
              messaging_name: courier.messaging_name,
              total_records: courier.total_records,
              total_incidents: courier.total_incidents,
              percentaje: courier.percentaje
            };
          }
          
          // If not in expected format, try to map from the old format
          // Try to determine the courier name from the ID if nombre_mensajeria is empty
          let courierName = courier.nombre_mensajeria;
          
          // Log each courier's data for debugging
          console.log('Processing courier in old format:', {
            original: courier,
            nombre_mensajeria: courier.nombre_mensajeria,
            id: courier.id,
            mensajeria_id: courier.mensajeria_id
          });
          
          // If the courier name is empty or null, try to find it by ID
          if (!courierName || courierName.trim() === '') {
            // Check if the courier has an ID field
            if (courier.id) {
              courierName = getCarrierNameById(courier.id);
              console.log(`Found name by id ${courier.id}: ${courierName}`);
            } else if (courier.mensajeria_id) {
              courierName = getCarrierNameById(courier.mensajeria_id);
              console.log(`Found name by mensajeria_id ${courier.mensajeria_id}: ${courierName}`);
            } else {
              // Try to extract ID from other properties if available
              console.log('No explicit ID found, looking for ID in other properties');
              
              // Check if there are any properties that might contain the courier ID
              const courierStr = JSON.stringify(courier);
              const idMatch = courierStr.match(/"id":(\d+)/);
              if (idMatch && idMatch[1]) {
                const extractedId = parseInt(idMatch[1]);
                courierName = getCarrierNameById(extractedId);
                console.log(`Extracted ID ${extractedId} from JSON, name: ${courierName}`);
              }
            }
          }
          
          const result = {
            messaging_name: courierName || 'Desconocido',
            total_records: courier.total_de_registros || 0,
            total_incidents: courier.total_de_incidencias || 0,
            percentaje: courier.percentaje || 0
          };
          
          console.log('Mapped courier:', result);
          return result;
        });
        
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
