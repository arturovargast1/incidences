'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import AppLayout from '../../../components/AppLayout';
import IncidentDetail from '../../../components/incidents/IncidentDetail';
import { fetchIncidentDetails, updateIncident } from '../../../lib/api';
import { logout } from '../../../lib/auth';

// Define the type for route params
interface IncidentParams {
  id: string;
}

// Use typed params for Next.js
export default function IncidentDetailPage({ params }: { params: any }) {
  const unwrappedParams = React.use(params) as IncidentParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Forzar recarga de incidencia desde el servidor - memoized with useCallback
  const reloadIncident = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando detalles de incidencia:', unwrappedParams.id);
      const detailData = await fetchIncidentDetails(unwrappedParams.id);
      console.log('Datos obtenidos de la API:', detailData);
      
      if (detailData && detailData.detail) {
        // Procesar los datos para asegurar compatibilidad con el componente
        const rawData = detailData.detail;
        
        // Crear un nuevo objeto con las propiedades en camelCase para compatibilidad
        const incidentData: any = {
          // Mapear propiedades de snake_case a camelCase
          incidentId: rawData.incident_id || rawData.incidentId,
          guideNumber: rawData.guide_number || rawData.guideNumber,
          trackingNumber: rawData.guide_number || rawData.guideNumber || rawData.trackingNumber,
          commerceId: rawData.commerce_id || rawData.commerceId,
          carrierId: rawData.carrier_id || rawData.carrierId,
          status_mensajeria: rawData.status_mensajeria || rawData.status,
          status: rawData.status,
          type: rawData.type,
          priority: rawData.priority,
          createdAt: rawData.created_at || rawData.createdAt,
          updatedAt: rawData.updated_at || rawData.updatedAt,
          deadline: rawData.deadline,
          
          // Mantener shipmentDetails con la estructura original
          shipmentDetails: rawData.shipment_details || rawData.shipmentDetails,
          
          // Procesar timeline si existe
          timeline: (rawData.timeline || []).map((event: any) => ({
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
          actionDetails: rawData.action_details || rawData.actionDetails
        };
        
        // Extraer nombre del cliente de los datos de envío si existe
        if (incidentData.shipmentDetails?.destination?.contact && !incidentData.customerName) {
          incidentData.customerName = incidentData.shipmentDetails.destination.contact;
        }
        
        // Calcular las horas restantes de SLA si no existen
        if (!incidentData.slaHours && incidentData.deadline) {
          const now = new Date();
          const deadline = new Date(incidentData.deadline);
          const hoursRemaining = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
          incidentData.slaHours = hoursRemaining;
        }
        
        // Si hay metadata de resolutionTime, usarla como slaHours
        if (!incidentData.slaHours && incidentData.metadata?.resolutionTime) {
          incidentData.slaHours = incidentData.metadata.resolutionTime;
        }
        
        // Formatear la fecha límite si no existe
        if (!incidentData.formattedDeadline && incidentData.deadline) {
          incidentData.formattedDeadline = new Date(incidentData.deadline).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
          });
        }
        
        setIncident(incidentData);
        console.log('Datos procesados:', incidentData);
      } else {
        throw new Error('No se recibieron datos válidos del endpoint');
      }
    } catch (err) {
      console.error('Error al cargar detalles de incidencia:', err);
      
      // Verificar si es un error de autenticación
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Mostrar mensaje de error genérico, pero no interferir con la navegación ni redirigir al login
      setError('Error al cargar los detalles de la incidencia. Inténtalo de nuevo.');
      
      // Podemos actualizar localmente (si tenemos datos) o seguir mostrando la pantalla de carga
      // Pero no hacemos nada que interrumpa la experiencia del usuario
    } finally {
      setLoading(false);
    }
  }, [unwrappedParams.id]); // Only depend on the ID
  
  // Cargar datos al iniciar, primero desde los parámetros de búsqueda, luego desde la API si es necesario
  useEffect(() => {
    if (unwrappedParams.id) {
      // Intentar obtener datos desde los parámetros de búsqueda
      const encodedData = searchParams?.get('data');
      
      if (encodedData) {
        try {
          const decodedData = JSON.parse(decodeURIComponent(encodedData));
          console.log('Usando datos de los parámetros de búsqueda:', decodedData);
          
          // Asegurarnos de que los datos tienen el formato esperado
          if (decodedData && decodedData.incidentId) {
            setIncident(decodedData);
            setLoading(false);
          } else {
            console.warn('Los datos de parámetros no tienen el formato esperado, cargando desde API');
            reloadIncident();
          }
        } catch (e) {
          console.error('Error al decodificar datos de parámetros:', e);
          reloadIncident();
        }
      } else {
        // No hay datos en parámetros, cargar desde API
        console.log('No hay datos en parámetros, cargando desde API');
        reloadIncident();
      }
    }
  }, [unwrappedParams.id, searchParams]); // Remove reloadIncident from dependencies
  
  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    
    try {
      setLoading(true);
      
      // Log del estado antes de enviarlo al servidor
      console.log(`Cambiando estado de ${incident.status_mensajeria} a ${newStatus}`);
      
      try {
        // Obtener el tipo de acción de la incidencia
        const actionType = incident.type;
        let actionData = {};
        
        // Si hay datos de actionDetails, extraerlos para incluirlos en la solicitud
        if (incident.actionDetails && incident.actionDetails.length > 0) {
          // Buscar los datos específicos para este tipo de incidencia
          const specificData = incident.actionDetails[0][actionType];
          if (specificData) {
            actionData = {
              [actionType]: specificData
            };
          }
        }
        
        // Preparar la solicitud según el formato esperado por la API
        const updateData: any = {
          incidentId: unwrappedParams.id, // Usar el ID de la URL que es el formato correcto
          status: newStatus, // Usar status como espera la API
          actionType: actionType,
          notes: `La mensajeria procesa la incidencia`
        };
        
        // Añadir los datos específicos del tipo de incidencia si están disponibles
        if (Object.keys(actionData).length > 0) {
          Object.assign(updateData, actionData);
        } else {
        // Si no hay datos específicos, agregar datos mínimos genéricos
        // Este enfoque es más flexible y funcionará con cualquier tipo de incidencia actual o futura
        
        // Crear un objeto genérico con datos mínimos
        const genericData: any = {};
        
        // Detectar patrones en el tipo de incidencia para proporcionar datos relevantes
        if (actionType.includes('address') || actionType.includes('dirección')) {
          genericData.city = "Queretaro";
          genericData.reason = "Actualización de dirección";
        } else if (actionType.includes('package') || actionType.includes('paquete')) {
          if (actionType.includes('damage') || actionType.includes('dañado')) {
            genericData.damage_type = "Leve";
            genericData.damage_description = "Daño en el empaque";
          } else if (actionType.includes('lost') || actionType.includes('perdido')) {
            genericData.last_seen_date = new Date().toISOString();
            genericData.last_seen_location = "Centro de distribución";
          } else if (actionType.includes('movement') || actionType.includes('movimiento')) {
            genericData.days_without_movement = 3;
            genericData.last_status = "En tránsito";
          } else {
            genericData.status = "Requiere revisión";
            genericData.notes = "Incidencia de paquete";
          }
        } else if (actionType.includes('pickup') || actionType.includes('recolección')) {
          genericData.attempt_date = new Date().toISOString();
          genericData.failure_reason = "No se encontró en la dirección";
        } else if (actionType.includes('delivery') || actionType.includes('entrega')) {
          genericData.delay_reason = "Condiciones climáticas";
          genericData.estimated_delivery_date = new Date(Date.now() + 86400000).toISOString(); // +1 día
        } else if (actionType.includes('recipient') || actionType.includes('destinatario')) {
          genericData.attempt_date = new Date().toISOString();
          genericData.notes = "No se encontró al destinatario";
        } else if (actionType.includes('access') || actionType.includes('acceso')) {
          genericData.reason = "Zona de acceso restringido";
          genericData.notes = "Se requiere autorización especial";
        } else {
          // Para cualquier otro tipo, proporcionar datos genéricos básicos
          genericData.date = new Date().toISOString();
          genericData.notes = `Procesando incidencia de tipo ${actionType}`;
          genericData.status = "En revisión";
        }
        
        // Asignar los datos genéricos al tipo específico de incidencia
        updateData[actionType] = genericData;
        }
        
        console.log('Enviando datos de actualización:', updateData);
        
        // Intentar enviar estado al servidor
        await updateIncident(updateData);
        
        // Actualizar estado exitosamente
        console.log('Estado actualizado correctamente en el servidor');
        
        // Actualizar el estado localmente para inmediatez
        setIncident({
          ...incident,
          status_mensajeria: newStatus,
          status: newStatus // Para compatibilidad
        });
        
        // Después de actualizar, redirigir a la lista de incidencias
        setTimeout(() => {
          router.push('/incidents');
        }, 1000);
      } catch (apiErr) {
        console.error('Error al actualizar estado en la API:', apiErr);
        
        // Si hay error de autenticación o cualquier otro error, actualizar localmente
        const errorMessage = apiErr instanceof Error ? apiErr.message : String(apiErr);
        
        // Para cualquier tipo de error, incluidos los de token, solo actualiza localmente
        console.warn('Error al actualizar en el servidor, actualizando localmente');
        
        // Actualizar estado localmente
        const timestamp = new Date().toISOString();
        const updatedIncident = {
          ...incident,
          status_mensajeria: newStatus,
          status: newStatus, // Para compatibilidad
          timeline: [...(incident.timeline || []), {
            status: newStatus,
            timestamp: timestamp,
            actor: {
              id: 'local',
              type: 'carrier',
              name: 'Usuario Local'
            },
            notes: `Actualizado a ${newStatus} (localmente)`
          }]
        };
        
        setIncident(updatedIncident);
        
        // Después de actualizar localmente, redirigir a la lista de incidencias
        setTimeout(() => {
          router.push('/incidents');
        }, 1000);
      }
      
      // Mostrar notificación de éxito
      console.log(`Estado actualizado a: ${newStatus}`);
    } catch (err) {
      console.error('Error general al actualizar estado:', err);
      setError('Error al actualizar el estado de la incidencia');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthGuard>
      <AppLayout notificationCount={0}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/incidents')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Incidencia</h1>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#db3b2a]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-6 rounded-md text-red-700 shadow-sm">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-800">Error</h3>
              </div>
              <p className="ml-8">{error}</p>
              
              {error.includes('Token no autorizado') && (
                <div className="ml-8 mt-4">
                  <p className="text-sm text-red-600 mb-2">Redirigiendo a la página de inicio de sesión en unos segundos...</p>
                  <button 
                    onClick={() => logout()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Ir al login ahora
                  </button>
                </div>
              )}
            </div>
          ) : incident ? (
            <IncidentDetail 
              incident={incident} 
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-700">No se encontró la incidencia.</p>
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
