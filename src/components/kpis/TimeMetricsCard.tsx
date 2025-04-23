'use client';

import { useEffect, useState } from 'react';

interface TimeMetricsCardProps {
  title: string;
  requiresActionToInProcess: number;
  inProcessToFinalized: number;
  isLoading?: boolean;
}

export default function TimeMetricsCard({
  title,
  requiresActionToInProcess,
  inProcessToFinalized,
  isLoading = false
}: TimeMetricsCardProps) {
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-[var(--gray-200)] overflow-hidden transition-all duration-500 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="px-5 py-4 border-b border-[var(--gray-200)]">
        <h3 className="text-lg font-semibold text-[var(--gray-900)]">{title}</h3>
      </div>
      
      <div className="p-5">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-[var(--gray-200)] rounded w-3/4"></div>
            <div className="h-10 bg-[var(--gray-200)] rounded w-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="status-tag status-requires-action">
                  Requiere acción
                </span>
                <svg className="mx-1 h-4 w-4 text-[var(--gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="status-tag status-in-process">
                  En proceso
                </span>
              </div>
              <span className="font-medium text-[var(--primary)] text-lg">
                {formatTime(requiresActionToInProcess)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="status-tag status-in-process">
                  En proceso
                </span>
                <svg className="mx-1 h-4 w-4 text-[var(--gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="status-tag status-finalized">
                  Finalizada
                </span>
              </div>
              <span className="font-medium text-[var(--primary)] text-lg">
                {formatTime(inProcessToFinalized)}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-[var(--gray-200)]">
              <span className="text-[var(--gray-700)]">Tiempo total promedio:</span>
              <span className="font-bold text-[var(--primary)] text-xl">
                {formatTime(requiresActionToInProcess + inProcessToFinalized)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
