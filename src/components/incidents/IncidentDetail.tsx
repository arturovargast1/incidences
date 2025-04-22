'use client';

import React, { useState, useEffect } from 'react';
import { Incident } from '../../types/incidents';
import { INCIDENT_STATUS_NAMES, INCIDENT_TYPE_NAMES, formatDate, calculateRemainingDays, determineSlaStatus } from '../../lib/api';
import PhotoGallery from './PhotoGallery';

// Mapa de traducciones para los campos comunes
const FIELD_TRANSLATIONS: Record<string, string> = {
  // Direcciones
  'street': 'Calle',
  'calle': 'Calle',
  'neighborhood': 'Colonia',
  'colonia': 'Colonia',
  'postalCode': 'Código Postal',
  'código_postal': 'Código Postal',
  'zip': 'Código Postal',
  'state': 'Estado',
  'estado': 'Estado',
  'city': 'Ciudad',
  'ciudad': 'Ciudad',
  'references': 'Referencias',
  'reference': 'Referencia',
  'intNumber': 'Número Interior',
  'extNumber': 'Número Exterior',
  'numero': 'Número',
  'reason': 'Motivo',
  'municipality': 'Municipio',
  
  // Paquete sin movimiento
  'last_update': 'Última actualización',
  'days_without_movement': 'Días sin movimiento',
  'last_status': 'Último estado',
  'last_location': 'Última ubicación',
  
  // Paquete dañado
  'damage_type': 'Tipo de daño',
  'damage_description': 'Descripción del daño',
  'damage_photos': 'Fotos del daño',
  'claim_amount': 'Monto de reclamación',
  
  // Paquete perdido
  'last_seen_date': 'Última vez visto',
  'last_seen_location': 'Última ubicación conocida',
  'package_value': 'Valor del paquete',
  'insurance_coverage': 'Cobertura de seguro',
  
  // Recolección fallida
  'attempt_date': 'Fecha de intento',
  'failure_reason': 'Motivo de fallo',
  'contact_person': 'Persona de contacto',
  'reschedule_date': 'Fecha de reprogramación',
  
  // Retraso en entrega
  'original_delivery_date': 'Fecha original de entrega',
  'estimated_delivery_date': 'Fecha estimada de entrega',
  'delay_reason': 'Motivo del retraso',
  
  // Campos generales
  'notes': 'Notas',
  'description': 'Descripción',
  'status': 'Estado',
  'date': 'Fecha',
  'location': 'Ubicación',
  'contact': 'Contacto',
  'phone': 'Teléfono',
  'email': 'Correo electrónico'
};

interface IncidentDetailProps {
  incident: Incident;
  onStatusChange?: (status: string) => void;
}

