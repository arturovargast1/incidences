'use client';

import { useState, useEffect } from 'react';

interface CourierPerformanceData {
  id: string;
  name: string;
  logo: string;
  averageResolutionTime: number;
  totalIncidents: number;
  successRate: number;
}

interface CourierPerformanceTableProps {
  title: string;
  data: CourierPerformanceData[];
  isLoading?: boolean;
}

export default function CourierPerformanceTable({
  title,
  data,
  isLoading = false
}: CourierPerformanceTableProps) {
  const [animate, setAnimate] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof CourierPerformanceData>('successRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const handleSort = (column: keyof CourierPerformanceData) => {
    if (sortColumn === column) {
      // Toggle sort direction if clicking on the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];
    
    // Handle string or number comparisons
    const comparison = typeof valueA === 'string' 
      ? valueA.localeCompare(valueB as string)
      : (valueA as number) - (valueB as number);
      
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Function to determine color class based on success rate
  const getSuccessRateColorClass = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-emerald-500';
    if (rate >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-[var(--gray-200)] overflow-hidden transition-all duration-500 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="px-5 py-4 border-b border-[var(--gray-200)]">
        <h3 className="text-lg font-semibold text-[var(--gray-900)]">{title}</h3>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-5 animate-pulse space-y-4">
            <div className="h-10 bg-[var(--gray-200)] rounded w-full"></div>
            <div className="h-10 bg-[var(--gray-200)] rounded w-full"></div>
            <div className="h-10 bg-[var(--gray-200)] rounded w-full"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[var(--gray-200)]">
            <thead className="bg-[var(--gray-50)]">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider cursor-pointer hover:bg-[var(--gray-100)]"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    <span>Paquetería</span>
                    {sortColumn === 'name' && (
                      <svg className={`ml-1 w-4 h-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider cursor-pointer hover:bg-[var(--gray-100)]"
                  onClick={() => handleSort('averageResolutionTime')}
                >
                  <div className="flex items-center">
                    <span>Tiempo promedio</span>
                    {sortColumn === 'averageResolutionTime' && (
                      <svg className={`ml-1 w-4 h-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider cursor-pointer hover:bg-[var(--gray-100)]"
                  onClick={() => handleSort('totalIncidents')}
                >
                  <div className="flex items-center">
                    <span>Total incidencias</span>
                    {sortColumn === 'totalIncidents' && (
                      <svg className={`ml-1 w-4 h-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider cursor-pointer hover:bg-[var(--gray-100)]"
                  onClick={() => handleSort('successRate')}
                >
                  <div className="flex items-center">
                    <span>Tasa de éxito</span>
                    {sortColumn === 'successRate' && (
                      <svg className={`ml-1 w-4 h-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                      </svg>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--gray-200)]">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-[var(--gray-500)]">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--gray-50)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 mr-3">
                          <img className="h-10 w-10 object-contain" src={`/logos/${item.logo}`} alt={item.name} />
                        </div>
                        <div className="text-sm font-medium text-[var(--gray-900)]">
                          {item.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-700)]">
                      {formatTime(item.averageResolutionTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-700)]">
                      {item.totalIncidents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getSuccessRateColorClass(item.successRate)}`}>
                          {item.successRate}%
                        </span>
                        <div className="ml-4 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getSuccessRateColorClass(item.successRate).replace('text-', 'bg-')}`}
                            style={{ width: `${item.successRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
