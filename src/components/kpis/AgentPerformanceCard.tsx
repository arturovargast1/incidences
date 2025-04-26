'use client';

import { useState, useEffect } from 'react';

interface AgentMetricsCardProps {
  title: string;
  agentName: string;
  averageProcessingTime: number;
  totalIncidents: number;
  isLoading?: boolean;
}

export default function AgentPerformanceCard({
  title,
  agentName,
  averageProcessingTime,
  totalIncidents,
  isLoading = false
}: AgentMetricsCardProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    return () => setAnimate(false);
  }, []);

  // Helper function to format hours to a more readable format
  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 24) {
      const wholePart = Math.floor(hours);
      const minutesPart = Math.round((hours - wholePart) * 60);
      return minutesPart > 0 
        ? `${wholePart}h ${minutesPart}m` 
        : `${wholePart}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return remainingHours > 0 
        ? `${days}d ${remainingHours}h` 
        : `${days}d`;
    }
  };

  // Determine efficiency level based on processing time
  const getEfficiencyClass = (time: number): string => {
    if (time < 0.5) return 'text-green-500';
    if (time < 1) return 'text-emerald-600';
    if (time < 2) return 'text-amber-500';
    return 'text-red-500';
  };

  const efficiencyClass = getEfficiencyClass(averageProcessingTime);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-[var(--gray-200)] overflow-hidden transition-all duration-500 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="px-5 py-4 border-b border-[var(--gray-200)]">
        <h3 className="text-lg font-semibold text-[var(--gray-900)]">{title}</h3>
      </div>
      
      <div className="p-5">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[var(--gray-200)] rounded w-2/3"></div>
            <div className="h-10 bg-[var(--gray-200)] rounded w-1/2"></div>
            <div className="h-20 bg-[var(--gray-200)] rounded w-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Agent name */}
            <div className="text-xl font-medium text-[var(--gray-800)]">{agentName}</div>
            
            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[var(--gray-200)]">
                <div className="text-sm font-medium text-[var(--gray-600)] mb-1">Tiempo promedio</div>
                <div className={`text-2xl font-bold ${efficiencyClass}`}>
                  {formatTime(averageProcessingTime)}
                </div>
                <div className="text-xs text-[var(--gray-500)] mt-1">
                  {averageProcessingTime < 1 
                    ? 'Tiempo óptimo' 
                    : averageProcessingTime < 2 
                      ? 'Tiempo aceptable' 
                      : 'Atención requerida'}
                </div>
              </div>
              
              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[var(--gray-200)]">
                <div className="text-sm font-medium text-[var(--gray-600)] mb-1">Incidencias atendidas</div>
                <div className="text-2xl font-bold text-[var(--primary)]">
                  {totalIncidents}
                </div>
                <div className="text-xs text-[var(--gray-500)] mt-1">
                  Total gestionado
                </div>
              </div>
            </div>
            
            {/* Efficiency representation */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[var(--gray-600)] mb-1">
                <span>Eficiencia de resolución</span>
                <span className={efficiencyClass}>
                  {averageProcessingTime < 0.5 
                    ? 'Excelente' 
                    : averageProcessingTime < 1 
                      ? 'Buena' 
                      : averageProcessingTime < 2 
                        ? 'Regular' 
                        : 'Necesita mejorar'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div 
                  className={`h-full rounded-full ${
                    averageProcessingTime < 0.5 
                      ? 'bg-green-500' 
                      : averageProcessingTime < 1 
                        ? 'bg-emerald-600' 
                        : averageProcessingTime < 2 
                          ? 'bg-amber-500' 
                          : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.max(0, 100 - (averageProcessingTime * 25)))}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
