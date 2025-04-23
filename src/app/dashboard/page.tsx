'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import AppLayout from '../../components/AppLayout';
import StatusCard from '../../components/dashboard/StatusCard';
import { useIncidents } from '../../hooks/useIncidents';
import { useIncidenceStats } from '../../hooks/useIncidenceStats';
import { CARRIER_NAMES, INCIDENT_TYPE_NAMES, INCIDENT_STATUS_NAMES } from '../../lib/api';
import Link from 'next/link';

export default function Dashboard() {
  const [selectedCarrier, setSelectedCarrier] = useState<number>(0);
  const [stats, setStats] = useState({
    incidentRate: '0%',
    slaCompliance: '100%',
    averageTime: '0 hrs',
    firstActionTime: '0 hrs',
    totalIncidents: 0,
    requiresAction: 0,
    pending: 0,
    inProcess: 0,
    finalized: 0
  });

  const {
    incidents,
    loading: incidentsLoading,
    error: incidentsError,
    totalRecords,
    refreshData: refreshIncidents,
  } = useIncidents(selectedCarrier);
  
  const {
    filteredData: incidenceStats,
    loading: statsLoading,
    error: statsError,
    refreshData: refreshStats
  } = useIncidenceStats(selectedCarrier);
  
  // Function to refresh all data
  const refreshData = () => {
    refreshIncidents();
    refreshStats();
  };
  
  // Combined loading and error states
  const loading = incidentsLoading || statsLoading;
  const error = incidentsError || statsError;

  // Calculate stats based on incidents data
  useEffect(() => {
    if (incidents.length > 0) {
      // Status counters
      const requiresAction = incidents.filter(inc => inc.status_mensajeria === 'requires_action').length;
      const pending = incidents.filter(inc => inc.status_mensajeria === 'pending').length;
      const inProcess = incidents.filter(inc => inc.status_mensajeria === 'in_process').length;
      const finalized = incidents.filter(inc => inc.status_mensajeria === 'finalized').length;

      // Incident rate calculation
      const incidentRate = (1 + (incidents.length / 100)).toFixed(2) + '%';
      
      // Resolution time calculation
      const resolvedIncidents = incidents.filter(inc => inc.resolution && inc.resolution.status === 'approved');
      let avgTime = '0 hrs';
      if (resolvedIncidents.length > 0) {
        const avgHours = resolvedIncidents.reduce((sum, inc) => {
          return sum + (inc.metadata?.resolutionTime || 0);
        }, 0) / resolvedIncidents.length;
        avgTime = avgHours.toFixed(1) + ' hrs';
      }

      // SLA compliance calculation
      const now = new Date();
      const pastDeadlineCount = incidents.filter(inc => {
        if (!inc.deadline) return false;
        const deadlineDate = new Date(inc.deadline);
        return deadlineDate < now && inc.status_mensajeria !== 'finalized';
      }).length;
      
      const slaCompliance = incidents.length > 0 
        ? (100 - (pastDeadlineCount / incidents.length * 100)).toFixed(1) + '%' 
        : '100.0%';
        
      // First action time calculation
      let totalFirstActionTime = 0;
      let incidentsWithFirstAction = 0;
      
      incidents.forEach(inc => {
        if (inc.timeline && inc.timeline.length > 1 && inc.createdAt) {
          const creationDate = new Date(inc.createdAt);
          const firstActionEvent = inc.timeline[1];
          
          if (firstActionEvent && firstActionEvent.timestamp) {
            const firstActionDate = new Date(firstActionEvent.timestamp);
            const hoursToFirstAction = (firstActionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60);
            
            totalFirstActionTime += hoursToFirstAction;
            incidentsWithFirstAction++;
          }
        }
      });
      
      const firstActionTime = incidentsWithFirstAction > 0
        ? (totalFirstActionTime / incidentsWithFirstAction).toFixed(1) + ' hrs'
        : '0 hrs';

      setStats({
        incidentRate,
        slaCompliance,
        averageTime: avgTime,
        firstActionTime,
        totalIncidents: totalRecords,
        requiresAction,
        pending,
        inProcess,
        finalized
      });
    }
  }, [incidents, totalRecords]);

  return (
    <AuthGuard>
      <AppLayout notificationCount={stats.requiresAction}>
        <div className="p-6 animate-slide-in-up">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">Dashboard de Incidencias</h1>
          </div>
          
          {/* Carrier selector and refresh button */}
          <div className="tienvios-card p-6 mb-8 border border-[var(--gray-200)]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="w-full md:w-72">
                <label htmlFor="carrier" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                  Selecciona una paquetería
                </label>
                <div className="relative">
                  <select
                    id="carrier"
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(Number(e.target.value))}
                    className="filter-control w-full"
                  >
                    <option value="0">Todas las paqueterías</option>
                    {Object.entries(CARRIER_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="tienvios-button flex items-center justify-center"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Actualizar datos</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Incidents card */}
            <div className="tienvios-card p-6 hover:shadow-lg transition-all duration-300 border border-[var(--gray-200)]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--gray-600)] uppercase tracking-wider">Total Incidencias</h3>
                  <p className="text-3xl font-bold text-[var(--gray-900)] mt-2 tracking-tight">
                    {incidenceStats && incidenceStats.isFiltered && incidenceStats.selectedCourier 
                      ? incidenceStats.selectedCourier.total_incidents
                      : stats.totalIncidents
                    }
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--primary-light)]">
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              
              {/* Incident rate information */}
              {incidenceStats && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-[var(--gray-600)]">
                    Tasa de incidencias
                    {incidenceStats.isFiltered && incidenceStats.selectedCourier && (
                      <span className="ml-1 font-semibold">
                        ({incidenceStats.selectedCourier.messaging_name})
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-red-600">
                    {incidenceStats.overallPercentage ? 
                     incidenceStats.overallPercentage.toFixed(2) : '0.00'}%
                  </span>
                </div>
                <div className="w-full bg-[var(--gray-200)] rounded-full h-2 shadow-inner">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${incidenceStats.overallPercentage || 0}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-[var(--gray-600)]">
                  {incidenceStats.isFiltered && incidenceStats.selectedCourier 
                    ? `${incidenceStats.selectedCourier.total_incidents} de ${incidenceStats.selectedCourier.total_records} guías`
                    : `${incidenceStats.totalIncidents || 9} de ${incidenceStats.totalGuides || 2943} guías`
                  }
                </p>
              </div>
              )}
            </div>
            
            {/* Out of time card */}
            <div className="tienvios-card p-6 hover:shadow-lg transition-all duration-300 border border-[var(--gray-200)]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--gray-600)] uppercase tracking-wider">Fuera de Tiempo</h3>
                  <p className="text-3xl font-bold text-[var(--gray-900)] mt-2 tracking-tight">{Math.round(totalRecords * (1 - parseFloat(stats.slaCompliance) / 100))}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-[var(--gray-600)]">SLA incumplido</span>
                  <span className="text-xs font-semibold text-red-600">{(100 - parseFloat(stats.slaCompliance)).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[var(--gray-200)] rounded-full h-2 shadow-inner">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(100 - parseFloat(stats.slaCompliance)).toFixed(1)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* First action card */}
            <div className="tienvios-card p-6 hover:shadow-lg transition-all duration-300 border border-[var(--gray-200)]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--gray-600)] uppercase tracking-wider">Primera Acción</h3>
                  <p className="text-3xl font-bold text-[var(--gray-900)] mt-2 tracking-tight">{stats.firstActionTime}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--primary-light)]">
                  <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Resolution time card */}
            <div className="tienvios-card p-6 hover:shadow-lg transition-all duration-300 border border-[var(--gray-200)]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--gray-600)] uppercase tracking-wider">Tiempo Resolución</h3>
                  <p className="text-3xl font-bold text-[var(--gray-900)] mt-2 tracking-tight">{stats.averageTime}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Graphs section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Latest incidents */}
            <div className="tienvios-card overflow-hidden">
              <div className="p-6 border-b border-[var(--gray-200)]">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-[var(--gray-900)]">Últimas Incidencias</h2>
                  <Link href="/incidents" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
                    Ver todas
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="h-64 overflow-y-auto pr-1">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--primary)]"></div>
                  </div>
                ) : error ? (
                  <div className="h-64 flex flex-col items-center justify-center text-red-500">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-center">Error al cargar datos: {error}</p>
                    <button 
                      onClick={refreshData}
                      className="mt-4 tienvios-button-secondary text-sm"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidents.slice(0, 6).map((incident) => (
                      <div 
                        key={incident.incidentId} 
                        className="p-4 bg-white border border-[var(--gray-200)] rounded-lg flex justify-between items-center hover:shadow-md transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] mr-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--gray-900)]">{incident.incidentId}</p>
                            <p className="text-xs text-[var(--gray-600)]">{INCIDENT_TYPE_NAMES[incident.type as keyof typeof INCIDENT_TYPE_NAMES]}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`status-tag ${
                            incident.status_mensajeria === 'requires_action' ? 'status-requires-action' : 
                            incident.status_mensajeria === 'pending' ? 'status-pending' : 
                            incident.status_mensajeria === 'in_process' ? 'status-in-process' : 
                            'status-finalized'
                          }`}>
                            {INCIDENT_STATUS_NAMES[incident.status_mensajeria as keyof typeof INCIDENT_STATUS_NAMES] || incident.status_mensajeria}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>
            
            {/* Incidents by type */}
            <div className="tienvios-card overflow-hidden">
              <div className="p-6 border-b border-[var(--gray-200)]">
                <h2 className="text-lg font-bold text-[var(--gray-900)]">Distribución por Tipo</h2>
              </div>
              
              <div className="p-6">
                <div className="h-64 overflow-y-auto pr-1">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--primary)]"></div>
                  </div>
                ) : error ? (
                  <div className="h-64 flex flex-col items-center justify-center text-red-500">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-center">Error al cargar datos: {error}</p>
                    <button 
                      onClick={refreshData}
                      className="mt-4 tienvios-button-secondary text-sm"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : incidenceStats?.incidentsByType?.length ? (
                  <div className="space-y-4">
                    {incidenceStats.incidentsByType
                      .sort((a, b) => b.count - a.count)
                      .map((typeData) => {
                        const displayName = INCIDENT_TYPE_NAMES[typeData.incident_type as keyof typeof INCIDENT_TYPE_NAMES] || 
                                          typeData.incident_type.replace(/_/g, ' ');
                        
                        return (
                          <div key={typeData.incident_type} className="p-4 bg-white border border-[var(--gray-200)] rounded-lg hover:shadow-sm transition-all duration-300">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] mr-3">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-bold text-[var(--gray-900)]">{displayName}</p>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm font-bold text-[var(--primary)]">{typeData.count}</span>
                                <span className="ml-1 text-xs font-medium text-[var(--gray-600)]">({typeData.percentage_of_incidents.toFixed(2)}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-[var(--gray-100)] rounded-full h-2.5 overflow-hidden shadow-inner">
                              <div 
                                className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${typeData.percentage_of_incidents}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p>No hay datos de tipos de incidencia disponibles</p>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Current incidents status */}
          <div className="tienvios-card p-6 mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[var(--gray-900)]">Estado Actual de Incidencias</h2>
              <p className="text-sm text-[var(--gray-600)]">Distribución de incidencias por estado</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center py-6">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[var(--primary)]"></div>
                </div>
              ) : error ? (
                <div className="col-span-full flex flex-col items-center justify-center text-red-500 py-6">
                  <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  <p className="text-center">Error al cargar datos: {error}</p>
                </div>
              ) : (
                <>{incidenceStats?.incidentsByStatus?.length ? (
                  <>
                    {['requires_action', 'pending', 'in_process', 'finalized'].map(statusKey => {
                      const statusData = incidenceStats.incidentsByStatus?.find(s => s.status === statusKey);
                      
                      let title, bgColor, textColor, borderColor;
                      
                      switch(statusKey) {
                        case 'requires_action':
                          title = "Requieren Acción";
                          bgColor = "bg-[var(--status-requires-action)]";
                          textColor = "text-[var(--status-requires-action-text)]";
                          borderColor = "border-[var(--status-requires-action-border)]";
                          break;
                        case 'pending':
                          title = "Pendientes";
                          bgColor = "bg-[var(--status-pending)]";
                          textColor = "text-[var(--status-pending-text)]";
                          borderColor = "border-[var(--status-pending-border)]";
                          break;
                        case 'in_process':
                          title = "En Proceso";
                          bgColor = "bg-[var(--status-in-process)]";
                          textColor = "text-[var(--status-in-process-text)]";
                          borderColor = "border-[var(--status-in-process-border)]";
                          break;
                        case 'finalized':
                          title = "Finalizadas";
                          bgColor = "bg-[var(--status-finalized)]";
                          textColor = "text-[var(--status-finalized-text)]";
                          borderColor = "border-[var(--status-finalized-border)]";
                          break;
                        default:
                          title = statusKey;
                          bgColor = "bg-gray-100";
                          textColor = "text-gray-800";
                          borderColor = "border-gray-200";
                      }
                      
                      return (
                        <StatusCard 
                          key={statusKey}
                          title={title}
                          count={statusData?.count || 0}
                          bgColor={bgColor}
                          textColor={textColor}
                          borderColor={borderColor}
                          percentageOfIncidents={statusData?.percentage_of_incidents || 0}
                        />
                      );
                    })}
                  </>
                ) : (
                  <div className="col-span-full flex justify-center py-6">
                    <p className="text-gray-500">No hay datos disponibles</p>
                  </div>
                )}</>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
