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
    </div>
  );
}
