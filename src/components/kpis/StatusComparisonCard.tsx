'use client';

import { useState, useEffect } from 'react';

interface StatusComparisonCardProps {
  title: string;
  activeCount: number;
  closedCount: number;
  isLoading?: boolean;
}

export default function StatusComparisonCard({
  title,
  activeCount,
  closedCount,
  isLoading = false
}: StatusComparisonCardProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    return () => setAnimate(false);
  }, []);

  // Calculate total and percentages
  const total = activeCount + closedCount;
  const activePercentage = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  const closedPercentage = total > 0 ? Math.round((closedCount / total) * 100) : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-[var(--gray-200)] overflow-hidden transition-all duration-500 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="px-5 py-4 border-b border-[var(--gray-200)]">
        <h3 className="text-lg font-semibold text-[var(--gray-900)]">{title}</h3>
      </div>
      
      <div className="p-5">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-[var(--gray-200)] rounded w-3/4"></div>
            <div className="h-20 bg-[var(--gray-200)] rounded w-full"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Stats overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[var(--gray-200)]">
                <div className="text-sm font-medium text-[var(--gray-600)] mb-1">Activas</div>
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-bold text-amber-500">{activeCount}</div>
                  <div className="text-sm text-[var(--gray-500)]">({activePercentage}%)</div>
                </div>
              </div>
              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[var(--gray-200)]">
                <div className="text-sm font-medium text-[var(--gray-600)] mb-1">Cerradas</div>
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-bold text-green-600">{closedCount}</div>
                  <div className="text-sm text-[var(--gray-500)]">({closedPercentage}%)</div>
                </div>
              </div>
            </div>
            
            {/* Progress bar visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-amber-500">En proceso</span>
                <span className="text-green-600">Finalizadas</span>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-l-full"
                  style={{ 
                    width: `${activePercentage}%`,
                    borderRight: activePercentage > 0 && activePercentage < 100 ? '3px solid white' : 'none'
                  }}
                ></div>
                <div 
                  className="h-full bg-green-600 rounded-r-full -mt-4"
                  style={{ 
                    width: `${closedPercentage}%`, 
                    marginLeft: `${activePercentage}%`
                  }}
                ></div>
              </div>
            </div>
            
            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-[var(--gray-200)]">
              <span className="text-[var(--gray-700)]">Total de incidencias:</span>
              <span className="font-bold text-[var(--primary)] text-xl">{total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
