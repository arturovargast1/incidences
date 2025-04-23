import { useState, useEffect, useCallback } from 'react';
import { fetchIncidents, updateIncident } from '../lib/api';
import { Incident, IncidentUpdateRequest } from '../types/incidents';

interface IncidentsResponse {
  success: boolean;
  message: string;
  totalRecords: number;
  totalPages: number;
  detail: Incident[];
}

export function useIncidents(carrierId: number) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching incidents for carrier: ${carrierId}, page: ${currentPage}, size: ${pageSize}`);
      
      try {
        const data: IncidentsResponse = await fetchIncidents(carrierId, currentPage, pageSize);
        
        console.log('Response data:', data);
        
        if (data.success) {
          // Procesar las incidencias para asegurarnos de que tienen la estructura correcta
          const enhancedIncidents = data.detail.map(rawIncident => {
            // Usar type assertion para acceder a propiedades snake_case
            const raw = rawIncident as any;
            
            // Crear un nuevo objeto con las propiedades en camelCase para compatibilidad
            const incident: any = {
              // Mapear propiedades de snake_case a camelCase
              incidentId: raw.incident_id || rawIncident.incidentId,
              guideNumber: raw.guide_number || rawIncident.guideNumber,
              trackingNumber: raw.shipment_number || raw.guide_number || rawIncident.guideNumber || rawIncident.trackingNumber,
              commerceId: raw.commerce_id || rawIncident.commerceId,
              carrierId: raw.carrier_id || rawIncident.carrierId,
              // Add carrier object if it exists in the API response
              carrier: raw.carrier || rawIncident.carrier,
              status_mensajeria: raw.status_carrier || rawIncident.status_mensajeria || rawIncident.status,
              status: rawIncident.status,
              operations_status: raw.operations_status || rawIncident.operations_status,
              type: rawIncident.type,
              priority: rawIncident.priority,
              createdAt: raw.created_at || rawIncident.createdAt,
              updatedAt: raw.updated_at || rawIncident.updatedAt,
              deadline: rawIncident.deadline,
              
              // Mantener shipmentDetails con la estructura original
              shipmentDetails: raw.shipment_details || rawIncident.shipmentDetails,
              
              // Procesar timeline si existe
              timeline: (rawIncident.timeline || []).map((event: any) => ({
                status: event.status,
                timestamp: event.registered_in || event.timestamp,
                actor: {
                  id: event.actor?.id || 'system',
                  type: event.actor?.type || 'system',
                  name: event.actor?.user_name || event.actor?.name || 'Sistema'
                },
                notes: event.notes
              })),
              
              // Mantener actionDetails
              actionDetails: raw.action_details || rawIncident.actionDetails,
              
              // Add assigned_user if it exists in the API response
              assigned_user: raw.assigned_user || rawIncident.assigned_user
            };
            
            // Extraer nombre del cliente de los datos de envío si existe
            if (incident.shipmentDetails?.destination?.contact && !incident.customerName) {
              incident.customerName = incident.shipmentDetails.destination.contact;
            }
            
            // Calcular las horas restantes de SLA si no existen
            if (!incident.slaHours && incident.deadline) {
              const now = new Date();
              const deadline = new Date(incident.deadline);
              const hoursRemaining = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
              incident.slaHours = hoursRemaining;
            }
            
            // Si hay metadata de resolutionTime, usarla como slaHours
            if (!incident.slaHours && incident.metadata?.resolutionTime) {
              incident.slaHours = incident.metadata.resolutionTime;
            }
            
            // Formatear la fecha límite si no existe
            if (!incident.formattedDeadline && incident.deadline) {
              incident.formattedDeadline = new Date(incident.deadline).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              });
            }
            
            return incident;
          });
          
          setIncidents(enhancedIncidents);
          setTotalPages(data.totalPages);
          setTotalRecords(data.totalRecords);
        } else {
          setError(data.message || 'Error al cargar incidencias');
        }
      } catch (apiErr) {
        console.error('Error fetching incidents from API:', apiErr);
        const errorMessage = apiErr instanceof Error ? apiErr.message : 'Error desconocido al obtener incidencias';
        setError(errorMessage);
        setIncidents([]);
        setTotalPages(0);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Error loading incidents:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [carrierId, currentPage, pageSize, refreshTrigger]);

  // Función para actualizar una incidencia
  const handleUpdateIncident = async (updateData: IncidentUpdateRequest | string) => {
    try {
      setLoading(true);
      
      let dataToUpdate: any;
      
      // Si es una cadena en formato "campo=valor", convertirla a objeto
      if (typeof updateData === 'string') {
        // Para el formato "status_mensajeria=in_process"
        const parts = updateData.split('=');
        if (parts.length === 2) {
          const [field, value] = parts;
          dataToUpdate = {
            incidentId: selectedIncident?.incidentId,
            [field]: value
          };
        } else {
          // Formato antiguo, asumiendo que es solo el valor del estado
          dataToUpdate = {
            incidentId: selectedIncident?.incidentId,
            status_mensajeria: updateData
          };
        }
      } else {
        // Si ya es un objeto, lo usamos directamente
        dataToUpdate = updateData;
        
        // Asegurar que está usando status_mensajeria en lugar de status
        if (dataToUpdate.status && !dataToUpdate.status_mensajeria) {
          dataToUpdate.status_mensajeria = dataToUpdate.status;
        }
      }
      
      console.log('Datos a enviar a la API:', dataToUpdate);
      await updateIncident(dataToUpdate);
      
      // Refrescar la lista de incidencias
      setRefreshTrigger(prev => prev + 1);
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la incidencia');
      return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar de página
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      console.log(`Changing page from ${currentPage} to ${page}`);
      setCurrentPage(page);
      
      // Forzar la recarga de datos cuando se cambia de página
      setRefreshTrigger(prev => prev + 1);
    } else {
      console.warn(`Invalid page number: ${page}. Valid range is 1-${totalPages}`);
    }
  };

  // Función para cambiar el tamaño de página
  const changePageSize = (size: number) => {
    console.log(`Changing page size from ${pageSize} to ${size}`);
    setPageSize(size);
    setCurrentPage(1); // Volver a la primera página al cambiar el tamaño
    
    // Forzar la recarga de datos cuando se cambia el tamaño de página
    setRefreshTrigger(prev => prev + 1);
  };

  // Cargar incidencias cuando cambian las dependencias
  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  return {
    incidents,
    selectedIncident,
    setSelectedIncident,
    loading,
    error,
    currentPage,
    totalPages,
    totalRecords,
    pageSize,
    changePage,
    changePageSize,
    handleUpdateIncident,
    refreshData: () => setRefreshTrigger(prev => prev + 1)
  };
}
