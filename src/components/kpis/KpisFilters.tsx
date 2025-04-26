'use client';

import { useState } from 'react';

interface KpisFiltersProps {
  onAgentChange: (agentEmail: string) => void;
  agents: { agentId: string; agentName: string }[];
  selectedAgentId: string;
  isLoading?: boolean;
}

export default function KpisFilters({
  onAgentChange,
  agents,
  selectedAgentId,
  isLoading = false
}: KpisFiltersProps) {
  // These states are just for mock purposes, they won't actually filter yet
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Mock courier list based on available logos
  const couriers = [
    { id: '99min', name: '99 Minutos' },
    { id: 'ampm', name: 'AM PM' },
    { id: 'dhl', name: 'DHL' },
    { id: 'estafeta', name: 'Estafeta' },
    { id: 'express', name: 'Express' },
    { id: 'fedex', name: 'FedEx' },
    { id: 'jtexpress', name: 'JT Express' },
    { id: 't1envios', name: 'T1 Envíos' },
    { id: 'ups', name: 'UPS' }
  ];
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label htmlFor="agent-filter" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
          Filtrar por agente
        </label>
        <select
          id="agent-filter"
          className="w-full p-2 border border-[var(--gray-300)] rounded-md shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          value={selectedAgentId}
          onChange={(e) => onAgentChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Todos los agentes</option>
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex-1">
        <label htmlFor="courier-filter" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
          Filtrar por paquetería
        </label>
        <select
          id="courier-filter"
          className="w-full p-2 border border-[var(--gray-300)] rounded-md shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          value={selectedCourier}
          onChange={(e) => setSelectedCourier(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Todas las paqueterías</option>
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>
              {courier.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex-1">
        <label htmlFor="date-range" className="block text-sm font-medium text-[var(--gray-700)] mb-1">
          Rango de fechas
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            id="start-date"
            className="flex-1 p-2 border border-[var(--gray-300)] rounded-md shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isLoading}
          />
          <input
            type="date"
            id="end-date"
            className="flex-1 p-2 border border-[var(--gray-300)] rounded-md shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
