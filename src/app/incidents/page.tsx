'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import AppLayout from '../../components/AppLayout';
import { useIncidents } from '../../hooks/useIncidents';
import { 
  CARRIER_NAMES, 
  INCIDENT_TYPE_NAMES, 
  INCIDENT_STATUS_NAMES, 
  formatDate,
  fetchIncidenceStats,
  IncidenceStatsResponse,
  CourierStats
} from '../../lib/api';
import { Incident } from '../../types/incidents';

export default function IncidentsPage() {
  const router = useRouter();
  const [selectedCarrier, setSelectedCarrier] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [sortedIncidents, setSortedIncidents] = useState<Incident[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [slaCounts, setSlaCounts] = useState<{inTime: number, expired: number}>({inTime: 0, expired: 0});
  const [incidenceStats, setIncidenceStats] = useState<IncidenceStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  
  const {
    incidents,
    loading,
    error,
    totalRecords,
    totalPages,
    currentPage,
    pageSize,
    changePage,
    changePageSize,
    refreshData,
  } = useIncidents(selectedCarrier);
  
  // Cargar estadísticas de incidencias
  useEffect(() => {
    const loadIncidenceStats = async () => {
      try {
        setLoadingStats(true);
        const data = await fetchIncidenceStats();
        setIncidenceStats(data as IncidenceStatsResponse);
      } catch (error) {
        console.error('Error al cargar estadísticas de incidencias:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadIncidenceStats();
  }, []);

  // Apply filters to incidents and calculate counts
  useEffect(() => {
    if (!incidents) return;
    
    let result = [...incidents];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        inc => 
          (inc.incidentId && inc.incidentId.toLowerCase().includes(term)) || 
          (inc.trackingNumber && inc.trackingNumber.toLowerCase().includes(term))
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(inc => inc.status_mensajeria === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      result = result.filter(inc => inc.type === typeFilter);
    }
    
    if (slaFilter !== 'all') {
      result = result.filter(inc => {
        const slaHours = getSLAHours(inc);
        return slaFilter === 'expired' ? slaHours <= 0 : slaHours > 0;
      });
    }
    
    setFilteredIncidents(result);
    
    // Calculate status counts
    const counts: Record<string, number> = {
      requires_action: 0,
      pending: 0,
      in_process: 0,
      finalized: 0,
      in_review: 0
    };
    
    // Calculate SLA counts
    let inTimeCount = 0;
    let expiredCount = 0;
    
    incidents.forEach(inc => {
      if (inc.status_mensajeria && counts[inc.status_mensajeria] !== undefined) {
        counts[inc.status_mensajeria]++;
      }
      
      const slaHours = getSLAHours(inc);
      if (slaHours <= 0) {
        expiredCount++;
      } else {
        inTimeCount++;
      }
    });
    
    setStatusCounts(counts);
    setSlaCounts({ inTime: inTimeCount, expired: expiredCount });
  }, [incidents, searchTerm, statusFilter, typeFilter, slaFilter]);
  
  // Sort incidents to show expired ones first
  useEffect(() => {
    if (!filteredIncidents.length) return;
    
    const now = new Date();
    
    // Sort function to prioritize expired incidents
    const sortedList = [...filteredIncidents].sort((a, b) => {
      // Check if either incident is expired (SLA hours <= 0)
      const aExpired = isSLAExpired(a);
      const bExpired = isSLAExpired(b);
      
      // If one is expired and the other isn't, the expired one comes first
      if (aExpired && !bExpired) return -1;
      if (!aExpired && bExpired) return 1;
      
      // If both are expired or not expired, sort by SLA hours (ascending)
      const aSLA = getSLAHours(a);
      const bSLA = getSLAHours(b);
      
      return aSLA - bSLA;
    });
    
    setSortedIncidents(sortedList);
  }, [filteredIncidents]);
  
  // Get unique incident types
  const incidentTypes = incidents 
    ? [...new Set(incidents.map(inc => inc.type))]
    : [];
  
  // Función para renderizar las tarjetas de paquetería
  const renderCarrierCards = () => {
    if (!incidenceStats) return null;
    
    return incidenceStats.detail.couriers
      .filter(courier => courier.total_de_registros > 0)
      .sort((a, b) => b.total_de_registros - a.total_de_registros)
      .slice(0, 4)
      .map((courier, index) => {
        // Determinar color del círculo basado en el nombre de la paquetería
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";
        let shortName = "N/A";
        
        if (courier.nombre_mensajeria === "DHL") {
          bgColor = "bg-red-100";
          textColor = "text-red-700";
          shortName = "DHL";
        } else if (courier.nombre_mensajeria === "FEDEX") {
          bgColor = "bg-purple-100";
          textColor = "text-purple-700";
          shortName = "FDX";
        } else if (courier.nombre_mensajeria === "ESTAFETA") {
          bgColor = "bg-blue-100";
          textColor = "text-blue-700";
          shortName = "EST";
        } else if (courier.nombre_mensajeria === "UPS") {
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
          shortName = "UPS";
        } else if (courier.nombre_mensajeria === "99MIN") {
          bgColor = "bg-green-100";
          textColor = "text-green-700";
          shortName = "99M";
        } else if (courier.nombre_mensajeria) {
          shortName = courier.nombre_mensajeria.substring(0, 3);
        }
        
        return (
          <div key={index} className="flex items-center p-2 rounded-lg hover:bg-[var(--gray-50)]">
            <div className="mr-3 flex-shrink-0">
              <div className={`w-10 h-10 rounded-full ${bgColor} ${textColor} flex items-center justify-center font-bold`}>
                {shortName}
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-lg font-bold text-[var(--gray-900)]">{(courier.percentaje * 100).toFixed(1)}%</span>
              </div>
              <div className="text-xs font-medium text-[var(--gray-600)]">
                {courier.total_de_incidencias}/{courier.total_de_registros} envíos
              </div>
            </div>
          </div>
        );
      });
  };
  
  // Get situation based on incident type
  const getSituacion = (type: string) => {
    switch(type) {
      case 'recipient_not_found': return "Destinatario no localizado";
      case 'restricted_access': return "Acceso restringido";
      case 'package_without_movement': return "Paquete sin movimiento";
      case 'package_rejected': return "Paquete rechazado";
      case 'package_damaged': return "Paquete dañado";
      default: return "Dirección incorrecta";
    }
  };
  
  // Calculate SLA hours for an incident
  const getSLAHours = (incident: Incident): number => {
    if (incident.slaHours !== undefined) return incident.slaHours;
    
    if (incident.deadline) {
      const now = new Date();
      const deadline = new Date(incident.deadline);
      return Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    }
    
    return 48; // Default SLA hours if not specified
  };
  
  // Check if SLA is expired
  const isSLAExpired = (incident: Incident): boolean => {
    return getSLAHours(incident) <= 0;
  };
  
  // Get SLA status class
  const getSLAStatusClass = (hours: number): string => {
    if (hours <= 0) return 'text-white bg-red-600';
    if (hours <= 8) return 'text-red-800 bg-red-100';
    if (hours <= 24) return 'text-yellow-800 bg-yellow-100';
    return 'text-green-800 bg-green-100';
  };
  
  // Prepare data for detail view
  const prepareDetailData = (incident: Incident) => {
    return {
      ...incident,
      incidentId: incident.incidentId,
      trackingNumber: incident.trackingNumber || incident.guideNumber,
      customerName: incident.customerName || incident.shipmentDetails?.destination?.contact || 'Cliente',
      slaHours: incident.slaHours || Math.round((new Date(incident.deadline || '').getTime() - new Date().getTime()) / (1000 * 60 * 60)),
      type: incident.type,
      status_mensajeria: incident.status_mensajeria,
      status: incident.status_mensajeria,
      deadline: incident.deadline,
      createdAt: incident.createdAt,
      formattedDeadline: formatDate(incident.deadline || ''),
      shipmentDetails: incident.shipmentDetails || {},
      actionDetails: incident.actionDetails || []
    };
  };
  
  // Navigate to incident detail
  const navigateToDetail = (incident: Incident) => {
    const data = prepareDetailData(incident);
    router.push(`/incidents/${incident.incidentId}?data=${encodeURIComponent(JSON.stringify(data))}`);
  };
  
  return (
    <AuthGuard>
      <AppLayout notificationCount={statusCounts.requires_action || 0}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">Gestión de incidencias</h1>
            <p className="text-[var(--gray-600)]">Algunas entregas requieren ajustes. Gestiona aquí las incidencias reportadas por la paquetería y mantén el control de tus envíos.</p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Incident rate */}
            <div className="tienvios-card p-6">
              <h3 className="text-base font-bold text-[var(--gray-800)] mb-3">Tasa de incidencias</h3>
              {loadingStats ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary)]"></div>
                </div>
              ) : !incidenceStats ? (
                <div className="h-32 flex items-center justify-center text-red-500">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Error al cargar estadísticas</span>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-[var(--gray-900)]">
                      {(incidenceStats.detail.overall_percentaje * 100).toFixed(2)}%
                    </span>
                    <span className="ml-2 text-sm font-medium text-red-500">-0.2%</span>
                  </div>
                  <p className="text-sm text-[var(--gray-600)] mt-2">
                    {incidenceStats.detail.couriers.reduce((sum, courier) => sum + courier.total_de_incidencias, 0)} / {incidenceStats.detail.total_of_guides} envíos
                  </p>
                  
                  <div className="mt-4 w-full bg-[var(--gray-200)] rounded-full h-2 shadow-inner overflow-hidden">
                    <div 
                      className="bg-[var(--primary)] h-2 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${incidenceStats.detail.overall_percentaje * 100}%` }}
                    ></div>
                  </div>
                </>
              )}
            </div>
            
            {/* Carrier performance */}
            <div className="tienvios-card p-6">
              <h3 className="text-base font-bold text-[var(--gray-800)] mb-3">Desempeño por paquetería</h3>
              {loadingStats ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary)]"></div>
                </div>
              ) : !incidenceStats ? (
                <div className="h-32 flex items-center justify-center text-red-500">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Error al cargar estadísticas</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {renderCarrierCards()}
                </div>
              )}
            </div>
          </div>
          
          {/* Controls and filters */}
          <div className="tienvios-card p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 flex-grow">
                <div className="w-full md:w-auto">
                  <label htmlFor="carrier" className="block text-sm font-semibold text-[var(--gray-700)] mb-1">
                    Paquetería
                  </label>
                  <select
                    id="carrier"
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(Number(e.target.value))}
                    className="filter-control w-full md:w-48"
                  >
                    <option value="0">Todas las paqueterías</option>
                    {Object.entries(CARRIER_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="tienvios-button flex items-center justify-center h-[38px] self-end"
                >
                  {loading ? "Cargando..." : "Actualizar"}
                </button>
              </div>
              
              <div>
                <button className="tienvios-button">
                  Crear incidencia
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Search box */}
              <div>
                <label htmlFor="search" className="block text-sm font-semibold text-[var(--gray-700)] mb-1">
                  Buscar por ID o Guía
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ingresa tu número de guía"
                  className="filter-control w-full"
                />
              </div>
              
              {/* Status filter */}
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-semibold text-[var(--gray-700)] mb-1">
                  Estado
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-control w-full"
                >
                  <option value="all">Todos los estados</option>
                  <option value="requires_action">Requiere acción</option>
                  <option value="pending">Pendiente</option>
                  <option value="in_process">En proceso</option>
                  <option value="finalized">Finalizado</option>
                </select>
              </div>
              
              {/* Type filter */}
              <div>
                <label htmlFor="typeFilter" className="block text-sm font-semibold text-[var(--gray-700)] mb-1">
                  Tipo de Incidencia
                </label>
                <select
                  id="typeFilter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-control w-full"
                >
                  <option value="all">Todos los tipos</option>
                  {incidentTypes.map((type) => (
                    <option key={type} value={type}>
                      {INCIDENT_TYPE_NAMES[type as keyof typeof INCIDENT_TYPE_NAMES] || type}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* SLA filter */}
              <div>
                <label htmlFor="slaFilter" className="block text-sm font-semibold text-[var(--gray-700)] mb-1">
                  Tiempo SLA
                </label>
                <select
                  id="slaFilter"
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value)}
                  className="filter-control w-full"
                >
                  <option value="all">Todos</option>
                  <option value="in_time">En tiempo</option>
                  <option value="expired">Vencido</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Incident list */}
          <div className="tienvios-card overflow-hidden">
            <div className="p-5 border-b border-[var(--gray-200)]">
              <h2 className="text-lg font-bold text-[var(--gray-900)]">Incidencias</h2>
              <p className="text-sm text-[var(--gray-600)]">{filteredIncidents.length} incidencias encontradas de {totalRecords} en total</p>
              
              {/* Status summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div 
                  className="status-tag status-requires-action cursor-pointer hover:opacity-90"
                  onClick={() => setStatusFilter(statusFilter === 'requires_action' ? 'all' : 'requires_action')}
                >
                  Requiere acción: {statusCounts.requires_action || 0}
                </div>
                <div 
                  className="status-tag status-pending cursor-pointer hover:opacity-90"
                  onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                >
                  Pendiente: {statusCounts.pending || 0}
                </div>
                <div 
                  className="status-tag status-in-process cursor-pointer hover:opacity-90"
                  onClick={() => setStatusFilter(statusFilter === 'in_process' ? 'all' : 'in_process')}
                >
                  En proceso: {statusCounts.in_process || 0}
                </div>
                <div 
                  className="status-tag status-finalized cursor-pointer hover:opacity-90"
                  onClick={() => setStatusFilter(statusFilter === 'finalized' ? 'all' : 'finalized')}
                >
                  Finalizada: {statusCounts.finalized || 0}
                </div>
                <div 
                  className="status-tag status-in-review cursor-pointer hover:opacity-90"
                  onClick={() => setStatusFilter(statusFilter === 'in_review' ? 'all' : 'in_review')}
                >
                  En revisión: {statusCounts.in_review || 0}
                </div>
              </div>
              
              {/* SLA summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                <h3 className="w-full text-sm font-semibold text-[var(--gray-700)] mb-1">Estado de SLA:</h3>
                <div 
                  className="sla-tag sla-in-time cursor-pointer hover:opacity-90"
                  onClick={() => setSlaFilter(slaFilter === 'in_time' ? 'all' : 'in_time')}
                >
                  En tiempo: {slaCounts.inTime || 0}
                </div>
                <div 
                  className="sla-tag sla-expired cursor-pointer hover:opacity-90"
                  onClick={() => setSlaFilter(slaFilter === 'expired' ? 'all' : 'expired')}
                >
                  Vencido: {slaCounts.expired || 0}
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--primary)]"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <h3 className="text-lg font-bold text-[var(--gray-900)] mb-2">Error al cargar incidencias</h3>
                <p className="text-[var(--gray-600)]">{error}</p>
                <button 
                  onClick={refreshData}
                  className="mt-4 tienvios-button"
                >
                  Intentar nuevamente
                </button>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-bold text-[var(--gray-900)] mb-2">No se encontraron incidencias</h3>
                <p className="text-[var(--gray-600)]">No hay incidencias que coincidan con los filtros seleccionados.</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="mt-4 tienvios-button-secondary"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="tienvios-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>No. de guía</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Estado SLA</th>
                      <th>Tiempo SLA</th>
                      <th>Paquetería</th>
                      <th>Situación actual</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIncidents.map((incident) => {
                      const slaHours = getSLAHours(incident);
                      const isExpired = isSLAExpired(incident);
                      const slaClass = getSLAStatusClass(slaHours);
                      
                      return (
                        <tr 
                          key={incident.incidentId} 
                          className={`hover:bg-[var(--gray-50)] cursor-pointer ${isExpired ? 'bg-red-50' : ''}`}
                          onClick={() => navigateToDetail(incident)}
                        >
                          <td>{incident.incidentId}</td>
                          <td>{incident.trackingNumber}</td>
                          <td>
                            <div>Actualizado {formatDate(incident.updatedAt || incident.createdAt || '')}</div>
                            <div className="text-xs text-gray-500">Creado {formatDate(incident.createdAt || '')}</div>
                          </td>
                          <td>
                            {incident.status_mensajeria === 'requires_action' && (
                              <span className="status-tag status-requires-action">Requiere acción</span>
                            )}
                            {incident.status_mensajeria === 'in_process' && (
                              <span className="status-tag status-in-process">En proceso</span>
                            )}
                            {incident.status_mensajeria === 'finalized' && (
                              <span className="status-tag status-finalized">Finalizada</span>
                            )}
                            {incident.status_mensajeria === 'pending' && (
                              <span className="status-tag status-pending">Pendiente</span>
                            )}
                            {incident.status_mensajeria === 'in_review' && (
                              <span className="status-tag status-in-review">En revisión</span>
                            )}
                          </td>
                          <td>
                            <span className={`sla-tag ${slaHours <= 0 ? 'sla-expired' : slaHours <= 8 ? 'sla-warning' : 'sla-in-time'}`}>
                              {slaHours <= 0 ? 'Vencido' : 'En tiempo'}
                            </span>
                          </td>
                          <td>
                            <span className={`font-medium ${slaHours <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {slaHours <= 0 
                                ? `${Math.abs(slaHours).toFixed(2)} hrs` 
                                : `${slaHours.toFixed(2)} hrs`}
                            </span>
                          </td>
                          <td>
                            {incident.carrierId === 1 && <div className="carrier-icon carrier-icon-dhl">DHL</div>}
                            {incident.carrierId === 2 && <div className="carrier-icon carrier-icon-fedex">FDX</div>}
                            {incident.carrierId === 3 && <div className="carrier-icon carrier-icon-estafeta">EST</div>}
                            {incident.carrierId === 4 && <div className="carrier-icon carrier-icon-ups">UPS</div>}
                          </td>
                          <td>{getSituacion(incident.type)}</td>
                          <td>
                            <button className="tienvios-button-secondary text-sm px-3 py-1">
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && !error && totalPages > 0 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  En total {totalRecords} registro(s)
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
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
                        onClick={() => changePage(pageNum)}
                        className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    Siguiente
                  </button>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-2">
                    {pageSize} registros / página
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                    className="filter-control text-sm py-1 px-2"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
