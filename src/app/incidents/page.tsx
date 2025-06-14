'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AuthGuard from '../../components/AuthGuard';
import AppLayout from '../../components/AppLayout';
import { useCurrentUser } from '../../lib/auth';
import { useIncidents } from '../../hooks/useIncidents';
import { 
  CARRIER_NAMES, 
  INCIDENT_TYPE_NAMES, 
  INCIDENT_STATUS_NAMES, 
  formatDate,
  downloadIncidentsExcel,
  calculateRemainingDays
} from '../../lib/api';
import CsvUploadModal from '../../components/incidents/CsvUploadModal';
import ExportErrorModal from '../../components/ExportErrorModal';
import { Incident } from '../../types/incidents';

export default function IncidentsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const isT1CompanyUser = user?.company === 'T1';
  // Helper function to format date to YYYY-MM-DD
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Calculate default date range (last 7 days)
  const calculateDefaultDateRange = (): { startDate: string, endDate: string } => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    return {
      startDate: formatDateForAPI(startDate),
      endDate: formatDateForAPI(endDate)
    };
  };

  const defaultDateRange = useMemo(() => calculateDefaultDateRange(), []);
  
  const [selectedCarrier, setSelectedCarrier] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState<string>(defaultDateRange.endDate);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [sortedIncidents, setSortedIncidents] = useState<Incident[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [slaCounts, setSlaCounts] = useState<{inTime: number, expired: number}>({inTime: 0, expired: 0});
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExportErrorModalOpen, setIsExportErrorModalOpen] = useState<boolean>(false);
  const [batchUpdateError, setBatchUpdateError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  
  // Mapping of courier names to their logo paths
  const courierLogos: Record<string, string> = {
    'DHL': '/logos/dhl-logo-wine.svg',
    'FEDEX': '/logos/fedex.png',
    'ESTAFETA': '/logos/estafeta_logo.png',
    'UPS': '/logos/UPS.svg',
    '99MIN': '/logos/99min.svg',
    'AMPM': '/logos/ampm.png',
    'EXPRESS': '/logos/express.png',
    'JTEXPRESS': '/logos/JTExpress.svg',
    'T1ENVIOS': '/logos/T1envios.png'
  };
  
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
  } = useIncidents(selectedCarrier, startDate, endDate);
  
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
      finalized: 0
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
  
  // Handle Excel export
  const handleExportToExcel = async () => {
    try {
      setExportLoading(true);
      const response = await downloadIncidentsExcel(selectedCarrier, currentPage, pageSize, startDate, endDate);
      
      if (response.success && response.data?.file_url) {
        // Open the file URL in a new tab
        window.open(response.data.file_url, '_blank');
      } else {
        console.error('Error al exportar a Excel:', response.message || 'No se pudo obtener la URL del archivo');
        setExportError(response.message || 'No se pudo obtener la URL del archivo');
        setIsExportErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setExportError(error instanceof Error ? error.message : 'Error desconocido');
      setIsExportErrorModalOpen(true);
    } finally {
      setExportLoading(false);
    }
  };
  
  return (
    <AuthGuard>
      <AppLayout notificationCount={statusCounts.requires_action || 0}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">Gestión de incidencias</h1>
          </div>
          
          {/* Stats section removed as requested */}
          
          {/* Modals */}
          <CsvUploadModal 
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={() => {
              refreshData();
              setBatchUpdateError(null);
            }}
            onError={(error: string) => setBatchUpdateError(error)}
          />
          
          <ExportErrorModal
            isOpen={isExportErrorModalOpen}
            onClose={() => setIsExportErrorModalOpen(false)}
            errorMessage={exportError || ''}
          />
          
          {/* Error message for batch update */}
          {batchUpdateError && (
            <div className="tienvios-card p-4 mb-6 bg-red-50 border border-red-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-red-800">Error al actualizar incidencias</h3>
                  <p className="text-sm text-red-700">{batchUpdateError}</p>
                </div>
                <button 
                  onClick={() => setBatchUpdateError(null)}
                  className="ml-auto text-red-700 hover:text-red-900"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Controls and filters */}
          <div className="tienvios-card p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 flex-grow flex-wrap">
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
                
                {/* Date range picker */}
                <div className="w-full md:w-auto flex flex-col md:flex-row md:space-x-4">
                  <div className="mb-4 md:mb-0">
                    <label htmlFor="start_date" className="block text-sm font-semibold text-[var(--gray-700)] mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="filter-control w-full md:w-auto"
                    />
                  </div>
                  <div>
                    <label htmlFor="end_date" className="block text-sm font-semibold text-[var(--gray-700)] mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="filter-control w-full md:w-auto"
                    />
                  </div>
                </div>
                
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="tienvios-button flex items-center justify-center h-[38px] self-end"
                >
                  {loading ? "Cargando..." : "Actualizar"}
                </button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="tienvios-button-outline tienvios-button-lg flex items-center rounded-xl px-4 py-2.5"
                >
                  <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19.5V14m0 0l-3 3m3-3l3 3" />
                  </svg>
                  Cargar CSV
                </button>
                
                <button 
                  onClick={handleExportToExcel}
                  disabled={exportLoading || loading}
                  className="tienvios-button-outline tienvios-button-lg flex items-center rounded-xl px-4 py-2.5"
                >
                  {exportLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exportar a Excel
                    </>
                  )}
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
              {/* Status and SLA summary */}
              <div className="flex flex-wrap gap-2">
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
                
                {/* SLA filters */}
                <div className="ml-4 border-l border-gray-300 pl-4">
                  <div 
                    className="sla-tag sla-in-time cursor-pointer hover:opacity-90"
                    onClick={() => setSlaFilter(slaFilter === 'in_time' ? 'all' : 'in_time')}
                  >
                    En tiempo: {slaCounts.inTime || 0}
                  </div>
                </div>
                <div>
                  <div 
                    className="sla-tag sla-expired cursor-pointer hover:opacity-90"
                    onClick={() => setSlaFilter(slaFilter === 'expired' ? 'all' : 'expired')}
                  >
                    Vencido: {slaCounts.expired || 0}
                  </div>
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
                      {isT1CompanyUser && <th>Usuario asignado</th>}
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
                            {/* Show operations_status for T1 company users, otherwise show status_carrier */}
                            {isT1CompanyUser ? (
                              <>
                                {incident.operations_status === 'requires_action' && (
                                  <span className="status-tag status-requires-action">Requiere acción</span>
                                )}
                                {incident.operations_status === 'in_process' && (
                                  <span className="status-tag status-in-process">En proceso</span>
                                )}
                                {incident.operations_status === 'finalized' && (
                                  <span className="status-tag status-finalized">Finalizada</span>
                                )}
                                {incident.operations_status === 'pending' && (
                                  <span className="status-tag status-pending">Pendiente</span>
                                )}
                                {incident.operations_status === 'in_review' && (
                                  <span className="status-tag status-in-review">En revisión</span>
                                )}
                                {incident.operations_status === 'additional_information' && (
                                  <span className="status-tag status-in-review">Información adicional</span>
                                )}
                                {incident.operations_status === 'review' && (
                                  <span className="status-tag status-in-review">Revisión</span>
                                )}
                                {incident.operations_status === 'reopen' && (
                                  <span className="status-tag status-requires-action">Reapertura</span>
                                )}
                              </>
                            ) : (
                              <>
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
                              </>
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
                                ? `${Math.abs(calculateRemainingDays(incident.deadline))} días` 
                                : `${calculateRemainingDays(incident.deadline)} días`}
                            </span>
                          </td>
                          <td className="text-center">
                            {(() => {
                              // Determine courier name
                              const courierName = incident.carrier?.name || 
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
                                'Desconocida');
                              
                              // Get logo path
                              const logoPath = courierLogos[courierName];
                              
                              return logoPath ? (
                                <div className="flex justify-center">
                                  <Image 
                                    src={logoPath} 
                                    alt={`${courierName} logo`} 
                                    width={60} 
                                    height={30} 
                                    style={{ objectFit: 'contain' }} 
                                  />
                                </div>
                              ) : (
                                // Fallback to the original colored circles if no logo is found
                                <div className={`carrier-icon ${
                                  courierName === 'DHL' ? 'carrier-icon-dhl' :
                                  courierName === 'FEDEX' ? 'carrier-icon-fedex' :
                                  courierName === 'ESTAFETA' ? 'carrier-icon-estafeta' :
                                  courierName === 'UPS' ? 'carrier-icon-ups' :
                                  ''
                                }`}>
                                  {courierName === 'DHL' ? 'DHL' :
                                   courierName === 'FEDEX' ? 'FDX' :
                                   courierName === 'ESTAFETA' ? 'EST' :
                                   courierName === 'UPS' ? 'UPS' :
                                   courierName.substring(0, 3)}
                                </div>
                              );
                            })()}
                          </td>
                          <td>{getSituacion(incident.type)}</td>
                          {isT1CompanyUser && (
                            <td>
                              {incident.assigned_user?.email || "-"}
                            </td>
                          )}
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