export default function IncidentDetail({ incident, onStatusChange }: IncidentDetailProps) {
  const [loading, setLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<any>(null);
  const [newAddressData, setNewAddressData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  
  // Manejar click en el botón 'Iniciar Proceso'
  const handleStartProcess = () => {
    if (!loading && onStatusChange) {
      setLoading(true);
      onStatusChange('in_process');
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Manejar click en el botón 'Finalizar'
  const handleFinalize = () => {
    if (!loading && onStatusChange) {
      setLoading(true);
      onStatusChange('finalized');
      setTimeout(() => setLoading(false), 500);
    }
  };
  
  // Función para detectar si un valor es un array de URLs de fotos
  const isPhotoArray = (value: any): boolean => {
    if (!Array.isArray(value)) return false;
    if (value.length === 0) return false;
    
    // Verificar si todos los elementos son strings que parecen URLs de imágenes
    // o objetos con una propiedad url que parece una URL de imagen
    return value.every(item => {
      const url = typeof item === 'string' ? item : item?.url;
      if (typeof url !== 'string') return false;
      
      // Verificar si la URL parece ser de una imagen
      return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null || 
             url.startsWith('data:image/') ||
             url.includes('/image/') ||
             url.includes('/photo/');
    });
  };
  
  // Función para renderizar campos dinámicos
  const renderFields = (data: any) => {
    if (!data) return null;
    
    // Convertir el objeto a un array de pares [clave, valor]
    const entries = Object.entries(data);
    
    // Agrupar los campos normales y los campos de fotos
    const normalFields: React.ReactNode[] = [];
    const photoFields: React.ReactNode[] = [];
    
    entries.forEach(([key, value]) => {
      // Ignorar propiedades que no son directamente datos relevantes
      if (key === 'type') return;
      
      // Obtener el nombre del campo en español o usar el nombre original
      const fieldLabel = FIELD_TRANSLATIONS[key] || key;
      
      // Verificar si el campo es un array de fotos
      if (isPhotoArray(value)) {
        photoFields.push(
          <PhotoGallery 
            key={key} 
            photos={value as any} 
            title={fieldLabel}
          />
        );
      } else if (key.toLowerCase().includes('photo') || key.toLowerCase().includes('foto') || key.toLowerCase().includes('image') || key.toLowerCase().includes('imagen')) {
        // Si el campo tiene "photo", "foto", "image" o "imagen" en el nombre pero no es un array,
        // verificar si es una URL de imagen única
        const url = String(value);
        if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith('data:image/')) {
          photoFields.push(
            <PhotoGallery 
              key={key} 
              photos={[url]} 
              title={fieldLabel}
            />
          );
        } else {
          // Si no parece ser una URL de imagen, tratarlo como un campo normal
          const fieldValue = value === null ? 'N/A' : 
                           typeof value === 'object' ? JSON.stringify(value) : 
                           String(value);
          
          normalFields.push(
            <p key={key} className="text-sm font-medium mb-1">
              <span className="font-semibold">{fieldLabel}:</span> {fieldValue}
            </p>
          );
        }
      } else {
        // Para campos normales (no fotos)
        const fieldValue = value === null ? 'N/A' : 
                         typeof value === 'object' ? JSON.stringify(value) : 
                         String(value);
        
        normalFields.push(
          <p key={key} className="text-sm font-medium mb-1">
            <span className="font-semibold">{fieldLabel}:</span> {fieldValue}
          </p>
        );
      }
    });
    
    // Devolver primero los campos normales y luego los campos de fotos
    return [...normalFields, ...photoFields];
  };
  
  // Extraer los datos específicos del tipo de incidencia cuando el componente se inicia
  useEffect(() => {
    if (incident && incident.actionDetails && Array.isArray(incident.actionDetails)) {
      try {
        // Los datos están en el primer elemento del array, en la propiedad que coincide con el tipo de incidencia
        const firstItem = incident.actionDetails[0];
        const incidentType = incident.type;
        
        if (firstItem) {
          // Buscar los datos específicos según el tipo de incidencia
          // Esto funciona para cualquier tipo de incidencia, actual o futuro
          const specificData = firstItem[incidentType];
          if (specificData) {
            setNewAddressData(specificData);
          }
          
          // Obtener información contextual según el tipo de incidencia
          if (incident.shipmentDetails) {
            // Para la mayoría de los tipos, la información contextual está en los detalles del envío
            if (incidentType === 'address_change') {
              // Para cambios de dirección, mostrar la dirección original
              setCurrentAddress(incident.shipmentDetails.destination || {});
            } else if (incidentType?.includes('package') || incidentType?.includes('paquete')) {
              // Para incidencias relacionadas con paquetes, mostrar detalles del paquete
              setCurrentAddress(incident.shipmentDetails.package || {});
            } else if (incidentType?.includes('pickup') || incidentType?.includes('recolección')) {
              // Para incidencias de recolección, mostrar origen
              setCurrentAddress(incident.shipmentDetails.origin || {});
            } else if (incidentType?.includes('delivery') || incidentType?.includes('entrega')) {
              // Para incidencias de entrega, mostrar destino
              setCurrentAddress(incident.shipmentDetails.destination || {});
            } else {
              // Para otros tipos, mostrar información general del envío
              setCurrentAddress({
                origen: incident.shipmentDetails.origin?.contact || 'No disponible',
                destino: incident.shipmentDetails.destination?.contact || 'No disponible',
                servicio: incident.shipmentDetails.package?.service || 'No disponible',
                descripción: incident.shipmentDetails.package?.description || 'No disponible'
              });
            }
          } else {
            // Si no hay detalles de envío, usar datos genéricos
            setCurrentAddress({
              mensaje: "Información contextual no disponible"
            });
          }
        }
      } catch (error) {
        console.error("Error al procesar los detalles de la incidencia:", error);
        // Usar datos de fallback en caso de error
        setCurrentAddress({
          mensaje: "Error al procesar la información contextual"
        });
        setNewAddressData({});
      }
    } else {
      // Usar datos de fallback si no hay actionDetails
      setCurrentAddress(incident.shipmentDetails?.destination || incident.currentAddress || {});
      setNewAddressData(incident.address || {});
    }
  }, [incident]);
  
  // Obtener datos del SLA directamente de la incidencia
  // Obtener el estado SLA considerando si la incidencia está finalizada
  const slaStatus = determineSlaStatus(incident);
  const hoursRemaining = incident.slaHours || incident.metadata?.resolutionTime || 52;
  const daysRemaining = incident.deadline ? calculateRemainingDays(incident.deadline) : Math.ceil(hoursRemaining / 24);
  const timePercentage = Math.min(100, (hoursRemaining / 52) * 100);
  
  // Formatear la fecha límite si está disponible, o usar el valor directo
  let formattedDeadline = incident.formattedDeadline || "";
  if (!formattedDeadline && incident.deadline) {
    try {
      // Convertir la fecha a UTC-6
      const deadlineDate = new Date(incident.deadline);
      const deadlineUTCMinus6 = new Date(deadlineDate.getTime() - (6 * 60 * 60 * 1000));
      
      formattedDeadline = deadlineUTCMinus6.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      formattedDeadline = incident.deadline;
    }
  }
  
  // Obtener el nombre legible del tipo de incidencia
  const situacion = INCIDENT_TYPE_NAMES[incident.type] || 
                    incident.type?.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ') || 
                    "Incidencia";
  
  // Generar una línea de tiempo ficticia si no existe
  const timeline = incident.timeline || [
    {
      status: 'created',
      timestamp: incident.createdAt || new Date().toISOString(),
      actor: { id: 'system', type: 'system', name: 'Sistema' },
      notes: 'Incidencia creada'
    },
    {
      status: 'requires_action',
      timestamp: incident.updatedAt || new Date().toISOString(),
      actor: { id: 'carrier', type: 'carrier', name: 'Paquetería' },
      notes: 'Se requiere acción para resolver la incidencia'
    }
  ];
  
  // Función para obtener el color de estado
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'requires_action': return 'text-red-600 bg-red-50 border-red-200';
      case 'in_process': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'finalized': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_review': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Función para obtener el título de la sección de detalles según el tipo de incidencia
  const getDetailSectionTitles = () => {
    // Mapa de títulos para tipos conocidos
    const knownTypeTitles: Record<string, {left: string, right: string}> = {
      'address_change': {
        left: 'Dirección Actual',
        right: 'Dirección Nueva'
      },
      'package_without_movement': {
        left: 'Información del Paquete',
        right: 'Detalles del Estancamiento'
      },
      'package_damaged': {
        left: 'Información del Paquete',
        right: 'Detalles del Daño'
      },
      'package_lost': {
        left: 'Información del Paquete',
        right: 'Detalles de la Pérdida'
      },
      'failed_pickups': {
        left: 'Información de Recolección',
        right: 'Detalles del Fallo'
      },
      'delivery_delay': {
        left: 'Información de Entrega',
        right: 'Detalles del Retraso'
      },
      'recipient_not_found': {
        left: 'Información del Destinatario',
        right: 'Detalles del Intento'
      },
      'restricted_access': {
        left: 'Información de Entrega',
        right: 'Detalles de Acceso'
      }
    };
    
    // Si el tipo es conocido, usar los títulos predefinidos
    if (incident.type && knownTypeTitles[incident.type]) {
      return knownTypeTitles[incident.type];
    }
    
    // Para tipos desconocidos o futuros, generar títulos basados en el tipo
    const typeWords = incident.type?.split('_') || ['incidencia'];
    const typeCapitalized = typeWords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    // Detectar patrones comunes en el tipo para generar títulos más específicos
    if (incident.type?.includes('package') || incident.type?.includes('paquete')) {
      return {
        left: 'Información del Paquete',
        right: `Detalles de ${typeCapitalized}`
      };
    } else if (incident.type?.includes('delivery') || incident.type?.includes('entrega')) {
      return {
        left: 'Información de Entrega',
        right: `Detalles de ${typeCapitalized}`
      };
    } else if (incident.type?.includes('address') || incident.type?.includes('dirección')) {
      return {
        left: 'Dirección Actual',
        right: 'Dirección Nueva'
      };
    } else if (incident.type?.includes('pickup') || incident.type?.includes('recolección')) {
      return {
        left: 'Información de Recolección',
        right: `Detalles de ${typeCapitalized}`
      };
    }
    
    // Caso genérico para cualquier otro tipo
    return {
      left: 'Información General',
      right: `Detalles de ${typeCapitalized}`
    };
  };

  // Obtener los títulos para las secciones de detalles
  const detailTitles = getDetailSectionTitles();
  
  return (
    <div className="space-y-6">
      {/* Header con información principal */}
      <div className="tienvios-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900">{incident.incidentId}</h2>
              {incident.status_mensajeria && (
                <span className={`ml-3 status-tag ${
                  incident.status_mensajeria === 'requires_action' ? 'status-requires-action' :
                  incident.status_mensajeria === 'in_process' ? 'status-in-process' :
                  incident.status_mensajeria === 'finalized' ? 'status-finalized' :
                  incident.status_mensajeria === 'pending' ? 'status-pending' :
                  'status-in-review'
                }`}>
                  {INCIDENT_STATUS_NAMES[incident.status_mensajeria as keyof typeof INCIDENT_STATUS_NAMES] || incident.status_mensajeria}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-600 mt-1">
              {incident.trackingNumber} - {situacion}
            </p>
          </div>
          
          {/* SLA indicator */}
          <div className="mt-4 md:mt-0 w-full md:w-auto md:min-w-[200px]">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-bold text-gray-900">
                SLA: {daysRemaining} días
                <span className={`ml-2 sla-tag ${
                  !slaStatus.isOnTime ? 'sla-expired' : 
                  hoursRemaining <= 8 ? 'sla-warning' : 
                  'sla-in-time'
                }`}>
                  {slaStatus.label}
                </span>
              </div>
              <div className="text-xs text-gray-600">{formattedDeadline}</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                  hoursRemaining > 24 ? 'bg-green-500' : 
                  hoursRemaining > 8 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} 
                style={{ width: `${timePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Información general */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 uppercase">Cliente</span>
            <span className="text-sm font-semibold text-gray-900">{incident.customerName || 'Cliente'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 uppercase">Creado</span>
            <span className="text-sm font-semibold text-gray-900">{formatDate(incident.createdAt || '')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500 uppercase">Paquetería</span>
            <div className="flex items-center mt-1">
              {incident.carrierId === 1 && (
                <div className="carrier-icon carrier-icon-dhl">DHL</div>
              )}
              {incident.carrierId === 2 && (
                <div className="carrier-icon carrier-icon-fedex">FDX</div>
              )}
              {incident.carrierId === 3 && (
                <div className="carrier-icon carrier-icon-estafeta">EST</div>
              )}
              {incident.carrierId === 4 && (
                <div className="carrier-icon carrier-icon-ups">UPS</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Progreso del flujo de trabajo */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Estado del proceso</h3>
          <div className="relative">
            {/* Línea de progreso */}
            <div className="absolute top-5 left-0 w-full h-1 bg-gray-200"></div>
            
            {/* Etapas */}
            <div className="flex justify-between relative">
              {/* Etapa 1: Requiere acción */}
              <div className="flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  incident.status_mensajeria === 'requires_action' ? 'bg-red-600 text-white' : 
                  (incident.status_mensajeria === 'in_process' || incident.status_mensajeria === 'finalized') ? 'bg-gray-400 text-white' : 
                  'bg-white border-2 border-gray-300 text-gray-500'
                }`}>
                  1
                </div>
                <span className="text-xs font-medium text-gray-700">Requiere acción</span>
              </div>

              {/* Etapa 2: En proceso */}
              <div className="flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  incident.status_mensajeria === 'in_process' ? 'bg-blue-600 text-white' : 
                  incident.status_mensajeria === 'finalized' ? 'bg-gray-400 text-white' : 
                  'bg-white border-2 border-gray-300 text-gray-500'
                }`}>
                  2
                </div>
                <span className="text-xs font-medium text-gray-700">En proceso</span>
              </div>

              {/* Etapa 3: Finalizado */}
              <div className="flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  incident.status_mensajeria === 'finalized' ? 'bg-green-600 text-white' : 
                  'bg-white border-2 border-gray-300 text-gray-500'
                }`}>
                  3
                </div>
                <span className="text-xs font-medium text-gray-700">Finalizado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs para detalles y línea de tiempo */}
      <div className="tienvios-card overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button 
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('details')}
            >
              Detalles
            </button>
            <button 
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'timeline' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('timeline')}
            >
              Línea de tiempo
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sección izquierda - Información original/actual */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">{detailTitles.left}</h4>
                {currentAddress ? (
                  <div className="space-y-2">
                    {renderFields(currentAddress)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay información disponible</p>
                )}
              </div>
              
              {/* Sección derecha - Información nueva/específica */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">{detailTitles.right}</h4>
                {newAddressData ? (
                  <div className="space-y-2">
                    {renderFields(newAddressData)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay información disponible</p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200"></div>
              
              {/* Eventos de la línea de tiempo */}
              <div className="space-y-6">
                {timeline.map((event, index) => (
                  <div key={index} className="relative pl-10">
                    {/* Círculo indicador */}
                    <div className={`absolute left-0 top-0 w-12 h-12 flex items-center justify-center`}>
                      <div className={`w-3 h-3 rounded-full border-2 ${getStatusColor(event.status)}`}></div>
                    </div>
                    
                    {/* Contenido del evento */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900">
                          {event.status === 'created' ? 'Incidencia creada' :
                           event.status === 'requires_action' ? 'Requiere acción' :
                           event.status === 'in_process' ? 'En proceso' :
                           event.status === 'finalized' ? 'Finalizada' :
                           event.status}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{event.notes}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        Por: {event.actor.name || (event.actor as any).user_name || 'Sistema'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Acciones */}
      {onStatusChange && (
        <div className="tienvios-card p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Acciones disponibles</h3>
          <div className="flex flex-wrap gap-3 justify-end">
            {/* Botones para avanzar en el flujo de trabajo según status_mensajeria */}
            {incident.status_mensajeria === 'requires_action' && (
              <button 
                onClick={handleStartProcess}
                disabled={loading}
                className="tienvios-button"
              >
                {loading ? 'Procesando...' : 'Iniciar Proceso'}
              </button>
            )}
            
            {incident.status_mensajeria === 'pending' && (
              <button 
                onClick={handleStartProcess}
                disabled={loading}
                className="tienvios-button"
              >
                {loading ? 'Procesando...' : 'Iniciar Proceso'}
              </button>
            )}
            
            {incident.status_mensajeria === 'in_process' && (
              <button 
                onClick={handleFinalize}
                disabled={loading}
                className="tienvios-button"
              >
                {loading ? 'Procesando...' : 'Finalizar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
