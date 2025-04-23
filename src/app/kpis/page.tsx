'use client';

import { useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import AppLayout from '../../components/AppLayout';
import { useKpisStats, AgentPerformance } from '../../hooks/useKpisStats';
import TimeMetricsCard from '../../components/kpis/TimeMetricsCard';
import KpisFilters from '../../components/kpis/KpisFilters';
import PerformanceTable from '../../components/kpis/PerformanceTable';

export default function KpisPage() {
  const [selectedAgentEmail, setSelectedAgentEmail] = useState<string>('');
  const { filteredData, loading, error, refreshData } = useKpisStats(selectedAgentEmail);

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

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">KPIs de Incidencias</h1>
              <p className="mt-2 text-[var(--gray-600)]">
                Analiza los tiempos de transición de incidencias por agente y paquetería
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
            
            <div className="grid grid-cols-1 gap-6 mb-8">
              <TimeMetricsCard
                title="Tiempo promedio de transición de incidencias"
                requiresActionToInProcess={overallTimes.requiresActionToInProcess}
                inProcessToFinalized={overallTimes.inProcessToFinalized}
                isLoading={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <PerformanceTable
                title="Rendimiento por agente"
                data={agentTableData}
                isLoading={loading}
              />
            </div>
            
            {/* Se oculta temporalmente la tabla de rendimiento por paquetería
            <div className="grid grid-cols-1 gap-6">
              <PerformanceTable
                title="Rendimiento por paquetería"
                data={courierTableData}
                isLoading={loading}
              />
            </div>
            */}
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
