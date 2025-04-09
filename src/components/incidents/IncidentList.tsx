'use client';

import { useState } from 'react';
import { Incident } from '../../types/incidents';
import { INCIDENT_TYPE_NAMES, INCIDENT_STATUS_NAMES, calculateRemainingTime, calculateRemainingDays } from '../../lib/api';

interface IncidentListProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  debugMode?: boolean; // Modo de depuración opcional
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function IncidentList({ 
  incidents, 
  selectedIncident, 
  onSelectIncident,
  debugMode = false, // Modo de depuración desactivado por defecto
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: IncidentListProps) {
  const [filterType, setFilterType] = useState<string>('all');

  // Filtra las incidencias por tipo si es necesario
  const filteredIncidents = filterType === 'all' 
    ? incidents 
    : incidents.filter(incident => incident.type === filterType);

  return (
    <div className="w-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incidencias</h2>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button 
            className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
              filterType === 'all' 
                ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]' 
                : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            onClick={() => setFilterType('all')}
          >
            Todas
          </button>
          
          {Object.entries(INCIDENT_TYPE_NAMES).map(([type, name]) => (
            <button 
              key={type}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                filterType === type 
                  ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]' 
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              onClick={() => setFilterType(type)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      
      <ul className="divide-y divide-gray-200 max-h-[calc(100vh-250px)] overflow-y-auto">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => {
            const remainingTime = calculateRemainingTime(incident.deadline);
            
            // Determinar el tipo de situación basado en el tipo de incidencia
            let situacion = "Dirección incorrecta";
            if (incident.type === 'recipient_not_found') {
              situacion = "Destinatario no localizado";
            } else if (incident.type === 'restricted_access') {
              situacion = "Acceso restringido";
            } else if (incident.type === 'package_without_movement') {
              situacion = "Paquete sin movimiento";
            } else if (incident.type === 'package_rejected') {
              situacion = "Paquete rechazado";
            } else if (incident.type === 'package_damaged') {
              situacion = "Paquete dañado";
            }
            
            return (
              <li 
                key={incident.incidentId}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedIncident?.incidentId === incident.incidentId ? 'bg-[var(--gray-light)]' : ''
                }`}
                onClick={() => onSelectIncident(incident)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-[var(--primary)]">{incident.incidentId}</p>
                    <p className="text-sm text-gray-800">{incident.trackingNumber} - {situacion}</p>
                    <p className="text-xs text-gray-500">Cliente: {incident.shipmentDetails?.origin?.company || incident.shipmentDetails?.destination?.contact || incident.customerName || 'Cliente'}</p>
                    <p className="text-xs text-gray-500">
                      Paquetería: {
                        // Check if carrier object exists first
                        incident.carrier?.name || 
                        // Fallback to carrierId mapping if carrier object doesn't exist
                        (incident.carrierId === 1 ? 'DHL' :
                        incident.carrierId === 2 ? 'FEDEX' :
                        incident.carrierId === 3 ? 'ESTAFETA' :
                        incident.carrierId === 4 ? 'UPS' :
                        incident.carrierId === 12 ? '99MIN' :
                        incident.carrierId === 19 ? 'AMPM' :
                        incident.carrierId === 20 ? 'UPS' :
                        incident.carrierId === 22 ? 'EXPRESS' :
                        incident.carrierId === 24 ? 'JTEXPRESS' :
                        incident.carrierId === 2599 ? 'T1ENVIOS' :
                        'Desconocida')
                      }
                    </p>
                    
                    {/* Indicador de estado */}
                    <div className="mt-1">
                      <span className={`status-tag ${
                        incident.status_mensajeria === 'finalized' ? 'status-finalized' :
                        incident.status_mensajeria === 'requires_action' ? 'status-requires-action' :
                        incident.status_mensajeria === 'in_process' ? 'status-in-process' :
                        incident.status_mensajeria === 'pending' ? 'status-pending' :
                        'status-in-review'
                      }`}>
                        {INCIDENT_STATUS_NAMES[incident.status_mensajeria as keyof typeof INCIDENT_STATUS_NAMES] || incident.status_mensajeria}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center mb-1">
                        <div className={`h-2 w-2 rounded-full ${
                          remainingTime <= 0 ? 'bg-red-600' : 
                          remainingTime <= 8 ? 'bg-yellow-600' : 'bg-green-600'
                        } mr-1`}></div>
                        <span className={`text-xs font-bold ${
                          remainingTime <= 0 ? 'text-red-700' : 
                          remainingTime <= 8 ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {remainingTime <= 0 ? 
                            `¡Vencido hace ${Math.abs(calculateRemainingDays(incident.deadline))} días!` : 
                            `${calculateRemainingDays(incident.deadline)} días restantes`
                          }
                        </span>
                        <span className={`ml-2 sla-tag sla-tag-sm ${
                          remainingTime <= 0 ? 'sla-expired' : 
                          remainingTime <= 8 ? 'sla-warning' : 
                          'sla-in-time'
                        }`}>
                          {remainingTime <= 0 ? 'Vencido' : 'En tiempo'}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        Límite: {new Date(incident.deadline).toLocaleDateString()} {new Date(incident.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        ) : (
          <li className="p-6 text-center text-gray-500">
            No hay incidencias que coincidan con el filtro seleccionado
          </li>
        )}
      </ul>
      
      {/* Pagination controls */}
      {totalPages > 1 && onPageChange && (
        <div className="p-4 border-t border-gray-200 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-xs font-medium rounded-lg text-gray-700 hover:bg-gray-100 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-all duration-200 ${
                    currentPage === pageNum 
                      ? 'bg-[var(--primary)] text-white' 
                      : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-xs font-medium rounded-lg text-gray-700 hover:bg-gray-100 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
            >
              Siguiente
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
