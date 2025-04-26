'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import AppLayout from '../../components/AppLayout';
import { useKpisStats } from '../../hooks/useKpisStats';
import TimeMetricsCard from '../../components/kpis/TimeMetricsCard';
import KpisFilters from '../../components/kpis/KpisFilters';
import PerformanceTable from '../../components/kpis/PerformanceTable';
import StatusComparisonCard from '../../components/kpis/StatusComparisonCard';
import AgentPerformanceCard from '../../components/kpis/AgentPerformanceCard';
import CourierPerformanceTable from '../../components/kpis/CourierPerformanceTable';
import { useCurrentUser } from '../../lib/auth';

export default function KpisPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [selectedAgentEmail, setSelectedAgentEmail] = useState<string>('');
  const { filteredData, loading, error, refreshData } = useKpisStats(selectedAgentEmail);
  
  // Redirect non-T1 users to dashboard
  useEffect(() => {
    if (!userLoading && user && user.company !== 'T1') {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);
  
  // If user is loading or not from T1, don't render the actual content
  if (userLoading || (user && user.company !== 'T1')) {
    return (
      <AuthGuard>
        <AppLayout>
          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
              </div>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  // Prepare data for the agent performance table
  const agentTableData = filteredData?.agentPerformance.map(agent => ({
    id: agent.agentId,
    name: agent.agentName,
    requiresActionToInProcess: agent.requiresActionToInProcess,
    inProcessToFinalized: agent.inProcessToFinalized,
    totalIncidents: agent.totalIncidentsHandled
  })) || [];

  // Prepare the agent list for the filter dropdown
  const agentList = filteredData?.agentPerformance.map(agent => ({
    agentId: agent.agentId,
    agentName: agent.agentName
  })) || [];

  // Calculate overall transition times based on filters
  const overallTimes = {
    requiresActionToInProcess: filteredData?.overallTransitionTimes.requiresActionToInProcess || 0,
    inProcessToFinalized: filteredData?.overallTransitionTimes.inProcessToFinalized || 0
  };

  // Get status counts
  const statusCounts = {
    activeCount: filteredData?.statusCounts.activeCount || 0,
    closedCount: filteredData?.statusCounts.closedCount || 0
  };

  // Get the top performing agent (if any)
  const topAgent = filteredData?.agentPerformance.length 
    ? [...filteredData.agentPerformance].sort((a, b) => a.averageProcessingTime - b.averageProcessingTime)[0]
    : null;

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">KPIs de Incidencias</h1>
              <p className="mt-2 text-[var(--gray-600)]">
                Analiza el rendimiento en la gestión de incidencias por agente y paquetería
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            <div className="mb-8">
              <KpisFilters
                onAgentChange={setSelectedAgentEmail}
                agents={agentList}
                selectedAgentId={selectedAgentEmail}
                isLoading={loading}
              />
            </div>
            
            {/* Status summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatusComparisonCard
                title="Estado de Incidencias"
                activeCount={statusCounts.activeCount}
                closedCount={statusCounts.closedCount}
                isLoading={loading}
              />
              
              <TimeMetricsCard
                title="Tiempos de Transición"
                requiresActionToInProcess={overallTimes.requiresActionToInProcess}
                inProcessToFinalized={overallTimes.inProcessToFinalized}
                isLoading={loading}
              />
            </div>
            
            {/* Agent performance cards */}
            {topAgent && filteredData && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[var(--gray-800)] mb-4">Agente Destacado</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AgentPerformanceCard
                    title="Mejor tiempo de resolución"
                    agentName={topAgent.agentName}
                    averageProcessingTime={topAgent.averageProcessingTime}
                    totalIncidents={topAgent.totalIncidentsHandled}
                    isLoading={loading}
                  />
                  
                  {filteredData.agentPerformance.length > 1 && (
                    <AgentPerformanceCard
                      title="Mayor volumen de incidencias"
                      agentName={[...filteredData.agentPerformance]
                        .sort((a, b) => b.totalIncidentsHandled - a.totalIncidentsHandled)[0].agentName}
                      averageProcessingTime={[...filteredData.agentPerformance]
                        .sort((a, b) => b.totalIncidentsHandled - a.totalIncidentsHandled)[0].averageProcessingTime}
                      totalIncidents={[...filteredData.agentPerformance]
                        .sort((a, b) => b.totalIncidentsHandled - a.totalIncidentsHandled)[0].totalIncidentsHandled}
                      isLoading={loading}
                    />
                  )}
                  
                  {filteredData.agentPerformance.length > 2 && (
                    <AgentPerformanceCard
                      title="Necesita atención"
                      agentName={[...filteredData.agentPerformance]
                        .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)[0].agentName}
                      averageProcessingTime={[...filteredData.agentPerformance]
                        .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)[0].averageProcessingTime}
                      totalIncidents={[...filteredData.agentPerformance]
                        .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)[0].totalIncidentsHandled}
                      isLoading={loading}
                    />
                  )}
                </div>
              </div>
            )}
            
            {/* Detailed performance table */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              <PerformanceTable
                title="Rendimiento Detallado por Agente"
                data={agentTableData}
                isLoading={loading}
              />
            </div>
            
            {/* Courier performance table with mock data */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              <CourierPerformanceTable
                title="Rendimiento por Paquetería"
                data={[
                  {
                    id: 'dhl',
                    name: 'DHL',
                    logo: 'dhl-logo-wine.svg',
                    averageResolutionTime: 0.8,
                    totalIncidents: 45,
                    successRate: 92
                  },
                  {
                    id: 'fedex',
                    name: 'FedEx',
                    logo: 'fedex.png',
                    averageResolutionTime: 1.2,
                    totalIncidents: 38,
                    successRate: 88
                  },
                  {
                    id: 'estafeta',
                    name: 'Estafeta',
                    logo: 'estafeta_logo.png',
                    averageResolutionTime: 1.5,
                    totalIncidents: 27,
                    successRate: 82
                  },
                  {
                    id: '99min',
                    name: '99 Minutos',
                    logo: '99min.svg',
                    averageResolutionTime: 0.6,
                    totalIncidents: 18,
                    successRate: 95
                  },
                  {
                    id: 'ups',
                    name: 'UPS',
                    logo: 'UPS.svg',
                    averageResolutionTime: 0.9,
                    totalIncidents: 22,
                    successRate: 89
                  },
                  {
                    id: 'jtexpress',
                    name: 'JT Express',
                    logo: 'JTExpress.svg',
                    averageResolutionTime: 2.1,
                    totalIncidents: 15,
                    successRate: 73
                  },
                  {
                    id: 't1envios',
                    name: 'T1 Envíos',
                    logo: 'T1envios.png',
                    averageResolutionTime: 0.5,
                    totalIncidents: 8,
                    successRate: 97
                  }
                ]}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
